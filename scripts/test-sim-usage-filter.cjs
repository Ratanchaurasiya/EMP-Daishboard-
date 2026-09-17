// Automated Test for SIM Card Usage Filter Logic & Aggregation
const assert = require('assert');

// Mock data & logic mirroring src/utils/simUtils.ts
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

function getEmployeeSimCount(emp, simCards) {
  return getEmployeeSimCards(emp, simCards).length;
}

function getSimUsageCategory(count) {
  if (count <= 0) return '0';
  if (count === 1) return '1';
  if (count === 2) return '2';
  if (count === 3) return '3';
  return '4+';
}

function getSimUsageBadgeStyle(count) {
  if (count === 0) {
    return { label: 'No SIM Assigned', shortLabel: 'No SIM' };
  }
  if (count === 1) {
    return { label: '1 Corporate SIM', shortLabel: '1 SIM' };
  }
  if (count === 2) {
    return { label: '2 Corporate SIMs', shortLabel: '2 SIMs' };
  }
  if (count === 3) {
    return { label: '3 Corporate SIMs', shortLabel: '3 SIMs' };
  }
  return { label: `${count} SIMs (Power User)`, shortLabel: `${count} SIMs` };
}

console.log('--- Starting SIM Card Usage Filter Tests ---');

// Mock employees
const employees = [
  { id: 'emp-1', employeeId: 'EMP001', name: 'Ratan Chaurasiya', department: 'Engineering' },
  { id: 'emp-2', employeeId: 'EMP002', name: 'Employee A', department: 'Sales & Marketing' },
  { id: 'emp-3', employeeId: 'EMP003', name: 'Employee B', department: 'Operations' },
  { id: 'emp-4', employeeId: 'EMP004', name: 'Power User C', department: 'IT' },
  { id: 'emp-5', employeeId: 'EMP005', name: 'Employee NoSim', department: 'Finance' },
];

// Mock SIM cards
let simCards = [
  // Ratan Chaurasiya: 2 active SIMs
  { id: 'sim-1', contactNumber: '9876543210', simNumber: '8991001', assignedEmployeeId: 'emp-1', assignedEmployeeName: 'Ratan Chaurasiya', status: 'Active', purpose: 'Calling', project: 'HQ' },
  { id: 'sim-2', contactNumber: '9876543211', simNumber: '8991002', assignedEmployeeId: 'EMP001', assignedEmployeeName: 'Ratan Chaurasiya', status: 'Active', purpose: 'WhatsApp', project: 'HQ' },

  // Employee A: 1 SIM
  { id: 'sim-3', contactNumber: '9876543212', simNumber: '8991003', assignedEmployeeId: 'emp-2', assignedEmployeeName: 'Employee A', status: 'Active', purpose: 'Marketing', project: 'ABC' },

  // Employee B: 3 SIMs (one by name match, two by ID)
  { id: 'sim-4', contactNumber: '9876543213', simNumber: '8991004', assignedEmployeeId: 'emp-3', assignedEmployeeName: 'Employee B', status: 'Active', purpose: 'Field', project: 'XYZ' },
  { id: 'sim-5', contactNumber: '9876543214', simNumber: '8991005', assignedEmployeeId: 'emp-3', assignedEmployeeName: 'Employee B', status: 'Suspended', purpose: 'CP', project: 'XYZ' },
  { id: 'sim-6', contactNumber: '9876543215', simNumber: '8991006', assignedEmployeeId: null, assignedEmployeeName: 'employee b', status: 'Active', purpose: 'Calling', project: 'XYZ' },

  // Power User C: 4 SIMs
  { id: 'sim-7', contactNumber: '9876543216', assignedEmployeeId: 'emp-4', status: 'Active', purpose: 'Calling' },
  { id: 'sim-8', contactNumber: '9876543217', assignedEmployeeId: 'emp-4', status: 'Active', purpose: 'WhatsApp' },
  { id: 'sim-9', contactNumber: '9876543218', assignedEmployeeId: 'emp-4', status: 'Active', purpose: 'CP' },
  { id: 'sim-10', contactNumber: '9876543219', assignedEmployeeId: 'emp-4', status: 'Active', purpose: 'Field' },

  // Available SIM (in company stock, buffer)
  { id: 'sim-11', contactNumber: '9876543220', assignedEmployeeId: null, assignedEmployeeName: null, status: 'Available', purpose: 'Other' },

  // Deactivated SIM (must NOT count towards employee's active count)
  { id: 'sim-12', contactNumber: '9876543221', assignedEmployeeId: 'emp-1', assignedEmployeeName: 'Ratan Chaurasiya', status: 'Deactivated', purpose: 'Calling' },
];

