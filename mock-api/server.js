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
const { checkLoginRateLimit, recordLoginFailure, recordLoginSuccess } = require('./utils/rateLimit');
const { auditSuccess, auditFailure, auditRateLimited } = require('./utils/auditLog');
const SERVICE_ONLY = process.env.SERVICE_ONLY !== 'false';

const publicServiceRoutes = require('./routes/publicService');
const { router: serviceRequestRouter, updateTechnicianStatusAfterJobChange } = require('./routes/serviceRequests');
const { adminUsers, adminSessions, requireAdminAuth, isDemoAccountsEnabled, parseCookies } = require('./utils/auth');
const technicianRouter = require('./routes/technicians');
const ordersRouter = SERVICE_ONLY ? null : require('./routes/orders');
const adminProductsRouter = SERVICE_ONLY ? null : require('./routes/adminProducts');
const publicCommerceRoutes = SERVICE_ONLY ? null : require('./routes/public');
const adminDashboardRouter = require('./routes/adminDashboard');
const adminCustomersRouter = require('./routes/adminCustomers');
const adminSettingsRouter = require('./routes/adminSettings');
const adminFinanceRouter = require('./routes/adminFinance');
const technicianPortalRouter = require('./routes/technicianPortal');
const { router: customerAuthRouter } = require('./routes/customerAuth');
const contactRouter = require('./routes/contact');
const devRouter = require('./routes/dev');
const auditLogsRouter = require('./routes/auditLogs');

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
const JSON_LIMIT = process.env.MOCK_JSON_BODY_LIMIT || '1mb';
const URLENCODED_LIMIT = process.env.MOCK_URLENCODED_BODY_LIMIT || '100kb';

// Reject retired commerce before body parsing so every method has the same 404 contract.
app.use((req, res, next) => {
  res.setHeader('X-DL247-Backend', 'MOCK');
  res.setHeader('X-DL247-Service-Only', String(SERVICE_ONLY));
  if (SERVICE_ONLY && /^\/api\/v1\/(products|categories|brands|cart|orders|admin\/products|admin\/orders)(\/|$)/.test(req.path)) {
    return respondError(res, 404, 'Tính năng thương mại điện tử không hoạt động trong bản phát hành dịch vụ', 'FEATURE_DISABLED');
  }
  next();
});

// Custom Security Headers Middleware (Plan 18 Hardening)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:3001 http://localhost:3000 ws://localhost:3001 ws://localhost:3000 http://127.0.0.1:3001 http://127.0.0.1:3000 ws://127.0.0.1:3001 ws://127.0.0.1:3000;");
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  next();
});

// 1. Content-Type Guard for POST/PATCH/PUT (checked BEFORE parsing body to avoid parsing unapproved content types)
app.use((req, res, next) => {
  const method = req.method;
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const contentType = req.headers['content-type'];
    const contentLength = req.headers['content-length'];
    if (contentLength === '0') {
      return next();
    }
    if (!contentType || !contentType.toLowerCase().startsWith('application/json')) {
      return res.status(415).json({
        success: false,
        message: 'Unsupported content type'
      });
    }
  }
  next();
});

