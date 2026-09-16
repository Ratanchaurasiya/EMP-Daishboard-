const http = require('http');

const API_BASE = 'http://localhost:5050/api';

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, data });
          }
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTest() {
  console.log('🧪 Starting Assign Existing Laptop from Stock Test Suite...');

  // 1. Create a spare laptop in Buffer Stock (unassigned)
  const stockCompId = 'comp-stock-test-' + Date.now();
  const stockComp = {
    id: stockCompId,
    assetNumber: 'LAP-STOCK-POOL-01',
    deviceName: 'Buffer_Precision_Laptop',
    manufacturer: 'Dell',
    model: 'Precision 7780 Workstation',
    deviceType: 'Laptop',
    serialNumber: 'SN-STOCK-778899',
    assignedEmployeeId: null,
    assignedDate: null,
    condition: 'New',
    status: 'Available',
    remarks: 'Pristine unit in central buffer stock',
  };

  const createCompRes = await request(`${API_BASE}/computers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: stockComp,
  });

  if (createCompRes.status !== 200 && createCompRes.status !== 201) {
    throw new Error('Failed to create stock computer: ' + JSON.stringify(createCompRes.data));
  }
  console.log('✅ Created unassigned laptop in buffer stock:', stockComp.assetNumber);

  // 2. Create a new employee and assign this EXISTING laptop
  const newEmpId = 'emp-onboard-test-' + Date.now();
  const newEmp = {
    id: newEmpId,
    employeeId: 'EMP999',
    companyEmployeeNumber: 'CORP-9999',
    name: 'Vikram Malhotra',
    department: 'Engineering',
    designation: 'Senior DevOps Architect',
    team: 'Infrastructure Core',
    joiningDate: '2026-03-16',
    status: 'Active',
    email: 'vikram.malhotra@enterprise.io',
    phone: '+91 99887 76655',
    remarks: 'Assigned stock laptop on onboarding',
  };

  const createEmpRes = await request(`${API_BASE}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: newEmp,
  });

  if (createEmpRes.status !== 200 && createEmpRes.status !== 201) {
    throw new Error('Failed to create employee: ' + JSON.stringify(createEmpRes.data));
  }
  console.log('✅ Created new employee:', newEmp.name);

  // 3. Update the existing stock laptop to be assigned to this employee
  const assignCompRes = await request(`${API_BASE}/computers/${stockCompId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: {
      assignedEmployeeId: newEmpId,
      assignedDate: newEmp.joiningDate,
      status: 'Assigned',
      condition: 'New',
      remarks: `Assigned to ${newEmp.name} from available stock`,
    },
  });

  if (assignCompRes.status !== 200) {
    throw new Error('Failed to assign stock computer to employee: ' + JSON.stringify(assignCompRes.data));
  }
  console.log('✅ Assigned existing buffer stock laptop to new employee.');

  // 4. Create allocation record
  const allocRes = await request(`${API_BASE}/allocations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      id: 'alloc-test-' + Date.now(),
      employeeId: newEmp.employeeId,
      employeeName: newEmp.name,
      assetId: stockCompId,
      assetType: 'Laptop',
      assetNumber: stockComp.assetNumber,
      serialNumber: stockComp.serialNumber,
      assignedDate: newEmp.joiningDate,
      issuedBy: 'IT Administrator',
      receivedBy: newEmp.name,
      conditionAtIssue: 'New',
      returnDate: null,
      returnCondition: null,
      status: 'Assigned',
      remarks: 'Assigned from available buffer stock during onboarding',
    },
  });

  if (allocRes.status !== 200 && allocRes.status !== 201) {
    throw new Error('Failed to create allocation record: ' + JSON.stringify(allocRes.data));
  }
  console.log('✅ Created asset allocation record.');

  // 5. Verify via /api/bootstrap
  const bootRes = await request(`${API_BASE}/bootstrap`);
  const { employees, computers, allocationRecords } = bootRes.data.data;

  const foundEmp = employees.find(e => e.id === newEmpId);
  const foundComp = computers.find(c => c.id === stockCompId);
  const foundAlloc = allocationRecords.find(a => a.assetId === stockCompId && a.employeeId === newEmp.employeeId);

  if (!foundEmp) throw new Error('Employee not found in bootstrap');
  if (!foundComp) throw new Error('Computer not found in bootstrap');
  if (foundComp.status !== 'Assigned') throw new Error(`Expected computer status 'Assigned', got '${foundComp.status}'`);
  if (foundComp.assignedEmployeeId !== newEmpId) throw new Error(`Expected assignedEmployeeId '${newEmpId}', got '${foundComp.assignedEmployeeId}'`);
  if (!foundAlloc) throw new Error('Allocation record not found in bootstrap');

  console.log('✅ Verification passed: Existing stock laptop successfully assigned to new employee!');

  // Clean up test records
  await request(`${API_BASE}/employees/${newEmpId}`, { method: 'DELETE' });
  await request(`${API_BASE}/computers/${stockCompId}`, { method: 'DELETE' });
  console.log('🧹 Cleaned up test records.');

  console.log('\n🎉 ALL ASSIGN EXISTING LAPTOP FROM STOCK TESTS PASSED SUCCESSFULLY!');
}

runTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
