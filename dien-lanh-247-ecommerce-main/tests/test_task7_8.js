const http = require('http');

const adminCredentials = {
  email: 'owner@dienlanh247.vn',
  password: 'Admin@123'
};

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
  console.log('=== Running Task 7 & Task 8 Integration Tests ===');

  // 1. Admin Login
  console.log('\n[Test 1] Logging in as admin...');
  const loginRes = await request('POST', '/api/v1/admin/auth/login', adminCredentials);
  if (loginRes.status !== 200 || !loginRes.data.success) {
    console.error('Failed to log in:', loginRes);
    process.exit(1);
  }
  const token = loginRes.data.data.token;
  console.log('Admin login successful.');

  // 2. Reset DB
  console.log('\n[Test 2] Resetting DB...');
  const resetRes = await request('POST', '/api/v1/dev/reset-db', null, token);
  if (resetRes.status !== 200) {
    console.error('Failed to reset DB:', resetRes);
    process.exit(1);
  }
  console.log('DB reset successful.');

  // 3. Test Service Request completion validation (Task 7 backend)
  console.log('\n[Test 3] Testing Service Request status completion validations...');
  
  // Try complete SR-240601 (status confirmed, assignedTechnicianId null)
  // Should fail because no tech is assigned!
  console.log('Attempting to complete SR-240601 (status: confirmed, no tech)...');
  const completeFail1 = await request('PATCH', '/api/v1/admin/service-requests/SR-240601/status', {
    status: 'completed',
    finalPrice: 150000,
    note: 'Test complete'
  }, token);
  console.log(`Response status: ${completeFail1.status}, message: ${completeFail1.data?.message}`);
  if (completeFail1.status === 200) {
    console.error('ERROR: Completed service request without transition to assigned and without technician!');
    process.exit(1);
  }

  // Assign TECH-001 to SR-240601
  console.log('Assigning TECH-001 to SR-240601...');
  const assignRes = await request('PATCH', '/api/v1/admin/service-requests/SR-240601/assign-technician', { technicianId: 'TECH-001' }, token);
  if (assignRes.status !== 200) {
    console.error('Failed to assign technician:', assignRes);
    process.exit(1);
  }

  // Try complete SR-240601 (status assigned) with finalPrice <= 0
  // Should fail because finalPrice must be > 0
  console.log('Attempting to complete SR-240601 with finalPrice = 0...');
  const completeFail2 = await request('PATCH', '/api/v1/admin/service-requests/SR-240601/status', {
    status: 'completed',
    finalPrice: 0,
    note: 'Test complete'
  }, token);
  console.log(`Response status: ${completeFail2.status}, message: ${completeFail2.data?.message}`);
  if (completeFail2.status === 200) {
    console.error('ERROR: Allowed completion with finalPrice = 0!');
    process.exit(1);
  }

  // Try complete SR-240601 (status assigned) with finalPrice = 120000 and paymentStatus = 'paid'
  // Should succeed!
  console.log('Attempting to complete SR-240601 with finalPrice = 120000 and paymentStatus = paid (Should succeed)...');
  const completeSuccess = await request('PATCH', '/api/v1/admin/service-requests/SR-240601/status', {
    status: 'completed',
    finalPrice: 120000,
    paymentStatus: 'paid',
    note: 'Thực tế xử lý rất tốt'
  }, token);
  console.log(`Response status: ${completeSuccess.status}, message: ${completeSuccess.data?.message}`);
  if (completeSuccess.status !== 200) {
    console.error('ERROR: Failed to complete service request!');
    process.exit(1);
  }

  // Verify completed request details
  const srDetail = await request('GET', '/api/v1/admin/service-requests/SR-240601', null, token);
  const updatedReq = srDetail.data.data;
  console.log(`Completed service request status: ${updatedReq.status}`);
  console.log(`Completed service request finalPrice: ${updatedReq.finalPrice}`);
  console.log(`Completed service request paymentStatus: ${updatedReq.paymentStatus}`);
  console.log(`Completed service request completedAt: ${updatedReq.completedAt}`);
  console.log(`Last statusHistory entry: ${JSON.stringify(updatedReq.statusHistory[updatedReq.statusHistory.length - 1])}`);

  if (updatedReq.status !== 'completed' || updatedReq.finalPrice !== 120000 || updatedReq.paymentStatus !== 'paid' || !updatedReq.completedAt) {
    console.error('ERROR: Fields did not update correctly after completion!');
    process.exit(1);
  }
  console.log('Task 7 Backend Verification: PASS.');

  // 4. Test Order status transitions (Task 8 backend)
  console.log('\n[Test 4] Creating a new pending order via customer checkout...');
  
  // Fetch products
  const productsRes = await request('GET', '/api/v1/products');
  const testProduct = productsRes.data.data[0];
  console.log(`Picked product: ${testProduct.name} (${testProduct.id}), initial stock: ${testProduct.stock}`);

  const checkoutBody = {
    customerName: 'Test Customer',
    phone: '0987654321',
    email: 'test@gmail.com',
    city: 'Hà Nội',
    district: 'Cầu Giấy',
    addressDetail: '123 Test St',
    note: 'Call before delivery',
    items: [
      {
        productId: testProduct.id,
        quantity: 2
      }
    ],
    paymentMethod: 'cod'
  };

  const checkoutRes = await request('POST', '/api/v1/orders', checkoutBody);
  if (checkoutRes.status !== 200 && checkoutRes.status !== 201) {
    console.error('Failed to create test order:', checkoutRes);
    process.exit(1);
  }
  const pendingOrder = checkoutRes.data.data;
  console.log(`Created pending order: ${pendingOrder.code} (${pendingOrder.id})`);

  console.log('\nTesting Order workflow transitions...');

  // Try pending -> processing (invalid)
  console.log('Attempting pending -> processing (Should fail)...');
  const transitionFail1 = await request('PATCH', `/api/v1/admin/orders/${pendingOrder.id}/status`, { status: 'processing' }, token);
  console.log(`Response status: ${transitionFail1.status}, message: ${transitionFail1.data?.message}`);
  if (transitionFail1.status === 200) {
    console.error('ERROR: Allowed invalid transition pending -> processing!');
    process.exit(1);
  }

  // Try pending -> delivered (invalid)
  console.log('Attempting pending -> delivered (Should fail)...');
  const transitionFail2 = await request('PATCH', `/api/v1/admin/orders/${pendingOrder.id}/status`, { status: 'delivered' }, token);
  console.log(`Response status: ${transitionFail2.status}, message: ${transitionFail2.data?.message}`);
  if (transitionFail2.status === 200) {
    console.error('ERROR: Allowed invalid transition pending -> delivered!');
    process.exit(1);
  }

  // Try pending -> confirmed (valid)
  console.log('Attempting pending -> confirmed (Should succeed)...');
  const transitionSuccess1 = await request('PATCH', `/api/v1/admin/orders/${pendingOrder.id}/status`, { status: 'confirmed' }, token);
  console.log(`Response status: ${transitionSuccess1.status}, message: ${transitionSuccess1.data?.message}`);
  if (transitionSuccess1.status !== 200) {
    console.error('ERROR: Failed valid transition pending -> confirmed!');
    process.exit(1);
  }

  // Now status is confirmed. Try confirmed -> shipping (invalid)
  console.log('Attempting confirmed -> shipping (Should fail)...');
  const transitionFail3 = await request('PATCH', `/api/v1/admin/orders/${pendingOrder.id}/status`, { status: 'shipping' }, token);
  console.log(`Response status: ${transitionFail3.status}, message: ${transitionFail3.data?.message}`);
  if (transitionFail3.status === 200) {
    console.error('ERROR: Allowed invalid transition confirmed -> shipping!');
    process.exit(1);
  }

  // Try confirmed -> processing (valid)
  console.log('Attempting confirmed -> processing (Should succeed)...');
  const transitionSuccess2 = await request('PATCH', `/api/v1/admin/orders/${pendingOrder.id}/status`, { status: 'processing' }, token);
  console.log(`Response status: ${transitionSuccess2.status}, message: ${transitionSuccess2.data?.message}`);
  if (transitionSuccess2.status !== 200) {
    console.error('ERROR: Failed valid transition confirmed -> processing!');
    process.exit(1);
  }

  // Now status is processing. Try processing -> delivered (invalid)
  console.log('Attempting processing -> delivered (Should fail)...');
  const transitionFail4 = await request('PATCH', `/api/v1/admin/orders/${pendingOrder.id}/status`, { status: 'delivered' }, token);
  console.log(`Response status: ${transitionFail4.status}, message: ${transitionFail4.data?.message}`);
  if (transitionFail4.status === 200) {
    console.error('ERROR: Allowed invalid transition processing -> delivered!');
    process.exit(1);
  }

  // Try processing -> shipping (valid)
  console.log('Attempting processing -> shipping (Should succeed)...');
  const transitionSuccess3 = await request('PATCH', `/api/v1/admin/orders/${pendingOrder.id}/status`, { status: 'shipping' }, token);
  console.log(`Response status: ${transitionSuccess3.status}, message: ${transitionSuccess3.data?.message}`);
  if (transitionSuccess3.status !== 200) {
    console.error('ERROR: Failed valid transition processing -> shipping!');
    process.exit(1);
  }

  // Now status is shipping. Try shipping -> cancelled (invalid)
  console.log('Attempting shipping -> cancelled (Should fail)...');
  const transitionFail5 = await request('PATCH', `/api/v1/admin/orders/${pendingOrder.id}/status`, { status: 'cancelled' }, token);
  console.log(`Response status: ${transitionFail5.status}, message: ${transitionFail5.data?.message}`);
  if (transitionFail5.status === 200) {
    console.error('ERROR: Allowed invalid transition shipping -> cancelled!');
    process.exit(1);
  }

  // Try shipping -> delivered (valid)
  console.log('Attempting shipping -> delivered (Should succeed)...');
  const transitionSuccess4 = await request('PATCH', `/api/v1/admin/orders/${pendingOrder.id}/status`, { status: 'delivered' }, token);
  console.log(`Response status: ${transitionSuccess4.status}, message: ${transitionSuccess4.data?.message}`);
  if (transitionSuccess4.status !== 200) {
    console.error('ERROR: Failed valid transition shipping -> delivered!');
    process.exit(1);
  }

  // Now status is delivered. Try delivered -> cancelled (invalid)
  console.log('Attempting delivered -> cancelled (Should fail)...');
  const transitionFail6 = await request('PATCH', `/api/v1/admin/orders/${pendingOrder.id}/status`, { status: 'cancelled' }, token);
  console.log(`Response status: ${transitionFail6.status}, message: ${transitionFail6.data?.message}`);
  if (transitionFail6.status === 200) {
    console.error('ERROR: Allowed transition from delivered status!');
    process.exit(1);
  }
  console.log('Order Workflow transition checks: PASS.');

  // 5. Test cancellation stock restoration (Task 8 stock verification)
  console.log('\n[Test 5] Testing stock restoration on cancel...');
  
  // Re-fetch product initial stock before new order
  const pResBefore = await request('GET', '/api/v1/products');
  const testProductBefore = pResBefore.data.data.find(p => p.id === testProduct.id);
  const initialStock = testProductBefore.stock;
  console.log(`Initial stock of ${testProductBefore.name}: ${initialStock}`);

  // Create an order
  console.log('Creating order with quantity 3...');
  const newOrderRes = await request('POST', '/api/v1/orders', {
    ...checkoutBody,
    items: [{ productId: testProduct.id, quantity: 3 }]
  });
  const createdOrder = newOrderRes.data.data;
  
  // Verify stock was subtracted
  const pResMid = await request('GET', '/api/v1/products');
  const testProductMid = pResMid.data.data.find(p => p.id === testProduct.id);
  console.log(`Stock after order creation: ${testProductMid.stock} (expected: ${initialStock - 3})`);
  if (testProductMid.stock !== initialStock - 3) {
    console.error('ERROR: Stock was not correctly subtracted on order creation!');
    process.exit(1);
  }

  // Cancel the order
  console.log(`Cancelling order ${createdOrder.code}...`);
  const cancelRes = await request('PATCH', `/api/v1/admin/orders/${createdOrder.id}/status`, { status: 'cancelled' }, token);
  if (cancelRes.status !== 200) {
    console.error('Failed to cancel order:', cancelRes);
    process.exit(1);
  }

  // Re-fetch product to verify stock has increased by 3
  const pResAfter = await request('GET', '/api/v1/products');
  const testProductAfter = pResAfter.data.data.find(p => p.id === testProduct.id);
  const updatedStock = testProductAfter.stock;
  console.log(`Product stock after cancel: ${updatedStock} (expected: ${initialStock})`);

  if (updatedStock !== initialStock) {
    console.error(`ERROR: Stock did not restore correctly! Expected: ${initialStock}, Got: ${updatedStock}`);
    process.exit(1);
  }
  console.log('Stock restoration verification: PASS.');

  console.log('\nALL INTEGRATION TESTS PASSED SUCCESSFULLY! Task 7 & Task 8 are fully verified.');
}

runTests().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
