const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json'
    };
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
  console.log('=== Running Server-Side Order Pricing & Validation Tests ===');

  // Reset DB first
  console.log('\n[Test 0] Resetting DB...');
  await request('POST', '/api/v1/dev/reset-db');

  // Fetch product for reference
  const productsRes = await request('GET', '/api/v1/products');
  const prod1 = productsRes.data.data.find(p => p.id === 'dh-daikin-ftkf25xvmv'); // price = 10490000
  const prod2 = productsRes.data.data.find(p => p.id === 'lk-remote-daikin');    // price = 180000

  // 1. Place valid order, verify server-calculated pricing (Subtotal, Shipping, Total)
  console.log('\n[Test 1] Placing valid order (small item)...');
  const payload1 = {
    customerName: 'Test Customer',
    phone: '0987654321',
    city: 'Hà Nội',
    district: 'Quận Cầu Giấy',
    addressDetail: '123 Test St',
    paymentMethod: 'cod',
    items: [
      { productId: prod2.id, quantity: 2 } // 180000 * 2 = 360000 (shipping = 30000)
    ]
  };
  const res1 = await request('POST', '/api/v1/orders', payload1);
  console.log('Status:', res1.status);
  console.log('Pricing:', res1.data?.data ? {
    shippingFee: res1.data.data.shippingFee,
    discountAmount: res1.data.data.discountAmount,
    totalAmount: res1.data.data.totalAmount
  } : res1.data);

  if (res1.status !== 201 && res1.status !== 200) {
    console.error('ERROR: Should have created order successfully');
    process.exit(1);
  }
  const o1 = res1.data.data;
  if (o1.shippingFee !== 30000 || o1.discountAmount !== 0 || o1.totalAmount !== 390000) {
    console.error('ERROR: Pricing calculation mismatch');
    process.exit(1);
  }
  console.log('PASS.');

  // 2. Place order with voucher, verify server-calculated discount
  console.log('\n[Test 2] Placing order with valid voucher (GIAM50K)...');
  const payload2 = {
    ...payload1,
    voucherCode: 'GIAM50K' // -50000 for orders >= 200000
  };
  const res2 = await request('POST', '/api/v1/orders', payload2);
  console.log('Status:', res2.status);
  console.log('Pricing:', res2.data?.data ? {
    shippingFee: res2.data.data.shippingFee,
    discountAmount: res2.data.data.discountAmount,
    totalAmount: res2.data.data.totalAmount
  } : res2.data);
  const o2 = res2.data.data;
  if (o2.discountAmount !== 50000 || o2.totalAmount !== 340000) {
    console.error('ERROR: Voucher discount not applied correctly');
    process.exit(1);
  }
  console.log('PASS.');

  // 3. Place order with voucher but not meeting minOrderValue
  console.log('\n[Test 3] Placing order with voucher but under minOrderValue (DIENLANH247, min 2M)...');
  const payload3 = {
    ...payload1,
    voucherCode: 'DIENLANH247' // 10% off for >= 2M
  };
  const res3 = await request('POST', '/api/v1/orders', payload3);
  console.log('Status:', res3.status);
  console.log('Pricing:', res3.data?.data ? {
    shippingFee: res3.data.data.shippingFee,
    discountAmount: res3.data.data.discountAmount,
    totalAmount: res3.data.data.totalAmount
  } : res3.data);
  const o3 = res3.data.data;
  if (o3.discountAmount !== 0 || o3.totalAmount !== 390000) {
    console.error('ERROR: Should not have applied discount since minOrderValue not met');
    process.exit(1);
  }
  console.log('PASS.');

  // 4. Send malicious pricing in payload (Should be ignored by server)
  console.log('\n[Test 4] Sending malicious pricing values (totalAmount=1, discountAmount=999999, shippingFee=0)...');
  const payload4 = {
    ...payload1,
    totalAmount: 1,
    discountAmount: 999999,
    shippingFee: 0
  };
  const res4 = await request('POST', '/api/v1/orders', payload4);
  console.log('Status:', res4.status);
  console.log('Pricing:', res4.data?.data ? {
    shippingFee: res4.data.data.shippingFee,
    discountAmount: res4.data.data.discountAmount,
    totalAmount: res4.data.data.totalAmount
  } : res4.data);
  const o4 = res4.data.data;
  if (o4.shippingFee !== 30000 || o4.discountAmount !== 0 || o4.totalAmount !== 390000) {
    console.error('ERROR: Server trusted client-provided pricing!');
    process.exit(1);
  }
  console.log('PASS.');

  // 5. Invalid productId
  console.log('\n[Test 5] Placing order with invalid productId (Should FAIL)...');
  const payload5 = {
    ...payload1,
    items: [{ productId: 'invalid-id', quantity: 1 }]
  };
  const res5 = await request('POST', '/api/v1/orders', payload5);
  console.log('Status:', res5.status, 'Message:', res5.data?.message);
  if (res5.status !== 404) {
    console.error('ERROR: Should have returned 404 for invalid product');
    process.exit(1);
  }
  console.log('PASS.');

  // 6. Invalid quantity (0 or negative)
  console.log('\n[Test 6] Placing order with zero quantity (Should FAIL)...');
  const payload6 = {
    ...payload1,
    items: [{ productId: prod2.id, quantity: 0 }]
  };
  const res6 = await request('POST', '/api/v1/orders', payload6);
  console.log('Status:', res6.status, 'Message:', res6.data?.message);
  if (res6.status !== 400) {
    console.error('ERROR: Should have returned 400 for zero quantity');
    process.exit(1);
  }
  console.log('PASS.');

  // 7. Quantity exceeding stock
  console.log('\n[Test 7] Placing order with quantity exceeding stock (Should FAIL)...');
  const payload7 = {
    ...payload1,
    items: [{ productId: prod2.id, quantity: 9999 }]
  };
  const res7 = await request('POST', '/api/v1/orders', payload7);
  console.log('Status:', res7.status, 'Message:', res7.data?.message);
  if (res7.status !== 400 || !res7.data?.message.includes('không đủ tồn kho')) {
    console.error('ERROR: Should have returned 400 for exceeding stock');
    process.exit(1);
  }
  console.log('PASS.');

  console.log('\nALL SERVER-SIDE ORDER PRICING & VALIDATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