// Test 1: Verification of individual employee counts
const ratanSims = getEmployeeSimCards(employees[0], simCards);
assert.strictEqual(ratanSims.length, 2, 'Ratan Chaurasiya should have exactly 2 active SIMs (Deactivated excluded)');
assert.strictEqual(getSimUsageCategory(ratanSims.length), '2', 'Ratan usage category should be "2"');
console.log('✓ Test 1: Ratan Chaurasiya count = 2 SIMs (Deactivated excluded)');

const empASims = getEmployeeSimCards(employees[1], simCards);
assert.strictEqual(empASims.length, 1, 'Employee A should have 1 SIM');
assert.strictEqual(getSimUsageCategory(empASims.length), '1', 'Employee A category should be "1"');
console.log('✓ Test 2: Employee A count = 1 SIM');

const empBSims = getEmployeeSimCards(employees[2], simCards);
assert.strictEqual(empBSims.length, 3, 'Employee B should have 3 SIMs (including suspended and name match)');
assert.strictEqual(getSimUsageCategory(empBSims.length), '3', 'Employee B category should be "3"');
console.log('✓ Test 3: Employee B count = 3 SIMs');

const powerCSims = getEmployeeSimCards(employees[3], simCards);
assert.strictEqual(powerCSims.length, 4, 'Power User C should have 4 SIMs');
assert.strictEqual(getSimUsageCategory(powerCSims.length), '4+', 'Power User C category should be "4+"');
console.log('✓ Test 4: Power User C count = 4+ SIMs');

const noSims = getEmployeeSimCards(employees[4], simCards);
assert.strictEqual(noSims.length, 0, 'Employee NoSim should have 0 SIMs');
assert.strictEqual(getSimUsageCategory(noSims.length), '0', 'Employee NoSim category should be "0"');
console.log('✓ Test 5: Employee NoSim count = 0 (No SIM)');

// Test 6: Aggregate Bucket Counts
function computeUsageStats(emps, sims) {
  let countAll = emps.length;
  let count1 = 0;
  let count2 = 0;
  let count3 = 0;
  let count4Plus = 0;
  let count0 = 0;

  emps.forEach(emp => {
    const cnt = getEmployeeSimCount(emp, sims);
    if (cnt === 0) count0++;
    else if (cnt === 1) count1++;
    else if (cnt === 2) count2++;
    else if (cnt === 3) count3++;
    else count4Plus++;
  });

  return { countAll, count1, count2, count3, count4Plus, count0 };
}

const stats = computeUsageStats(employees, simCards);
assert.strictEqual(stats.countAll, 5, 'Total employees should be 5');
assert.strictEqual(stats.count1, 1, 'Employees with 1 SIM should be 1');
assert.strictEqual(stats.count2, 1, 'Employees with 2 SIMs should be 1');
assert.strictEqual(stats.count3, 1, 'Employees with 3 SIMs should be 1');
assert.strictEqual(stats.count4Plus, 1, 'Employees with 4+ SIMs should be 1');
assert.strictEqual(stats.count0, 1, 'Employees with 0 SIMs should be 1');
console.log('✓ Test 6: Usage bucket statistics match expected counts perfectly:', stats);

// Test 7: Dynamic updates - Assigning buffer SIM to Employee NoSim
simCards.push({
  id: 'sim-13',
  contactNumber: '9876543299',
  assignedEmployeeId: 'emp-5',
  assignedEmployeeName: 'Employee NoSim',
  status: 'Active',
  purpose: 'WhatsApp',
});

const updatedStats = computeUsageStats(employees, simCards);
assert.strictEqual(updatedStats.count0, 0, 'Employees with 0 SIMs should now be 0');
assert.strictEqual(updatedStats.count1, 2, 'Employees with 1 SIM should now be 2');
console.log('✓ Test 7: Dynamic allocation update verified. Bucket stats updated accurately:', updatedStats);

// Test 8: Releasing a SIM from Ratan Chaurasiya back to buffer
simCards = simCards.filter(s => s.id !== 'sim-1'); // Unassigned/removed
const ratanNewSims = getEmployeeSimCards(employees[0], simCards);
assert.strictEqual(ratanNewSims.length, 1, 'Ratan should now have 1 SIM');
assert.strictEqual(getSimUsageCategory(ratanNewSims.length), '1');
console.log('✓ Test 8: Releasing a SIM dynamically adjusts employee count from 2 SIMs to 1 SIM');

console.log('\n========================================');
console.log('ALL SIM CARD USAGE FILTER TESTS PASSED!');
console.log('========================================');