app.use(express.json({ limit: JSON_LIMIT }));
app.use(express.urlencoded({ extended: false, limit: URLENCODED_LIMIT }));
app.use('/api/v1', publicServiceRoutes);
if (publicCommerceRoutes) app.use('/api/v1', publicCommerceRoutes);
app.use('/api/v1', serviceRequestRouter);
app.use('/api/v1', technicianRouter);
app.use('/api/v1', technicianPortalRouter);
if (!SERVICE_ONLY) {
  app.use('/api/v1', ordersRouter);
  app.use('/api/v1', adminProductsRouter);
}
app.use('/api/v1', adminDashboardRouter);
app.use('/api/v1', adminCustomersRouter);
app.use('/api/v1', adminSettingsRouter);
app.use('/api/v1', adminFinanceRouter);
app.use('/api/v1', customerAuthRouter);
app.use('/api/v1', contactRouter);
app.use('/api/v1', devRouter);
app.use('/api/v1', auditLogsRouter);

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
        <li>Chế độ backend: <strong>MOCK</strong></li>
        <li>Phạm vi phát hành: <strong>${SERVICE_ONLY ? 'SERVICE ONLY' : 'FULL (service + ecommerce)'}</strong></li>
        <li>Danh mục dịch vụ: <a href="/api/v1/service-categories" style="color: #2563eb; text-decoration: none;">/api/v1/service-categories</a></li>
      </ul>
    </div>
  `);
});// Mounted via devRouter handles dev/reset-db route.

// Mounted via ordersRouter.

// Mounted via contactRouter and customerAuthRouter.

// ----------------------------------------------------
// 3. ADMIN AUTH ENDPOINTS
// ----------------------------------------------------
const adminCookieOptions = {
  access: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/v1/admin', maxAge: 30 * 60 * 1000 },
  refresh: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/v1/admin/auth/refresh', maxAge: 7 * 24 * 60 * 60 * 1000 }
};
const issueAdminSession = (adminId) => {
  const session = {
    token: 'admin_access_' + crypto.randomBytes(16).toString('hex'),
    refreshToken: 'admin_refresh_' + crypto.randomBytes(24).toString('hex'),
    adminId,
    expiresAt: Date.now() + 30 * 60 * 1000,
    refreshExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  };
  adminSessions.push(session);
  return session;
};
const setAdminCookies = (res, session) => {
  res.cookie('admin_access', session.token, adminCookieOptions.access);
  res.cookie('admin_refresh', session.refreshToken, adminCookieOptions.refresh);
};
const clearAdminCookies = (res) => {
  res.clearCookie('admin_access', { ...adminCookieOptions.access, maxAge: undefined });
  res.clearCookie('admin_refresh', { ...adminCookieOptions.refresh, maxAge: undefined });
};

app.get('/api/v1/dev/demo-credentials', (req, res) => {
  if (!isDemoAccountsEnabled()) return respondError(res, 404, 'Not Found', 'NOT_FOUND');
  const owner = adminUsers.find(user => user.role === 'superadmin');
  if (!owner) return respondError(res, 404, 'Not Found', 'NOT_FOUND');
  return respondSuccess(res, { email: owner.email, password: owner.password }, 'Thông tin đăng nhập thử nghiệm');
});

app.post('/api/v1/admin/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return respondError(res, 400, 'Vui lòng nhập đầy đủ email và mật khẩu', 'MISSING_CREDENTIALS');
  const normalizedEmail = email.trim().toLowerCase();
  const rateLimitResult = checkLoginRateLimit(req, normalizedEmail);
  if (rateLimitResult.locked) {
    auditRateLimited(req, 'AUTH_LOGIN_RATE_LIMITED', 'auth', null, { email: normalizedEmail }, 'Admin login blocked due to rate limit');
    return res.status(429).json({ success: false, message: 'Too many login attempts. Please try again later.', retryAfterSeconds: rateLimitResult.retryAfterSeconds });
  }
  const admin = adminUsers.find(user => user.email.toLowerCase() === normalizedEmail && user.password === password && user.status === 'active');
  if (!admin) {
    recordLoginFailure(req, normalizedEmail);
    auditFailure(req, 'AUTH_LOGIN_FAILED', 'auth', null, { email: normalizedEmail }, 'Admin login failed');
    return respondError(res, 401, 'Email hoặc mật khẩu không chính xác', 'INVALID_CREDENTIALS');
  }
  recordLoginSuccess(req, normalizedEmail);
  auditSuccess(req, 'AUTH_LOGIN_SUCCESS', 'auth', admin.id, { email: normalizedEmail }, 'Admin login successful');
  const session = issueAdminSession(admin.id);
  setAdminCookies(res, session);
  const { password: _, ...adminSafe } = admin;
  return respondSuccess(res, { admin: adminSafe, token: session.token, expiresAt: session.expiresAt }, 'Đăng nhập thành công');
});

app.post('/api/v1/admin/auth/refresh', (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const index = adminSessions.findIndex(session => session.refreshToken === cookies.admin_refresh);
  const current = index >= 0 ? adminSessions[index] : null;
  if (!current || Date.now() > current.refreshExpiresAt) {
    if (index >= 0) adminSessions.splice(index, 1);
    clearAdminCookies(res);
    return respondError(res, 401, 'Phiên làm việc đã hết hạn', 'INVALID_REFRESH_TOKEN');
  }
  adminSessions.splice(index, 1);
  const replacement = issueAdminSession(current.adminId);
  setAdminCookies(res, replacement);
  return respondSuccess(res, { expiresAt: replacement.expiresAt }, 'Làm mới phiên quản trị thành công');
});

app.get('/api/v1/admin/auth/me', requireAdminAuth, (req, res) => {
  const { password: _, ...adminSafe } = req.admin;
  return respondSuccess(res, { admin: adminSafe }, 'Lấy thông tin admin thành công');
});

app.post('/api/v1/admin/auth/logout', (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const sessionIndex = adminSessions.findIndex(session => session.token === cookies.admin_access || session.refreshToken === cookies.admin_refresh);
  const session = sessionIndex >= 0 ? adminSessions[sessionIndex] : null;
  if (sessionIndex >= 0) adminSessions.splice(sessionIndex, 1);
  clearAdminCookies(res);
  auditSuccess(req, 'AUTH_LOGOUT', 'auth', session?.adminId || 'none', null, 'Admin logout successful');
  return respondSuccess(res, null, 'Đăng xuất thành công');
});

// ----------------------------------------------------
// 4. ADMIN PORTAL ENDPOINTS (frontend-admin) — Protected by requireAdminAuth
// ----------------------------------------------------

// Mounted via adminDashboardRouter, adminCustomersRouter, and adminSettingsRouter.

// Mounted via serviceRequestRouter.
// Mounted via technicianRouter.

// Global error handler for body parsing errors (payload too large or invalid JSON format)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload'
    });
  }
  if (err && err.status === 413) {
    return res.status(413).json({
      success: false,
      message: 'Payload too large'
    });
  }
  // Generic error fallback
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Mock API Server is running on http://localhost:${PORT}`);
  console.log(`Healthcheck URL: http://localhost:${PORT}/api/v1/health`);
  readDB();
});
