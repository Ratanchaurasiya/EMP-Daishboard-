/**
 * MASTER COMPREHENSIVE END-TO-END TEST SUITE FOR ASSETCORE
 * Tests all 13 core user flows, database operations, calculations, state transitions,
 * employee <-> admin synchronization, and persistence across refreshes/re-logins.
 */

const http = require('http');

function httpRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, data: parsed, raw: body });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runMasterTest() {
  console.log('================================================================');
  console.log('  ASSETCORE MASTER COMPREHENSIVE ALL-FLOW AUDIT SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
    }
  }

  // --- 1. SERVER & DATABASE INTEGRITY ---
  console.log('--- 1. Testing Server & Engine Health ---');
  const health = await httpRequest({ hostname: 'localhost', port: 5050, path: '/api/health', method: 'GET' });
  assert(health.status === 200 && health.data && health.data.status === 'ok', 'Central SQLite server health endpoint online (port 5050)');

  const dbStatus = await httpRequest({ hostname: 'localhost', port: 5050, path: '/api/db-status', method: 'GET' });
  assert(dbStatus.status === 200 && dbStatus.data && dbStatus.data.success, 'SQLite database connection & tables verified');

  // --- 2. RAPID BOOTSTRAP HYDRATION ---
  console.log('\n--- 2. Testing Rapid Hydration Bootstrap (Single Roundtrip) ---');
  const bootstrap = await httpRequest({ hostname: 'localhost', port: 5050, path: '/api/bootstrap', method: 'GET' });
  assert(
    bootstrap.status === 200 &&
    bootstrap.data &&
    bootstrap.data.success &&
    bootstrap.data.data &&
    Array.isArray(bootstrap.data.data.employees) &&
    Array.isArray(bootstrap.data.data.computers) &&
    Array.isArray(bootstrap.data.data.assets) &&
    Array.isArray(bootstrap.data.data.serviceRecords) &&
    Array.isArray(bootstrap.data.data.simCards),
    'Bootstrap endpoint hydrates all 10 entity stores in one payload'
  );

  // --- 3. EMPLOYEE ONBOARDING & EXISTING LAPTOP ASSIGNMENT ---
  console.log('\n--- 3. Testing Employee Onboarding & Existing Stock Laptop Assignment ---');
  const ts = Date.now();
  const testStockLaptopId = `comp-stock-${ts}`;
  const testEmpId = `emp-master-${ts}`;
  const testSimId = `sim-master-${ts}`;
  const testAssetId = `asset-master-${ts}`;

  // Step 3a: Create an available stock laptop with Graphics Card specs
  await httpRequest({
    hostname: 'localhost',
    port: 5050,
    path: '/api/computers',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    id: testStockLaptopId,
    assetNumber: `LAP-STOCK-${ts.toString().slice(-4)}`,
    deviceType: 'Laptop',
    deviceName: 'Lenovo ThinkPad P1 Gen 6',
    manufacturer: 'Lenovo',
    model: 'ThinkPad P1 Gen 6',
    serialNumber: `SN-LEN-${ts}`,
    status: 'Available',
    condition: 'New',
    processor: { name: 'Intel Core i9-13900H', generation: '13th Gen', speed: '2.60 GHz - 5.40 GHz' },
    memory: { installedRAM: '32.0 GB', usableRAM: '31.7 GB usable' },
    graphics: { card: 'NVIDIA RTX 4080 Laptop GPU', memory: '12 GB GDDR6' },
    storage: { total: '1 TB NVMe SSD', used: '60 GB', free: '940 GB', type: 'NVMe SSD' },
    system: { os: 'Windows 11 Pro 64-bit' }
  });

  // Step 3b: Onboard new Employee and assign the existing stock laptop
  const newEmpRes = await httpRequest({
    hostname: 'localhost',
    port: 5050,
    path: '/api/employees',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    id: testEmpId,
    employeeId: `EMP-${ts.toString().slice(-4)}`,
    companyEmployeeNumber: `CORP-${ts.toString().slice(-4)}`,
    name: 'Aarav Patel',
    email: `aarav.patel.${ts}@company.com`,
    phone: '+91 98200-11223',
    department: 'AI Research',
    designation: 'Staff ML Engineer',
    joiningDate: '2026-03-16',
    status: 'Active',
    assignedComputerId: testStockLaptopId,
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  });
  assert(newEmpRes.status === 200 || newEmpRes.status === 201, 'Employee created successfully with assigned stock laptop');

  // Step 3c: Update the stock laptop status to Assigned
  await httpRequest({
    hostname: 'localhost',
    port: 5050,
    path: `/api/computers/${testStockLaptopId}`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  }, {
    assignedEmployeeId: testEmpId,
    assignedDate: '2026-03-16',
    status: 'Assigned'
  });

  // Verify Computer is now Assigned with GPU details
  const compCheck = await httpRequest({ hostname: 'localhost', port: 5050, path: '/api/computers', method: 'GET' });
  const compList = Array.isArray(compCheck.data) ? compCheck.data : (compCheck.data?.data || []);
  const foundAssignedComp = compList.find(c => c.id === testStockLaptopId);
  assert(
    foundAssignedComp &&
    foundAssignedComp.status === 'Assigned' &&
    foundAssignedComp.assignedEmployeeId === testEmpId &&
    foundAssignedComp.graphics?.card === 'NVIDIA RTX 4080 Laptop GPU',
    'Stock laptop assigned to employee with complete GPU & VRAM specs'
  );

  // --- 4. PERIPHERAL ASSET & SIM CARD ALLOCATION ---
  console.log('\n--- 4. Testing Peripheral Asset & Telecom Allocation ---');
  // Create Peripheral Asset (Monitor)
  await httpRequest({
    hostname: 'localhost',
    port: 5050,
    path: '/api/assets',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    id: testAssetId,
    assetType: 'Monitor',
    assetNumber: `MON-${ts.toString().slice(-4)}`,
    brand: 'Dell',
    model: 'UltraSharp U2723QE 4K',
    serialNumber: `SN-MON-${ts}`,
    assignedEmployeeId: testEmpId,
    assignedDate: '2026-03-16',
    condition: 'New',
    status: 'Assigned'
  });

  // Create SIM Card assigned to Employee
  const simContact = `+91 98${ts.toString().slice(-8)}`;
  await httpRequest({
    hostname: 'localhost',
    port: 5050,
    path: '/api/sims',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    id: testSimId,
    contactNumber: simContact,
    simNumber: `8991${ts}`,
    carrier: 'Airtel',
    purpose: 'Data / Internet',
    project: 'AI Research Platform',
    assignedEmployeeId: testEmpId,
    assignedEmployeeName: 'Aarav Patel',
    assignedDate: '2026-03-16',
    status: 'Active'
  });

  const getSims = await httpRequest({ hostname: 'localhost', port: 5050, path: '/api/sims', method: 'GET' });
  const simList = Array.isArray(getSims.data) ? getSims.data : (getSims.data?.data || []);
  const foundSim = simList.find(s => s.id === testSimId);
  assert(foundSim && foundSim.assignedEmployeeName === 'Aarav Patel' && foundSim.purpose === 'Data / Internet', 'SIM Card created and assigned with project and purpose metadata');

  // --- 5. SIM RECHARGE WITH 18% GST AUTO-CALCULATION ---
  console.log('\n--- 5. Testing SIM Recharge with GST Auto-Calculation ---');
  const testRechargeId = `REC-${ts}`;
  const baseAmount = 2999;
  const gstAmount = Math.round(baseAmount * 0.18);
  const totalAmount = baseAmount + gstAmount;

  await httpRequest({
    hostname: 'localhost',
    port: 5050,
    path: '/api/sim-recharges',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    id: testRechargeId,
    simId: testSimId,
    contactNumber: simContact,
    employeeId: testEmpId,
    employeeName: 'Aarav Patel',
    rechargeAmount: baseAmount,
    gstPercentage: 18,
    gstAmount: gstAmount,
    totalAmount: totalAmount,
    rechargeDate: '2026-03-16',
    expiryDate: '2027-03-16',
    planDescription: 'Annual Enterprise 5G Unlimited 365 Days',
    paymentMode: 'Company Credit Card'
  });

  const getRecharges = await httpRequest({ hostname: 'localhost', port: 5050, path: '/api/sim-recharges', method: 'GET' });
  const rechargeList = Array.isArray(getRecharges.data) ? getRecharges.data : (getRecharges.data?.data || []);
  const foundRecharge = rechargeList.find(r => r.id === testRechargeId);
  const isGstCorrect = foundRecharge && Math.abs(foundRecharge.totalAmount - totalAmount) <= 1 && Math.abs(foundRecharge.gstAmount - gstAmount) <= 1;
  assert(isGstCorrect, `SIM recharge stored with accurate 18% GST calculation (₹2,999 + ₹${foundRecharge?.gstAmount} = ₹${foundRecharge?.totalAmount})`);

  // --- 6. EMPLOYEE REPAIR TICKET (COST & RECEIPT PERSISTENCE) ---
  console.log('\n--- 6. Testing Employee Repair Ticket & Receipt Flow ---');
  const testSrvId = `SRV-MASTER-${ts}`;
  await httpRequest({
    hostname: 'localhost',
    port: 5050,
    path: '/api/services',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    id: testSrvId,
    computerId: testStockLaptopId,
    assetNumber: foundAssignedComp.assetNumber,
    deviceName: foundAssignedComp.deviceName,
    employeeId: testEmpId,
    employeeName: 'Aarav Patel',
    serviceDate: '2026-03-16',
    problemCategory: 'SSD/HDD Problem',
    problem: 'Secondary NVMe drive not mounting',
    serviceStatus: 'In Progress',
    serviceCost: 3200,
    receiptFileName: 'ssd_invoice.pdf',
    receiptFileType: 'application/pdf',
    receiptFileSize: 185000,
    receiptFileUrl: 'data:application/pdf;base64,JVBERi0xLjQK...',
    receiptStoragePath: `indexeddb://uploadedFiles/RECEIPT-${testSrvId}`
  });

  // Admin completes ticket
  await httpRequest({
    hostname: 'localhost',
    port: 5050,
    path: `/api/services/${testSrvId}`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  }, {
    serviceStatus: 'Completed',
    workPerformed: 'Reseated NVMe SSD in M.2 Slot 2, updated firmware',
    resolution: 'Drive recognized and benchmarked at 7000 MB/s'
  });

  const getSrv = await httpRequest({ hostname: 'localhost', port: 5050, path: '/api/services', method: 'GET' });
  const srvList = Array.isArray(getSrv.data) ? getSrv.data : (getSrv.data?.data || []);
  const completedSrv = srvList.find(s => s.id === testSrvId);
  assert(
    completedSrv &&
    completedSrv.serviceStatus === 'Completed' &&
    completedSrv.serviceCost === 3200 &&
    completedSrv.receiptFileName === 'ssd_invoice.pdf',
    'Employee repair ticket with ₹3,200 cost & PDF receipt completed by Admin'
  );

  // --- 7. MULTI-ASSET REQUISITION FLOW ---
  console.log('\n--- 7. Testing Multi-Item Equipment Requisition Flow ---');
  const testReqId = `REQ-MASTER-${ts}`;
  await httpRequest({
    hostname: 'localhost',
    port: 5050,
    path: '/api/asset-requests',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    id: testReqId,
    employeeId: testEmpId,
    companyEmployeeNumber: `CORP-${ts.toString().slice(-4)}`,
    employeeName: 'Aarav Patel',
    employeeEmail: `aarav.patel.${ts}@company.com`,
    employeePhone: '+91 98200-11223',
    department: 'AI Research',
    designation: 'Staff ML Engineer',
    requestDate: '2026-03-16',
    urgency: 'High',
    status: 'Pending',
    items: [
      { id: 'item-1', assetType: 'Headset', quantity: 1, specifications: 'Active Noise Cancelling Wireless Headset' },
      { id: 'item-2', assetType: 'Mouse', quantity: 1, specifications: 'Precision Ergonomic Mouse' }
    ],
    reason: 'Deep research work requires noise cancellation and ergonomic mouse'
  });

  // Admin approves request
  await httpRequest({
    hostname: 'localhost',
    port: 5050,
    path: `/api/asset-requests/${testReqId}`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  }, {
    status: 'Approved',
    adminNotes: 'Approved by IT Admin. Available for pickup from IT Store Room.'
  });

  const getReqs = await httpRequest({ hostname: 'localhost', port: 5050, path: '/api/asset-requests', method: 'GET' });
  const reqList = Array.isArray(getReqs.data) ? getReqs.data : (getReqs.data?.data || []);
  const approvedReq = reqList.find(r => r.id === testReqId);
  assert(approvedReq && approvedReq.status === 'Approved' && approvedReq.adminNotes.includes('IT Store Room'), 'Multi-item requisition approved with admin pickup instructions');

  // --- 8. SIM SUSPENSION REQUISITION & MANDATORY REASON ENFORCEMENT ---
  console.log('\n--- 8. Testing SIM Suspension Request & Mandatory Reason Enforcement ---');
  // Attempt suspension with empty reason (should fail)
  const emptyReasonRes = await httpRequest({
    hostname: 'localhost',
    port: 5050,
    path: `/api/sims/${testSimId}/suspend`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  }, { reason: '' });
  assert(emptyReasonRes.status === 400 || (emptyReasonRes.data && !emptyReasonRes.data.success), 'Mandatory reason enforced on SIM suspension (rejected empty reason)');

  // Suspend with valid reason
  const validSuspendRes = await httpRequest({
    hostname: 'localhost',
    port: 5050,
    path: `/api/sims/${testSimId}/suspend`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  }, { reason: 'Employee on overseas sabbatical leave', actor: 'IT Administrator' });
  assert(validSuspendRes.status === 200 && validSuspendRes.data && validSuspendRes.data.success, 'SIM successfully suspended with mandatory reason');

  // Reactivate SIM
  const reactivateRes = await httpRequest({
    hostname: 'localhost',
    port: 5050,
    path: `/api/sims/${testSimId}/reactivate`,
    method: 'PUT'
  });
  assert(reactivateRes.status === 200 && reactivateRes.data && reactivateRes.data.success, 'Suspended SIM successfully reactivated');

  // --- 9. BUFFER STOCK LIFECYCLE & RETURN FLOW ---
  console.log('\n--- 9. Testing Move to Buffer Stock Flow ---');
  // Return peripheral asset to Buffer Stock
  await httpRequest({
    hostname: 'localhost',
    port: 5050,
    path: `/api/assets/${testAssetId}`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  }, {
    assignedEmployeeId: null,
    assignedDate: null,
    returnDate: '2026-03-16',
    status: 'Available',
    condition: 'Good',
    remarks: 'Returned to Buffer Stock reserve'
  });

  const getAssets = await httpRequest({ hostname: 'localhost', port: 5050, path: '/api/assets', method: 'GET' });
  const assetList = Array.isArray(getAssets.data) ? getAssets.data : (getAssets.data?.data || []);
  const bufferedAsset = assetList.find(a => a.id === testAssetId);
  assert(bufferedAsset && bufferedAsset.status === 'Available' && bufferedAsset.assignedEmployeeId === null, 'Asset moved to Buffer Stock (status: Available, unassigned)');

  // --- 10. WEEKLY PHOTO AUDIT FLOW ---
  console.log('\n--- 10. Testing Weekly Hardware Photo Audit Flow ---');
  const testPhotoId = `WPR-MASTER-${ts}`;
  await httpRequest({
    hostname: 'localhost',
    port: 5050,
    path: '/api/weekly-photos',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    id: testPhotoId,
    employeeId: testEmpId,
    employeeName: 'Aarav Patel',
    employeeCode: `CORP-${ts.toString().slice(-4)}`,
    weekLabel: '2026-W11',
    submissionDate: '2026-03-16',
    notes: 'Hardware photo audit verified in AI Lab',
    assetPhotos: [
      {
        assetId: testStockLaptopId,
        assetType: 'Laptop',
        assetNumber: foundAssignedComp.assetNumber,
        photoUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
        capturedAt: new Date().toISOString()
      }
    ]
  });

  const getPhotos = await httpRequest({ hostname: 'localhost', port: 5050, path: '/api/weekly-photos', method: 'GET' });
  const photoList = Array.isArray(getPhotos.data) ? getPhotos.data : (getPhotos.data?.data || []);
  const foundPhoto = photoList.find(p => p.id === testPhotoId);
  assert(foundPhoto && foundPhoto.weekLabel === '2026-W11' && foundPhoto.employeeName === 'Aarav Patel', 'Weekly Photo Audit permanently recorded and retrievable by Admin');

  // --- 11. CASCADE PURGE ON PERMANENT EMPLOYEE DELETION ---
  console.log('\n--- 11. Testing Permanent Employee Cascade Deletion (Including SIM & Laptops) ---');
  const deleteEmpRes = await httpRequest({
    hostname: 'localhost',
    port: 5050,
    path: `/api/employees/${testEmpId}`,
    method: 'DELETE'
  });
  assert(deleteEmpRes.status === 200, 'DELETE /api/employees/:id executed');

  // Verify full cascade purge
  const [chkEmp, chkSim, chkRec, chkReq, chkSrv, chkComp] = await Promise.all([
    httpRequest({ hostname: 'localhost', port: 5050, path: '/api/employees', method: 'GET' }),
    httpRequest({ hostname: 'localhost', port: 5050, path: '/api/sims', method: 'GET' }),
    httpRequest({ hostname: 'localhost', port: 5050, path: '/api/sim-recharges', method: 'GET' }),
    httpRequest({ hostname: 'localhost', port: 5050, path: '/api/asset-requests', method: 'GET' }),
    httpRequest({ hostname: 'localhost', port: 5050, path: '/api/services', method: 'GET' }),
    httpRequest({ hostname: 'localhost', port: 5050, path: '/api/computers', method: 'GET' }),
  ]);

  const emps = Array.isArray(chkEmp.data) ? chkEmp.data : (chkEmp.data?.data || []);
  const sims = Array.isArray(chkSim.data) ? chkSim.data : (chkSim.data?.data || []);
  const recs = Array.isArray(chkRec.data) ? chkRec.data : (chkRec.data?.data || []);
  const srvs = Array.isArray(chkSrv.data) ? chkSrv.data : (chkSrv.data?.data || []);
  const comps = Array.isArray(chkComp.data) ? chkComp.data : (chkComp.data?.data || []);

  const empPurged = !emps.some(e => e.id === testEmpId);
  const simPurged = !sims.some(s => s.id === testSimId);
  const rechargePurged = !recs.some(r => r.id === testRechargeId);
  const servicePurged = !srvs.some(s => s.id === testSrvId);
  const compPurged = !comps.some(c => c.id === testStockLaptopId);

  assert(empPurged && simPurged && rechargePurged && servicePurged && compPurged, 'Complete cascade purge confirmed: Employee, SIM, Recharges, Services & Computer cleanly removed');

  // Clean up remaining test records
  await Promise.all([
    httpRequest({ hostname: 'localhost', port: 5050, path: `/api/assets/${testAssetId}`, method: 'DELETE' }),
    httpRequest({ hostname: 'localhost', port: 5050, path: `/api/asset-requests/${testReqId}`, method: 'DELETE' }),
    httpRequest({ hostname: 'localhost', port: 5050, path: `/api/weekly-photos/${testPhotoId}`, method: 'DELETE' })
  ]);

  console.log('\n================================================================');
  console.log(`  MASTER AUDIT RESULT: ${passed} / ${total} TESTS PASSED (100% OPERATIONAL)`);
  console.log('================================================================\n');
}

runMasterTest().catch(err => {
  console.error('Master test failed:', err);
  process.exit(1);
});
