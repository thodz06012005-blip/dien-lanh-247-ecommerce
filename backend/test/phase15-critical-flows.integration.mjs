import assert from 'node:assert/strict';

const baseUrl = process.env.PHASE15_API_URL || 'http://127.0.0.1:3000/api/v1';
const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin-phase15@example.test';
const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Phase15AdminFixture123';

class CookieJar {
  constructor() {
    this.values = new Map();
  }

  absorb(headers) {
    const cookies =
      typeof headers.getSetCookie === 'function'
        ? headers.getSetCookie()
        : [headers.get('set-cookie')].filter(Boolean);
    for (const cookie of cookies) {
      const [pair, ...attributes] = cookie.split(';');
      const separator = pair.indexOf('=');
      if (separator < 1) continue;
      const name = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      const expired = attributes.some((item) =>
        /max-age=0|expires=thu, 01 jan 1970/i.test(item),
      );
      if (expired || !value) this.values.delete(name);
      else this.values.set(name, value);
    }
  }

  header() {
    return Array.from(this.values.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }
}

async function api(path, { method = 'GET', body, jar } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (jar?.header()) headers.Cookie = jar.header();

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  jar?.absorb(response.headers);
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: response.status, json, headers: response.headers };
}

function futureDate(days = 2) {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function futureWindow(days = 2) {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + days);
  start.setUTCHours(1, 0, 0, 0); // 08:00 Asia/Bangkok
  const end = new Date(start);
  end.setUTCHours(end.getUTCHours() + 2);
  return { start: start.toISOString(), end: end.toISOString() };
}

const unique = Date.now();
const customerEmail = `phase15.customer.${unique}@example.test`;
const customerPhone = `09${String(unique).slice(-8)}`;
const customerPassword = 'Phase15Customer123';

const live = await api('/health/live');
assert.equal(live.status, 200);
assert.equal(live.json?.data?.status, 'ok');

const ready = await api('/health/ready');
assert.equal(ready.status, 200);
assert.equal(ready.json?.data?.checks?.database?.status, 'up');

const categories = await api('/service-categories');
assert.equal(categories.status, 200);
const categoryList = Array.isArray(categories.json?.data)
  ? categories.json.data
  : categories.json?.data?.data;
const category = categoryList?.find((item) => item.id === 'sua-dieu-hoa') || categoryList?.[0];
assert.ok(category?.id, 'service category seed is required');

const createRequest = await api('/service-requests', {
  method: 'POST',
  body: {
    customerName: 'Khách hàng nghiệm thu Phase 15',
    customerPhone,
    customerEmail,
    customerAddress: '12 Trần Thái Tông',
    district: 'Quận Cầu Giấy',
    serviceCategoryId: category.id,
    applianceType: 'Điều hòa treo tường',
    issueDescription: 'Điều hòa không lạnh, cần kiểm tra và báo giá trước khi sửa.',
    preferredDate: futureDate(),
    preferredTimeSlot: '08:00 - 10:00',
    priority: 'medium',
    note: 'E2E production acceptance flow',
  },
});
assert.equal(createRequest.status, 201);
const requestId = createRequest.json?.data?.code;
assert.match(requestId, /^DL247-/);

const customerJar = new CookieJar();
const register = await api('/auth/register', {
  method: 'POST',
  jar: customerJar,
  body: {
    email: customerEmail,
    password: customerPassword,
    firstName: 'Khách',
    lastName: 'Phase15',
    phone: customerPhone,
  },
});
assert.equal(register.status, 201);
assert.ok(customerJar.header().includes('accessToken='));

const forbiddenAdmin = await api('/admin/operations/overview', { jar: customerJar });
assert.equal(forbiddenAdmin.status, 403, 'customer must not bypass backend RBAC');

const adminJar = new CookieJar();
const adminLogin = await api('/admin/auth/login', {
  method: 'POST',
  jar: adminJar,
  body: { email: adminEmail, password: adminPassword },
});
assert.equal(adminLogin.status, 200);
assert.ok(adminJar.header().includes('adminAccessToken='));

