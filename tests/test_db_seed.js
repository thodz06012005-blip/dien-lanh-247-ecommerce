const http = require('http');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (body) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(postData);
    }
    req.end();
  });
}

async function runValidation() {
  console.log('=== Running Database Seed Verification ===');

  // Login as admin
  const loginRes = await request('POST', '/api/v1/admin/auth/login', {
    email: 'owner@dienlanh247.vn',
    password: 'Admin@123'
  });
  if (loginRes.status !== 200 || !loginRes.data?.data?.token) {
    console.error('Failed to log in as admin:', loginRes);
    process.exit(1);
  }
  const token = loginRes.data.data.token;
  console.log('Admin login successful.');

  // 1. Get products and check for "Invalid Price Product"
  console.log('\n[Check 1] Verifying products list...');
  const prodRes = await request('GET', '/api/v1/products');
  if (prodRes.status !== 200 || !Array.isArray(prodRes.data?.data)) {
    console.error('Failed to fetch products:', prodRes);
    process.exit(1);
  }
  const products = prodRes.data.data;
  const hasInvalid = products.some(p => p.name === 'Invalid Price Product' || p.sku === 'SKU-PRICE-ERR');
  if (hasInvalid) {
    console.error('ERROR: Found invalid/test product in the database!');
    process.exit(1);
  }
  console.log(`PASS. Total products: ${products.length}. No test products found.`);

  // 2. Get service requests and verify priority
  console.log('\n[Check 2] Verifying service requests priority...');
  const srRes = await request('GET', '/api/v1/admin/service-requests', null, token);
  if (srRes.status !== 200 || !Array.isArray(srRes.data?.data)) {
    console.error('Failed to fetch service requests:', srRes);
    process.exit(1);
  }
  const requests = srRes.data.data;
  for (const sr of requests) {
    console.log(`Request ${sr.id}: district="${sr.district}", priority="${sr.priority}"`);
    if (!['low', 'medium', 'high', 'urgent'].includes(sr.priority)) {
      console.error(`ERROR: Request ${sr.id} has invalid priority: "${sr.priority}"`);
      process.exit(1);
    }
    if (!sr.district.startsWith('Quận ')) {
      console.error(`ERROR: Request ${sr.id} district is not standardized: "${sr.district}"`);
      process.exit(1);
    }
  }
  console.log('PASS. All service requests have valid priority and standardized districts.');

  // 3. Get technicians and verify workingAreas & status
  console.log('\n[Check 3] Verifying technicians list...');
  const techRes = await request('GET', '/api/v1/admin/technicians', null, token);
  if (techRes.status !== 200 || !Array.isArray(techRes.data?.data)) {
    console.error('Failed to fetch technicians:', techRes);
    process.exit(1);
  }
  const techs = techRes.data.data;
  const validStatuses = ['available', 'busy', 'offline', 'inactive'];
  for (const tech of techs) {
    console.log(`Technician ${tech.id} (${tech.name}): status="${tech.status}", areas=${JSON.stringify(tech.workingAreas)}`);
    if (!validStatuses.includes(tech.status)) {
      console.error(`ERROR: Tech ${tech.id} has invalid status: "${tech.status}"`);
      process.exit(1);
    }
    for (const area of tech.workingAreas) {
      if (!area.startsWith('Quận ')) {
        console.error(`ERROR: Tech ${tech.id} has non-standardized working area: "${area}"`);
        process.exit(1);
      }
    }
  }
  console.log('PASS. All technicians have valid status and standardized working areas.');

  // 4. Verify technician matching works for SR-240601 (Ve sinh dieu hoa in Cau Giay)
  console.log('\n[Check 4] Testing technician matching for SR-240601...');
  // Find matching techs for SR-240601 (ve-sinh-dieu-hoa, Quận Cầu Giấy)
  const targetRequest = requests.find(r => r.id === 'SR-240601');
  if (!targetRequest) {
    console.error('ERROR: SR-240601 not found in seed data.');
    process.exit(1);
  }
  const matchingTechs = techs.filter(t => 
    t.status === 'available' &&
    t.skills.includes(targetRequest.serviceCategoryId) &&
    t.workingAreas.includes(targetRequest.district)
  );
  console.log(`Matching available technicians for SR-240601:`, matchingTechs.map(t => t.name));
  if (matchingTechs.length === 0) {
    console.error('ERROR: No matching technicians found for SR-240601!');
    process.exit(1);
  }
  console.log('PASS. Technician matching is functioning correctly.');

  console.log('\nALL DATABASE SEED VERIFICATIONS PASSED SUCCESSFULLY!');
}

runValidation().catch(err => {
  console.error('Validation failed with error:', err);
  process.exit(1);
});
