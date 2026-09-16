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
  console.log('🧪 Starting Buffer Stock Flow Test Suite...');

  // 1. Check bootstrap
  const bootRes = await request(`${API_BASE}/bootstrap`);
  if (bootRes.status !== 200 || !bootRes.data.success) {
    throw new Error('Bootstrap API failed');
  }

  const { employees, computers, assets } = bootRes.data.data;
  console.log(`✅ Loaded bootstrap: ${employees.length} employees, ${computers.length} computers, ${assets.length} assets.`);

  // 2. Create a test assigned computer
  const testCompId = 'comp-buffer-test-' + Date.now();
  const testComp = {
    id: testCompId,
    assetNumber: 'LAP-BUF-TEST-99',
    deviceName: 'Test_Buffer_Laptop',
    manufacturer: 'Lenovo',
    model: 'ThinkPad T14s',
    deviceType: 'Laptop',
    serialNumber: 'SN-BUF-998877',
    assignedEmployeeId: employees[0]?.id || 'EMP001',
    assignedDate: '2026-01-15',
    condition: 'Good',
    status: 'Assigned',
    remarks: 'Assigned to primary staff member',
  };

  const createRes = await request(`${API_BASE}/computers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: testComp,
  });

  if (createRes.status !== 201 && createRes.status !== 200) {
    throw new Error('Failed to create test computer: ' + JSON.stringify(createRes.data));
  }
  console.log('✅ Created test assigned computer:', testComp.assetNumber);

  // 3. Move/Return computer to Buffer Stock (status: 'Available', assignedEmployeeId: null)
  const updateRes = await request(`${API_BASE}/computers/${testCompId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: {
      assignedEmployeeId: null,
      assignedDate: null,
      condition: 'Good',
      status: 'Available',
      remarks: 'Returned and moved to Buffer Stock for reassignment.',
    },
  });

  if (updateRes.status !== 200) {
    throw new Error('Failed to update computer to Buffer Stock: ' + JSON.stringify(updateRes.data));
  }
  console.log('✅ Successfully moved computer to Buffer Stock (Available, Unassigned).');

  // 4. Verify in Bootstrap / Get Computers
  const verifyRes = await request(`${API_BASE}/computers`);
  const updatedComp = verifyRes.data.data.find(c => c.id === testCompId);

  if (!updatedComp) {
    throw new Error('Computer not found after update');
  }

  if (updatedComp.status !== 'Available') {
    throw new Error(`Expected status 'Available', got '${updatedComp.status}'`);
  }

  if (updatedComp.assignedEmployeeId !== null && updatedComp.assignedEmployeeId !== undefined && updatedComp.assignedEmployeeId !== '') {
    throw new Error(`Expected assignedEmployeeId null/empty, got '${updatedComp.assignedEmployeeId}'`);
  }

  console.log('✅ Verification passed: Computer is in Buffer Stock with status "Available" and ready for reassignment.');

  // Clean up test computer
  await request(`${API_BASE}/computers/${testCompId}`, { method: 'DELETE' });
  console.log('🧹 Cleaned up test record.');

  console.log('\n🎉 ALL BUFFER STOCK TESTS PASSED SUCCESSFULLY!');
}

runTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