const adminDetail = await api(`/admin/service-requests/${requestId}`, { jar: adminJar });
assert.equal(adminDetail.status, 200);
assert.equal(adminDetail.json?.data?.id, requestId);

const confirmed = await api(`/admin/service-requests/${requestId}/status`, {
  method: 'PATCH',
  jar: adminJar,
  body: { status: 'CONFIRMED', note: 'Đã xác nhận yêu cầu qua E2E' },
});
assert.equal(confirmed.status, 200);
assert.equal(confirmed.json?.data?.workflowStatus, 'CONFIRMED');

const schedule = futureWindow();
const dispatched = await api(`/admin/operations/requests/${requestId}/dispatch`, {
  method: 'POST',
  jar: adminJar,
  body: {
    technicianId: 'TECH-001',
    scheduledStart: schedule.start,
    scheduledEnd: schedule.end,
    reason: 'Phân công tự động trong nghiệm thu Phase 15',
  },
});
assert.equal(dispatched.status, 201);
assert.equal(dispatched.json?.data?.request?.assignedTechnicianId, 'TECH-001');

const started = await api(`/admin/service-requests/${requestId}/status`, {
  method: 'PATCH',
  jar: adminJar,
  body: { status: 'IN_PROGRESS', note: 'Kỹ thuật viên bắt đầu xử lý' },
});
assert.equal(started.status, 200);
assert.equal(started.json?.data?.workflowStatus, 'IN_PROGRESS');

const quote = await api(`/admin/operations/requests/${requestId}/quotes`, {
  method: 'POST',
  jar: adminJar,
  body: {
    lines: [
      {
        lineType: 'LABOR',
        description: 'Công kiểm tra và sửa chữa',
        quantity: 1,
        unit: 'lần',
        unitPrice: 350000,
        sortOrder: 0,
      },
      {
        lineType: 'MATERIAL',
        description: 'Tụ điều hòa thay thế',
        sku: 'CAP-P15',
        quantity: 1,
        unit: 'cái',
        unitPrice: 250000,
        sortOrder: 1,
      },
    ],
    discountType: 'FIXED',
    discountValue: 50000,
    taxRate: 0,
    notes: 'Báo giá nghiệm thu E2E',
  },
});
assert.equal(quote.status, 201);
const confirmationToken = quote.json?.data?.confirmationToken;
assert.ok(confirmationToken);
assert.equal(quote.json?.data?.totalAmount, 550000);

const accepted = await api('/operations/quotes/confirm', {
  method: 'POST',
  body: { token: confirmationToken, decision: 'ACCEPT', note: 'Khách hàng đồng ý' },
});
assert.equal(accepted.status, 201);
assert.equal(accepted.json?.data?.decision, 'ACCEPT');

const completion = await api(`/admin/operations/requests/${requestId}/completion`, {
  method: 'POST',
  jar: adminJar,
  body: {
    diagnosis: 'Tụ khởi động suy giảm, hệ thống lạnh hoạt động không ổn định.',
    workPerformed: 'Thay tụ, vệ sinh dàn lạnh và kiểm tra dòng vận hành.',
    materialsUsed: [{ sku: 'CAP-P15', quantity: 1 }],
    recommendations: 'Vệ sinh định kỳ mỗi 6 tháng.',
    customerName: 'Khách hàng nghiệm thu Phase 15',
    completedAt: new Date().toISOString(),
  },
});
assert.equal(completion.status, 201);
assert.equal(completion.json?.data?.status, 'COMPLETED');

const workspace = await api(`/admin/operations/requests/${requestId}`, { jar: adminJar });
assert.equal(workspace.status, 200);
assert.equal(workspace.json?.data?.request?.workflowStatus, 'COMPLETED');
assert.ok(workspace.json?.data?.completion?.reportNumber);
assert.equal(workspace.json?.data?.quotes?.[0]?.status, 'ACCEPTED');

const logout = await api('/admin/auth/logout', { method: 'POST', jar: adminJar });
assert.equal(logout.status, 200);
const afterLogout = await api('/admin/operations/overview', { jar: adminJar });
assert.equal(afterLogout.status, 401);

console.log('Phase 15 critical API flows passed.');
