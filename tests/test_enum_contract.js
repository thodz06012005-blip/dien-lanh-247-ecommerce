const fs = require('fs');
const path = require('path');
const http = require('http');

function request(method, pathUrl, body = null, token = null) {
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
      path: pathUrl,
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

async function runTests() {
  console.log('=== Running Enum Contract & Mock DB Validation Tests ===');

  // Read mock-db.json
  const dbPath = path.join(__dirname, '../mock-api/mock-db.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  // Define valid sets
  const VALID_SERVICE_STATUSES = ['pending', 'confirmed', 'assigned', 'completed', 'cancelled'];
  const VALID_SERVICE_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
  const VALID_TECHNICIAN_STATUSES = ['available', 'busy', 'offline', 'inactive'];

  const categoryIds = (db.serviceCategories || []).map(c => c.id);

  // 1. mock-db.json không có service request status lạ
  console.log('\n[Test 1] Validating service request statuses in mock-db.json...');
  (db.serviceRequests || []).forEach(r => {
    if (!VALID_SERVICE_STATUSES.includes(r.status)) {
      console.error(`ERROR: Service request ${r.id} has invalid status: ${r.status}`);
      process.exit(1);
    }
  });
  console.log('PASS.');

  // 2. mock-db.json không có priority lạ
  console.log('\n[Test 2] Validating service request priorities in mock-db.json...');
  (db.serviceRequests || []).forEach(r => {
    if (r.priority && !VALID_SERVICE_PRIORITIES.includes(r.priority)) {
      console.error(`ERROR: Service request ${r.id} has invalid priority: ${r.priority}`);
      process.exit(1);
    }
  });
  console.log('PASS.');

  // 3. mock-db.json không có technician status lạ
  console.log('\n[Test 3] Validating technician statuses in mock-db.json...');
  (db.technicians || []).forEach(t => {
    if (!VALID_TECHNICIAN_STATUSES.includes(t.status)) {
      console.error(`ERROR: Technician ${t.id} has invalid status: ${t.status}`);
      process.exit(1);
    }
  });
  console.log('PASS.');

  // 4. technician.skills đều khớp service category id hiện có
  console.log('\n[Test 4] Validating technician skills in mock-db.json...');
  (db.technicians || []).forEach(t => {
    (t.skills || []).forEach(s => {
      if (!categoryIds.includes(s)) {
        console.error(`ERROR: Technician ${t.id} has skill not matching any category: ${s}`);
        process.exit(1);
      }
    });
  });
  console.log('PASS.');

  // 5. technician.workingAreas đều dùng dạng "Quận ..."
  console.log('\n[Test 5] Validating technician workingAreas in mock-db.json...');
  (db.technicians || []).forEach(t => {
    (t.workingAreas || []).forEach(w => {
      if (!w.startsWith('Quận ')) {
        console.error(`ERROR: Technician ${t.id} has workingArea not starting with "Quận ": ${w}`);
        process.exit(1);
      }
    });
  });
  console.log('PASS.');

  // Login as admin for API tests
  console.log('\nLogging in as Admin...');
  const loginRes = await request('POST', '/api/v1/admin/auth/login', {
    email: 'owner@dienlanh247.vn',
    password: 'Admin@123'
  });
  const token = loginRes.data.data.token;

  // 6. API từ chối service request status lạ
  console.log('\n[Test 6] Verifying API rejects invalid service request status...');
  const res6 = await request('PATCH', '/api/v1/admin/service-requests/SR-240601/status', { status: 'invalid-status' }, token);
  console.log('Status:', res6.status, 'Message:', res6.data?.message);
  if (res6.status !== 400) {
    console.error('ERROR: API accepted invalid service request status!');
    process.exit(1);
  }
  console.log('PASS.');

  // 7. API từ chối technician status lạ
  console.log('\n[Test 7] Verifying API rejects invalid technician status...');
  const res7 = await request('PATCH', '/api/v1/admin/technicians/TECH-001/status', { status: 'invalid-status' }, token);
  console.log('Status:', res7.status, 'Message:', res7.data?.message);
  if (res7.status !== 400) {
    console.error('ERROR: API accepted invalid technician status!');
    process.exit(1);
  }
  console.log('PASS.');

  // 8. API từ chối priority lạ
  console.log('\n[Test 8] Verifying API rejects invalid priority...');
  const res8 = await request('POST', '/api/v1/service-requests', {
    customerName: 'Test customer',
    customerPhone: '0912345678',
    customerAddress: '123 Test St',
    district: 'Quận Cầu Giấy',
    serviceCategoryId: 've-sinh-dieu-hoa',
    applianceType: 'Điều hòa',
    issueDescription: 'Bảo trì',
    preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    preferredTimeSlot: '10:00 - 12:00',
    priority: 'invalid-priority'
  }, token);
  console.log('Status:', res8.status, 'Message:', res8.data?.message);
  if (res8.status !== 400) {
    console.error('ERROR: API accepted invalid priority!');
    process.exit(1);
  }
  console.log('PASS.');

  // ================= BỔ SUNG THEO CÂU LỆNH 8B =================

  // 9. Tạo order bằng paymentMethod thực tế từ Checkout (chữ thường: 'cod', 'bank_transfer')
  console.log('\n[Test 9] Creating order with real paymentMethod from Checkout ("cod")...');
  const orderRes = await request('POST', '/api/v1/orders', {
    customerName: 'Customer Test Payment',
    phone: '0911222333',
    city: 'Hà Nội',
    district: 'Quận Cầu Giấy',
    addressDetail: '123 Test',
    paymentMethod: 'cod',
    items: [
      { productId: 'lk-remote-daikin', quantity: 1 }
    ]
  });
  console.log('Status:', orderRes.status, 'Normalized paymentMethod in response:', orderRes.data?.data?.paymentMethod);
  if (orderRes.status !== 201 || orderRes.data?.data?.paymentMethod !== 'cod') {
    // Note: mapOrderToUser converts it back to lowercase.
    console.error('ERROR: Failed to normalize or accept "cod" paymentMethod!');
    process.exit(1);
  }
  console.log('PASS.');

  // 10. API từ chối paymentMethod sai (ví dụ 'momo')
  console.log('\n[Test 10] Verifying API rejects invalid paymentMethod ("momo")...');
  const badOrderRes = await request('POST', '/api/v1/orders', {
    customerName: 'Customer Test Payment',
    phone: '0911222333',
    city: 'Hà Nội',
    district: 'Quận Cầu Giấy',
    addressDetail: '123 Test',
    paymentMethod: 'momo',
    items: [
      { productId: 'lk-remote-daikin', quantity: 1 }
    ]
  });
  console.log('Status:', badOrderRes.status, 'Message:', badOrderRes.data?.message);
  if (badOrderRes.status !== 400) {
    console.error('ERROR: API accepted invalid paymentMethod!');
    process.exit(1);
  }
  console.log('PASS.');

  // 11. Tạo service request bằng district chuẩn và kiểm tra lưu đúng
  console.log('\n[Test 11] Creating service request with district "Quận Cầu Giấy"...');
  const srRes = await request('POST', '/api/v1/service-requests', {
    customerName: 'Customer District Test',
    customerPhone: '0912345678',
    customerAddress: '123 Test St',
    district: 'Quận Cầu Giấy',
    serviceCategoryId: 've-sinh-dieu-hoa',
    applianceType: 'Điều hòa',
    issueDescription: 'Bảo trì',
    preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    preferredTimeSlot: '10:00 - 12:00'
  });
  console.log('Status:', srRes.status, 'Saved district:', srRes.data?.data?.district);
  if (srRes.status !== 201 || srRes.data?.data?.district !== 'Quận Cầu Giấy') {
    console.error('ERROR: Failed to save district correctly!');
    process.exit(1);
  }
  console.log('PASS.');

  console.log('\nALL ENUM CONTRACT & DB VALIDATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
