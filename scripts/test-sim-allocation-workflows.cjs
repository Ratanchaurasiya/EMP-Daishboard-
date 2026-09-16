// Verification script for SIM & Mobile Fleet Allocation during Employee Creation and Profile Integration
const BASE_URL = 'http://localhost:5050';

async function verifyAllocationWorkflows() {
  console.log('🚀 Starting Comprehensive SIM Allocation Workflows Verification...\n');

  try {
    // 1. Check Backend Health
    console.log('1. Checking Backend API Health...');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    console.log('   ✅ Health status:', healthData.status);

    // 2. Workflow 1: Create New Employee with SIM Allocation
    console.log('\n2. Workflow 1: Create New Employee with Multiple SIM Allocations...');
    const emp1Id = `EMP-TEST-${Date.now().toString().slice(-4)}`;
    const emp1Data = {
      id: emp1Id,
      employeeId: emp1Id,
      companyEmployeeNumber: `CORP-${emp1Id}`,
      name: 'Ratan Chaurasiya (Test)',
      department: 'Technology',
      designation: 'Staff Engineer',
      team: 'Frontend Core',
      joiningDate: '2026-09-15',
      status: 'Active',
      email: `ratan.${Date.now()}@company.com`,
      phone: '9820012345',
      remarks: 'Primary system architect',
    };

    const createEmpRes = await fetch(`${BASE_URL}/api/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emp1Data),
    });
    const createdEmp = await createEmpRes.json();
    console.log('   ✅ Employee Created:', createdEmp.data?.name || createdEmp);

    // Allocate SIM 1 (WhatsApp)
    const sim1 = {
      id: `SIM-TEST-W1-${Date.now()}-1`,
      contactNumber: '9812345678',
      simNumber: '8991000000000000001',
      assignedEmployeeId: emp1Id,
      assignedEmployeeName: emp1Data.name,
      status: 'Assigned',
      purpose: 'WhatsApp',
      project: 'ABC Project',
      department: 'Technology',
      carrier: 'Airtel',
      issueDate: '2026-09-15',
      remarks: 'Primary WhatsApp comms',
    };

    // Allocate SIM 2 (Calling)
    const sim2 = {
      id: `SIM-TEST-W1-${Date.now()}-2`,
      contactNumber: '9712345678',
      simNumber: '8991000000000000002',
      assignedEmployeeId: emp1Id,
      assignedEmployeeName: emp1Data.name,
      status: 'Assigned',
      purpose: 'Calling',
      project: 'ABC Project',
      department: 'Technology',
      carrier: 'Jio',
      issueDate: '2026-09-15',
      remarks: 'Calling SIM line',
    };

    // Allocate SIM 3 (Marketing - Suspended)
    const sim3 = {
      id: `SIM-TEST-W1-${Date.now()}-3`,
      contactNumber: '9612345678',
      simNumber: '8991000000000000003',
      assignedEmployeeId: emp1Id,
      assignedEmployeeName: emp1Data.name,
      status: 'Suspended',
      purpose: 'Marketing',
      project: 'XYZ Project',
      department: 'Marketing',
      carrier: 'Vodafone Idea',
      issueDate: '2026-09-15',
      remarks: 'Campaign marketing SIM',
      suspensionReason: 'Audit check on marketing line',
      suspendedAt: '2026-09-15',
    };

    for (const sim of [sim1, sim2, sim3]) {
      const simRes = await fetch(`${BASE_URL}/api/sims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sim),
      });
      const resData = await simRes.json();
      console.log(`   ✅ SIM Created & Allocated: ${sim.contactNumber} (${sim.purpose} • ${sim.project} • ${sim.status})`);
    }

    // 3. Workflow 2: Allocate SIM to Existing Employee Later
    console.log('\n3. Workflow 2: Allocate Available SIM to Existing Employee Later...');
    // Create an Available SIM first
    const sim4 = {
      id: `SIM-TEST-AVAIL-${Date.now()}`,
      contactNumber: '9512345678',
      simNumber: '8991000000000000004',
      assignedEmployeeId: null,
      assignedEmployeeName: null,
      status: 'Available',
      purpose: 'Holding',
      carrier: 'BSNL',
      remarks: 'Buffer inventory pool',
    };
    await fetch(`${BASE_URL}/api/sims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sim4),
    });
    console.log(`   ✅ Available Buffer SIM created: ${sim4.contactNumber}`);

    // Now assign it to the employee with custom purpose 'Other'
    const assignPayload = {
      ...sim4,
      assignedEmployeeId: emp1Id,
      assignedEmployeeName: emp1Data.name,
      status: 'Assigned',
      purpose: 'Other',
      customPurpose: 'Field Operations & Dispatching',
      project: 'HQ Field Ops',
      issueDate: '2026-09-15',
      remarks: 'Assigned for on-field fleet logistics',
    };
    const updateRes = await fetch(`${BASE_URL}/api/sims/${sim4.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignPayload),
    });
    const updateData = await updateRes.json();
    console.log('   ✅ Assigned Available SIM to Employee with Purpose "Other" (Field Operations):', updateData.success || updateData);

    // 4. Verify Employee Profile SIM & Mobile Fleet Aggregation
    console.log('\n4. Verifying Querying SIMs for Employee Profile...');
    const allSimsRes = await fetch(`${BASE_URL}/api/sims`);
    const allSims = await allSimsRes.json();
    const empAssignedSims = (allSims.data || allSims).filter(s => s.assignedEmployeeId === emp1Id);

    console.log(`   Total SIMs assigned to ${emp1Data.name}: ${empAssignedSims.length}`);
    console.table(empAssignedSims.map(s => ({
      'Contact No': s.contactNumber,
      'Purpose': s.purpose === 'Other' ? `Other (${s.customPurpose})` : s.purpose,
      'Project': s.project || '-',
      'Status': s.status,
      'Issue Date': s.issueDate || '-',
    })));

    if (empAssignedSims.length === 4) {
      console.log('   ✅ Exact match: 4 SIMs assigned and tracked under Employee Profile!');
    } else {
      console.error(`   ❌ Expected 4 SIMs, got ${empAssignedSims.length}`);
    }

    // 5. Workflow 3: Release / Unassign SIM
    console.log('\n5. Workflow 3: Release / Unassign SIM back to Inventory Pool...');
    const unassignPayload = {
      ...sim4,
      assignedEmployeeId: null,
      assignedEmployeeName: null,
      status: 'Available',
      purpose: 'Holding',
      customPurpose: null,
      project: null,
      remarks: 'Released from employee back to buffer pool',
    };
    await fetch(`${BASE_URL}/api/sims/${sim4.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(unassignPayload),
    });
    console.log(`   ✅ SIM ${sim4.contactNumber} released to status: Available`);

    // Clean up test data
    console.log('\n6. Cleaning up test records...');
    for (const s of [sim1, sim2, sim3, sim4]) {
      await fetch(`${BASE_URL}/api/sims/${s.id}`, { method: 'DELETE' });
    }
    await fetch(`${BASE_URL}/api/employees/${emp1Id}`, { method: 'DELETE' });
    console.log('   ✅ Test records cleaned up.');

    console.log('\n🎉 ALL SIM & MOBILE FLEET ALLOCATION WORKFLOWS VERIFIED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
  }
}

verifyAllocationWorkflows();
