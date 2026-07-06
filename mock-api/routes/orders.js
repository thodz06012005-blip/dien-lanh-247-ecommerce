const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../utils/db');
const { respondSuccess, respondCreated, respondError } = require('../utils/response');
const { requirePermission } = require('../utils/auth');
const { VALID_PAYMENT_METHODS } = require('../constants');
const {
  validateRequiredString,
  validateEnum,
  validatePaginationStrict,
  validateSortStrict,
  validateAllowedQueryKeys,
  validateSearchQuery,
  validateDateRangeQuery,
  sendValidationError
} = require('../utils/validation');

// Adapter to map mock-db standardized order model to customer frontend (frontend-user) formats
const mapOrderToUser = (o) => {
  // Convert address back to flat details
  return {
    id: o.id,
    customerName: o.customerName,
    phone: o.phone,
    email: o.email || '',
    city: o.address.province,
    district: o.address.district,
    addressDetail: o.address.detail,
    note: o.note || '',
    paymentMethod: o.paymentMethod.toLowerCase(),
    shippingFee: o.shippingFee,
    discountAmount: o.discount,
    totalAmount: o.total,
    status: o.status,
    items: o.items.map(item => ({
      productId: item.productId,
      name: item.name,
      sku: item.sku,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.thumbnail
    })),
    createdAt: new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(o.createdAt))
  };
};

