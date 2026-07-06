const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const {
  VALID_SERVICE_STATUSES,
  VALID_SERVICE_PRIORITIES,
  VALID_TECHNICIAN_STATUSES,
  VALID_ORDER_STATUSES,
  VALID_PAYMENT_STATUSES,
  VALID_PAYMENT_METHODS,
  ACTIVE_SERVICE_REQUEST_STATUSES
} = require('./constants');

const { readDB, writeDB, setInitialDataGenerator } = require('./utils/db');
const { respondSuccess, respondCreated, respondError } = require('./utils/response');
const { isValidPhone, isValidEmail, slugify } = require('./utils/validators');

const { getInitialData } = require('./seed/initialData');

const publicRoutes = require('./routes/public');
const { router: serviceRequestRouter, updateTechnicianStatusAfterJobChange } = require('./routes/serviceRequests');
const { adminUsers, adminSessions, requireAdminAuth, isDemoAccountsEnabled } = require('./utils/auth');
const technicianRouter = require('./routes/technicians');
const ordersRouter = require('./routes/orders');
const adminProductsRouter = require('./routes/adminProducts');
const adminDashboardRouter = require('./routes/adminDashboard');
const adminCustomersRouter = require('./routes/adminCustomers');
const adminSettingsRouter = require('./routes/adminSettings');
const customerAuthRouter = require('./routes/customerAuth');
const contactRouter = require('./routes/contact');
const devRouter = require('./routes/dev');

const app = express();
const PORT = process.env.PORT || 3001;

const corsOriginsEnv = process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS;
const allowedOrigins = corsOriginsEnv
  ? corsOriginsEnv.split(',').map(o => o.trim()).filter(o => o.length > 0)
  : [
      'http://localhost:5174',
      'http://localhost:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5173'
    ];

