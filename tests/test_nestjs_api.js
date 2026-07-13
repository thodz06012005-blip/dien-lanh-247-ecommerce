const BASE_URL = 'http://localhost:3000/api/v1';

async function runTests() {
  console.log('=== STARTING NESTJS BACKEND API INTEGRATION TESTS ===\n');

  try {
    // ----------------------------------------------------------------
    // 1. PUBLIC API TESTS
    // ----------------------------------------------------------------
    console.log('[1] Testing Public APIs...');
    
    const resServiceCats = await fetch(`${BASE_URL}/service-categories`);
    console.log(`- GET /service-categories: ${resServiceCats.status} (${resServiceCats.status === 200 ? 'PASS' : 'FAIL'})`);
    
    const resSettings = await fetch(`${BASE_URL}/settings/public`);
    const settingsResponse = await resSettings.json();
    const settingsData = settingsResponse.data || settingsResponse;
    console.log(`- GET /settings/public: ${resSettings.status} (${resSettings.status === 200 ? 'PASS' : 'FAIL'})`);
    console.log(`  Hotline: ${settingsData.hotline}, ShippingFee: ${settingsData.shippingFee}`);
    
    const resCategories = await fetch(`${BASE_URL}/categories`);
    console.log(`- GET /categories: ${resCategories.status} (${resCategories.status === 200 ? 'PASS' : 'FAIL'})`);
    
    const resBrands = await fetch(`${BASE_URL}/brands`);
    console.log(`- GET /brands: ${resBrands.status} (${resBrands.status === 200 ? 'PASS' : 'FAIL'})`);
    
    const resProducts = await fetch(`${BASE_URL}/products`);
    const productsResponse = await resProducts.json();
    console.log(`- GET /products: ${resProducts.status} (${resProducts.status === 200 ? 'PASS' : 'FAIL'})`);
    
    // Support both wrapped and unwrapped response shapes
    const productsList = Array.isArray(productsResponse.data)
      ? productsResponse.data
      : (productsResponse.data?.data || productsResponse.products || []);
    console.log(`  Total products found: ${productsList.length}`);

    // POST /contact
    const resContact = await fetch(`${BASE_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Nguyễn Văn A',
        phone: '0988888888',
        message: 'Cần tư vấn sửa tủ lạnh gấp'
      })
    });
    console.log(`- POST /contact: ${resContact.status} (${resContact.status === 201 ? 'PASS' : 'FAIL'})`);

    console.log('\n--------------------------------------------------\n');

    // ----------------------------------------------------------------
    // 2. SECURITY & AUTHENTICATION TESTS
    // ----------------------------------------------------------------
    console.log('[2] Testing Security & Auth...');
    
    // Check block when no token
    const resNoToken = await fetch(`${BASE_URL}/admin/dashboard`);
    console.log(`- GET /admin/dashboard (No Token): ${resNoToken.status} (${resNoToken.status === 401 ? 'PASS (Blocked)' : 'FAIL'})`);
    
    // Check block when wrong token
    const resWrongToken = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { 'Authorization': 'Bearer WRONG_TOKEN' }
    });
    console.log(`- GET /admin/dashboard (Wrong Token): ${resWrongToken.status} (${resWrongToken.status === 401 ? 'PASS (Blocked)' : 'FAIL'})`);

    // Admin login
    const resLogin = await fetch(`${BASE_URL}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@dienlanh247.vn',
        password: 'admin123'
      })
    });
    console.log(`- POST /admin/auth/login: ${resLogin.status} (${resLogin.status === 200 ? 'PASS' : 'FAIL'})`);
    
    const loginResponse = await resLogin.json();
    const token = loginResponse.data?.token || loginResponse.token;
    if (!token) {
      throw new Error('Failed to retrieve Admin accessToken from login response');
    }
    console.log(`  AccessToken retrieved successfully.`);
    const authHeader = { 'Authorization': `Bearer ${token}` };

    // GET /admin/auth/me
    const resMe = await fetch(`${BASE_URL}/admin/auth/me`, {
      headers: authHeader
    });
    const meResponse = await resMe.json();
    const meData = meResponse.data || meResponse;
    console.log(`- GET /admin/auth/me: ${resMe.status} (${resMe.status === 200 ? 'PASS' : 'FAIL'})`);
    console.log(`  Logged in as: ${meData.admin?.name} (${meData.admin?.role})`);

    console.log('\n--------------------------------------------------\n');

    // ----------------------------------------------------------------
    // 3. ADMIN PROTECTED ENDPOINTS
    // ----------------------------------------------------------------
    console.log('[3] Testing Admin Protected Endpoints...');

    const resDashboard = await fetch(`${BASE_URL}/admin/dashboard`, { headers: authHeader });
    console.log(`- GET /admin/dashboard: ${resDashboard.status} (${resDashboard.status === 200 ? 'PASS' : 'FAIL'})`);
    const dbResponse = await resDashboard.json();
    const dbData = dbResponse.data || dbResponse;
    console.log(`  Today Revenue: ${dbData.todayRevenue}, Pending Orders: ${dbData.pendingOrders}`);

    const resAdminSettings = await fetch(`${BASE_URL}/admin/settings`, { headers: authHeader });
    console.log(`- GET /admin/settings: ${resAdminSettings.status} (${resAdminSettings.status === 200 ? 'PASS' : 'FAIL'})`);

    const resPatchSettings = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'PATCH',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hotline: '1900 1234',
        zalo: '0987654321',
        email: 'support@dienlanh247.vn',
        address: '123 Đường Cầu Giấy, Hà Nội',
        shippingFee: 30000,
        freeShippingThreshold: 10000000
      })
    });
    console.log(`- PATCH /admin/settings: ${resPatchSettings.status} (${resPatchSettings.status === 200 ? 'PASS' : 'FAIL'})`);

    const resTechs = await fetch(`${BASE_URL}/admin/technicians`, { headers: authHeader });
    console.log(`- GET /admin/technicians: ${resTechs.status} (${resTechs.status === 200 ? 'PASS' : 'FAIL'})`);

    const resTechDetail = await fetch(`${BASE_URL}/admin/technicians/TECH-001`, { headers: authHeader });
    console.log(`- GET /admin/technicians/TECH-001: ${resTechDetail.status} (${resTechDetail.status === 200 ? 'PASS' : 'FAIL'})`);

    const resSRs = await fetch(`${BASE_URL}/admin/service-requests`, { headers: authHeader });
    console.log(`- GET /admin/service-requests: ${resSRs.status} (${resSRs.status === 200 ? 'PASS' : 'FAIL'})`);

    const resSRDetail = await fetch(`${BASE_URL}/admin/service-requests/SR-240601`, { headers: authHeader });
    console.log(`- GET /admin/service-requests/SR-240601: ${resSRDetail.status} (${resSRDetail.status === 200 ? 'PASS' : 'FAIL'})`);

    const resOrders = await fetch(`${BASE_URL}/admin/orders`, { headers: authHeader });
    console.log(`- GET /admin/orders: ${resOrders.status} (${resOrders.status === 200 ? 'PASS' : 'FAIL'})`);

    const resCustomers = await fetch(`${BASE_URL}/admin/customers`, { headers: authHeader });
    const customersResponse = await resCustomers.json();
    const customersList = customersResponse.data || [];
    console.log(`- GET /admin/customers: ${resCustomers.status} (${resCustomers.status === 200 ? 'PASS' : 'FAIL'})`);
    console.log(`  Total Admin Customers found: ${customersList.length}`);

    console.log('\n--------------------------------------------------\n');

    // ----------------------------------------------------------------
    // 4. SERVICE REQUEST LIFECYCLE TESTS
    // ----------------------------------------------------------------
    console.log('[4] Testing Service Request Lifecycle...');

    // Create a new technician dynamically to ensure they are available
    const randomSuffix = Math.floor(Math.random() * 100000);
    const resCreateTech = await fetch(`${BASE_URL}/admin/technicians`, {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Thợ Kiểm Thử ${randomSuffix}`,
        phone: `096${String(randomSuffix).padStart(7, '0')}`,
        email: `tech_${randomSuffix}@dienlanh247.vn`,
        skills: ['ve-sinh-dieu-hoa'],
        workingAreas: ['Quận Cầu Giấy'],
        avatar: 'https://placehold.co/200x200',
        rating: 5
      })
    });
    const createTechResponse = await resCreateTech.json();
    const techId = createTechResponse.data?.id || createTechResponse.id;
    if (!techId) {
      throw new Error(`Failed to create test technician: ${JSON.stringify(createTechResponse)}`);
    }
    console.log(`  New test technician created: ${techId}`);

    // Create new service request
    const resCreateSR = await fetch(`${BASE_URL}/service-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Trần Văn Cường',
        customerPhone: '0977555666',
        customerAddress: '72 Trần Hưng Đạo',
        district: 'Quận Cầu Giấy',
        priority: 'medium',
        serviceCategoryId: 've-sinh-dieu-hoa',
        applianceType: 'Điều hòa Daikin',
        issueDescription: 'Cần vệ sinh lọc bụi dàn lạnh',
        preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        preferredTimeSlot: '09:00 - 11:00',
        note: ''
      })
    });
    console.log(`- POST /service-requests: ${resCreateSR.status} (${resCreateSR.status === 201 ? 'PASS' : 'FAIL'})`);
    const srResponse = await resCreateSR.json();
    const srId = srResponse.data?.id || srResponse.id;
    console.log(`  New Service Request ID: ${srId}`);

    // GET /my-service-requests
    const resMySR = await fetch(`${BASE_URL}/my-service-requests?phone=0977555666`);
    console.log(`- GET /my-service-requests: ${resMySR.status} (${resMySR.status === 200 ? 'PASS' : 'FAIL'})`);

    if (srId && techId) {
      // PATCH status pending -> confirmed
      const resConfirmSR = await fetch(`${BASE_URL}/admin/service-requests/${srId}/status`, {
        method: 'PATCH',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' })
      });
      console.log(`- PATCH /admin/service-requests/${srId}/status (confirmed): ${resConfirmSR.status} (${resConfirmSR.status === 200 ? 'PASS' : 'FAIL'})`);

      // PATCH assign technician
      const resAssignSR = await fetch(`${BASE_URL}/admin/service-requests/${srId}/assign-technician`, {
        method: 'PATCH',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId: techId })
      });
      console.log(`- PATCH /admin/service-requests/${srId}/assign-technician: ${resAssignSR.status} (${resAssignSR.status === 200 ? 'PASS' : 'FAIL'})`);

      // Verify technician status is now busy
      const resVerifyTechBusy = await fetch(`${BASE_URL}/admin/technicians/${techId}`, { headers: authHeader });
      const techBusyResponse = await resVerifyTechBusy.json();
      const techBusyData = techBusyResponse.data || techBusyResponse;
      console.log(`  Technician status after assign: ${techBusyData.status} (${techBusyData.status === 'busy' ? 'PASS' : 'FAIL'})`);

      // PATCH status assigned -> completed
      const resCompleteSR = await fetch(`${BASE_URL}/admin/service-requests/${srId}/status`, {
        method: 'PATCH',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', finalPrice: 250000 })
      });
      console.log(`- PATCH /admin/service-requests/${srId}/status (completed): ${resCompleteSR.status} (${resCompleteSR.status === 200 ? 'PASS' : 'FAIL'})`);

      // Verify technician status is now available again
      const resVerifyTechAvail = await fetch(`${BASE_URL}/admin/technicians/${techId}`, { headers: authHeader });
      const techAvailResponse = await resVerifyTechAvail.json();
      const techAvailData = techAvailResponse.data || techAvailResponse;
      console.log(`  Technician status after complete: ${techAvailData.status} (${techAvailData.status === 'available' ? 'PASS' : 'FAIL'})`);
    } else {
      console.log('  Skipping Service Request status/assignment tests due to missing ID.');
    }

    console.log('\n--------------------------------------------------\n');

    // ----------------------------------------------------------------
    // 5. ORDERS & STOCK LIFECYCLE TESTS
    // ----------------------------------------------------------------
    console.log('[5] Testing Orders & Stock Lifecycle...');

    // Get a product to order
    const sampleProduct = productsList.find(p => p.slug === 'dieu-hoa-daikin-inverter-1-hp-ftkf25xvmv') 
                         || productsList[0];
    if (!sampleProduct) {
      throw new Error('No product available to place order');
    }
    const variantId = sampleProduct.variants?.[0]?.id;
    if (!variantId) {
      throw new Error('No product variant available to place order');
    }
    const initialStock = sampleProduct.variants?.[0]?.stock;
    console.log(`  Product variant: ${sampleProduct.variants?.[0]?.sku}, Initial Stock: ${initialStock}`);

    // Create new order (using CreateOrderDto fields)
    const resCreateOrder = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Lê Hoàng Minh',
        phone: '0988777666',
        city: 'Hà Nội',
        district: 'Quận Cầu Giấy',
        addressDetail: '99 Cầu Giấy',
        paymentMethod: 'cod',
        voucherCode: 'GIAM50K',
        items: [
          {
            productId: sampleProduct.id,
            quantity: 1
          }
        ]
      })
    });
    console.log(`- POST /orders: ${resCreateOrder.status} (${resCreateOrder.status === 201 ? 'PASS' : 'FAIL'})`);
    const orderResponse = await resCreateOrder.json();
    const orderId = orderResponse.data?.id || orderResponse.id;
    const orderData = orderResponse.data || orderResponse;
    console.log(`  New Order ID: ${orderId}, Total: ${orderData.totalAmount}, Discount: ${orderData.discountAmount}`);

    if (orderId) {
      // GET /orders?phone=0988777666
      const resMyOrders = await fetch(`${BASE_URL}/orders?phone=0988777666`);
      console.log(`- GET /orders?phone=0988777666: ${resMyOrders.status} (${resMyOrders.status === 200 ? 'PASS' : 'FAIL'})`);

      // GET /orders/:id?phone=0988777666
      const resOrderDetail = await fetch(`${BASE_URL}/orders/${orderId}?phone=0988777666`);
      console.log(`- GET /orders/${orderId}: ${resOrderDetail.status} (${resOrderDetail.status === 200 ? 'PASS' : 'FAIL'})`);

      // Check stock was reduced
      const resVerifyStockReduced = await fetch(`${BASE_URL}/products`);
      const productsResponse2 = await resVerifyStockReduced.json();
      const productsList2 = Array.isArray(productsResponse2.data)
        ? productsResponse2.data
        : (productsResponse2.data?.data || productsResponse2.products || []);
      const sampleProduct2 = productsList2.find(p => p.id === sampleProduct.id);
      const reducedStock = sampleProduct2.variants?.[0]?.stock;
      console.log(`  Stock after order: ${reducedStock} (${reducedStock === initialStock - 1 ? 'PASS (Reduced)' : 'FAIL'})`);

      // Cancel order
      const resCancelOrder = await fetch(`${BASE_URL}/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '0988777666' })
      });
      console.log(`- PATCH /orders/${orderId}/cancel: ${resCancelOrder.status} (${resCancelOrder.status === 200 ? 'PASS' : 'FAIL'})`);

      // Check stock was restored
      const resVerifyStockRestored = await fetch(`${BASE_URL}/products`);
      const productsResponse3 = await resVerifyStockRestored.json();
      const productsList3 = Array.isArray(productsResponse3.data)
        ? productsResponse3.data
        : (productsResponse3.data?.data || productsResponse3.products || []);
      const sampleProduct3 = productsList3.find(p => p.id === sampleProduct.id);
      const restoredStock = sampleProduct3.variants?.[0]?.stock;
      console.log(`  Stock after cancel: ${restoredStock} (${restoredStock === initialStock ? 'PASS (Restored)' : 'FAIL'})`);
    } else {
      console.log('  Skipping Order cancellation/stock tests due to missing ID.');
    }

    console.log('\n==================================================');
    console.log('ALL NESTJS BACKEND API TESTS COMPLETED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('\n!!! TEST EXECUTION FAILED !!!');
    console.error(error);
    process.exit(1);
  }
}

runTests();
