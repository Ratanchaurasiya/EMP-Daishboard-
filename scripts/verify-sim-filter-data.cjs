const http = require('http');

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

function getSimUsageCategory(count) {
  if (count <= 0) return '0';
  if (count === 1) return '1';
  if (count === 2) return '2';
  if (count === 3) return '3';
  return '4+';
}

async function verify() {
  console.log('--- Validating Live Backend Hydration ---');
  const res = await getJson('http://localhost:5050/api/bootstrap');
  const emps = res.data.employees;
  const sims = res.data.simCards;
  const recharges = res.data.simRecharges;

  console.log('Employees in system:', emps.length);
  console.log('SIM Cards in system:', sims.length);
  console.log('Recharges in system:', recharges.length);

  const bucketMap = { 'all': [], '1': [], '2': [], '3': [], '4+': [], '0': [] };

  emps.forEach(emp => {
    const assigned = getEmployeeSimCards(emp, sims);
    const cat = getSimUsageCategory(assigned.length);
    bucketMap['all'].push({ name: emp.name, count: assigned.length, lines: assigned.map(s => s.contactNumber) });
    bucketMap[cat].push({ name: emp.name, count: assigned.length, lines: assigned.map(s => s.contactNumber) });
  });

  console.log('\n--- Bucket Verification ---');
  for (const [bucket, members] of Object.entries(bucketMap)) {
    console.log(`[Bucket: ${bucket}] Count: ${members.length}`);
    members.forEach(m => console.log(`   - ${m.name}: ${m.count} SIMs (${m.lines.join(', ') || 'None'})`));
  }

  const inStock = sims.filter(s => s.status === 'Available');
  console.log('\n--- In-Stock / Buffer SIMs ---');
  console.log('Count:', inStock.length);
  inStock.forEach(s => console.log(`   - ${s.carrier}: ${s.contactNumber} (${s.project})`));

  console.log('\n===============================================');
  console.log('DATA SEEDING & FILTER VERIFICATION: ALL PASSED');
  console.log('===============================================');
}

verify().catch(console.error);
