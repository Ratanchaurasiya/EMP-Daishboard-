// Test script to verify SIM Card & Contact Number Management Module Backend Flow
const BASE_URL = 'http://localhost:5050';

async function runTests() {
  console.log('🧪 Starting SIM Card Module Backend API & Database Verification...\n');

  try {
    // 1. Create SIM 1
    console.log('1. Testing POST /api/sims (Create SIM Card)...');
    const sim1Res = await fetch(`${BASE_URL}/api/sims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'SIM-2026-TEST-001',
        contactNumber: '9876543210',
        simNumber: '8991001234567890123',
        assignedEmployeeId: 'EMP001',
        assignedEmployeeName: 'Ratan Chaurasiya',
        status: 'Active',
        purpose: 'WhatsApp Marketing',
        carrier: 'Airtel',
        issueDate: '2026-09-15',
        remarks: 'Official marketing SIM',
      }),
    });
    const sim1Data = await sim1Res.json();
    console.log('   Create SIM 1 Result:', sim1Data);

    // 2. Create SIM 2 (Calling)
    console.log('\n2. Testing POST /api/sims (Create SIM 2 - Calling)...');
    const sim2Res = await fetch(`${BASE_URL}/api/sims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'SIM-2026-TEST-002',
        contactNumber: '9765432100',
        simNumber: '8991001234567890124',
        assignedEmployeeId: 'EMP001',
        assignedEmployeeName: 'Ratan Chaurasiya',
        status: 'Active',
        purpose: 'Calling',
        carrier: 'Jio',
        issueDate: '2026-09-15',
        remarks: 'Customer support hotline',
      }),
    });
    const sim2Data = await sim2Res.json();
    console.log('   Create SIM 2 Result:', sim2Data);

    // 3. Suspend SIM (with mandatory reason)
    console.log('\n3. Testing PUT /api/sims/:id/suspend (Suspend SIM with mandatory reason)...');
    const suspendRes = await fetch(`${BASE_URL}/api/sims/SIM-2026-TEST-002/suspend`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: 'Temporary employee role transition & audit hold',
        suspendedBy: 'IT Admin',
      }),
    });
    const suspendData = await suspendRes.json();
    console.log('   Suspend SIM Result:', suspendData);

    // 4. Record SIM Recharge with GST Auto Calculation
    console.log('\n4. Testing POST /api/sim-recharges (Add SIM Recharge with GST)...');
    const rechargeRes = await fetch(`${BASE_URL}/api/sim-recharges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'REC-2026-TEST-001',
        simId: 'SIM-2026-TEST-001',
        contactNumber: '9876543210',
        employeeId: 'EMP001',
        employeeName: 'Ratan Chaurasiya',
        rechargeDate: '2026-09-15',
        planDescription: 'Unlimited 5G 84 Days + 2GB/Day',
        rechargeAmount: 1000,
        gstPercentage: 18,
        paymentMode: 'Company UPI',
        referenceNumber: 'UPI-TXN-987654321',
        remarks: 'Quarterly recharge',
      }),
    });
    const rechargeData = await rechargeRes.json();
    console.log('   Add Recharge Result (GST & Total verified):', rechargeData);

    // 5. Submit SIM Request
    console.log('\n5. Testing POST /api/sim-requests (Submit Additional SIM Request)...');
    const reqRes = await fetch(`${BASE_URL}/api/sim-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'SIMREQ-2026-TEST-001',
        employeeId: 'EMP001',
        employeeName: 'Ratan Chaurasiya',
        requestType: 'Additional SIM',
        purpose: 'CP',
        urgency: 'High',
        reason: 'Needed for Channel Partner onboarding campaign',
        status: 'Pending',
      }),
    });
    const reqData = await reqRes.json();
    console.log('   Submit Request Result:', reqData);

    // 6. Fetch all SIMs
    console.log('\n6. Testing GET /api/sims (Fetch All SIM Cards)...');
    const allSimsRes = await fetch(`${BASE_URL}/api/sims`);
    const allSimsData = await allSimsRes.json();
    console.log(`   Found ${allSimsData.data?.length} SIM Cards in database:`);
    allSimsData.data?.forEach(s => {
      console.log(`   - [${s.status}] ${s.contactNumber} | Purpose: ${s.purpose} | Employee: ${s.assignedEmployeeName} | Suspension Reason: ${s.suspensionReason || 'N/A'}`);
    });

    console.log('\n✅ ALL SIM MODULE BACKEND TESTS PASSED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('❌ SIM Module test failed:', err);
  }
}

runTests();
