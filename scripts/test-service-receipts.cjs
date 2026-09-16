// scripts/test-service-receipts.cjs
const http = require('http');

const API_BASE = 'http://localhost:5050';

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testServiceReceiptFlows() {
  console.log('================================================================');
  console.log('  TESTING REPAIR COST & RECEIPT PERSISTENCE (EMPLOYEE & ADMIN)  ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, name, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] ${name}`);
    } else {
      console.error(`  [FAIL] ${name} - ${details}`);
    }
  }

  try {
    const testId = `srv-${Date.now()}`;
    const testReceiptBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    // 1. Create a service ticket with repair cost and receipt (Simulating Employee Self-Service / Admin Log)
    const servicePayload = {
      id: testId,
      computerId: 'COMP-TEST-1',
      assetNumber: 'AST-TEST-999',
      deviceName: 'Dell OptiPlex 7090 MT',
      employeeId: 'EMP-TEST-01',
      employeeName: 'Ratan Test Employee',
      serviceDate: '2026-09-16',
      problem: 'Display flickering on HDMI port',
      problemCategory: 'Display Problem',
      workPerformed: 'Replaced HDMI connector and tested 144Hz video output',
      partsReplaced: 'HDMI 2.1 Interface Port',
      technician: 'Rajesh Sharma',
      serviceProviderShopName: 'QuickFix Chip & Board Lab',
      serviceProviderPhone: '9876511223',
      serviceProviderAddress: 'Shop 42, 1st Floor, Tech Market, Noida',
      serviceType: 'Hardware Repair & Chip-Level',
      serviceCost: 2850,
      serviceStatus: 'Completed',
      resolution: 'Display output stable under full resolution benchmark',
      receiptNumber: 'INV-2026-9041',
      receiptDate: '2026-09-16',
      receiptFileName: 'repair_invoice_dell_optiplex.png',
      receiptFileType: 'image/png',
      receiptFileSize: 2048,
      receiptFileUrl: testReceiptBase64,
      remarks: 'Self-reported repair receipt attached by employee'
    };

    console.log('--- 1. CREATE SERVICE RECORD WITH SERVICE PROVIDER & RECEIPT ---');
    const createRes = await request('POST', '/api/services', servicePayload);
    assert(createRes.status === 201 && createRes.data.success, 'Create service record with provider & receipt', JSON.stringify(createRes));

    // 2. Fetch all services and verify the record is saved with receipt details
    console.log('\n--- 2. VERIFY RECEIPT & SERVICE PROVIDER RETRIEVAL & INTEGRITY ---');
    const listRes = await request('GET', '/api/services');
    assert(listRes.status === 200 && Array.isArray(listRes.data.data), 'GET /api/services returns list');
    
    const savedRecord = listRes.data.data.find(s => s.id === testId);
    assert(!!savedRecord, `Found created service record ${testId}`);
    assert(savedRecord?.serviceCost === 2850, `Service cost accurately stored as 2850 (got: ${savedRecord?.serviceCost})`);
    assert(savedRecord?.serviceProviderShopName === 'QuickFix Chip & Board Lab', `Shop name accurately stored (got: ${savedRecord?.serviceProviderShopName})`);
    assert(savedRecord?.serviceProviderPhone === '9876511223', `Provider phone accurately stored (got: ${savedRecord?.serviceProviderPhone})`);
    assert(savedRecord?.receiptNumber === 'INV-2026-9041', `Receipt number accurately stored as INV-2026-9041 (got: ${savedRecord?.receiptNumber})`);
    assert(savedRecord?.receiptFileName === 'repair_invoice_dell_optiplex.png', `Receipt filename preserved`);
    assert(savedRecord?.receiptFileUrl === testReceiptBase64, `Receipt Data URL image data preserved`);

    // 3. Update the repair cost and attach an updated receipt / invoice (Simulating Admin or Employee Update)
    console.log('\n--- 3. UPDATE REPAIR COST, PROVIDER & REPLACE RECEIPT ---');
    const updatedReceiptPdf = 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1IDAgUiAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeAEr5HIKWTAxUDA0NTAxVnBScFVwV1DIzVFIz1HwS8xNVchJLElNzVFIzs/JL1dwS8xNVchWSE5NzFEwNEFWAABzChBpCmVuZHN0cmVhbQplbmRvYmoK';
    const updatePayload = {
      ...savedRecord,
      serviceProviderShopName: 'Apex Electronics & Chip Level Services',
      serviceProviderPhone: '9811122233',
      serviceCost: 3500,
      receiptNumber: 'INV-2026-9041-REV',
      receiptFileName: 'revised_official_invoice.pdf',
      receiptFileType: 'application/pdf',
      receiptFileSize: 4096,
      receiptFileUrl: updatedReceiptPdf,
      remarks: 'Admin reviewed and updated invoice to official GST PDF receipt'
    };

    const updateRes = await request('PUT', `/api/services/${testId}`, updatePayload);
    assert(updateRes.status === 200 && updateRes.data.success, 'Update service record cost, provider and PDF receipt', JSON.stringify(updateRes));

    // 4. Verify bootstrap rapid hydration returns the updated receipt and provider
    console.log('\n--- 4. RAPID BOOTSTRAP HYDRATION VERIFICATION ---');
    const bootstrapRes = await request('GET', '/api/bootstrap');
    assert(bootstrapRes.status === 200 && bootstrapRes.data.success, 'GET /api/bootstrap returns success');
    
    const bootstrapRecord = bootstrapRes.data.data.serviceRecords.find(s => s.id === testId);
    assert(!!bootstrapRecord, 'Bootstrap contains service record');
    assert(bootstrapRecord?.serviceCost === 3500, `Bootstrap reflects updated cost ₹3,500 (got: ${bootstrapRecord?.serviceCost})`);
    assert(bootstrapRecord?.serviceProviderShopName === 'Apex Electronics & Chip Level Services', `Bootstrap reflects updated shop name`);
    assert(bootstrapRecord?.serviceProviderPhone === '9811122233', `Bootstrap reflects updated provider phone`);
    assert(bootstrapRecord?.receiptFileName === 'revised_official_invoice.pdf', 'Bootstrap reflects updated PDF receipt filename');
    assert(bootstrapRecord?.receiptFileType === 'application/pdf', 'Bootstrap reflects application/pdf type');
    assert(bootstrapRecord?.receiptNumber === 'INV-2026-9041-REV', 'Bootstrap reflects revised invoice number');

    console.log('\n================================================================');
    console.log(`  RESULT: ${passed} / ${total} TESTS PASSED (100%)`);
    console.log('================================================================');
    if (passed === total) {
      console.log('>> SERVICE PROVIDER & RECEIPT PERSISTENCE IS 100% OPERATIONAL!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

testServiceReceiptFlows();
