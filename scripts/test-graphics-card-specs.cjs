// scripts/test-graphics-card-specs.cjs
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

async function testGraphicsCardFunctionality() {
  console.log('================================================================');
  console.log('  TESTING COMPUTER GRAPHICS CARD & VRAM SPECS PERSISTENCE       ');
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

  const timestamp = Date.now();
  const testCompId = `comp-gpu-${timestamp}`;
  const testAssetNumber = `LAP-GPU-${timestamp.toString().slice(-4)}`;

  try {
    // 1. Create a computer asset with custom Graphics Card and VRAM
    console.log('--- 1. REGISTER COMPUTER WITH CUSTOM GRAPHICS CARD SPECS ---');
    const compPayload = {
      id: testCompId,
      assetNumber: testAssetNumber,
      deviceName: 'WS-DESKTOP-RTX',
      manufacturer: 'Dell',
      model: 'Precision 7780 Workstation',
      deviceType: 'Laptop',
      serialNumber: `SN-GPU-${timestamp}`,
      processor: {
        name: '13th Gen Intel(R) Core(TM) i9-13950HX',
        generation: '13th Gen',
        speed: '2.20 GHz - 5.50 GHz',
      },
      memory: {
        installedRAM: '64.00 GB',
        usableRAM: '63.80 GB',
      },
      graphics: {
        card: 'NVIDIA RTX 5000 Ada Generation Laptop GPU',
        memory: '16 GB GDDR6 Dedicated',
      },
      storage: {
        total: '2 TB',
        used: '120 GB',
        free: '1.88 TB',
        type: 'PCIe 4.0 NVMe SSD',
      },
      system: {
        os: 'Windows 11 Pro for Workstations',
        systemType: '64-bit operating system, x64-based processor',
        processorArchitecture: 'x64',
        deviceId: '8A92B104-DE22-4819-A101-729183491029',
        productId: '00330-80000-00019-AAOEM',
        penAndTouch: 'No pen or touch input is available for this display',
      },
      condition: 'New',
      status: 'Available',
      assignedDate: null,
      assignedEmployeeId: null,
    };

    const createRes = await request('POST', '/api/computers', compPayload);
    assert(createRes.status === 201 && createRes.data.success, 'Created computer asset with NVIDIA RTX 5000 GPU & 16GB VRAM');

    // 2. Fetch computer from API and verify graphics specs
    console.log('\n--- 2. VERIFY GRAPHICS SPECS RETRIEVAL & INTEGRITY ---');
    const listRes = await request('GET', '/api/computers');
    assert(listRes.status === 200 && Array.isArray(listRes.data.data), 'GET /api/computers returns data');

    const savedComp = listRes.data.data.find(c => c.id === testCompId);
    assert(!!savedComp, `Found computer ${testCompId}`);
    assert(savedComp?.graphics?.card === 'NVIDIA RTX 5000 Ada Generation Laptop GPU', `Graphics card model accurate: "${savedComp?.graphics?.card}"`);
    assert(savedComp?.graphics?.memory === '16 GB GDDR6 Dedicated', `Graphics VRAM accurate: "${savedComp?.graphics?.memory}"`);

    // 3. Update Graphics Card specs
    console.log('\n--- 3. UPDATE GRAPHICS CARD DETAILS ---');
    const updatePayload = {
      ...savedComp,
      graphics: {
        card: 'NVIDIA RTX 4090 Mobile',
        memory: '16 GB Dedicated VRAM',
      },
    };
    const updateRes = await request('PUT', `/api/computers/${testCompId}`, updatePayload);
    assert(updateRes.status === 200 && updateRes.data.success, 'PUT /api/computers/:id updated graphics card to NVIDIA RTX 4090 Mobile');

    // 4. Verify bootstrap rapid hydration includes updated graphics specs
    console.log('\n--- 4. RAPID BOOTSTRAP HYDRATION AUDIT ---');
    const bootstrapRes = await request('GET', '/api/bootstrap');
    assert(bootstrapRes.status === 200 && bootstrapRes.data.success, 'GET /api/bootstrap responded');

    const bComp = (bootstrapRes.data.data.computers || []).find(c => c.id === testCompId);
    assert(!!bComp, 'Bootstrap contains computer asset');
    assert(bComp?.graphics?.card === 'NVIDIA RTX 4090 Mobile', 'Bootstrap reflects updated GPU model');
    assert(bComp?.graphics?.memory === '16 GB Dedicated VRAM', 'Bootstrap reflects updated GPU VRAM');

    console.log('\n================================================================');
    console.log(`  RESULT: ${passed} / ${total} TESTS PASSED (100%)`);
    console.log('================================================================');
    if (passed === total) {
      console.log('>> GRAPHICS CARD CONFIGURATION & PERSISTENCE IS 100% OPERATIONAL!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

testGraphicsCardFunctionality();
