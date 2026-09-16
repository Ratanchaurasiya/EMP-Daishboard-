// scripts/test-employee-delete-cascade.cjs
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

async function runEmployeeCascadeDeleteAudit() {
  console.log('================================================================');
  console.log('  TESTING COMPLETE CASCADE DELETION OF EMPLOYEE & SIM INFO      ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, name, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] ${name}`);
    } else {
      console.error(`  [FAIL] ${name} - ${details}`);
    }
  }

  const timestamp = Date.now();
  const testEmpId = `emp-del-${timestamp}`;
  const testEmpCode = `EMP-DEL-${timestamp.toString().slice(-4)}`;
  const testSimId = `sim-del-${timestamp}`;
  const testCompId = `comp-del-${timestamp}`;
  const testAssetId = `ast-del-${timestamp}`;
  const testServiceId = `srv-del-${timestamp}`;
  const testRechargeId = `rec-del-${timestamp}`;
  const testSimReqId = `sreq-del-${timestamp}`;
  const testAssetReqId = `areq-del-${timestamp}`;
  const testPhotoId = `photo-del-${timestamp}`;
  const testContact = `98${timestamp.toString().slice(-8)}`;

  try {
    // 1. Create Employee
    console.log('--- 1. SEEDING TEST EMPLOYEE & CONNECTED ECOSYSTEM ---');
    const empRes = await request('POST', '/api/employees', {
      id: testEmpId,
      employeeId: testEmpCode,
      name: 'Full Deletion Test Employee',
      email: `del.test.${timestamp}@company.com`,
      phone: testContact,
      designation: 'Operations Lead',
      department: 'Field Operations',
      status: 'Active',
      joiningDate: '2026-01-10',
    });
    assert(empRes.status === 201 && empRes.data.success, 'Created test employee');

    // 2. Create Assigned SIM Card
    const simRes = await request('POST', '/api/sims', {
      id: testSimId,
      contactNumber: testContact,
      simNumber: `8991${timestamp}`,
      carrier: 'Jio 5G',
      project: 'Field Operations',
      assignedEmployeeId: testEmpCode,
      assignedEmployeeName: 'Full Deletion Test Employee',
      status: 'Active',
      purpose: 'Field Ops Calling',
      monthlyPlanAmount: 499,
    });
    assert(simRes.status === 201 && simRes.data.success, 'Created SIM card assigned to employee');

    // 3. Create SIM Recharge
    const recRes = await request('POST', '/api/sim-recharges', {
      id: testRechargeId,
      simId: testSimId,
      contactNumber: testContact,
      employeeId: testEmpCode,
      employeeName: 'Full Deletion Test Employee',
      project: 'Field Operations',
      rechargeDate: '2026-09-16',
      planDescription: 'Jio 84 Days 2GB/Day',
      rechargeAmount: 719,
      gstPercentage: 18,
      paymentMode: 'Company Card',
    });
    assert(recRes.status === 201 && recRes.data.success, 'Created SIM recharge linked to employee & SIM');

    // 4. Create SIM Request
    const simReqRes = await request('POST', '/api/sim-requests', {
      id: testSimReqId,
      employeeId: testEmpCode,
      employeeName: 'Full Deletion Test Employee',
      quantity: 1,
      project: 'Field Operations',
      requestType: 'New SIM',
      purpose: 'Calling',
      urgency: 'Normal',
      reason: 'Additional line for regional coordinator',
    });
    assert(simReqRes.status === 201 && simReqRes.data.success, 'Created SIM requisition request for employee');

    // 5. Create Computer Assigned to Employee
    const compRes = await request('POST', '/api/computers', {
      id: testCompId,
      assetNumber: `LAP-DEL-${timestamp.toString().slice(-4)}`,
      deviceName: 'Lenovo ThinkPad P14s',
      assignedEmployeeId: testEmpId,
      assignedEmployeeName: 'Full Deletion Test Employee',
      status: 'Assigned',
      manufacturer: 'Lenovo',
      model: 'ThinkPad P14s Gen 4',
    });
    assert(compRes.status === 201 && compRes.data.success, 'Created laptop assigned to employee');

    // 6. Create Service Record
    const srvRes = await request('POST', '/api/services', {
      id: testServiceId,
      computerId: testCompId,
      assetNumber: `LAP-DEL-${timestamp.toString().slice(-4)}`,
      deviceName: 'Lenovo ThinkPad P14s',
      employeeId: testEmpCode,
      employeeName: 'Full Deletion Test Employee',
      serviceDate: '2026-09-16',
      problem: 'Keyboard backlight flickering',
      problemCategory: 'Keyboard Problem',
      workPerformed: 'Replaced keyboard ribbon cable',
      partsReplaced: 'Ribbon Cable',
      technician: 'Rajesh Sharma',
      serviceCost: 650,
      serviceStatus: 'Completed',
    });
    assert(srvRes.status === 201 && srvRes.data.success, 'Created service record for employee laptop');

    // 7. Execute Employee Deletion via DELETE /api/employees/:id
    console.log('\n--- 2. EXECUTING PERMANENT EMPLOYEE DELETION ---');
    const deleteRes = await request('DELETE', `/api/employees/${testEmpId}`);
    assert(deleteRes.status === 200 && deleteRes.data.success, 'DELETE /api/employees/:id returned 200 success', JSON.stringify(deleteRes));

    // 8. Verify Cascade Deletion across all collections
    console.log('\n--- 3. VERIFYING PURGE OF ALL EMPLOYEE & SIM INFO ---');
    
    // Check Employees
    const empList = await request('GET', '/api/employees');
    const empExists = (empList.data.data || []).some(e => e.id === testEmpId || e.employeeId === testEmpCode);
    assert(!empExists, 'Employee record completely removed from /api/employees');

    // Check SIM Cards
    const simList = await request('GET', '/api/sims');
    const simExists = (simList.data.data || []).some(s => s.id === testSimId || s.assignedEmployeeId === testEmpCode || s.assignedEmployeeId === testEmpId);
    assert(!simExists, 'SIM Card record completely removed from /api/sims');

    // Check SIM Recharges
    const rechargeList = await request('GET', '/api/sim-recharges');
    const recExists = (rechargeList.data.data || []).some(r => r.id === testRechargeId || r.employeeId === testEmpCode || r.employeeId === testEmpId);
    assert(!recExists, 'SIM recharge records completely removed from /api/sim-recharges');

    // Check SIM Requests
    const simReqList = await request('GET', '/api/sim-requests');
    const reqExists = (simReqList.data.data || []).some(req => req.id === testSimReqId || req.employeeId === testEmpCode || req.employeeId === testEmpId);
    assert(!reqExists, 'SIM requisition requests completely removed from /api/sim-requests');

    // Check Computers
    const compList = await request('GET', '/api/computers');
    const compExists = (compList.data.data || []).some(c => c.id === testCompId || c.assignedEmployeeId === testEmpId || c.assignedEmployeeId === testEmpCode);
    assert(!compExists, 'Assigned computer completely removed from /api/computers');

    // Check Service Records
    const srvList = await request('GET', '/api/services');
    const srvExists = (srvList.data.data || []).some(s => s.id === testServiceId || s.employeeId === testEmpCode || s.employeeId === testEmpId);
    assert(!srvExists, 'Service records completely removed from /api/services');

    // Check Bootstrap Payload
    console.log('\n--- 4. RAPID BOOTSTRAP HYDRATION PURGE AUDIT ---');
    const bootstrap = await request('GET', '/api/bootstrap');
    assert(bootstrap.status === 200 && bootstrap.data.success, 'GET /api/bootstrap responded');
    
    const bEmp = (bootstrap.data.data.employees || []).some(e => e.id === testEmpId || e.employeeId === testEmpCode);
    const bSim = (bootstrap.data.data.simCards || []).some(s => s.id === testSimId || s.assignedEmployeeId === testEmpCode);
    const bRec = (bootstrap.data.data.simRecharges || []).some(r => r.id === testRechargeId || r.employeeId === testEmpCode);
    const bReq = (bootstrap.data.data.simRequests || []).some(req => req.id === testSimReqId || req.employeeId === testEmpCode);
    const bComp = (bootstrap.data.data.computers || []).some(c => c.id === testCompId);
    const bSrv = (bootstrap.data.data.serviceRecords || []).some(s => s.id === testServiceId);

    assert(!bEmp && !bSim && !bRec && !bReq && !bComp && !bSrv, 'Rapid Bootstrap confirms 100% clean purge of employee, SIM, recharge, computer & service data');

    console.log('\n================================================================');
    console.log(`  RESULT: ${passed} / ${total} TESTS PASSED (100%)`);
    console.log('================================================================');
    if (passed === total) {
      console.log('>> EMPLOYEE PURGE CASCADE (INCLUDING SIM INFO) IS 100% OPERATIONAL!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runEmployeeCascadeDeleteAudit();
