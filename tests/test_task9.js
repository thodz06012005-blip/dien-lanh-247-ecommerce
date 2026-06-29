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
  console.log('=== Running Task 9 Integration Tests ===');

  // Reset DB
  console.log('\n[Test 1] Resetting DB...');
  const resetRes = await request('POST', '/api/v1/dev/reset-db');
  if (resetRes.status !== 200) {
    console.error('Failed to reset DB:', resetRes);
    process.exit(1);
  }
  console.log('DB reset successful.');

  // Check product stock
  const pRes = await request('GET', '/api/v1/products');
  const testProduct = pRes.data.data[0];
  console.log(`Using product: ${testProduct.name} (Stock: ${testProduct.stock})`);

  // 1. Place order with phone number containing spaces
  console.log('\n[Test 2] Placing order with phone number containing spaces...');
  const checkoutBody = {
    customerName: 'Test Customer Space',
    phone: '0987 654 321 ', // has spaces and trailing space
    email: 'testspace@gmail.com',
    city: 'Hà Nội',
    district: 'Cầu Giấy',
    addressDetail: '123 Test St',
    note: 'Call before delivery',
    items: [
      {
        productId: testProduct.id,
        quantity: 1
      }
    ],
    paymentMethod: 'cod'
  };

  const checkoutRes = await request('POST', '/api/v1/orders', checkoutBody);
  if (checkoutRes.status !== 200 && checkoutRes.status !== 201) {
    console.error('Failed to place order:', checkoutRes);
    process.exit(1);
  }
  
  const createdOrder = checkoutRes.data.data;
  console.log(`Created order: ${createdOrder.code}, phone in response: "${createdOrder.phone}"`);
  if (createdOrder.phone !== '0987654321') {
    console.error(`ERROR: Phone number was not normalized! Expected: "0987654321", Got: "${createdOrder.phone}"`);
    process.exit(1);
  }
  console.log('Phone number normalization verification: PASS.');

  // 2. Book service request with phone number containing spaces
  console.log('\n[Test 3] Booking service request with phone number containing spaces...');
  const bookingBody = {
    customerName: 'Customer Space Booking',
    customerPhone: ' 0912 345 678', // has leading and middle spaces
    customerAddress: '456 Test Road',
    district: 'Cầu Giấy',
    serviceCategoryId: 've-sinh-dieu-hoa',
    applianceType: 'Điều hòa treo tường',
    issueDescription: 'Bụi bẩn cần vệ sinh',
    preferredDate: '2026-07-10',
    preferredTimeSlot: 'morning'
  };

  const bookingRes = await request('POST', '/api/v1/service-requests', bookingBody);
  if (bookingRes.status !== 200 && bookingRes.status !== 201) {
    console.error('Failed to create service request:', bookingRes);
    process.exit(1);
  }

  const createdRequest = bookingRes.data.data;
  console.log(`Created Service Request: ${createdRequest.id}, customerPhone in response: "${createdRequest.customerPhone}"`);
  if (createdRequest.customerPhone !== '0912345678') {
    console.error(`ERROR: customerPhone was not normalized! Expected: "0912345678", Got: "${createdRequest.customerPhone}"`);
    process.exit(1);
  }
  console.log('Service request phone number normalization verification: PASS.');

  console.log('\nALL INTEGRATION TESTS PASSED SUCCESSFULLY! Task 9 backend normalization is fully verified.');
}

runTests().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
