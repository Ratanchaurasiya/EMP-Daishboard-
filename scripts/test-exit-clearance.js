// Test script to verify Employee Exit & Asset Clearance API & Logic
import http from 'http';

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
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

async function runExitClearanceVerification() {
  console.log('====================================================');
  console.log('🧪 Verifying Employee Exit & Asset Clearance Features');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const runId = Date.now().toString().slice(-4);
  const testClearanceId = `CLR-TEST-${runId}`;

  try {
    // 1. Check GET /api/exit-clearances
    console.log('--- Step 1: GET /api/exit-clearances ---');
    const getRes = await makeRequest({
      hostname: 'localhost',
      port: 5050,
      path: '/api/exit-clearances',
      method: 'GET',
    });
    assert(getRes.status === 200 && getRes.data.success === true, 'GET /api/exit-clearances returns 200 OK');

    // 2. Create an Exit Clearance Record with 2-5 days window
    console.log('\n--- Step 2: POST /api/exit-clearances (Initiate Clearance) ---');
    const today = new Date();
    const exitDate = today.toISOString().split('T')[0];
    const deadline = new Date(today);
    deadline.setDate(today.getDate() + 3);
    const deadlineStr = deadline.toISOString().split('T')[0];

    const newRecord = {
      id: testClearanceId,
      employeeId: `EMP-${runId}`,
      employeeName: 'Rahul Sharma',
      employeeEmail: `rahul.test.${runId}@company.com`,
      employeePhone: '+91 9876543210',
      department: 'Technology & Engineering',
      designation: 'Senior Full Stack Developer',
      exitType: 'Resignation',
      resignationDate: exitDate,
      exitDate: exitDate,
      clearanceWindowDays: 3,
      returnDeadline: deadlineStr,
      status: 'Pending Asset Return',
      notes: 'Handover in progress with team lead.',
      summary: {
        totalAssigned: 3,
        totalReturned: 0,
        totalDamaged: 0,
        totalMissing: 0,
        totalLateFines: 0,
        totalRepairCosts: 0,
        totalEmployeeLiableAmount: 0,
        totalCompanyCoveredAmount: 0,
      },
      items: [
        {
          id: `item-lap-${runId}`,
          assetId: `comp-${runId}`,
          assetNumber: `LAP-${runId}`,
          deviceName: 'Dell Latitude 5430',
          assetType: 'Laptop',
          serialNumber: `SN-LAP-${runId}`,
          returnStatus: 'Pending',
          deadlineDate: deadlineStr,
          isLate: false,
          lateDays: 0,
          lateFinePerDay: 500,
          lateFineAmount: 0,
          fineWaived: false,
          repairCost: 0,
          missingReplacementCost: 0,
          liabilityPolicy: 'Under Review',
          liabilityAmount: 0,
          companyAbsorbedAmount: 0,
        },
        {
          id: `item-sim-${runId}`,
          assetId: `sim-${runId}`,
          assetNumber: `SIM-${runId}`,
          deviceName: 'Airtel Corporate 5G SIM',
          assetType: 'SIM Card',
          returnStatus: 'Pending',
          deadlineDate: deadlineStr,
          isLate: false,
          lateDays: 0,
          lateFinePerDay: 500,
          lateFineAmount: 0,
          fineWaived: false,
          repairCost: 0,
          missingReplacementCost: 0,
          liabilityPolicy: 'Under Review',
          liabilityAmount: 0,
          companyAbsorbedAmount: 0,
        },
        {
          id: `item-mou-${runId}`,
          assetId: `ast-${runId}`,
          assetNumber: `MOU-${runId}`,
          deviceName: 'Logitech MX Master 3S',
          assetType: 'Peripheral',
          returnStatus: 'Pending',
          deadlineDate: deadlineStr,
          isLate: false,
          lateDays: 0,
          lateFinePerDay: 500,
          lateFineAmount: 0,
          fineWaived: false,
          repairCost: 0,
          missingReplacementCost: 0,
          liabilityPolicy: 'Under Review',
          liabilityAmount: 0,
          companyAbsorbedAmount: 0,
        },
      ],
      auditTrail: [
        {
          id: `audit-${runId}-1`,
          timestamp: new Date().toISOString(),
          action: 'Exit Clearance Initiated',
          actor: 'IT Administrator',
          details: 'Initiated 3-day asset clearance window for Rahul Sharma (3 assets tracked)',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const postRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5050,
        path: '/api/exit-clearances',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      newRecord
    );

    assert(postRes.status === 201 && postRes.data.success === true, 'POST /api/exit-clearances creates new record');

    // 3. GET /api/exit-clearances/:id
    console.log('\n--- Step 3: GET /api/exit-clearances/:id ---');
    const getSingleRes = await makeRequest({
      hostname: 'localhost',
      port: 5050,
      path: `/api/exit-clearances/${testClearanceId}`,
      method: 'GET',
    });
    assert(
      getSingleRes.status === 200 &&
        getSingleRes.data.success === true &&
        getSingleRes.data.data.employeeName === 'Rahul Sharma' &&
        getSingleRes.data.data.items.length === 3,
      'Retrieve newly created clearance record with 3 items'
    );

    // 4. Simulate Inspection & Late Return Fine calculation
    console.log('\n--- Step 4: Asset Inspection & Late Fine (₹500/day) calculation ---');
    // Laptop returned on time in Good condition
    newRecord.items[0].returnStatus = 'Verified';
    newRecord.items[0].submissionDate = exitDate;
    newRecord.items[0].inspectionCondition = 'Good';

    // SIM card returned 2 days LATE (2 * ₹500 = ₹1,000 late fine)
    const lateDays = 2;
    newRecord.items[1].returnStatus = 'Late';
    newRecord.items[1].isLate = true;
    newRecord.items[1].lateDays = lateDays;
    newRecord.items[1].lateFineAmount = lateDays * 500; // ₹1,000
    newRecord.items[1].inspectionCondition = 'Good';

    // Mouse returned DAMAGED with repair cost ₹800 and Employee Liability policy
    newRecord.items[2].returnStatus = 'Damaged';
    newRecord.items[2].inspectionCondition = 'Damaged';
    newRecord.items[2].damageReason = 'Left button cracked during transit';
    newRecord.items[2].repairCost = 800;
    newRecord.items[2].liabilityPolicy = 'Employee Liability';
    newRecord.items[2].liabilityAmount = 800;
    newRecord.items[2].companyAbsorbedAmount = 0;

    // Recalculate summary
    newRecord.summary = {
      totalAssigned: 3,
      totalReturned: 3,
      totalDamaged: 1,
      totalMissing: 0,
      totalLateFines: 1000,
      totalRepairCosts: 800,
      totalEmployeeLiableAmount: 1800, // 1000 late fine + 800 repair
      totalCompanyCoveredAmount: 0,
    };
    newRecord.status = 'Action Required / Liability Pending';

    const putRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5050,
        path: `/api/exit-clearances/${testClearanceId}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      },
      newRecord
    );
    assert(putRes.status === 200 && putRes.data.success === true, 'PUT /api/exit-clearances updates inspection results');

    const verifyInspectionRes = await makeRequest({
      hostname: 'localhost',
      port: 5050,
      path: `/api/exit-clearances/${testClearanceId}`,
      method: 'GET',
    });
    const updatedData = verifyInspectionRes.data.data;
    assert(
      updatedData.summary.totalLateFines === 1000,
      `Late return fine calculated properly: ₹${updatedData.summary.totalLateFines} (₹500/day * 2 days)`
    );
    assert(
      updatedData.summary.totalEmployeeLiableAmount === 1800,
      `Total liability correctly calculated: ₹${updatedData.summary.totalEmployeeLiableAmount}`
    );

    // 5. Final Approval & Certificate Generation
    console.log('\n--- Step 5: Final Clearance Approval & Certificate Issuance ---');
    updatedData.status = 'Full & Final Approved';
    updatedData.clearanceCertificateNumber = `EASH-CERT-CLR-${runId}`;
    updatedData.approvedByAdmin = 'IT Administrator';
    updatedData.clearedAt = new Date().toISOString();
    updatedData.approvalRemarks = 'All assets inspected, liability of ₹1800 logged for F&F settlement.';

    const approveRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5050,
        path: `/api/exit-clearances/${testClearanceId}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      },
      updatedData
    );
    assert(approveRes.status === 200 && approveRes.data.success === true, 'Final clearance approved');

    const finalRes = await makeRequest({
      hostname: 'localhost',
      port: 5050,
      path: `/api/exit-clearances/${testClearanceId}`,
      method: 'GET',
    });
    assert(
      finalRes.data.data.status === 'Full & Final Approved' &&
        finalRes.data.data.clearanceCertificateNumber === `EASH-CERT-CLR-${runId}`,
      `Certificate ${finalRes.data.data.clearanceCertificateNumber} issued successfully`
    );

    // 6. Cleanup test record
    console.log('\n--- Step 6: DELETE /api/exit-clearances/:id ---');
    const delRes = await makeRequest({
      hostname: 'localhost',
      port: 5050,
      path: `/api/exit-clearances/${testClearanceId}`,
      method: 'DELETE',
    });
    assert(delRes.status === 200 && delRes.data.success === true, 'DELETE test clearance record cleans up cleanly');

    console.log('\n====================================================');
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runExitClearanceVerification();
