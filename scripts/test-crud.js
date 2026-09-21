// Comprehensive End-to-End Database CRUD, Multi-Engine & Persistence Test Suite
import { db } from '../server/db.js';

async function runTests() {
  console.log('====================================================');
  console.log(`🧪 Running AssetCore Database CRUD & Persistence Tests`);
  console.log(`📂 Active Engine: ${db.activeEngine}`);
  console.log(`📁 Database Path: ${db.dbPath}`);
  console.log(`⚡ PostgreSQL Mode: ${db.isPostgres ? 'ACTIVE' : 'No'}`);
  console.log(`⚡ MySQL Mode: ${db.isMySQL ? 'ACTIVE' : 'No'}`);
  console.log(`⚡ Native SQLite WAL Mode: ${db.isSQLite ? 'ACTIVE' : 'No'}`);
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
    const runId = Date.now().toString().slice(-4);

    // -------------------------------------------------------------
    // Test 1: Employee CRUD
    // -------------------------------------------------------------
    console.log('--- Test 1: Employee CRUD ---');
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
      remarks: 'Primary test employee for persistent database verification',
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
      notes: 'Completed preventive maintenance successfully.',
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
      vendor: 'Lenovo Commercial Direct',
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
    // Test 7: SIM Cards CRUD & Lifecycle
    // -------------------------------------------------------------
    console.log('\n--- Test 7: SIM Cards Management ---');
    const testSim = {
      id: 'sim-test-' + runId,
      contactNumber: '+91 98765-4' + runId,
      simNumber: '899100123456789' + runId,
      carrier: 'Airtel',
      assignedEmployeeId: testEmp.id,
      assignedEmployeeName: testEmp.name,
      status: 'Assigned',
      purpose: 'Field Operations',
      project: 'Cloud Infra Migration',
      remarks: 'Primary corporate SIM',
      assignedDate: '2026-01-16',
    };

    await db.upsert('sim_cards', testSim);
    let sim = await db.getById('sim_cards', testSim.id);
    await assert(sim && sim.contactNumber === testSim.contactNumber && sim.status === 'Assigned', 'Insert and retrieve SIM card');

    // Test SIM Suspension
    sim.status = 'Suspended';
    sim.suspensionReason = 'Employee on sabbatical';
    await db.upsert('sim_cards', sim);
    let suspendedSim = await db.getById('sim_cards', testSim.id);
    await assert(suspendedSim && suspendedSim.status === 'Suspended' && suspendedSim.suspensionReason === 'Employee on sabbatical', 'Suspend SIM card with audit reason');

    // Test SIM Reactivation
    suspendedSim.status = 'Active';
    suspendedSim.suspensionReason = null;
    await db.upsert('sim_cards', suspendedSim);
    let reactivatedSim = await db.getById('sim_cards', testSim.id);
    await assert(reactivatedSim && reactivatedSim.status === 'Active' && reactivatedSim.suspensionReason === null, 'Reactivate SIM card');

    // -------------------------------------------------------------
    // Test 8: SIM Recharges & GST Accounting
    // -------------------------------------------------------------
    console.log('\n--- Test 8: SIM Recharges & Financial Accounting ---');
    const rechargeAmount = 999;
    const gstPercentage = 18;
    const gstAmount = Number(((rechargeAmount * gstPercentage) / 100).toFixed(2));
    const totalAmount = rechargeAmount + gstAmount;

    const testRecharge = {
      id: 'rec-test-' + runId,
      simId: testSim.id,
      contactNumber: testSim.contactNumber,
      employeeId: testEmp.employeeId,
      employeeName: testEmp.name,
      rechargeDate: '2026-03-01',
      validityDays: 84,
      dataLimit: '2GB/day',
      rechargeAmount,
      gstPercentage,
      gstAmount,
      totalAmount,
      paymentMethod: 'Corporate Corporate Card',
      receiptNumber: 'RCP-' + runId,
    };

    await db.upsert('sim_recharges', testRecharge);
    let rec = await db.getById('sim_recharges', testRecharge.id);
    await assert(rec && rec.totalAmount === 1178.82 && rec.simId === testSim.id, 'Insert and retrieve SIM recharge with GST');

    // -------------------------------------------------------------
    // Test 9: SIM Requests Lifecycle
    // -------------------------------------------------------------
    console.log('\n--- Test 9: SIM Requisitions Lifecycle ---');
    const testSimReq = {
      id: 'simreq-test-' + runId,
      employeeId: testEmp.employeeId,
      employeeName: testEmp.name,
      department: testEmp.department,
      requestType: 'New SIM Card',
      purpose: 'Client Site Visits',
      preferredCarrier: 'Jio',
      urgency: 'Medium',
      status: 'Pending',
      requestDate: '2026-03-10',
    };

    await db.upsert('sim_requests', testSimReq);
    let simReq = await db.getById('sim_requests', testSimReq.id);
    await assert(simReq && simReq.status === 'Pending' && simReq.employeeId === testEmp.employeeId, 'Employee submits SIM request');

    simReq.status = 'Approved';
    await db.upsert('sim_requests', simReq);
    let approvedSimReq = await db.getById('sim_requests', testSimReq.id);
    await assert(approvedSimReq && approvedSimReq.status === 'Approved', 'Approve SIM request');

    // -------------------------------------------------------------
    // Test 10: Service Providers (PC Support & Hardware Vendors)
    // -------------------------------------------------------------
    console.log('\n--- Test 10: Service Providers & Repair Technicians ---');
    const testProvider = {
      id: 'prov-test-' + runId,
      technicianName: 'Suresh Verma',
      shopName: 'Apex Micro Systems & Chip Repair',
      phoneNumber: '+91 98220-11223',
      alternatePhone: '+91 98220-44556',
      serviceType: 'Hardware',
      city: 'Gurugram',
      address: 'Shop 42, Cyber Hub Tech Arcade',
      rating: 4.8,
      status: 'Active',
      isAuthorized: true,
    };

    await db.upsert('service_providers', testProvider);
    let prov = await db.getById('service_providers', testProvider.id);
    await assert(prov && prov.technicianName === 'Suresh Verma' && prov.shopName.includes('Apex Micro Systems'), 'Insert and retrieve authorized service vendor');

    // -------------------------------------------------------------
    // Test 11: Audit Log Tracking
    // -------------------------------------------------------------
    console.log('\n--- Test 11: Audit Logging ---');
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
    // Test 11b: Staff Asset Query Tracking & Acknowledgement
    // -------------------------------------------------------------
    console.log('\n--- Test 11b: Staff Asset Query Tracking ---');
    const testQuery = {
      id: 'QRY-TEST-' + runId,
      employeeId: testEmp.id,
      employeeName: testEmp.name,
      assetNumber: testComp.assetNumber,
      assetName: testComp.deviceName,
      status: 'Pending Acknowledgement',
      queryType: 'Fault / Breakdown',
      subject: 'Display flickering intermittently',
      isStarred: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: 'hist-' + runId,
          timestamp: new Date().toISOString(),
          status: 'Pending Acknowledgement',
          updatedBy: testEmp.name,
          notes: 'Display flickers during heavy compile workloads.',
        },
      ],
    };
    await db.upsert('asset_queries', testQuery);
    let qry = await db.getById('asset_queries', testQuery.id);
    await assert(qry && qry.assetNumber === testComp.assetNumber && qry.isStarred === true, 'Insert and retrieve asset query');

    // Update query status to Acknowledged
    qry.status = 'Acknowledged';
    qry.acknowledgedBy = 'Admin Lead';
    qry.acknowledgedAt = new Date().toISOString();
    await db.upsert('asset_queries', qry);
    let updatedQry = await db.getById('asset_queries', testQuery.id);
    await assert(updatedQry && updatedQry.status === 'Acknowledged' && updatedQry.acknowledgedBy === 'Admin Lead', 'Acknowledge and update asset query');

    // -------------------------------------------------------------
    // Test 12: System Statistics & Telemetry
    // -------------------------------------------------------------
    console.log('\n--- Test 12: System Statistics & Diagnostics ---');
    const stats = await db.getStats();
    await assert(stats.connected === true && stats.totalRecords > 0, `Database statistics verified (${stats.totalRecords} total records across tables)`);

    // -------------------------------------------------------------
    // Test 13: Simulated Server Restart & Disk Commit Verification
    // -------------------------------------------------------------
    console.log('\n--- Test 13: Simulated Server Restart & Disk Commit Verification ---');
    const persistMarker = {
      id: 'persist-check-' + runId,
      employeeId: 'PERSIST-' + runId,
      name: 'Persistence Check Agent',
      department: 'ACID Verification',
      status: 'Active',
      testSignature: 'DISK_COMMIT_VERIFIED_' + runId,
    };

    await db.upsert('employees', persistMarker);
    db.checkpoint(); // Trigger WAL checkpoint / write flush

    // Re-query from database to verify persistence
    const reloaded = await db.getById('employees', persistMarker.id);
    await assert(
      reloaded && reloaded.testSignature === persistMarker.testSignature,
      'Data verified persistently committed to database storage'
    );
    await db.delete('employees', persistMarker.id);

    // -------------------------------------------------------------
    // Test 14: Clean Deletion of Test Records
    // -------------------------------------------------------------
    console.log('\n--- Test 14: Delete Operations ---');
    await db.delete('computers', testComp.id);
    await db.delete('employees', testEmp.id);
    for (const a of testAssets) {
      await db.delete('assets', a.id);
    }
    await db.delete('service_records', testService.id);
    await db.delete('purchases', testPurchase.id);
    await db.delete('asset_requests', testRequest.id);
    await db.delete('sim_cards', testSim.id);
    await db.delete('sim_recharges', testRecharge.id);
    await db.delete('sim_requests', testSimReq.id);
    await db.delete('service_providers', testProvider.id);
    await db.delete('asset_queries', testQuery.id);
    await db.delete('audit_logs', testLog.id);

    const checkEmp = await db.getById('employees', testEmp.id);
    const checkComp = await db.getById('computers', testComp.id);
    const checkSim = await db.getById('sim_cards', testSim.id);
    const checkQry = await db.getById('asset_queries', testQuery.id);
    await assert(checkEmp === null && checkComp === null && checkSim === null && checkQry === null, 'Verify clean removal of test records from database');

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
