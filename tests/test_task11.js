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
  console.log('=== Running Task 11 Product Validation Tests ===');

  // Login to get token
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
  console.log('Admin login successful. Token acquired.');

  // Reset DB
  console.log('\n[Test 1] Resetting DB...');
  await request('POST', '/api/v1/dev/reset-db');

  // Fetch a product
  const pRes = await request('GET', '/api/v1/products');
  const testProduct = pRes.data.data[0];

  // 1. Create product with salePrice > basePrice
  console.log('\n[Test 2] Creating product with salePrice > basePrice (Should FAIL)...');
  const payload1 = {
    name: 'Invalid Price Product',
    sku: 'SKU-PRICE-ERR',
    slug: 'invalid-price-product',
    categoryId: 'dieu-hoa',
    brandId: 'daikin',
    basePrice: 100000,
    salePrice: 120000, // salePrice > basePrice
    stock: 10,
    thumbnail: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586'
  };
  const res1 = await request('POST', '/api/v1/admin/products', payload1, token);
  console.log(`Status: ${res1.status}, Message: "${res1.data?.message}"`);
  if (res1.status !== 400 || !res1.data?.message.includes('Giá khuyến mãi không được lớn hơn giá gốc')) {
    console.error('ERROR: Should have blocked salePrice > basePrice');
    process.exit(1);
  }
  console.log('PASS.');

  // 2. Create product with negative stock
  console.log('\n[Test 3] Creating product with negative stock (Should FAIL)...');
  const payload2 = {
    ...payload1,
    salePrice: 90000,
    stock: -5 // negative stock
  };
  const res2 = await request('POST', '/api/v1/admin/products', payload2, token);
  console.log(`Status: ${res2.status}, Message: "${res2.data?.message}"`);
  if (res2.status !== 400 || !res2.data?.message.includes('Số lượng tồn kho phải là số nguyên lớn hơn hoặc bằng 0')) {
    console.error('ERROR: Should have blocked negative stock');
    process.exit(1);
  }
  console.log('PASS.');

  // 3. Create product with empty thumbnail
  console.log('\n[Test 4] Creating product with empty thumbnail (Should FAIL)...');
  const payload3 = {
    ...payload1,
    salePrice: 90000,
    stock: 10,
    thumbnail: '' // empty thumbnail
  };
  const res3 = await request('POST', '/api/v1/admin/products', payload3, token);
  console.log(`Status: ${res3.status}, Message: "${res3.data?.message}"`);
  if (res3.status !== 400 || !res3.data?.message.includes('Ảnh đại diện sản phẩm không được để trống')) {
    console.error('ERROR: Should have blocked empty thumbnail');
    process.exit(1);
  }
  console.log('PASS.');

  // 4. Create product with basePrice <= 0
  console.log('\n[Test 5] Creating product with basePrice <= 0 (Should FAIL)...');
  const payload4 = {
    ...payload1,
    basePrice: 0, // basePrice = 0
    salePrice: 0
  };
  const res4 = await request('POST', '/api/v1/admin/products', payload4, token);
  console.log(`Status: ${res4.status}, Message: "${res4.data?.message}"`);
  if (res4.status !== 400 || !res4.data?.message.includes('Giá gốc sản phẩm phải lớn hơn 0')) {
    console.error('ERROR: Should have blocked basePrice <= 0');
    process.exit(1);
  }
  console.log('PASS.');

  // 5. Create valid product
  console.log('\n[Test 6] Creating valid product (Should PASS)...');
  const payload5 = {
    ...payload1,
    salePrice: 95000,
    stock: 20
  };
  const res5 = await request('POST', '/api/v1/admin/products', payload5, token);
  console.log(`Status: ${res5.status}, Product Created: "${res5.data?.data?.name}"`);
  if (res5.status !== 201 && res5.status !== 200) {
    console.error('ERROR: Should have created valid product successfully');
    process.exit(1);
  }
  console.log('PASS.');

  console.log('\nALL TASK 11 PRODUCT VALIDATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
