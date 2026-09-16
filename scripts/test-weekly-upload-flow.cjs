/**
 * Test: Full Weekly Upload & Admin Review Lifecycle
 *
 * Verifies:
 * 1. Server connectivity & health
 * 2. Employee weekly upload creation (with file data, employeeId, name, weekLabel, status: 'Pending Review')
 * 3. Persistence in backend SQLite database
 * 4. Immediate visibility in GET /api/weekly-photos for Admin Dashboard
 * 5. Admin updates status to 'Needs Attention' with adminRemarks
 * 6. Verification that remarks and status reflect properly
 * 7. Admin verifies & approves to status 'Verified'
 * 8. Cleanup test record
 */

const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 5050,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };

    const req = http.request(options, res => {
      let resData = '';
      res.on('data', chunk => {
        resData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(resData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resData });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTest() {
  console.log('=== STARTING WEEKLY UPLOAD & ADMIN REVIEW SYSTEM TEST ===\n');

  // Step 1: Health Check
  console.log('[Step 1] Checking backend server health...');
  const health = await request('GET', '/api/health');
  console.log('Health Response:', health.status, health.data?.status || health.data?.databaseType);
  if (health.status !== 200) {
    throw new Error(`Server health check failed: ${JSON.stringify(health)}`);
  }

  // Step 2: Employee creates weekly upload
  const testId = `test_weekly_${Date.now()}`;
  const mockUploadRecord = {
    id: testId,
    employeeId: 'emp_test_001',
    employeeName: 'Rahul Sharma',
    employeeCode: 'EMP0101',
    weekStartDate: '2026-09-14',
    weekLabel: 'Week 37, 2026 (Sep 14 - Sep 20)',
    inspectionDate: '2026-09-16',
    uploadDate: '2026-09-16',
    conductedBy: 'Rahul Sharma',
    googleDriveLink: 'https://drive.google.com/drive/folders/test-weekly-audit',
    overallRemarks: 'Weekly workstation condition verification',
    status: 'Pending Review',
    reviewStatus: 'Pending Review',
    assetPhotos: [
      {
        id: `photo_${Date.now()}_1`,
        assetId: 'asset_laptop_001',
        assetNumber: 'LAP-001',
        assetName: 'Dell Latitude 5420',
        assetType: 'Laptop',
        photoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        fileName: 'Dell_Latitude_front_view.png',
        fileSize: 124500,
        fileType: 'image/png',
        storagePath: 'indexeddb://uploadedFiles/Dell_Latitude_front_view.png',
        condition: 'Good',
        capturedAt: '2026-09-16T10:30:00.000Z',
        notes: 'Screen and keyboard clean and working properly',
      },
    ],
  };

  console.log(`\n[Step 2] Employee uploads weekly documentation (ID: ${testId})...`);
  const createRes = await request('POST', '/api/weekly-photos', mockUploadRecord);
  console.log('Create Status:', createRes.status, 'Success:', createRes.data?.success);
  if (createRes.status !== 201 && createRes.status !== 200) {
    throw new Error(`Create upload failed: ${JSON.stringify(createRes)}`);
  }

  // Step 3: Admin Dashboard fetches weekly uploads
  console.log('\n[Step 3] Admin Dashboard fetches all weekly photos...');
  const fetchRes = await request('GET', '/api/weekly-photos');
  const allRecords = fetchRes.data?.data || [];
  const foundRecord = allRecords.find(r => r.id === testId);

  if (!foundRecord) {
    throw new Error(`Uploaded record ${testId} not found in database!`);
  }
  console.log('✓ Found upload record in Admin Dashboard list:');
  console.log('  - Employee:', foundRecord.employeeName, `(${foundRecord.employeeCode})`);
  console.log('  - Week:', foundRecord.weekLabel);
  console.log('  - Upload Date:', foundRecord.uploadDate || foundRecord.inspectionDate);
  console.log('  - Status:', foundRecord.status);
  console.log('  - Photos count:', foundRecord.assetPhotos?.length);
  console.log('  - Photo filename:', foundRecord.assetPhotos?.[0]?.fileName);

  if (foundRecord.status !== 'Pending Review') {
    throw new Error(`Expected status 'Pending Review', got '${foundRecord.status}'`);
  }

  // Step 4: Admin reviews and flags 'Needs Attention' with remarks
  console.log('\n[Step 4] Admin flags upload as "Needs Attention" with remarks...');
  const updateFlagRes = await request('PUT', `/api/weekly-photos/${testId}`, {
    status: 'Needs Attention',
    reviewStatus: 'Needs Attention',
    reviewedBy: 'Admin IT Team',
    reviewedAt: new Date().toISOString(),
    adminRemarks: 'Please provide a clearer photo showing the serial number on the bottom.',
  });
  console.log('Flag Status:', updateFlagRes.status);

  // Verify reflection of Admin Remarks
  const verifyFlag = await request('GET', '/api/weekly-photos');
  const flaggedRecord = (verifyFlag.data?.data || []).find(r => r.id === testId);
  console.log('✓ Verified status updated to:', flaggedRecord.status);
  console.log('✓ Admin Remarks present:', flaggedRecord.adminRemarks);
  console.log('✓ Reviewed By:', flaggedRecord.reviewedBy);

  if (flaggedRecord.status !== 'Needs Attention') {
    throw new Error(`Expected status 'Needs Attention', got '${flaggedRecord.status}'`);
  }

  // Step 5: Admin approves and marks as 'Verified'
  console.log('\n[Step 5] Admin approves and marks as "Verified"...');
  const approveRes = await request('PUT', `/api/weekly-photos/${testId}`, {
    status: 'Verified',
    reviewStatus: 'Verified',
    reviewedBy: 'Admin IT Team',
    reviewedAt: new Date().toISOString(),
    adminRemarks: 'Verified and approved.',
  });
  console.log('Approve Status:', approveRes.status);

  const verifyApprove = await request('GET', '/api/weekly-photos');
  const approvedRecord = (verifyApprove.data?.data || []).find(r => r.id === testId);
  console.log('✓ Verified final status:', approvedRecord.status);
  console.log('✓ Final Remarks:', approvedRecord.adminRemarks);

  if (approvedRecord.status !== 'Verified') {
    throw new Error(`Expected status 'Verified', got '${approvedRecord.status}'`);
  }

  // Step 6: Cleanup test record
  console.log('\n[Step 6] Cleaning up test record...');
  const delRes = await request('DELETE', `/api/weekly-photos/${testId}`);
  console.log('Delete Status:', delRes.status);

  console.log('\n🎉 ALL WEEKLY UPLOAD SYSTEM TESTS PASSED SUCCESSFULLY!');
}

runTest().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
