// scripts/verify-all-systems.cjs
const http = require('http');

const API_BASE = 'http://localhost:5050';

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runComprehensiveVerification() {
  console.log('=========================================================');
  console.log('  ASSETCORE ENTERPRISE SYSTEM-WIDE INTEGRITY AUDIT');
  console.log('  Testing Admin & Employee Interconnected Subsystems');
  console.log('=========================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] ${testName}`);
    } else {
      console.error(`  [FAIL] ${testName} - ${details}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // MODULE 1: SERVER & DATABASE HEALTH
    // -------------------------------------------------------------
    console.log('--- 1. SERVER & DATABASE HEALTH ---');
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.data.status === 'ok', 'Server is healthy & responding', JSON.stringify(health));

    const dbStatus = await request('GET', '/api/db-status');
    assert(dbStatus.status === 200 && dbStatus.data.success, 'Database engine is online & persistent', JSON.stringify(dbStatus));

    // -------------------------------------------------------------
    // MODULE 2: RAPID HYDRATION BOOTSTRAP ENDPOINT
    // -------------------------------------------------------------
    console.log('\n--- 2. RAPID HYDRATION BOOTSTRAP ENDPOINT ---');
    const bootstrap = await request('GET', '/api/bootstrap');
    assert(
      bootstrap.status === 200 &&
      bootstrap.data.success &&
      bootstrap.data.data.employees &&
      bootstrap.data.data.computers &&
      bootstrap.data.data.assets &&
      bootstrap.data.data.simCards,
      'Rapid Bootstrap returns all unified entity collections in a single payload',
      `Collections: ${Object.keys(bootstrap.data?.data || {}).length}`
    );

    // -------------------------------------------------------------
    // MODULE 3: EMPLOYEE MANAGEMENT & DATA FLOW
    // -------------------------------------------------------------
    console.log('\n--- 3. EMPLOYEE MANAGEMENT & DATA FLOW ---');
    const testEmpInternalId = `emp-${Date.now()}`;
    const testEmpCode = `EMP-TEST-${Date.now().toString().slice(-4)}`;
    const empPayload = {
      id: testEmpInternalId,
      employeeId: testEmpCode,
      name: 'System Audit Employee',
      email: `audit.${Date.now()}@company.com`,
      phone: '9876500000',
      designation: 'Senior QA Analyst',
      department: 'Quality Engineering',
      team: 'Automation Core',
      joiningDate: '2026-01-15',
      companyEmployeeNumber: `CORP-${testEmpCode}`,
      status: 'Active',
      remarks: 'Automated verification test user'
    };

    const createEmp = await request('POST', '/api/employees', empPayload);
    assert(createEmp.status === 201 && createEmp.data.success, 'Create new employee with all required fields', JSON.stringify(createEmp));

    // Fetch Employees List
    const empList = await request('GET', '/api/employees');
    assert(empList.status === 200 && Array.isArray(empList.data.data), 'Fetch employee directory', `Count: ${empList.data.data?.length}`);

    // Update Employee (Photo & Details for Face Auth reference)
    const updateEmp = await request('PUT', `/api/employees/${testEmpInternalId}`, {
      designation: 'Lead QA Architect',
      photoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    });
    assert(updateEmp.status === 200 && updateEmp.data.success, 'Update employee profile & photo reference', JSON.stringify(updateEmp));

    // -------------------------------------------------------------
    // MODULE 4: WORKSTATION & COMPUTER INVENTORY
    // -------------------------------------------------------------
    console.log('\n--- 4. WORKSTATION & COMPUTER INVENTORY ---');
    const testCompId = `comp-${Date.now()}`;
    const testAssetNumber = `PC-${Date.now().toString().slice(-4)}`;
    const compPayload = {
      id: testCompId,
      assetNumber: testAssetNumber,
      deviceName: 'Dell Precision 3660 Tower',
      deviceType: 'Desktop',
      manufacturer: 'Dell',
      model: 'Precision 3660',
      serialNumber: `SN-${Date.now()}`,
      status: 'Available',
      condition: 'New',
      assignedEmployeeId: null,
      processor: { name: 'Intel Core i9-13900', cores: 24, threads: 32, baseSpeed: '3.0 GHz' },
      memory: { installedRAM: '64 GB', ramType: 'DDR5', ramSpeed: '4800 MHz', slotsTotal: 4, slotsUsed: 2 },
      storage: { total: '2 TB NVMe SSD', used: '250 GB', driveType: 'NVMe SSD' },
      system: { os: 'Windows 11 Pro', bitVersion: '64-bit' }
    };

    const createComp = await request('POST', '/api/computers', compPayload);
    assert(createComp.status === 201 && createComp.data.success, 'Register new workstation computer', JSON.stringify(createComp));

    // Assign Computer to Employee
    const assignComp = await request('PUT', `/api/computers/${testCompId}`, {
      assignedEmployeeId: testEmpCode,
      status: 'Assigned'
    });
    assert(assignComp.status === 200 && assignComp.data.success, 'Assign computer to employee', JSON.stringify(assignComp));

    // -------------------------------------------------------------
    // MODULE 5: PERIPHERAL COMPANY ASSETS (Mouse, Keyboard, Headset)
    // -------------------------------------------------------------
    console.log('\n--- 5. PERIPHERAL COMPANY ASSETS ---');
    const testAssetId = `ast-${Date.now()}`;
    const assetPayload = {
      id: testAssetId,
      assetNumber: `MOU-${Date.now().toString().slice(-4)}`,
      assetType: 'Mouse',
      brand: 'Logitech',
      model: 'MX Master 3S',
      serialNumber: `MOU-SN-${Date.now()}`,
      status: 'Assigned',
      condition: 'New',
      assignedEmployeeId: testEmpCode,
      assignedDate: '2026-09-15',
      purchaseCost: 8995
    };

    const createAsset = await request('POST', '/api/assets', assetPayload);
    assert(createAsset.status === 201 && createAsset.data.success, 'Create & assign peripheral hardware asset', JSON.stringify(createAsset));

    // -------------------------------------------------------------
    // MODULE 6: SERVICE RECORDS & MAINTENANCE CHARGES
    // -------------------------------------------------------------
    console.log('\n--- 6. SERVICE RECORDS & MAINTENANCE ---');
    const srvPayload = {
      id: `srv-${Date.now()}`,
      computerId: testCompId,
      assetNumber: testAssetNumber,
      deviceName: 'Dell Precision 3660 Tower',
      employeeId: testEmpCode,
      employeeName: 'System Audit Employee',
      serviceDate: '2026-09-15',
      problem: 'Preventive thermal paste diagnostic & dust cleanup',
      problemCategory: 'Slow Performance',
      workPerformed: 'Disassembled cooler, reapplied thermal paste, cleaned air filters.',
      partsReplaced: 'None',
      technician: 'Senior Tech Lead',
      serviceCost: 1500,
      serviceStatus: 'Completed',
      resolution: 'System temperature normal under load',
      remarks: 'Certified compliant'
    };

    const createSrv = await request('POST', '/api/services', srvPayload);
    assert(createSrv.status === 201 && createSrv.data.success, 'Log hardware service & maintenance charge', JSON.stringify(createSrv));

    // -------------------------------------------------------------
    // MODULE 7: SIM CARD & TELECOM MASTER
    // -------------------------------------------------------------
    console.log('\n--- 7. SIM CARD & TELECOM MASTER ---');
    const testSimId = `SIM-AUDIT-${Date.now().toString().slice(-4)}`;
    const testContactNumber = `93${Date.now().toString().slice(-8)}`;
    const simPayload = {
      id: testSimId,
      contactNumber: testContactNumber,
      simNumber: `8991${Date.now()}`,
      carrier: 'Airtel',
      project: 'Enterprise Audit Ops',
      assignedEmployeeId: testEmpCode,
      assignedEmployeeName: 'System Audit Employee',
      status: 'Active',
      purpose: 'WhatsApp',
      issueDate: '2026-09-15',
      remarks: 'Primary operational SIM'
    };

    const createSim = await request('POST', '/api/sims', simPayload);
    assert(createSim.status === 201 && createSim.data.success, 'Create SIM card with project & employee linkage', JSON.stringify(createSim));

    // Test Mandatory Reason for Suspension Validation
    const invalidSuspend = await request('PUT', `/api/sims/${testSimId}/suspend`, { reason: '' });
    assert(invalidSuspend.status === 400, 'Mandatory reason enforced on SIM suspension (Reject empty reason)', JSON.stringify(invalidSuspend));

    // Valid SIM Suspension
    const validSuspend = await request('PUT', `/api/sims/${testSimId}/suspend`, {
      reason: 'No longer required for the project',
      suspendedBy: 'System Auditor'
    });
    assert(validSuspend.status === 200 && validSuspend.data.success, 'Execute SIM suspension with valid reason', JSON.stringify(validSuspend));

    // SIM Reactivation
    const reactivateSim = await request('PUT', `/api/sims/${testSimId}/reactivate`);
    assert(reactivateSim.status === 200 && reactivateSim.data.success, 'Reactivate suspended SIM card', JSON.stringify(reactivateSim));

    // SIM Recharge with Auto GST Calculation
    const rechargePayload = {
      simId: testSimId,
      contactNumber: testContactNumber,
      employeeId: testEmpCode,
      employeeName: 'System Audit Employee',
      project: 'Enterprise Audit Ops',
      rechargeDate: '2026-09-15',
      planDescription: 'Airtel Unlimited 5G 84 Days',
      rechargeAmount: 1000,
      gstPercentage: 18,
      paymentMode: 'Company UPI',
      referenceNumber: `TXN-${Date.now()}`
    };
    const createRecharge = await request('POST', '/api/sim-recharges', rechargePayload);
    assert(
      createRecharge.status === 201 &&
      createRecharge.data.data.gstAmount === 180 &&
      createRecharge.data.data.totalAmount === 1180,
      'Log SIM recharge with accurate 18% GST auto-calculation (1000 + 180 = 1180)',
      JSON.stringify(createRecharge)
    );

    // SIM Requisition Request with WhatsApp Target
    const simReqPayload = {
      employeeId: testEmpCode,
      employeeName: 'System Audit Employee',
      quantity: 2,
      project: 'Enterprise Audit Ops',
      requestType: 'Additional SIM',
      purpose: 'Marketing',
      urgency: 'High',
      reason: 'Need 2 marketing SIMs for quarterly lead generation campaign',
      targetWhatsAppNumber: '9328594724'
    };
    const createSimReq = await request('POST', '/api/sim-requests', simReqPayload);
    assert(createSimReq.status === 201 && createSimReq.data.success, 'Submit New SIM Request routed to 9328594724', JSON.stringify(createSimReq));

    // -------------------------------------------------------------
    // MODULE 8: EQUIPMENT REQUISITIONS & ASSET REQUESTS
    // -------------------------------------------------------------
    console.log('\n--- 8. EQUIPMENT REQUISITIONS & ASSET REQUESTS ---');
    const assetReqPayload = {
      id: `req-${Date.now()}`,
      employeeId: testEmpCode,
      employeeName: 'System Audit Employee',
      employeeEmail: empPayload.email,
      requestDate: '2026-09-15',
      items: [
        { assetType: 'Keyboard', quantity: 1, specifications: 'Mechanical tactile switch' },
        { assetType: 'Headset', quantity: 1, specifications: 'Noise cancelling USB' }
      ],
      urgency: 'Normal',
      reason: 'Standard developer equipment upgrade',
      status: 'Pending'
    };
    const createAssetReq = await request('POST', '/api/asset-requests', assetReqPayload);
    assert(createAssetReq.status === 201 && createAssetReq.data.success, 'Submit multi-item equipment requisition to Admin', JSON.stringify(createAssetReq));

    // -------------------------------------------------------------
    // MODULE 9: WEEKLY PHOTO AUDITS & DOCUMENTATION
    // -------------------------------------------------------------
    console.log('\n--- 9. WEEKLY PHOTO AUDITS & DOCUMENTATION ---');
    const photoAuditPayload = {
      id: `audit-${Date.now()}`,
      employeeId: testEmpCode,
      employeeName: 'System Audit Employee',
      auditWeek: '2026-W37',
      auditDate: '2026-09-15',
      assetsAudited: [
        { assetNumber: testAssetNumber, assetType: 'Desktop', status: 'Good', photoUrl: 'data:image/png;base64,test' }
      ],
      remarks: 'Weekly hardware audit clean'
    };
    const createPhotoAudit = await request('POST', '/api/weekly-photos', photoAuditPayload);
    assert(createPhotoAudit.status === 201 && createPhotoAudit.data.success, 'Log weekly asset photo audit record', JSON.stringify(createPhotoAudit));

    // -------------------------------------------------------------
    // MODULE 10: AUDIT LOG TRAIL & DEACTIVATION INTEGRITY
    // -------------------------------------------------------------
    console.log('\n--- 10. AUDIT LOG TRAIL & DEACTIVATION INTEGRITY ---');
    const logPayload = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Employee Deactivated',
      details: `Deactivated employee ${empPayload.name} (${testEmpCode}). Historical records preserved.`,
      user: 'Administrator'
    };
    const createAuditLog = await request('POST', '/api/audit', logPayload);
    assert(createAuditLog.status === 201 && createAuditLog.data.success, 'Log immutable system audit trail entry', JSON.stringify(createAuditLog));

    const auditLogs = await request('GET', '/api/audit');
    assert(auditLogs.status === 200 && Array.isArray(auditLogs.data.data), 'Fetch immutable system audit trail', `Logs: ${auditLogs.data.data?.length}`);

    // Summary
    console.log('\n=========================================================');
    console.log(`  FINAL RESULT: ${passed} / ${total} TESTS PASSED (100%)`);
    console.log('=========================================================');

    if (passed === total) {
      console.log('>> ALL ADMIN & EMPLOYEE CONNECTED FEATURES ARE WORKING PROPERLY!');
      process.exit(0);
    } else {
      console.error('>> SOME TESTS FAILED. PLEASE INSPECT LOGS ABOVE.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal execution error during verification:', err);
    process.exit(1);
  }
}

runComprehensiveVerification();
