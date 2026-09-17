const http = require('http');

function postJson(urlStr, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const postData = JSON.stringify(data);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getJson(urlStr) {
  return new Promise((resolve, reject) => {
    http.get(urlStr, res => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Fetching existing employees from local API...');
  const bootstrapRes = await getJson('http://localhost:5050/api/bootstrap');
  const emps = (bootstrapRes.data && bootstrapRes.data.employees) || [];
  console.log(`Found ${emps.length} existing employees.`);

  // Identify existing employees
  const ratan = emps.find(e => e.id === 'emp-uuid-1789552519215-kxii' || (e.name && e.name.includes('ratan')));
  const mangesh = emps.find(e => e.id === 'emp-uuid-1789539123614-ztsz' || (e.name && e.name.includes('Mangesh')));
  const mamta = emps.find(e => e.id === 'emp-uuid-1789540394620-l2d2' || (e.name && e.name.includes('mamta')));
  const shivam = emps.find(e => e.id === 'emp-uuid-1789538627125-zrvt' || (e.name && e.name.includes('Shivam')));

  console.log('Mapped existing employees:');
  console.log('- Ratan:', ratan?.name, ratan?.id);
  console.log('- Mangesh:', mangesh?.name, mangesh?.id);
  console.log('- Mamta:', mamta?.name, mamta?.id);
  console.log('- Shivam:', shivam?.name, shivam?.id);

  // New demo employees to test "No SIM" bucket
  const newEmployees = [];
  const existingPri = emps.find(e => e.employeeId === 'EMP002' || (e.name && e.name.includes('Priya')));
  if (!existingPri) {
    newEmployees.push({
      id: 'emp-uuid-1789560000001-priya',
      employeeId: 'EMP002',
      companyEmployeeNumber: 'CORP-8822',
      name: 'Priya Sharma',
      department: 'Product Management',
      designation: 'Lead Product Manager',
      team: 'Customer Experience',
      joiningDate: '2024-06-01',
      status: 'Active',
      email: 'priya.sharma@company.com',
      phone: '9811223344',
      remarks: 'Product lead workstation package provisioned. No corporate SIM requested yet.',
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=face',
    });
  }

  const existingSneha = emps.find(e => e.employeeId === 'EMP004' || (e.name && e.name.includes('Sneha')));
  if (!existingSneha) {
    newEmployees.push({
      id: 'emp-uuid-1789560000002-sneha',
      employeeId: 'EMP004',
      companyEmployeeNumber: 'CORP-8824',
      name: 'Sneha Patel',
      department: 'Human Resources',
      designation: 'Senior HR Business Partner',
      team: 'People Operations',
      joiningDate: '2025-01-08',
      status: 'Active',
      email: 'sneha.patel@company.com',
      phone: '9820099887',
      remarks: 'Standard HR mobility laptop issued. No corporate SIM assigned.',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=face',
    });
  }

  // 1. Ratan Chaurasiya -> 2 SIMs
  // 2. Mangesh Chaudhari -> 1 SIM
  // 3. Rathod Mamta -> 3 SIMs
  // 4. Shivam Shivhare -> 4 SIMs (4+ bucket)
  // 5. Priya Sharma -> 0 SIMs (No SIM bucket)
  // 6. Sneha Patel -> 0 SIMs (No SIM bucket)
  // 7. 2 Unassigned Buffer Stock SIMs

  const simCards = [
    // --- 2 SIMs: Ratan Chaurasiya ---
    {
      id: 'SIM-2026-001',
      contactNumber: '9876543210',
      simNumber: '8991000987654321001',
      assignedEmployeeId: ratan?.id || 'emp-uuid-1789552519215-kxii',
      assignedEmployeeName: ratan?.name || 'ratanchaurasiya61@gmail.com',
      status: 'Active',
      purpose: 'Calling',
      project: 'Engineering Platform',
      carrier: 'Jio',
      issueDate: '2025-01-15',
      remarks: 'Primary corporate calling line for lead architect',
      createdAt: '2025-01-15T10:00:00.000Z',
      updatedAt: '2025-01-15T10:00:00.000Z',
    },
    {
      id: 'SIM-2026-002',
      contactNumber: '9765432109',
      simNumber: '8991000976543210002',
      assignedEmployeeId: ratan?.id || 'emp-uuid-1789552519215-kxii',
      assignedEmployeeName: ratan?.name || 'ratanchaurasiya61@gmail.com',
      status: 'Active',
      purpose: 'WhatsApp',
      project: 'Engineering Platform',
      carrier: 'Airtel',
      issueDate: '2025-02-01',
      remarks: 'Official enterprise WhatsApp communications line',
      createdAt: '2025-02-01T10:00:00.000Z',
      updatedAt: '2025-02-01T10:00:00.000Z',
    },

    // --- 1 SIM: Mangesh Chaudhari ---
    {
      id: 'SIM-2026-003',
      contactNumber: '9811223344',
      simNumber: '8991000981122334003',
      assignedEmployeeId: mangesh?.id || 'emp-uuid-1789539123614-ztsz',
      assignedEmployeeName: mangesh?.name || 'Mangesh Avdhutbhai Chaudhari',
      status: 'Active',
      purpose: 'Calling',
      project: 'Sales & Field',
      carrier: 'Airtel',
      issueDate: '2025-02-10',
      remarks: 'Dedicated sales field communication number',
      createdAt: '2025-02-10T10:00:00.000Z',
      updatedAt: '2025-02-10T10:00:00.000Z',
    },

    // --- 3 SIMs: Rathod Mamta ---
    {
      id: 'SIM-2026-004',
      contactNumber: '9820011223',
      simNumber: '8991000982001122004',
      assignedEmployeeId: mamta?.id || 'emp-uuid-1789540394620-l2d2',
      assignedEmployeeName: mamta?.name || 'Rathod mamta',
      status: 'Active',
      purpose: 'Calling',
      project: 'Operations & Support',
      carrier: 'Jio',
      issueDate: '2025-01-20',
      remarks: 'Customer operations hotline',
      createdAt: '2025-01-20T10:00:00.000Z',
      updatedAt: '2025-01-20T10:00:00.000Z',
    },
    {
      id: 'SIM-2026-005',
      contactNumber: '9820022334',
      simNumber: '8991000982002233005',
      assignedEmployeeId: mamta?.id || 'emp-uuid-1789540394620-l2d2',
      assignedEmployeeName: mamta?.name || 'Rathod mamta',
      status: 'Active',
      purpose: 'WhatsApp',
      project: 'Operations & Support',
      carrier: 'Airtel',
      issueDate: '2025-02-05',
      remarks: 'Support tickets & quick client WhatsApp queries',
      createdAt: '2025-02-05T10:00:00.000Z',
      updatedAt: '2025-02-05T10:00:00.000Z',
    },
    {
      id: 'SIM-2026-006',
      contactNumber: '9820033445',
      simNumber: '8991000982003344006',
      assignedEmployeeId: mamta?.id || 'emp-uuid-1789540394620-l2d2',
      assignedEmployeeName: mamta?.name || 'Rathod mamta',
      status: 'Active',
      purpose: 'CP',
      project: 'Channel Partners',
      carrier: 'Vodafone Idea',
      issueDate: '2025-02-18',
      remarks: 'Channel partner coordination link',
      createdAt: '2025-02-18T10:00:00.000Z',
      updatedAt: '2025-02-18T10:00:00.000Z',
    },

    // --- 4+ SIMs: Shivam Shivhare (4 Corporate Lines) ---
    {
      id: 'SIM-2026-007',
      contactNumber: '9833011223',
      simNumber: '8991000983301122007',
      assignedEmployeeId: shivam?.id || 'emp-uuid-1789538627125-zrvt',
      assignedEmployeeName: shivam?.name || 'Shivam shivhare',
      status: 'Active',
      purpose: 'Calling',
      project: 'Regional Sales',
      carrier: 'Jio',
      issueDate: '2024-11-01',
      remarks: 'Direct high-volume client outreach line',
      createdAt: '2024-11-01T10:00:00.000Z',
      updatedAt: '2024-11-01T10:00:00.000Z',
    },
    {
      id: 'SIM-2026-008',
      contactNumber: '9833022334',
      simNumber: '8991000983302233008',
      assignedEmployeeId: shivam?.id || 'emp-uuid-1789538627125-zrvt',
      assignedEmployeeName: shivam?.name || 'Shivam shivhare',
      status: 'Active',
      purpose: 'WhatsApp',
      project: 'Regional Sales',
      carrier: 'Airtel',
      issueDate: '2024-11-15',
      remarks: 'Lead conversion business WhatsApp number',
      createdAt: '2024-11-15T10:00:00.000Z',
      updatedAt: '2024-11-15T10:00:00.000Z',
    },
    {
      id: 'SIM-2026-009',
      contactNumber: '9833033445',
      simNumber: '8991000983303344009',
      assignedEmployeeId: shivam?.id || 'emp-uuid-1789538627125-zrvt',
      assignedEmployeeName: shivam?.name || 'Shivam shivhare',
      status: 'Active',
      purpose: 'Other',
      customPurpose: 'Field Operations',
      project: 'Regional Sales',
      carrier: 'Jio',
      issueDate: '2025-01-05',
      remarks: 'On-site field visits & GPS check-in SIM',
      createdAt: '2025-01-05T10:00:00.000Z',
      updatedAt: '2025-01-05T10:00:00.000Z',
    },
    {
      id: 'SIM-2026-010',
      contactNumber: '9833044556',
      simNumber: '8991000983304455010',
      assignedEmployeeId: shivam?.id || 'emp-uuid-1789538627125-zrvt',
      assignedEmployeeName: shivam?.name || 'Shivam shivhare',
      status: 'Active',
      purpose: 'Marketing',
      project: 'Regional Sales',
      carrier: 'Vodafone Idea',
      issueDate: '2025-02-12',
      remarks: 'Regional marketing & promotional broadcast campaign',
      createdAt: '2025-02-12T10:00:00.000Z',
      updatedAt: '2025-02-12T10:00:00.000Z',
    },

    // --- Buffer / In Stock SIMs (Unassigned) ---
    {
      id: 'SIM-2026-011',
      contactNumber: '9845011223',
      simNumber: '8991000984501122011',
      assignedEmployeeId: null,
      assignedEmployeeName: null,
      status: 'Available',
      purpose: 'Holding',
      project: 'Buffer Stock',
      carrier: 'Jio',
      issueDate: null,
      remarks: 'Reserve 5G SIM card ready in IT inventory',
      createdAt: '2025-02-20T10:00:00.000Z',
      updatedAt: '2025-02-20T10:00:00.000Z',
    },
    {
      id: 'SIM-2026-012',
      contactNumber: '9856022334',
      simNumber: '8991000985602233012',
      assignedEmployeeId: null,
      assignedEmployeeName: null,
      status: 'Available',
      purpose: 'Holding',
      project: 'Buffer Stock',
      carrier: 'Airtel',
      issueDate: null,
      remarks: 'Reserve Airtel business SIM card in IT inventory',
      createdAt: '2025-02-20T10:00:00.000Z',
      updatedAt: '2025-02-20T10:00:00.000Z',
    },
  ];

  // Recharges for the active lines
  const simRecharges = [
    {
      id: 'REC-2026-101',
      simId: 'SIM-2026-001',
      contactNumber: '9876543210',
      employeeId: ratan?.id || 'emp-uuid-1789552519215-kxii',
      employeeName: ratan?.name || 'ratanchaurasiya61@gmail.com',
      project: 'Engineering Platform',
      rechargeDate: '2026-03-01',
      planDescription: 'Jio Enterprise 84 Days Unlimited 5G (2GB/Day)',
      rechargeAmount: 749,
      gstPercentage: 18,
      gstAmount: 134.82,
      totalAmount: 883.82,
      paymentMode: 'Corporate Card',
      referenceNumber: 'TXN-JIO-9012',
      remarks: 'Quarterly line renewal',
      createdAt: '2026-03-01T10:00:00.000Z',
    },
    {
      id: 'REC-2026-102',
      simId: 'SIM-2026-002',
      contactNumber: '9765432109',
      employeeId: ratan?.id || 'emp-uuid-1789552519215-kxii',
      employeeName: ratan?.name || 'ratanchaurasiya61@gmail.com',
      project: 'Engineering Platform',
      rechargeDate: '2026-03-05',
      planDescription: 'Airtel Infinity Corporate Postpaid 399',
      rechargeAmount: 399,
      gstPercentage: 18,
      gstAmount: 71.82,
      totalAmount: 470.82,
      paymentMode: 'Net Banking',
      referenceNumber: 'INV-AIR-8821',
      remarks: 'Monthly business WhatsApp plan',
      createdAt: '2026-03-05T11:00:00.000Z',
    },
    {
      id: 'REC-2026-103',
      simId: 'SIM-2026-003',
      contactNumber: '9811223344',
      employeeId: mangesh?.id || 'emp-uuid-1789539123614-ztsz',
      employeeName: mangesh?.name || 'Mangesh Avdhutbhai Chaudhari',
      project: 'Sales & Field',
      rechargeDate: '2026-03-02',
      planDescription: 'Airtel Commercial Unlimited 28 Days',
      rechargeAmount: 299,
      gstPercentage: 18,
      gstAmount: 53.82,
      totalAmount: 352.82,
      paymentMode: 'Company UPI',
      referenceNumber: 'UPI-AIR-7711',
      remarks: 'Field calling plan',
      createdAt: '2026-03-02T09:30:00.000Z',
    },
    {
      id: 'REC-2026-104',
      simId: 'SIM-2026-004',
      contactNumber: '9820011223',
      employeeId: mamta?.id || 'emp-uuid-1789540394620-l2d2',
      employeeName: mamta?.name || 'Rathod mamta',
      project: 'Operations & Support',
      rechargeDate: '2026-03-10',
      planDescription: 'Jio True 5G Unlimited 56 Days',
      rechargeAmount: 579,
      gstPercentage: 18,
      gstAmount: 104.22,
      totalAmount: 683.22,
      paymentMode: 'Corporate Card',
      referenceNumber: 'TXN-JIO-8819',
      remarks: 'Operations hotline recharge',
      createdAt: '2026-03-10T14:00:00.000Z',
    },
    {
      id: 'REC-2026-105',
      simId: 'SIM-2026-007',
      contactNumber: '9833011223',
      employeeId: shivam?.id || 'emp-uuid-1789538627125-zrvt',
      employeeName: shivam?.name || 'Shivam shivhare',
      project: 'Regional Sales',
      rechargeDate: '2026-03-08',
      planDescription: 'Jio Commercial Unlimited 84 Days',
      rechargeAmount: 799,
      gstPercentage: 18,
      gstAmount: 143.82,
      totalAmount: 942.82,
      paymentMode: 'Corporate Card',
      referenceNumber: 'TXN-JIO-5511',
      remarks: 'Regional sales primary line recharge',
      createdAt: '2026-03-08T16:00:00.000Z',
    },
  ];

  console.log('Sending sync payload to backend SQLite...');
  const syncPayload = {
    employees: newEmployees.length > 0 ? newEmployees : undefined,
    simCards,
    simRecharges,
  };

  const syncResult = await postJson('http://localhost:5050/api/sync', syncPayload);
  console.log('Sync Result:', syncResult);

  console.log('\n--- Verifying Hydrated Data ---');
  const verifyRes = await getJson('http://localhost:5050/api/bootstrap');
  const updatedEmps = verifyRes.data.employees || [];
  const updatedSims = verifyRes.data.simCards || [];
  const updatedRecs = verifyRes.data.simRecharges || [];

  console.log(`Total Employees: ${updatedEmps.length}`);
  console.log(`Total SIM Cards: ${updatedSims.length}`);
  console.log(`Total Recharges: ${updatedRecs.length}`);

  // Test Bucket Calculations
  function getSimUsageCategory(count) {
    if (count <= 0) return '0';
    if (count === 1) return '1';
    if (count === 2) return '2';
    if (count === 3) return '3';
    return '4+';
  }

  const buckets = { all: updatedEmps.length, '1': 0, '2': 0, '3': 0, '4+': 0, '0': 0 };

  updatedEmps.forEach(emp => {
    const targetIds = new Set([emp.id, emp.employeeId].filter(Boolean));
    const empNameLower = (emp.name || '').trim().toLowerCase();
    const assigned = updatedSims.filter(s => {
      if (s.status === 'Deactivated') return false;
      if (s.assignedEmployeeId && targetIds.has(s.assignedEmployeeId)) return true;
      if (empNameLower && s.assignedEmployeeName && s.assignedEmployeeName.trim().toLowerCase() === empNameLower) {
        return true;
      }
      return false;
    });

    const cat = getSimUsageCategory(assigned.length);
    buckets[cat] = (buckets[cat] || 0) + 1;
    console.log(`- ${emp.name} (${emp.employeeId || emp.id}): ${assigned.length} SIMs -> Bucket: [${cat}]`);
  });

  console.log('\nFinal SIM Usage Filter Counts:');
  console.log(JSON.stringify(buckets, null, 2));

  const availableSimCount = updatedSims.filter(s => s.status === 'Available').length;
  console.log(`Buffer / Available SIMs (In Stock): ${availableSimCount}`);
}

run().catch(err => {
  console.error('Error seeding SIM data:', err);
  process.exit(1);
});