app.use(cors({
  origin: function (origin, callback) {
    // If request has no origin (like curl or server-to-server), allow it
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Do not throw an Error object to avoid express 500 error logs / stack traces.
      // Deny by passing false.
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With', 'Cookie']
}));
app.use(express.json());
app.use('/api/v1', publicRoutes);
app.use('/api/v1', serviceRequestRouter);
app.use('/api/v1', technicianRouter);
app.use('/api/v1', ordersRouter);
app.use('/api/v1', adminProductsRouter);
app.use('/api/v1', adminDashboardRouter);
app.use('/api/v1', adminCustomersRouter);
app.use('/api/v1', adminSettingsRouter);
app.use('/api/v1', customerAuthRouter);
app.use('/api/v1', contactRouter);
app.use('/api/v1', devRouter);

setInitialDataGenerator(getInitialData);

// Removed old auth users, sessions, requireAdminAuth, and updateTechnicianStatusAfterJobChange. Imported from utils/auth and routes/serviceRequests instead.

// Initial data generator registered above.
// Initial data generator registered above.

// Adapters to map mock-db standardized model to customer frontend (frontend-user) formats
const mapProductToUser = (p) => {
  // Convert specifications format: array of {name, value} -> object Record<string, string>
  const specificationsObj = {};
  if (Array.isArray(p.specifications)) {
    p.specifications.forEach(spec => {
      specificationsObj[spec.name] = spec.value;
    });
  } else if (p.specifications && typeof p.specifications === 'object') {
    Object.assign(specificationsObj, p.specifications);
  }

  // Convert images to [{url: ...}] format
  const imagesCompat = p.images.map(img => {
    if (typeof img === 'string') return { url: img };
    return img;
  });

  return {
    ...p,
    inStock: p.stock > 0 && p.status === 'active',
    quantity: p.stock, // frontend-user calls stock "quantity"
    specifications: specificationsObj,
    images: imagesCompat
  };
};

// ----------------------------------------------------
// 1. SYSTEM / UTILITY ENDPOINTS
// ----------------------------------------------------

// GET /
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <h1 style="color: #2563eb;">Điện Lạnh 247 Mock API Server</h1>
      <p style="color: #475569;">Mock API đang chạy thành công trên cổng <strong>3001</strong>.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <h3 style="color: #0f172a;">Các đường dẫn kiểm tra nhanh:</h3>
      <ul style="line-height: 1.8;">
        <li>Kiểm tra sức khỏe hệ thống: <a href="/api/v1/health" style="color: #2563eb; text-decoration: none;">/api/v1/health</a></li>
        <li>Danh sách sản phẩm mẫu: <a href="/api/v1/products" style="color: #2563eb; text-decoration: none;">/api/v1/products</a></li>
        <li>Danh mục sản phẩm: <a href="/api/v1/categories" style="color: #2563eb; text-decoration: none;">/api/v1/categories</a></li>
        <li>Thương hiệu sản phẩm: <a href="/api/v1/brands" style="color: #2563eb; text-decoration: none;">/api/v1/brands</a></li>
      </ul>
    </div>
  `);
});// Mounted via devRouter handles dev/reset-db route.

// Mounted via ordersRouter.

// Mounted via contactRouter and customerAuthRouter.

// ----------------------------------------------------
// 3. ADMIN AUTH ENDPOINTS (Security-1B)
// ----------------------------------------------------

// POST /admin/auth/login
app.post('/api/v1/admin/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return respondError(res, 400, 'Vui lòng nhập đầy đủ email và mật khẩu', 'MISSING_CREDENTIALS');
  }

  const demoEmails = ['admin@dienlanh247.vn', 'staff@dienlanh247.vn'];
  const isDefaultOwner = email === 'owner@dienlanh247.vn' && password === 'Admin@123';
  if ((demoEmails.includes(email) || isDefaultOwner) && !isDemoAccountsEnabled()) {
    return respondError(res, 401, 'Email hoặc mật khẩu không chính xác', 'INVALID_CREDENTIALS');
  }

  const admin = adminUsers.find(u => u.email === email && u.password === password && u.status === 'active');

  if (!admin) {
    return respondError(res, 401, 'Email hoặc mật khẩu không chính xác', 'INVALID_CREDENTIALS');
  }

  // Generate dynamic token using crypto
  const token = 'admin_tok_' + crypto.randomBytes(16).toString('hex');
  const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes

  // Store session in memory
  adminSessions.push({
    token,
    adminId: admin.id,
    expiresAt
  });

  // Return admin info without password
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 60 * 1000 // 30 minutes
  });

  const { password: _, ...adminSafe } = admin;
  return respondSuccess(res, {
    admin: adminSafe,
    token,
    expiresAt
  }, 'Đăng nhập thành công');
});

// GET /admin/auth/me
app.get('/api/v1/admin/auth/me', requireAdminAuth, (req, res) => {
  const { password: _, ...adminSafe } = req.admin;
  return respondSuccess(res, { admin: adminSafe }, 'Lấy thông tin admin thành công');
});

// POST /admin/auth/logout
app.post('/api/v1/admin/auth/logout', (req, res) => {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers.cookie) {
    const { parseCookies } = require('./utils/auth');
    const cookies = parseCookies(req.headers.cookie);
    token = cookies['accessToken'];
  }

  if (token) {
    const index = adminSessions.findIndex(s => s.token === token);
    if (index !== -1) {
      adminSessions.splice(index, 1);
    }
  }

  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  return respondSuccess(res, null, 'Đăng xuất thành công');
});

// ----------------------------------------------------
// 4. ADMIN PORTAL ENDPOINTS (frontend-admin) — Protected by requireAdminAuth
// ----------------------------------------------------

// Mounted via adminDashboardRouter, adminCustomersRouter, and adminSettingsRouter.

// Mounted via serviceRequestRouter.
// Mounted via technicianRouter.

// Start Server
app.listen(PORT, () => {
  console.log(`Mock API Server is running on http://localhost:${PORT}`);
  console.log(`Healthcheck URL: http://localhost:${PORT}/api/v1/health`);
  readDB();
});