// GET /admin/orders — requires: orders:read (superadmin, admin, staff)
router.get('/admin/orders', requirePermission('orders:read'), (req, res) => {
  const errors = [];
  
  validateAllowedQueryKeys(req.query, [
    'page', 'limit', 'q', 'search', 'status', 'paymentStatus', 'dateFrom', 'dateTo', 'sortBy', 'sortOrder'
  ], errors);
  
  validatePaginationStrict(req.query, errors);
  validateSortStrict(req.query, ['code', 'customerName', 'phone', 'total', 'status', 'paymentStatus', 'createdAt', 'updatedAt'], errors);
  
  if (req.query.q !== undefined) validateSearchQuery(req.query, 'q', errors, 100);
  if (req.query.search !== undefined) validateSearchQuery(req.query, 'search', errors, 100);
  if (req.query.status !== undefined) {
    validateEnum(req.query.status, ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'], 'status', errors, false);
  }
  if (req.query.paymentStatus !== undefined) {
    validateEnum(req.query.paymentStatus, ['paid', 'unpaid'], 'paymentStatus', errors, false);
  }
  validateDateRangeQuery(req.query, 'dateFrom', 'dateTo', errors);

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const db = readDB();
  return respondSuccess(res, db.orders);
});

// POST /orders (Place COD/Unpaid orders)
router.post('/orders', (req, res) => {
  const db = readDB();
  const body = req.body;
  if (body.phone && typeof body.phone === 'string') {
    body.phone = body.phone.replace(/\s+/g, '').trim();
  }

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return respondError(res, 400, 'Giỏ hàng rỗng', 'EMPTY_CART');
  }

  // 1. Validate all items first
  for (const item of body.items) {
    if (!item.productId || typeof item.productId !== 'string') {
      return respondError(res, 400, 'Mã sản phẩm không hợp lệ', 'INVALID_PRODUCT_ID');
    }
    
    // Validate quantity: must be an integer, greater than 0
    const qty = item.quantity;
    if (qty === undefined || qty === null || typeof qty !== 'number' || !Number.isInteger(qty) || qty <= 0) {
      return respondError(res, 400, 'Số lượng sản phẩm không hợp lệ', 'INVALID_QUANTITY');
    }

    const p = db.products.find(prod => prod.id === item.productId);
    if (!p) {
      return respondError(res, 404, `Sản phẩm không tồn tại`, 'PRODUCT_NOT_FOUND');
    }
    
    // Enforce active status
    if (p.status !== 'active') {
      return respondError(res, 400, `Sản phẩm ${p.name} hiện không hoạt động hoặc hết hàng`, 'PRODUCT_INACTIVE');
    }
    
    if (p.stock < qty || p.stock <= 0) {
      return respondError(res, 400, `Sản phẩm ${p.name} không đủ tồn kho (Còn lại ${p.stock})`, 'INSUFFICIENT_STOCK');
    }
  }

  // 2. Fetch data from DB, calculate subtotal and construct orderItems
  const orderItems = body.items.map(item => {
    const p = db.products.find(prod => prod.id === item.productId);
    const price = p.salePrice || p.basePrice;
    return {
      productId: p.id,
      name: p.name,
      sku: p.sku,
      thumbnail: p.thumbnail,
      price: price,
      quantity: item.quantity,
      total: price * item.quantity
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);

  // 3. Dynamic shipping fee calculation
  const settings = db.settings || {};
  const baseShippingFee = settings.shippingFee !== undefined ? settings.shippingFee : 30000;
  const threshold = settings.freeShippingThreshold !== undefined ? settings.freeShippingThreshold : 5000000;

  let shippingFee = 0;
  if (subtotal > 0 && subtotal < threshold) {
    // Check if there are large appliances in cart
    const hasLargeAppliance = orderItems.some((item) => {
      const p = db.products.find(prod => prod.id === item.productId);
      return ['dieu-hoa', 'tu-lanh', 'may-giat', 'may-say', 'tu-dong'].includes(p?.categoryId || '');
    });
    shippingFee = hasLargeAppliance ? 150000 : baseShippingFee;
  }

  // 4. Calculate discount from voucherCode (Do not trust client discountAmount)
  let discount = 0;
  if (body.voucherCode) {
    const vouchersList = [
      {
        code: 'DIENLANH247',
        discountType: 'percentage',
        value: 10,
        minOrderValue: 2000000,
        maxDiscount: 1000000
      },
      {
        code: 'GIAM50K',
        discountType: 'fixed',
        value: 50000,
        minOrderValue: 200000
      },
      {
        code: 'MIENPHIYENTAM',
        discountType: 'percentage',
        value: 100,
        minOrderValue: 5000000,
        maxDiscount: 200000
      }
    ];

    const v = vouchersList.find(voucher => voucher.code === body.voucherCode);
    if (v && subtotal >= v.minOrderValue) {
      if (v.discountType === 'percentage') {
        let calcDiscount = (subtotal * v.value) / 100;
        if (v.maxDiscount) {
          calcDiscount = Math.min(calcDiscount, v.maxDiscount);
        }
        discount = Math.min(calcDiscount, subtotal);
      } else if (v.discountType === 'fixed') {
        discount = Math.min(v.value, subtotal);
      }
    }
  }

  // 5. Calculate grand total, ensuring totalAmount cannot be negative
  const total = Math.max(0, subtotal + shippingFee - discount);

  // 6. Subtract stock after all validations pass
  body.items.forEach(item => {
    const p = db.products.find(prod => prod.id === item.productId);
    p.stock -= item.quantity;
    if (p.stock <= 0) {
      p.status = 'out_of_stock';
    }
    p.updatedAt = new Date().toISOString();
  });

  // 7. Validate paymentMethod
  const paymentMethodRaw = (body.paymentMethod || 'COD').toUpperCase().replace(/\s+/g, '');
  if (!VALID_PAYMENT_METHODS.includes(paymentMethodRaw)) {
    return respondError(res, 400, `Phương thức thanh toán không hợp lệ. Chỉ chấp nhận: ${VALID_PAYMENT_METHODS.join(', ')}`, 'INVALID_PAYMENT_METHOD');
  }

  // 8. Generate order details
  const orderCode = `DL247-${Math.floor(100000 + Math.random() * 900000)}`;
  const newOrder = {
    id: orderCode,
    code: orderCode,
    customerName: body.customerName,
    phone: body.phone,
    email: body.email || '',
    address: {
      province: body.city || '',
      district: body.district || '',
      detail: body.addressDetail || ''
    },
    note: body.note || '',
    items: orderItems,
    subtotal,
    shippingFee,
    discount,
    total,
    paymentMethod: paymentMethodRaw,
    paymentStatus: 'unpaid',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 8. Update customer stats
  const custIndex = db.customers.findIndex(c => c.phone === body.phone);
  if (custIndex !== -1) {
    db.customers[custIndex].orderCount += 1;
    db.customers[custIndex].totalSpent += total;
  } else {
    db.customers.push({
      id: `cust-${Date.now()}`,
      name: body.customerName,
      phone: body.phone,
      email: body.email || '',
      orderCount: 1,
      totalSpent: total,
      createdAt: new Date().toISOString()
    });
  }

  db.orders.unshift(newOrder);
  writeDB(db);

  return respondCreated(res, mapOrderToUser(newOrder), 'Đặt hàng thành công');
});

// GET /orders (Lọc theo phone)
router.get('/orders', (req, res) => {
  const db = readDB();
  const phone = req.query.phone;
  if (!phone || typeof phone !== 'string' || phone.trim() === '') {
    return respondSuccess(res, []);
  }
  const list = db.orders.filter(o => o.phone === phone.trim());
  return respondSuccess(res, list.map(mapOrderToUser));
});

// GET /orders/:id
router.get('/orders/:id', (req, res) => {
  const db = readDB();
  const rawPhone = req.query.phone;
  if (!rawPhone || typeof rawPhone !== 'string' || rawPhone.trim() === '') {
    return respondError(res, 400, 'Thiếu thông tin số điện thoại để xác thực', 'MISSING_PHONE');
  }
  const phone = rawPhone.replace(/\s+/g, '').trim();

  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) {
    return respondError(res, 404, 'Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND');
  }

  const orderPhone = (order.phone || '').replace(/\s+/g, '').trim();
  if (orderPhone !== phone) {
    return respondError(res, 403, 'Bạn không có quyền xem đơn hàng này', 'FORBIDDEN');
  }

  return respondSuccess(res, mapOrderToUser(order));
});

// PATCH /orders/:id/cancel (Customer cancels order)
router.patch('/orders/:id/cancel', (req, res) => {
  const db = readDB();
  const rawPhone = req.query.phone || (req.body && req.body.phone);
  if (!rawPhone || typeof rawPhone !== 'string' || rawPhone.trim() === '') {
    return respondError(res, 400, 'Thiếu thông tin số điện thoại để xác thực', 'MISSING_PHONE');
  }
  const phone = rawPhone.replace(/\s+/g, '').trim();

  const order = db.orders.find(o => o.id === req.params.id);

  if (!order) {
    return respondError(res, 404, 'Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND');
  }

  const orderPhone = (order.phone || '').replace(/\s+/g, '').trim();
  if (orderPhone !== phone) {
    return respondError(res, 403, 'Bạn không có quyền hủy đơn hàng này', 'FORBIDDEN');
  }

  if (order.status !== 'pending') {
    return respondError(res, 400, 'Chỉ có thể hủy đơn hàng ở trạng thái Chờ xác nhận', 'INVALID_ORDER_STATUS');
  }

  order.items.forEach(item => {
    const p = db.products.find(prod => prod.id === item.productId);
    if (p) {
      p.stock += item.quantity;
      if (p.status === 'out_of_stock' && p.stock > 0) {
        p.status = 'active';
      }
      p.updatedAt = new Date().toISOString();
    }
  });

  order.status = 'cancelled';
  order.cancelledAt = new Date().toISOString();
  order.updatedAt = new Date().toISOString();

  const cust = db.customers.find(c => c.phone === order.phone);
  if (cust) {
    cust.totalSpent = Math.max(0, cust.totalSpent - order.total);
    cust.orderCount = Math.max(0, cust.orderCount - 1);
  }

  writeDB(db);
  return respondSuccess(res, mapOrderToUser(order), 'Đã hủy đơn hàng thành công');
});



// GET /admin/orders/:id — requires: orders:read (superadmin, admin, staff)
router.get('/admin/orders/:id', requirePermission('orders:read'), (req, res) => {
  const errors = [];
  validateRequiredString(req.params.id, 'id', errors, 1, 50);
  
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if (order) {
    return respondSuccess(res, order);
  }
  return respondError(res, 404, 'Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND');
});

// PATCH /admin/orders/:id/status — requires: orders:update (superadmin, admin, staff)
router.patch('/admin/orders/:id/status', requirePermission('orders:update'), (req, res) => {
  const errors = [];
  validateRequiredString(req.params.id, 'id', errors, 1, 50);

  const { status, paymentStatus } = req.body;
  if (status !== undefined) {
    validateEnum(status, ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'], 'status', errors);
  }
  if (paymentStatus !== undefined) {
    validateEnum(paymentStatus, ['paid', 'unpaid'], 'paymentStatus', errors);
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const db = readDB();
  const id = req.params.id;
  const order = db.orders.find(o => o.id === id);

  if (!order) {
    return respondError(res, 404, 'Không tìm thấy đơn hàng', 'ORDER_NOT_FOUND');
  }

  const oldStatus = order.status;

  if (status && status !== oldStatus) {
    const orderWhitelist = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];
    if (!orderWhitelist.includes(status)) {
      return respondError(res, 400, 'Trạng thái đơn hàng không hợp lệ', 'INVALID_STATUS');
    }

    if (oldStatus === 'delivered' || oldStatus === 'cancelled') {
      return respondError(res, 400, 'Đơn hàng đã giao hoặc đã hủy không thể thay đổi trạng thái', 'INVALID_TRANSITION');
    }

    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['processing', 'cancelled'],
      'processing': ['shipping', 'cancelled'],
      'shipping': ['delivered']
    };

    if (validTransitions[oldStatus] && !validTransitions[oldStatus].includes(status)) {
      return respondError(res, 400, `Không thể chuyển trạng thái từ ${oldStatus} sang ${status}`, 'INVALID_TRANSITION');
    }

    if (status === 'cancelled') {
      order.items.forEach(item => {
        const p = db.products.find(prod => prod.id === item.productId);
        if (p) {
          p.stock += item.quantity;
          if (p.status === 'out_of_stock' && p.stock > 0) {
            p.status = 'active';
          }
          p.updatedAt = new Date().toISOString();
        }
      });
      order.cancelledAt = new Date().toISOString();
      
      const cust = db.customers.find(c => c.phone === order.phone);
      if (cust) {
        cust.totalSpent = Math.max(0, cust.totalSpent - order.total);
        cust.orderCount = Math.max(0, cust.orderCount - 1);
      }
    }

    if (oldStatus === 'cancelled' && status !== 'cancelled') {
      for (const item of order.items) {
        const p = db.products.find(prod => prod.id === item.productId);
        if (p && p.stock < item.quantity) {
          return respondError(res, 400, `Sản phẩm ${p.name} không đủ tồn kho để khôi phục đơn hàng`, 'INSUFFICIENT_STOCK');
        }
      }
      order.items.forEach(item => {
        const p = db.products.find(prod => prod.id === item.productId);
        if (p) {
          p.stock -= item.quantity;
          if (p.stock <= 0) {
            p.status = 'out_of_stock';
          }
          p.updatedAt = new Date().toISOString();
        }
      });
      
      const cust = db.customers.find(c => c.phone === order.phone);
      if (cust) {
        cust.totalSpent += order.total;
        cust.orderCount += 1;
      }
    }

    if (status === 'delivered') {
      order.deliveredAt = new Date().toISOString();
      order.paymentStatus = 'paid';
    }

    order.status = status;
  }

  if (paymentStatus) {
    order.paymentStatus = paymentStatus;
  }

  order.updatedAt = new Date().toISOString();
  writeDB(db);

  return respondSuccess(res, order, 'Cập nhật trạng thái đơn hàng thành công');
});

module.exports = router;
