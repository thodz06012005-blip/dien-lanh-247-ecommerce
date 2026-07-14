import assert from 'node:assert/strict';

const baseUrl = process.env.PHASE6_API_URL || 'http://127.0.0.1:3000/api/v1';
const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@dienlanh247.vn';
const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Phase6SecureSeed123!';

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  return { response, payload };
}

function dataOf(payload) {
  if (payload?.data?.data) return payload.data.data;
  return payload?.data ?? payload;
}

function messageOf(payload) {
  return payload?.message || payload?.data?.message || payload?.error?.message || '';
}

function extractCookie(response) {
  const values = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie') || ''];
  const access = values.join(',').match(/accessToken=([^;]+)/);
  assert.ok(access, 'Admin login must set the HttpOnly accessToken cookie');
  return `accessToken=${access[1]}`;
}

const createPayload = {
  customerName: 'Khách hàng kiểm thử Giai đoạn 6',
  customerPhone: '0912345678',
  customerEmail: 'phase6.customer@example.com',
  customerAddress: 'Số 12 đường Cầu Giấy, phường Dịch Vọng',
  district: 'Quận Cầu Giấy',
  applianceType: 'Điều hòa Daikin Inverter 12000 BTU',
  serviceCategoryId: 'sua-dieu-hoa',
  issueDescription: 'Điều hòa không làm lạnh và có tiếng kêu bất thường khi vận hành.',
  priority: 'high',
  preferredDate: '2027-01-15',
  preferredTimeSlot: '08:00 - 10:00',
  note: 'Gọi trước khi đến 30 phút.',
};

console.log('1. Creating a public service request...');
const created = await request('/service-requests', {
  method: 'POST',
  body: JSON.stringify(createPayload),
});
assert.equal(created.response.status, 201, messageOf(created.payload));
const createdData = dataOf(created.payload);
const code = createdData.code || createdData.id;
assert.match(code, /^DL247-\d{6}-[A-F0-9]{6}$/);
assert.equal(createdData.status, 'NEW');

console.log('2. Verifying privacy-safe lookup...');
const lookup = await request('/service-requests/lookup', {
  method: 'POST',
  body: JSON.stringify({ code, phone: createPayload.customerPhone }),
});
assert.equal(lookup.response.status, 201, messageOf(lookup.payload));
const lookupData = dataOf(lookup.payload);
assert.equal(lookupData.code, code);
assert.equal(lookupData.status, 'NEW');
assert.notEqual(lookupData.customerPhone, createPayload.customerPhone);
assert.notEqual(lookupData.customerEmail, createPayload.customerEmail);
assert.equal('customerAddress' in lookupData, false);
assert.equal(JSON.stringify(lookupData).includes(createPayload.customerAddress), false);

console.log('3. Rejecting lookup with a wrong phone...');
const wrongLookup = await request('/service-requests/lookup', {
  method: 'POST',
  body: JSON.stringify({ code, phone: '0987654321' }),
});
assert.equal(wrongLookup.response.status, 404);

console.log('4. Signing in as an administrator...');
const login = await request('/admin/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email: adminEmail, password: adminPassword }),
});
assert.equal(login.response.status, 200, messageOf(login.payload));
const cookie = extractCookie(login.response);

const adminPatch = (status, extra = {}) => request(`/admin/service-requests/${encodeURIComponent(code)}/status`, {
  method: 'PATCH',
  headers: { Cookie: cookie },
  body: JSON.stringify({ status, note: `Integration test -> ${status}`, ...extra }),
});

console.log('5. Blocking an invalid NEW -> COMPLETED shortcut...');
const invalidNewCompleted = await adminPatch('COMPLETED', { finalPrice: 450000 });
assert.equal(invalidNewCompleted.response.status, 400);

console.log('6. Running the valid workflow through completion...');
assert.equal((await adminPatch('CONFIRMED')).response.status, 200);

const assigned = await request(`/admin/service-requests/${encodeURIComponent(code)}/assign-technician`, {
  method: 'PATCH',
  headers: { Cookie: cookie },
  body: JSON.stringify({ technicianId: 'TECH-001' }),
});
assert.equal(assigned.response.status, 200, messageOf(assigned.payload));

const invalidAssignedCompleted = await adminPatch('COMPLETED', { finalPrice: 450000 });
assert.equal(invalidAssignedCompleted.response.status, 400);
assert.equal((await adminPatch('IN_PROGRESS')).response.status, 200);
assert.equal((await adminPatch('WAITING_PARTS')).response.status, 200);
assert.equal((await adminPatch('IN_PROGRESS')).response.status, 200);
assert.equal((await adminPatch('COMPLETED', { finalPrice: 450000 })).response.status, 200);
assert.equal((await adminPatch('WARRANTY')).response.status, 200);
assert.equal((await adminPatch('CLOSED')).response.status, 200);

console.log('7. Verifying timeline, audit and terminal-state protection...');
const adminDetail = await request(`/admin/service-requests/${encodeURIComponent(code)}`, {
  headers: { Cookie: cookie },
});
assert.equal(adminDetail.response.status, 200, messageOf(adminDetail.payload));
const detail = dataOf(adminDetail.payload);
assert.equal(detail.status, 'CLOSED');
assert.ok(detail.timeline.length >= 8, 'Expected normalized status timeline');
assert.ok(detail.audits.length >= 8, 'Expected database audit events');
assert.deepEqual(detail.allowedTransitions, []);
assert.equal((await adminPatch('IN_PROGRESS')).response.status, 400);

console.log('8. Confirming admin list receives the request immediately...');
const list = await request(`/admin/service-requests?q=${encodeURIComponent(code)}`, {
  headers: { Cookie: cookie },
});
assert.equal(list.response.status, 200, messageOf(list.payload));
const listPayload = list.payload?.data ?? list.payload;
const rows = listPayload?.data ?? [];
assert.equal(rows.some((row) => row.id === code), true);

console.log(`Phase 6 service-request integration passed for ${code}.`);
