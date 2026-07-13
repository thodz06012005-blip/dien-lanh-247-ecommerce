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
  console.log('=== Running Technician Validation & Constraints Tests ===');

  // Login as admin
  console.log('\n[Test 0] Logging in as Admin...');
  const loginRes = await request('POST', '/api/v1/admin/auth/login', {
    email: 'owner@dienlanh247.vn',
    password: 'Admin@123'
  });
  const token = loginRes.data.data.token;

  // Reset DB
  console.log('\n[Test 1] Resetting DB...');
  await request('POST', '/api/v1/dev/reset-db');

  // 1. Tạo thợ hợp lệ
  console.log('\n[Test 2] Creating valid technician...');
  const validTech = {
    name: 'Thợ Kiểm Thử',
    phone: '0912345678',
    email: 'tho.kiemthu@dienlanh247.vn',
    skills: ['sua-dieu-hoa'],
    workingAreas: ['Quận Cầu Giấy'],
    status: 'available'
  };
  const res2 = await request('POST', '/api/v1/admin/technicians', validTech, token);
  console.log('Status:', res2.status, 'ID:', res2.data?.data?.id);
  if (res2.status !== 201) {
    console.error('ERROR: Failed to create valid technician!');
    process.exit(1);
  }
  const createdTechId = res2.data.data.id;
  console.log('PASS.');

  // 2. Tạo thợ thiếu tên
  console.log('\n[Test 3] Creating technician without name (Should FAIL)...');
  const res3 = await request('POST', '/api/v1/admin/technicians', { ...validTech, name: '' }, token);
  console.log('Status:', res3.status, 'Message:', res3.data?.message);
  if (res3.status !== 400) {
    console.error('ERROR: Allowed creating technician without name!');
    process.exit(1);
  }
  console.log('PASS.');

  // 3. Tạo thợ sai số điện thoại
  console.log('\n[Test 4] Creating technician with invalid phone (Should FAIL)...');
  const res4 = await request('POST', '/api/v1/admin/technicians', { ...validTech, phone: '12345' }, token);
  console.log('Status:', res4.status, 'Message:', res4.data?.message);
  if (res4.status !== 400) {
    console.error('ERROR: Allowed creating technician with invalid phone!');
    process.exit(1);
  }
  console.log('PASS.');

  // 4. Tạo thợ trùng phone
  console.log('\n[Test 5] Creating duplicate phone technician (Should FAIL)...');
  const res5 = await request('POST', '/api/v1/admin/technicians', { ...validTech, email: 'other@gmail.com' }, token);
  console.log('Status:', res5.status, 'Message:', res5.data?.message);
  if (res5.status !== 400) {
    console.error('ERROR: Allowed duplicate phone!');
    process.exit(1);
  }
  console.log('PASS.');

  // 5. Tạo thợ trùng email
  console.log('\n[Test 6] Creating duplicate email technician (Should FAIL)...');
  const res6 = await request('POST', '/api/v1/admin/technicians', { ...validTech, phone: '0987654321' }, token);
  console.log('Status:', res6.status, 'Message:', res6.data?.message);
  if (res6.status !== 400) {
    console.error('ERROR: Allowed duplicate email!');
    process.exit(1);
  }
  console.log('PASS.');

  // 6. Sửa rating > 5
  console.log('\n[Test 7] Updating technician with rating > 5 (Should FAIL)...');
  const res7 = await request('PATCH', `/api/v1/admin/technicians/${createdTechId}`, { rating: 6 }, token);
  console.log('Status:', res7.status, 'Message:', res7.data?.message);
  if (res7.status !== 400) {
    console.error('ERROR: Allowed rating > 5!');
    process.exit(1);
  }
  console.log('PASS.');

  // 7. Sửa status lạ
  console.log('\n[Test 8] Updating technician with invalid status (Should FAIL)...');
  const res8 = await request('PATCH', `/api/v1/admin/technicians/${createdTechId}`, { status: 'invalid-status' }, token);
  console.log('Status:', res8.status, 'Message:', res8.data?.message);
  if (res8.status !== 400) {
    console.error('ERROR: Allowed invalid status!');
    process.exit(1);
  }
  console.log('PASS.');

  // 8. Thử ghi đè completedCount qua PATCH
  console.log('\n[Test 9] Attempting to override completedCount and id (Should be IGNORED)...');
  const res9 = await request('PATCH', `/api/v1/admin/technicians/${createdTechId}`, { completedCount: 999, id: 'HACKED-ID' }, token);
  console.log('Status:', res9.status);
  console.log('Technician after PATCH:', {
    id: res9.data?.data?.id,
    completedCount: res9.data?.data?.completedCount
  });
  if (res9.data?.data?.id === 'HACKED-ID' || res9.data?.data?.completedCount === 999) {
    console.error('ERROR: Server allowed overriding read-only fields!');
    process.exit(1);
  }
  console.log('PASS.');

  // 9. Khoá trạng thái thợ khi đang có job active
  console.log('\n[Test 10] Testing state locking for technician with active job...');
  // We have tech1 (Nguyễn Văn Hùng, TECH-001) in DB
  // Let's assign TECH-001 to SR-240601 (status: confirmed)
  console.log('Assigning TECH-001 to SR-240601...');
  await request('PATCH', `/api/v1/admin/service-requests/SR-240601/assign-technician`, { technicianId: 'TECH-001' }, token);

  // Now try to change TECH-001 status to 'available' via PATCH (Should FAIL)
  console.log('Attempting to change busy technician status to available (Should FAIL)...');
  const failStatus1 = await request('PATCH', `/api/v1/admin/technicians/TECH-001`, { status: 'available' }, token);
  console.log('Status:', failStatus1.status, 'Message:', failStatus1.data?.message);
  if (failStatus1.status !== 400) {
    console.error('ERROR: Allowed changing status to available while having active job!');
    process.exit(1);
  }

  // Try to change status to 'inactive' (Should FAIL)
  console.log('Attempting to change busy technician status to inactive (Should FAIL)...');
  const failStatus2 = await request('PATCH', `/api/v1/admin/technicians/TECH-001/status`, { status: 'inactive' }, token);
  console.log('Status:', failStatus2.status, 'Message:', failStatus2.data?.message);
  if (failStatus2.status !== 400) {
    console.error('ERROR: Allowed changing status to inactive while having active job!');
    process.exit(1);
  }
  console.log('PASS.');

  // 10. Chặn xóa thợ đang có job active
  console.log('\n[Test 11] Testing deletion block for technician with active job...');
  const failDelete = await request('DELETE', `/api/v1/admin/technicians/TECH-001`, null, token);
  console.log('Status:', failDelete.status, 'Message:', failDelete.data?.message);
  if (failDelete.status !== 400) {
    console.error('ERROR: Allowed deleting technician with active job!');
    process.exit(1);
  }
  console.log('PASS.');

  // ================= BỔ SUNG THEO CÂU LỆNH 5B =================

  // 11. Cập nhật workingAreas/skills hợp lệ (chuẩn hóa "Quận ")
  console.log('\n[Test 12] Updating workingAreas and skills with valid data...');
  const validPatch = {
    workingAreas: ['Đống Đa', 'Quận Cầu Giấy'], // 'Đống Đa' should be normalized to 'Quận Đống Đa'
    skills: ['ve-sinh-dieu-hoa', 'sua-tu-lanh']
  };
  const res12 = await request('PATCH', `/api/v1/admin/technicians/${createdTechId}`, validPatch, token);
  console.log('Status:', res12.status);
  console.log('Updated workingAreas:', res12.data?.data?.workingAreas);
  console.log('Updated skills:', res12.data?.data?.skills);
  if (res12.status !== 200) {
    console.error('ERROR: Failed to update workingAreas/skills!');
    process.exit(1);
  }
  if (!res12.data.data.workingAreas.includes('Quận Đống Đa') || !res12.data.data.workingAreas.includes('Quận Cầu Giấy')) {
    console.error('ERROR: workingAreas were not normalized correctly!');
    process.exit(1);
  }
  console.log('PASS.');

  // 12. Cập nhật workingAreas/skills không hợp lệ (rỗng / không phải mảng)
  console.log('\n[Test 13] Updating workingAreas/skills with invalid data (Should FAIL)...');
  // Case A: workingAreas rỗng
  const res13a = await request('PATCH', `/api/v1/admin/technicians/${createdTechId}`, { workingAreas: [] }, token);
  console.log('Empty workingAreas status:', res13a.status, 'Message:', res13a.data?.message);
  if (res13a.status !== 400) {
    console.error('ERROR: Allowed empty workingAreas!');
    process.exit(1);
  }
  // Case B: skills không phải mảng
  const res13b = await request('PATCH', `/api/v1/admin/technicians/${createdTechId}`, { skills: 've-sinh-dieu-hoa' }, token);
  console.log('Non-array skills status:', res13b.status, 'Message:', res13b.data?.message);
  if (res13b.status !== 400) {
    console.error('ERROR: Allowed non-array skills!');
    process.exit(1);
  }
  console.log('PASS.');

  // 13. Liên thông hoàn chỉnh với Service Request Lifecycle
  console.log('\n[Test 14] Verifying complete request integration...');
  // Reset DB
  await request('POST', '/api/v1/dev/reset-db');

  // Assign TECH-001 (available) to SR-240601. TECH-001 status becomes 'busy'.
  console.log('Assigning TECH-001 to SR-240601...');
  await request('PATCH', `/api/v1/admin/service-requests/SR-240601/assign-technician`, { technicianId: 'TECH-001' }, token);

  // Complete SR-240601
  console.log('Completing SR-240601...');
  await request('PATCH', `/api/v1/admin/service-requests/SR-240601/status`, { status: 'completed', finalPrice: 200000 }, token);

  // Check TECH-001: completedCount should increase, status should be 'available'
  const res14 = await request('GET', '/api/v1/admin/technicians', null, token);
  const tech14 = res14.data.data.find(t => t.id === 'TECH-001');
  console.log('TECH-001 status:', tech14.status, 'completedCount:', tech14.completedCount);
  if (tech14.status !== 'available' || tech14.completedCount !== 25) {
    console.error('ERROR: Integration check failed on complete request!');
    process.exit(1);
  }

  // Cancel request integration
  // Create a new request in Quận Cầu Giấy, ve-sinh-dieu-hoa.
  const newSrRes = await request('POST', '/api/v1/service-requests', {
    customerName: 'Customer 3',
    customerPhone: '0911111111',
    customerAddress: '123 Test St',
    district: 'Quận Cầu Giấy',
    serviceCategoryId: 've-sinh-dieu-hoa',
    applianceType: 'Điều hòa',
    issueDescription: 'Vệ sinh máy',
    preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    preferredTimeSlot: '10:00 - 12:00'
  });
  const sr3Id = newSrRes.data.data.id;
  await request('PATCH', `/api/v1/admin/service-requests/${sr3Id}/status`, { status: 'confirmed' }, token);
  await request('PATCH', `/api/v1/admin/service-requests/${sr3Id}/assign-technician`, { technicianId: 'TECH-001' }, token);
  
  // Cancel SR-3
  console.log('Cancelling SR-3...');
  await request('PATCH', `/api/v1/admin/service-requests/${sr3Id}/status`, { status: 'cancelled' }, token);

  // Check TECH-001: status should be 'available'
  const res14b = await request('GET', '/api/v1/admin/technicians', null, token);
  const tech14b = res14b.data.data.find(t => t.id === 'TECH-001');
  console.log('TECH-001 status after cancel:', tech14b.status);
  if (tech14b.status !== 'available') {
    console.error('ERROR: Integration check failed on cancel request!');
    process.exit(1);
  }
  console.log('PASS.');

  // 14. Kiểm tra nhiều job: thợ có job active khác thì không được chuyển 'available'
  console.log('\n[Test 15] Verifying technician with multiple active jobs...');
  // We need to set up TECH-001 having 2 active jobs.
  // We reset DB first.
  console.log('Resetting DB...');
  await request('POST', '/api/v1/dev/reset-db');

  // Create a new request in Quận Cầu Giấy, ve-sinh-dieu-hoa.
  const newSrRes2 = await request('POST', '/api/v1/service-requests', {
    customerName: 'Customer 4',
    customerPhone: '0911111111',
    customerAddress: '123 Test St',
    district: 'Quận Cầu Giấy',
    serviceCategoryId: 've-sinh-dieu-hoa',
    applianceType: 'Điều hòa',
    issueDescription: 'Vệ sinh máy',
    preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    preferredTimeSlot: '10:00 - 12:00'
  });
  const sr4Id = newSrRes2.data.data.id;
  await request('PATCH', `/api/v1/admin/service-requests/${sr4Id}/status`, { status: 'confirmed' }, token);

  console.log('Assigning TECH-001 to SR-240601...');
  await request('PATCH', `/api/v1/admin/service-requests/SR-240601/assign-technician`, { technicianId: 'TECH-001' }, token);

  // Now TECH-001 is busy. Try to assign to the new request (which is confirmed and matches)
  const res15 = await request('PATCH', `/api/v1/admin/service-requests/${sr4Id}/assign-technician`, { technicianId: 'TECH-001' }, token);
  console.log('Assign busy technician status (Should FAIL):', res15.status, 'Message:', res15.data?.message);
  if (res15.status !== 400 || !res15.data?.message.includes('bận')) {
    console.error('ERROR: Allowed assigning busy technician!');
    process.exit(1);
  }
  console.log('PASS.');

  console.log('\nALL TECHNICIAN VALIDATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
