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

async function runTests() {
  console.log('=== Running Service Request Lifecycle & Technician Matching Tests ===');

  // Login as admin
  console.log('\n[Test 0] Logging in as Admin...');
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

  // Reset DB
  console.log('\n[Test 1] Resetting DB...');
  await request('POST', '/api/v1/dev/reset-db');

  // Fetch initial service requests and technicians
  const srRes = await request('GET', '/api/v1/admin/service-requests', null, token);
  const techRes = await request('GET', '/api/v1/admin/technicians', null, token);
  const sr1 = srRes.data.data.find(r => r.id === 'SR-240601'); // status: confirmed, district: Quận Cầu Giấy, categoryId: ve-sinh-dieu-hoa
  const sr2 = srRes.data.data.find(r => r.id === 'SR-240602'); // status: pending, district: Quận Đống Đa, categoryId: sua-dieu-hoa
  const tech1 = techRes.data.data.find(t => t.id === 'TECH-001'); // skills: sua-dieu-hoa, ve-sinh-dieu-hoa; areas: Quận Cầu Giấy, Quận Nam Từ Liêm
  const tech2 = techRes.data.data.find(t => t.id === 'TECH-002'); // skills: sua-tu-lanh, sua-may-giat, sua-dieu-hoa; areas: Quận Đống Đa, Quận Thanh Xuân

  // 1. pending -> confirmed (Xác nhận nhanh)
  console.log('\n[Test 2] Transitioning pending -> confirmed...');
  const res1 = await request('PATCH', `/api/v1/admin/service-requests/${sr2.id}/status`, { status: 'confirmed', note: 'Xác nhận nhanh' }, token);
  console.log('Status:', res1.status, 'New Status:', res1.data?.data?.status);
  if (res1.status !== 200 || res1.data?.data?.status !== 'confirmed') {
    console.error('ERROR: Transition pending -> confirmed failed!');
    process.exit(1);
  }
  console.log('PASS.');

  // 2. completed -> pending (Should be BLOCKED)
  console.log('\n[Test 3] Assigning tech1 to sr1...');
  const assignRes1 = await request('PATCH', `/api/v1/admin/service-requests/${sr1.id}/assign-technician`, { technicianId: tech1.id }, token);
  if (assignRes1.status !== 200) {
    console.error('ERROR: Assigning technician failed!', assignRes1.data);
    process.exit(1);
  }
  console.log('Completing sr1...');
  const compRes1 = await request('PATCH', `/api/v1/admin/service-requests/${sr1.id}/status`, { status: 'completed', finalPrice: 250000 }, token);
  if (compRes1.status !== 200) {
    console.error('ERROR: Completing service request failed!', compRes1.data);
    process.exit(1);
  }
  console.log('Attempting completed -> pending (Should FAIL)...');
  const failRes1 = await request('PATCH', `/api/v1/admin/service-requests/${sr1.id}/status`, { status: 'pending' }, token);
  console.log('Status:', failRes1.status, 'Message:', failRes1.data?.message);
  if (failRes1.status !== 400) {
    console.error('ERROR: Allowed completed -> pending transition!');
    process.exit(1);
  }
  console.log('PASS.');

  // 3. cancelled -> assigned (Should be BLOCKED)
  console.log('\n[Test 4] Cancelling sr2...');
  const cancelRes = await request('PATCH', `/api/v1/admin/service-requests/${sr2.id}/status`, { status: 'cancelled' }, token);
  if (cancelRes.status !== 200) {
    console.error('ERROR: Cancelling service request failed!');
    process.exit(1);
  }
  console.log('Attempting cancelled -> assigned (Should FAIL)...');
  const failRes2 = await request('PATCH', `/api/v1/admin/service-requests/${sr2.id}/status`, { status: 'assigned' }, token);
  console.log('Status:', failRes2.status, 'Message:', failRes2.data?.message);
  if (failRes2.status !== 400) {
    console.error('ERROR: Allowed cancelled -> assigned transition!');
    process.exit(1);
  }
  console.log('PASS.');

  // Reset DB for matching tests
  await request('POST', '/api/v1/dev/reset-db');

  // 4. Assign technician: mismatched skill or area (Should be BLOCKED)
  console.log('\n[Test 5] Assigning tech2 to sr1 (mismatched area/skill)...');
  const failAssign1 = await request('PATCH', `/api/v1/admin/service-requests/${sr1.id}/assign-technician`, { technicianId: tech2.id }, token);
  console.log('Status:', failAssign1.status, 'Message:', failAssign1.data?.message);
  if (failAssign1.status !== 400) {
    console.error('ERROR: Allowed technician with mismatched area/skill!');
    process.exit(1);
  }
  console.log('PASS.');

  // 5. Assign technician: mismatched area (Should be BLOCKED)
  console.log('\n[Test 6] Assigning tech1 to sr2 (mismatched area)...');
  await request('PATCH', `/api/v1/admin/service-requests/${sr2.id}/status`, { status: 'confirmed' }, token);
  const failAssign2 = await request('PATCH', `/api/v1/admin/service-requests/${sr2.id}/assign-technician`, { technicianId: tech1.id }, token);
  console.log('Status:', failAssign2.status, 'Message:', failAssign2.data?.message);
  if (failAssign2.status !== 400 || !failAssign2.data?.message.includes('không hỗ trợ hoạt động tại khu vực')) {
    console.error('ERROR: Allowed technician with mismatched area!');
    process.exit(1);
  }
  console.log('PASS.');

  // 6. Assign busy technician (Should be BLOCKED)
  console.log('\n[Test 7] Assigning busy technician...');
  // Assign tech1 to sr1 (Quận Cầu Giấy, ve-sinh-dieu-hoa). tech1 becomes busy.
  await request('PATCH', `/api/v1/admin/service-requests/${sr1.id}/assign-technician`, { technicianId: tech1.id }, token);
  
  // Create another request in Quận Cầu Giấy, ve-sinh-dieu-hoa
  const newSrRes = await request('POST', '/api/v1/service-requests', {
    customerName: 'Customer 2',
    customerPhone: '0911111111',
    customerAddress: '123 Test St',
    district: 'Quận Cầu Giấy',
    serviceCategoryId: 've-sinh-dieu-hoa',
    applianceType: 'Điều hòa',
    issueDescription: 'Vệ sinh máy',
    preferredDate: '2026-07-10',
    preferredTimeSlot: '10:00 - 12:00'
  });
  const sr3Id = newSrRes.data.data.id;
  await request('PATCH', `/api/v1/admin/service-requests/${sr3Id}/status`, { status: 'confirmed' }, token);

  // Now try to assign tech1 (who is busy with sr1) to sr3.
  const failAssign3 = await request('PATCH', `/api/v1/admin/service-requests/${sr3Id}/assign-technician`, { technicianId: tech1.id }, token);
  console.log('Status:', failAssign3.status, 'Message:', failAssign3.data?.message);
  if (failAssign3.status !== 400 || !failAssign3.data?.message.includes('hiện đang bận hoặc ngừng hoạt động')) {
    console.error('ERROR: Allowed assigning busy technician!');
    process.exit(1);
  }
  console.log('PASS.');

  // 7. Complete and release logic
  console.log('\n[Test 8] Complete and release logic...');
  // Complete sr1
  await request('PATCH', `/api/v1/admin/service-requests/${sr1.id}/status`, { status: 'completed', finalPrice: 250000 }, token);

  // Check tech1 status: should be available and completedCount should increase
  const tRes1 = await request('GET', '/api/v1/admin/technicians', null, token);
  const tech1After = tRes1.data.data.find(t => t.id === 'TECH-001');
  console.log('Tech1 status after completing only job:', tech1After.status, 'Completed count:', tech1After.completedCount);
  if (tech1After.status !== 'available' || tech1After.completedCount !== 25) {
    console.error('ERROR: Tech1 did not become available or completedCount did not increase!');
    process.exit(1);
  }
  console.log('PASS.');

  console.log('\nALL SERVICE REQUEST LIFECYCLE TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
