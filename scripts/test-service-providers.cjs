const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5050,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING SERVICE PROVIDER BACKEND & FLOW TESTS ---');

  // Test 1: GET /api/service-providers
  console.log('\n1. Testing GET /api/service-providers...');
  const getRes = await request('GET', '/api/service-providers');
  if (getRes.status === 200 && getRes.body.success && Array.isArray(getRes.body.data)) {
    console.log(`[PASS] Fetched ${getRes.body.data.length} existing service providers.`);
    getRes.body.data.forEach(p => {
      console.log(`  - ${p.technicianName} | ${p.shopName} | ${p.serviceType} | WA: ${p.whatsappNumber || p.phoneNumber}`);
    });
  } else {
    console.error('[FAIL] GET /api/service-providers failed:', getRes);
    process.exit(1);
  }

  // Test 2: POST /api/service-providers
  console.log('\n2. Testing POST /api/service-providers (Create New PC Repair Provider)...');
  const testProvider = {
    id: `PROV-TEST-${Date.now()}`,
    technicianName: 'Suresh Kumar',
    shopName: 'QuickFix Chip & Board Lab',
    phoneNumber: '+91 98765-11223',
    whatsappNumber: '9876511223',
    email: 'suresh@quickfixlab.com',
    address: 'Shop 42, 1st Floor, Tech Market',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    serviceType: 'Hardware Repair & Chip-Level',
    rating: 4.9,
    experienceYears: 8,
    workingHours: '10:00 AM - 8:00 PM (Mon-Sat)',
    isPreferred: true,
    remarks: 'Motherboard IC replacement and BGA rework station specialist.',
  };

  const createRes = await request('POST', '/api/service-providers', testProvider);
  if ((createRes.status === 200 || createRes.status === 201) && createRes.body.success && createRes.body.data.id === testProvider.id) {
    console.log(`[PASS] Created provider "${createRes.body.data.technicianName}" successfully.`);
  } else {
    console.error('[FAIL] POST /api/service-providers failed:', createRes);
    process.exit(1);
  }

  // Test 3: PUT /api/service-providers/:id
  console.log('\n3. Testing PUT /api/service-providers/:id (Update Provider)...');
  const updateRes = await request('PUT', `/api/service-providers/${testProvider.id}`, {
    ...testProvider,
    rating: 5.0,
    remarks: 'Updated: Certified Apple & Dell Chip-Level Master Technician.',
  });
  if (updateRes.status === 200 && updateRes.body.success && updateRes.body.data.rating === 5.0) {
    console.log(`[PASS] Updated provider successfully. New rating: ${updateRes.body.data.rating}`);
  } else {
    console.error('[FAIL] PUT /api/service-providers/:id failed:', updateRes);
    process.exit(1);
  }

  // Test 4: Verify in /api/bootstrap
  console.log('\n4. Testing GET /api/bootstrap hydration...');
  const bootstrapRes = await request('GET', '/api/bootstrap');
  if (bootstrapRes.status === 200 && bootstrapRes.body.success && Array.isArray(bootstrapRes.body.data.serviceProviders)) {
    const found = bootstrapRes.body.data.serviceProviders.find(p => p.id === testProvider.id);
    if (found) {
      console.log(`[PASS] Bootstrap includes newly created provider "${found.technicianName}".`);
    } else {
      console.error('[FAIL] Created provider not found in bootstrap payload!');
      process.exit(1);
    }
  } else {
    console.error('[FAIL] GET /api/bootstrap failed:', bootstrapRes);
    process.exit(1);
  }

  // Test 5: DELETE /api/service-providers/:id
  console.log('\n5. Testing DELETE /api/service-providers/:id...');
  const delRes = await request('DELETE', `/api/service-providers/${testProvider.id}`);
  if (delRes.status === 200 && delRes.body.success) {
    console.log(`[PASS] Deleted provider ${testProvider.id} successfully.`);
  } else {
    console.error('[FAIL] DELETE /api/service-providers/:id failed:', delRes);
    process.exit(1);
  }

  // Test 6: WhatsApp link generator validation
  console.log('\n6. Validating WhatsApp Direct Link & Formatting Algorithm...');
  function formatWhatsAppLink(provider, activeTicket) {
    const rawNumber = provider.whatsappNumber || provider.phoneNumber;
    let cleanNumber = rawNumber.replace(/\D/g, '');
    if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;

    let message = '';
    if (activeTicket) {
      message =
        `Hello ${provider.technicianName},\n\n` +
        `We have a PC/Laptop service request from IT Department.\n` +
        `• Employee: ${activeTicket.employeeName} (${activeTicket.employeeId})\n` +
        `• Workstation / Device: ${activeTicket.deviceName || activeTicket.assetType || 'Laptop'} (${activeTicket.assetNumber || 'N/A'})\n` +
        `• Issue Description: ${activeTicket.problemDescription}\n` +
        (activeTicket.urgency ? `• Urgency: ${activeTicket.urgency}\n` : '') +
        `\nPlease advise on technician availability and repair estimation. Thank you!`;
    } else {
      message =
        `Hello ${provider.technicianName},\n\n` +
        `Reaching out from Enterprise IT Support regarding PC/Laptop repair and hardware maintenance services for our organization (${provider.shopName}).`;
    }
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  }

  const sampleTicket = {
    requestId: 'REQ-2026-999',
    employeeId: 'EMP001',
    employeeName: 'Ratan Chaurasiya',
    deviceName: 'Ratan_Precision_7560',
    assetNumber: 'LAP-001',
    problemDescription: 'Laptop screen flickering and motherboard thermal shutdown under heavy load.',
    urgency: 'Critical',
  };

  const sampleProvider = {
    technicianName: 'Rakesh Sharma',
    shopName: 'Apex PC Care',
    phoneNumber: '+91 98112-98765',
    whatsappNumber: '9811298765',
  };

  const generatedUrl = formatWhatsAppLink(sampleProvider, sampleTicket);
  console.log('[PASS] Generated WhatsApp URL:');
  console.log(' ', generatedUrl);
  if (!generatedUrl.includes('919811298765') || !generatedUrl.includes('Ratan%20Chaurasiya') || !generatedUrl.includes('flickering')) {
    console.error('[FAIL] Generated WhatsApp URL missing expected parameters!');
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('ALL SERVICE PROVIDER TESTS PASSED SUCCESSFULLY! (6/6)');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('Test Execution Error:', err);
  process.exit(1);
});
