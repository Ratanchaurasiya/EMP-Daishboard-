// Comprehensive End-to-End Database CRUD & Persistence Test Suite
import { db } from '../server/db.js';

async function runTests() {
  console.log('====================================================');
  console.log(`🧪 Running AssetCore Database CRUD & Persistence Tests`);
  console.log(`📂 Active Engine: ${db.activeEngine}`);
  console.log(`📁 Database Path: ${db.dbPath}`);
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Employee CRUD
    // -------------------------------------------------------------
    console.log('--- Test 1: Employee CRUD ---');
    const runId = Date.now().toString().slice(-4);
    const testEmp = {
      id: 'emp-test-' + runId,
      employeeId: 'EMP' + runId,
      companyEmployeeNumber: 'CORP-' + runId,
      name: 'Ratan Test Engineer',
      department: 'Cloud Infrastructure',
      designation: 'Staff DevOps Engineer',
      team: 'Platform & SRE',
      joiningDate: '2026-01-15',
      status: 'Active',
      email: `ratan.test.${runId}@company.com`,
      phone: '+91 99887-76655',
      remarks: 'Primary test employee for PostgreSQL verification',
    };

    await db.upsert('employees', testEmp);
    let emp = await db.getById('employees', testEmp.id);
    await assert(emp && emp.employeeId === testEmp.employeeId && emp.name === 'Ratan Test Engineer', 'Insert and retrieve employee');

    // Update Employee
    emp.designation = 'Principal Platform Engineer';
    await db.upsert('employees', emp);
    let updatedEmp = await db.getById('employees', testEmp.id);
    await assert(updatedEmp && updatedEmp.designation === 'Principal Platform Engineer', 'Update employee details');

    // -------------------------------------------------------------
    // Test 2: PC/Laptop Asset CRUD & Assignment
    // -------------------------------------------------------------
    console.log('\n--- Test 2: PC/Laptop Asset CRUD & Assignment ---');
    const testComp = {
      id: 'comp-test-' + runId,
      assetNumber: 'LAP-' + runId,
      deviceName: 'ThinkPad P1 Gen 7',
      modelNumber: '21KV000GUS',
      deviceType: 'Laptop',
      brand: 'Lenovo',
      processor: 'Intel Core Ultra 9 185H',
      ram: '64GB LPDDR5x',
      storage: '2TB PCIe Gen4 NVMe SSD',
      gpu: 'NVIDIA RTX 4070 Ada 8GB',
      operatingSystem: 'Ubuntu 24.04 LTS / Windows 11 Pro',
      assignedEmployeeId: testEmp.id,
      assignedDate: '2026-01-16',
      condition: 'Brand New',
      status: 'Assigned',
    };

    await db.upsert('computers', testComp);
    let comp = await db.getById('computers', testComp.id);
    await assert(comp && comp.assetNumber === testComp.assetNumber && comp.assignedEmployeeId === testEmp.id, 'Insert and retrieve assigned laptop');

    // Update Computer
    comp.ram = '96GB LPDDR5x';
    await db.upsert('computers', comp);
    let updatedComp = await db.getById('computers', testComp.id);
    await assert(updatedComp && updatedComp.ram === '96GB LPDDR5x', 'Update laptop hardware specs');

    // -------------------------------------------------------------
    // Test 3: Other Company Assets (Mouse, Keyboard, Headset, Mobile, Monitor)
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Peripherals & Multi-Asset Inventory ---');
    const testAssets = [
      {
        id: 'asset-m-' + runId,
        assetNumber: 'MOU-' + runId,
        assetType: 'Mouse',
        brand: 'Logitech',
        model: 'MX Master 3S',
        serialNumber: 'SN-MOU-' + runId,
        assignedEmployeeId: testEmp.id,
        assignedDate: '2026-01-16',
        condition: 'Good',
        status: 'Assigned',
      },
      {
        id: 'asset-k-' + runId,
        assetNumber: 'KBD-' + runId,
        assetType: 'Keyboard',
        brand: 'Keychron',
        model: 'K3 Max Wireless Mechanical',
        serialNumber: 'SN-KBD-' + runId,
        assignedEmployeeId: testEmp.id,
        assignedDate: '2026-01-16',
        condition: 'Good',
        status: 'Assigned',
      },
      {
        id: 'asset-h-' + runId,
        assetNumber: 'HDS-' + runId,
        assetType: 'Headset',
        brand: 'Sony',
        model: 'WH-1000XM5',
        serialNumber: 'SN-HDS-' + runId,
        assignedEmployeeId: testEmp.id,
        assignedDate: '2026-01-16',
        condition: 'Good',
        status: 'Assigned',
      },
      {
        id: 'asset-p-' + runId,
        assetNumber: 'PHN-' + runId,
        assetType: 'Mobile Phone',
        brand: 'Apple',
        model: 'iPhone 15 Pro 256GB',
        serialNumber: 'SN-PHN-' + runId,
        imeiNumber: '354892019283' + runId,
        phoneNumber: '+91 99887-76655',
        assignedEmployeeId: testEmp.id,
        assignedDate: '2026-01-16',
        condition: 'Brand New',
        status: 'Assigned',
      },
      {
        id: 'asset-mon-' + runId,
        assetNumber: 'MON-' + runId,
        assetType: 'Monitor',
        brand: 'Dell UltraSharp',
        model: 'U2723QE 27" 4K IPS Black',
        serialNumber: 'SN-MON-' + runId,
        assignedEmployeeId: testEmp.id,
        assignedDate: '2026-01-16',
        condition: 'Brand New',
        status: 'Assigned',
      },
    ];

    for (const a of testAssets) {
      await db.upsert('assets', a);
    }

    const allAssets = await db.getAll('assets');
    const foundMouse = allAssets.find(a => a.assetNumber === 'MOU-' + runId);
    const foundPhone = allAssets.find(a => a.assetNumber === 'PHN-' + runId);
    const foundMonitor = allAssets.find(a => a.assetNumber === 'MON-' + runId);
    await assert(foundMouse && foundPhone && foundMonitor, 'Insert and retrieve peripheral assets (Mouse, Phone, Monitor)');

    // -------------------------------------------------------------
    // Test 4: Service History Records
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Service History CRUD ---');
    const testService = {
      id: 'srv-test-' + Date.now(),
      computerId: testComp.id,
      employeeId: testEmp.employeeId,
      employeeName: testEmp.name,
      serviceDate: '2026-02-10',
      serviceCharge: 2500,
      workPerformed: 'Thermal paste repasting and fan dust cleaning',
      partsReplaced: 'Thermal Grizzly Kryonaut Extreme',
      technician: 'Ravi Kumar (Authorized Tech)',
      status: 'Completed',
      notes: 'Completed annual preventive maintenance successfully.',
    };

    await db.upsert('service_records', testService);
    let srv = await db.getById('service_records', testService.id);
    await assert(srv && srv.serviceCharge === 2500 && srv.computerId === testComp.id, 'Insert and retrieve service record');

    // -------------------------------------------------------------
    // Test 5: Hardware Purchases & Accessories
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Asset Purchases & Accounting ---');
    const testPurchase = {
      id: 'pur-test-' + runId,
      purchaseNumber: 'PO-2026-' + runId,
      deviceType: 'Laptop',
      brand: 'Lenovo',
      modelName: 'ThinkPad P1 Gen 7',
      serialNumber: 'SN-LEN-' + runId,
      purchaseDate: '2026-01-10',
      vendor: 'Lenovo Commercial Enterprise Direct',
      deviceCost: 220000,
      totalAccessoriesCost: 15000,
      grandTotalCost: 235000,
      status: 'Assigned',
      accessories: [
        { id: 'acc-1', accessoryName: 'USB-C Universal Dock', quantity: 1, unitCost: 12000, totalCost: 12000 },
        { id: 'acc-2', accessoryName: 'Lenovo Privacy Screen Filter', quantity: 1, unitCost: 3000, totalCost: 3000 },
      ],
    };

    await db.upsert('purchases', testPurchase);
    let pur = await db.getById('purchases', testPurchase.id);
    await assert(pur && pur.grandTotalCost === 235000 && pur.purchaseNumber === testPurchase.purchaseNumber, 'Insert and retrieve purchase record with accounting totals');

    // -------------------------------------------------------------
    // Test 6: Employee Requests (Requisitions) Lifecycle
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Employee Requisitions Lifecycle ---');
    const testRequest = {
      id: 'req-test-' + runId,
      employeeId: testEmp.employeeId,
      employeeName: testEmp.name,
      department: testEmp.department,
      designation: testEmp.designation,
      urgency: 'High',
      status: 'Pending',
      requestDate: '2026-03-15',
      items: [
        { id: 'item-1', assetType: 'Monitor', quantity: 1, specifications: '32-inch 4K HDR USB-C Hub Display' },
      ],
      reason: 'Architecture diagramming and multi-cluster Kubernetes monitoring.',
    };

    await db.upsert('asset_requests', testRequest);
    let req = await db.getById('asset_requests', testRequest.id);
    await assert(req && req.status === 'Pending' && req.employeeId === testEmp.employeeId, 'Employee submits equipment request');

    // Admin updates request
    req.status = 'Approved';
    req.adminNotes = 'Approved by Infrastructure Lead. Asset dispatched for procurement.';
    await db.upsert('asset_requests', req);
    let updatedReq = await db.getById('asset_requests', testRequest.id);
    await assert(updatedReq && updatedReq.status === 'Approved' && updatedReq.adminNotes.includes('Approved by Infrastructure Lead'), 'Admin updates request status and notes');

    // -------------------------------------------------------------
    // Test 7: Audit Log Tracking
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Audit Logging ---');
    const testLog = {
      id: 'log-test-' + runId,
      action: 'Asset Assigned',
      actor: 'IT Administrator',
      details: `Assigned Laptop LAP-${runId} and Peripherals to ${testEmp.name}`,
      timestamp: new Date().toISOString(),
    };
    await db.upsert('audit_logs', testLog);
    const logs = await db.getAll('audit_logs');
    const foundLog = logs.find(l => l.id === testLog.id);
    await assert(foundLog && foundLog.action === 'Asset Assigned', 'Record and query audit log');

    // -------------------------------------------------------------
    // Test 8: System Statistics & Telemetry
    // -------------------------------------------------------------
    console.log('\n--- Test 8: System Statistics & Diagnostics ---');
    const stats = await db.getStats();
    await assert(stats.connected === true && stats.totalRecords > 0, `Database statistics verified (${stats.totalRecords} total items across tables)`);

    // -------------------------------------------------------------
    // Test 9: Deletion & Cleanup
    // -------------------------------------------------------------
    console.log('\n--- Test 9: Delete Operations ---');
    const delComp = await db.delete('computers', testComp.id);
    const delEmp = await db.delete('employees', testEmp.id);
    for (const a of testAssets) {
      await db.delete('assets', a.id);
    }
    await db.delete('service_records', testService.id);
    await db.delete('purchases', testPurchase.id);
    await db.delete('asset_requests', testRequest.id);
    await db.delete('audit_logs', testLog.id);

    const checkEmp = await db.getById('employees', testEmp.id);
    const checkComp = await db.getById('computers', testComp.id);
    await assert(checkEmp === null && checkComp === null, 'Verify clean removal of test records from database');

    console.log('\n====================================================');
    console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('\n❌ Unhandled Test Error:', err);
    process.exit(1);
  }
}

runTests();
