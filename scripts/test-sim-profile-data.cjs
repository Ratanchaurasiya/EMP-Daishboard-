const http = require('http');
const assert = require('assert');

function getJson(urlStr) {
  return new Promise((resolve, reject) => {
    http.get(urlStr, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });
}

function getEmployeeSimCards(emp, simCards) {
  if (!emp || !simCards) return [];
  const targetIds = new Set([emp.id, emp.employeeId].filter(Boolean));
  const empNameLower = (emp.name || '').trim().toLowerCase();
  return simCards.filter(s => {
    if (s.status === 'Deactivated') return false;
    if (s.assignedEmployeeId && targetIds.has(s.assignedEmployeeId)) return true;
    if (empNameLower && s.assignedEmployeeName && s.assignedEmployeeName.trim().toLowerCase() === empNameLower) {
      return true;
    }
    return false;
  });
}

async function testProfileData() {
  console.log('--- Validating Employee Telecom Profile Feature Data ---');
  const res = await getJson('http://localhost:5050/api/bootstrap');
  const emps = res.data.employees;
  const sims = res.data.simCards;

  console.log(`Verifying profile data across ${emps.length} employees...`);

  emps.forEach(emp => {
    const assignedSims = getEmployeeSimCards(emp, sims);
    console.log(`\nEmployee Profile: ${emp.name}`);
    console.log(`- Employee ID: ${emp.employeeId || 'N/A'}`);
    console.log(`- Designation: ${emp.designation || 'Staff'} | Department: ${emp.department}`);
    console.log(`- Total SIMs Assigned: ${assignedSims.length}`);

    if (assignedSims.length > 0) {
      assignedSims.forEach((sim, idx) => {
        console.log(`  Line #${idx + 1}:`);
        console.log(`    * Mobile Number: ${sim.contactNumber}`);
        console.log(`    * SIM Number (ICCID): ${sim.simNumber}`);
        console.log(`    * Carrier / Type: ${sim.carrier}`);
        console.log(`    * Purpose: ${sim.purpose} ${sim.customPurpose ? `(${sim.customPurpose})` : ''}`);
        console.log(`    * Project / Work: ${sim.project}`);
        console.log(`    * Status: ${sim.status}`);
        console.log(`    * Allocation Date: ${sim.issueDate || 'N/A'}`);
        console.log(`    * Remarks: ${sim.remarks || 'None'}`);

        assert(sim.contactNumber, 'Mobile number must be present');
        assert(sim.carrier, 'Carrier must be present');
        assert(sim.status, 'Status must be present');
        assert(sim.purpose, 'Purpose must be present');
      });
    } else {
      console.log('  * Clean empty state: No corporate SIMs currently assigned.');
    }
  });

  console.log('\n===============================================');
  console.log('ALL EMPLOYEE TELECOM PROFILE DATA CHECKS PASSED');
  console.log('===============================================');
}

testProfileData().catch(err => {
  console.error(err);
  process.exit(1);
});
