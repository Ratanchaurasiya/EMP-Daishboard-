// Integration test script for Employee <-> Admin Portal Interconnection & Database Sync
const http = require('http');

const PORT = 5050;
const HOST = '127.0.0.1';

function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request(
      {
        hostname: HOST,
        port: PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      res => {
        let body = '';
        res.on('data', chunk => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('   EASH: Employee <-> Admin Portal Full Interconnection Test   ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // Step 0: Check backend health and bootstrap
    console.log('--- Step 0: Checking Backend Server & Database Engine ---');
    const health = await request('/api/health');
    assert(health.status === 200 && (health.body.status === 'ok' || health.body.success), 'Backend is healthy and connected to DB engine');

    const bootRes = await request('/api/bootstrap');
    assert(bootRes.status === 200 && bootRes.body.success, 'Central /api/bootstrap returns full dataset');
    const dbEngine = bootRes.body.engine || 'MySQL / SQLite';
    console.log(`Active Database Engine: ${dbEngine}`);

    // Step 1: Employee creates an Exit Request -> Admin reviews -> Status changes to Exited
    console.log('\n--- Step 1: Employee Exit Request & Admin Approval Flow ---');
    const testEmpId = `TEST-EMP-${Date.now()}`;
    const testEmployee = {
      id: testEmpId,
      employeeId: `EMP-${Date.now().toString().slice(-4)}`,
      name: 'Integration Test Employee',
      email: `test.${Date.now()}@eash.internal`,
      phone: '9876543210',
      department: 'Technology',
      designation: 'Staff Engineer',
      status: 'Active',
      joiningDate: '2023-01-15',
    };

    const createEmpRes = await request('/api/employees', 'POST', testEmployee);
    assert(createEmpRes.status === 201 && createEmpRes.body.success, 'Employee record created in Database');

    const testExitClrId = `CLR-TEST-${Date.now()}`;
    const exitRequestRecord = {
      id: testExitClrId,
      employeeId: testEmpId,
      employeeName: testEmployee.name,
      employeeEmail: testEmployee.email,
      department: testEmployee.department,
      exitType: 'Resignation',
      resignationDate: '2026-09-25',
      exitDate: '2026-10-15',
      status: 'Pending Asset Return',
      exitRequest: {
        proposedExitDate: '2026-10-15',
        reason: 'Career Opportunity',
        remarks: 'Submitted via employee portal for verification.',
        status: 'Pending',
        requestedAt: new Date().toISOString(),
        requestedBy: testEmployee.name,
      },
      items: [
        {
          id: `CLI-${Date.now()}`,
          assetId: 'AST-TEST-1',
          assetNumber: 'COMP-TEST-001',
          deviceName: 'Dell Latitude 7420 (Laptop)',
          assetType: 'Laptop',
          conditionAtExit: 'Good',
          returnStatus: 'Pending',
          lateFinePerDay: 500,
          lateFineAmount: 0,
        },
      ],
      summary: {
        totalAssigned: 1,
        totalReturned: 0,
        totalDamaged: 0,
        totalMissing: 0,
        totalLateFines: 0,
        totalEmployeeLiableAmount: 0,
      },
      auditTrail: [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Exit Request Raised',
          actor: testEmployee.name,
          details: 'Employee raised exit request from employee portal',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const submitExitRes = await request('/api/exit-clearances', 'POST', exitRequestRecord);
    assert(submitExitRes.status === 201 && submitExitRes.body.success, 'Exit request successfully persisted in Database');

    // Admin reviews and approves Exit Request
    const approvedExitRecord = {
      ...exitRequestRecord,
      exitRequest: {
        ...exitRequestRecord.exitRequest,
        status: 'Approved',
        finalExitDate: '2026-10-15',
        adminRemarks: 'Approved by IT and HR Administrator.',
        reviewedBy: 'Admin Reviewer',
        reviewedAt: new Date().toISOString(),
      },
      auditTrail: [
        {
          id: `AUD-APP-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'Exit Request Approved',
          actor: 'Admin Reviewer',
          details: 'Approved by IT and HR Administrator',
        },
        ...exitRequestRecord.auditTrail,
      ],
      updatedAt: new Date().toISOString(),
    };

    const updateExitRes = await request(`/api/exit-clearances/${testExitClrId}`, 'PUT', approvedExitRecord);
    assert(updateExitRes.status === 200 && updateExitRes.body.success, 'Admin Exit Request Approval persisted in Database');

    // Update employee status to 'Exited'
    const updateEmpRes = await request(`/api/employees/${testEmpId}`, 'PUT', {
      status: 'Exited',
      remarks: 'Exited on 2026-10-15. Approved by Admin Reviewer',
    });
    assert(updateEmpRes.status === 200 && updateEmpRes.body.success, 'Employee status successfully updated to Exited in Database');

    // Step 2: Employee Equipment Requisition (Asset Request) Flow
    console.log('\n--- Step 2: Equipment Requisition (Asset Request) Sync Flow ---');
    const testAssetReqId = `REQ-${Date.now()}`;
    const testAssetRequest = {
      id: testAssetReqId,
      employeeId: testEmployee.employeeId,
      employeeName: testEmployee.name,
      employeeEmail: testEmployee.email,
      department: testEmployee.department,
      requestDate: '2026-09-25',
      requiredByDate: '2026-09-30',
      reason: 'Dual monitor setup for development',
      urgency: 'Medium',
      status: 'Pending',
      items: [{ assetType: 'Monitor', quantity: 1, specifications: '27-inch 4K IPS' }],
      createdAt: new Date().toISOString(),
    };

    const createAssetReqRes = await request('/api/asset-requests', 'POST', testAssetRequest);
    assert(createAssetReqRes.status === 201 && createAssetReqRes.body.success, 'Employee Asset Request persisted in Database');

    // Admin fulfills/approves Asset Request
    const updatedAssetReq = {
      ...testAssetRequest,
      status: 'Approved',
      adminNotes: 'Allocation approved. Pick up from IT Room 204.',
      updatedAt: new Date().toISOString(),
    };
    const updateAssetReqRes = await request(`/api/asset-requests/${testAssetReqId}`, 'PUT', updatedAssetReq);
    assert(updateAssetReqRes.status === 200 && updateAssetReqRes.body.success, 'Admin Asset Request approval persisted in Database');

    // Step 3: Employee SIM Request Flow
    console.log('\n--- Step 3: SIM Requisition (Mobile / SIM Request) Sync Flow ---');
    const testSimReqId = `SIMREQ-${Date.now()}`;
    const testSimRequest = {
      id: testSimReqId,
      employeeId: testEmployee.employeeId,
      employeeName: testEmployee.name,
      employeeEmail: testEmployee.email,
      department: testEmployee.department,
      requestType: 'Additional SIM',
      preferredCarrier: 'Airtel',
      purpose: 'Field Client Visits',
      reason: 'Requires mobile connectivity during customer on-site visits',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    const createSimReqRes = await request('/api/sim-requests', 'POST', testSimRequest);
    assert(createSimReqRes.status === 201 && createSimReqRes.body.success, 'Employee SIM Request persisted in Database');

    // Admin approves SIM Request
    const updatedSimReq = {
      ...testSimRequest,
      status: 'Approved',
      adminRemarks: 'SIM allocated and activated on Corporate Plan.',
      updatedAt: new Date().toISOString(),
    };
    const updateSimReqRes = await request(`/api/sim-requests/${testSimReqId}`, 'PUT', updatedSimReq);
    assert(updateSimReqRes.status === 200 && updateSimReqRes.body.success, 'Admin SIM Request approval persisted in Database');

    // Step 4: Employee Staff Asset Query Flow
    console.log('\n--- Step 4: Staff Asset Query Sync Flow ---');
    const testQueryId = `QRY-${Date.now()}`;
    const testQuery = {
      id: testQueryId,
      employeeId: testEmployee.employeeId,
      employeeName: testEmployee.name,
      employeeEmail: testEmployee.email,
      department: testEmployee.department,
      assetName: 'Dell Latitude 7420',
      assetNumber: 'COMP-TEST-001',
      queryType: 'Performance Issue',
      subject: 'Frequent thermal throttling under high load',
      description: 'Fan spinning at maximum speed and system slows down during compilation',
      status: 'Pending Acknowledgement',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: `hist-1-${Date.now()}`,
          timestamp: new Date().toISOString(),
          status: 'Pending Acknowledgement',
          updatedBy: testEmployee.name,
          notes: 'Query raised by staff',
        },
      ],
    };

    const createQueryRes = await request('/api/asset-queries', 'POST', testQuery);
    assert(createQueryRes.status === 201 && createQueryRes.body.success, 'Staff Asset Query persisted in Database');

    // Admin acknowledges and resolves Query
    const updatedQuery = {
      ...testQuery,
      status: 'Resolved',
      acknowledgedBy: 'IT Lead',
      acknowledgedAt: new Date().toISOString(),
      resolvedBy: 'IT Lead',
      resolvedAt: new Date().toISOString(),
      resolutionNotes: 'Heatsink repasted and fan dust cleaned. Thermal levels normal.',
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: `hist-2-${Date.now()}`,
          timestamp: new Date().toISOString(),
          status: 'Resolved',
          updatedBy: 'IT Lead',
          notes: 'Heatsink repasted and fan dust cleaned.',
        },
        ...testQuery.history,
      ],
    };
    const updateQueryRes = await request(`/api/asset-queries/${testQueryId}`, 'PUT', updatedQuery);
    assert(updateQueryRes.status === 200 && updateQueryRes.body.success, 'Admin Query Acknowledgement & Resolution persisted in Database');

    // Step 5: Verify Unified Bootstrap Fetch (What Employee & Admin portals receive)
    console.log('\n--- Step 5: Central Bootstrap Data Verification ---');
    const finalBoot = await request('/api/bootstrap');
    assert(finalBoot.status === 200 && finalBoot.body.success, 'Central /api/bootstrap successful');

    const data = finalBoot.body.data;
    const foundEmp = data.employees.find(e => e.id === testEmpId);
    assert(foundEmp && foundEmp.status === 'Exited', `Employee status is 'Exited' in central Database`);

    const foundExit = (data.exitClearances || []).find(c => c.id === testExitClrId);
    assert(foundExit && foundExit.exitRequest?.status === 'Approved', `Exit Request status is 'Approved' in central Database`);

    const foundAssetReq = (data.assetRequests || []).find(r => r.id === testAssetReqId);
    assert(foundAssetReq && foundAssetReq.status === 'Approved' && foundAssetReq.adminNotes.includes('Room 204'), `Asset Request status & admin notes match in central Database`);

    const foundSimReq = (data.simRequests || []).find(r => r.id === testSimReqId);
    assert(foundSimReq && foundSimReq.status === 'Approved' && foundSimReq.adminRemarks.includes('Corporate Plan'), `SIM Request status & admin remarks match in central Database`);

    const foundQuery = (data.assetQueries || []).find(q => q.id === testQueryId);
    assert(foundQuery && foundQuery.status === 'Resolved' && foundQuery.resolutionNotes.includes('Thermal levels normal'), `Asset Query status & resolution notes match in central Database`);

    // Step 6: Clean up test records
    console.log('\n--- Step 6: Cleaning Up Test Artifacts ---');
    await request(`/api/employees/${testEmpId}`, 'DELETE');
    await request(`/api/exit-clearances/${testExitClrId}`, 'DELETE');
    await request(`/api/asset-requests/${testAssetReqId}`, 'DELETE');
    await request(`/api/sim-requests/${testSimReqId}`, 'DELETE');
    await request(`/api/asset-queries/${testQueryId}`, 'DELETE');
    console.log('[CLEAN] Test records cleanly purged from database.');

    console.log('\n================================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
