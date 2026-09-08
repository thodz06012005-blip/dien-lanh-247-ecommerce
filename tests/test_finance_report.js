const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_URL || 'http://localhost:3001/api/v1';
const dbPath = path.join(__dirname, '../mock-api/mock-db.json');
const original = fs.readFileSync(dbPath, 'utf8');

async function request(method, endpoint, body, token) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const contentType = response.headers.get('content-type') || '';
  return { status: response.status, data: contentType.includes('json') ? await response.json() : await response.text() };
}

async function run() {
  try {
    const login = await request('POST', '/admin/auth/login', { email: 'owner@dienlanh247.vn', password: 'Admin@123' });
    if (login.status !== 200) throw new Error(`Owner login failed: ${login.status}`);
    const token = login.data.data.token;
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    db.serviceRequests.push({ id: 'SR-FIN-TEST', customerName: 'Khách kiểm thử', applianceType: 'Điều hòa', status: 'completed', assignedTechnicianId: 'TECH-001', finalPrice: 1000000, partsCost: 200000, amountCollected: 400000, paymentStatus: 'partial', completedAt: '2026-09-05T10:00:00.000Z', updatedAt: '2026-09-05T10:00:00.000Z' });
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    const report = await request('GET', '/admin/finance/report?month=2026-09', null, token);
    if (report.status !== 200 || report.data.data.totals.revenue !== 1000000 || report.data.data.totals.collected !== 400000 || report.data.data.totals.debt !== 600000 || report.data.data.totals.technicianPay !== 320000 || report.data.data.totals.estimatedProfit !== 480000) throw new Error('Finance totals are incorrect');
    const update = await request('PATCH', '/admin/finance/requests/SR-FIN-TEST', { partsCost: 250000, amountCollected: 1000000, paymentStatus: 'paid', note: 'Đã nhận chuyển khoản' }, token);
    if (update.status !== 200) throw new Error('Finance update failed');
    const settlement = await request('PATCH', '/admin/finance/requests/SR-FIN-TEST/settlement', { status: 'settled' }, token);
    if (settlement.status !== 200) throw new Error('Settlement failed');
    const audit = await request('GET', '/admin/finance/audit-logs?month=2026-09', null, token);
    if (audit.status !== 200 || audit.data.data.length !== 2) throw new Error('Finance audit log failed');
    const exported = await request('GET', '/admin/finance/export?month=2026-09', null, token);
    if (exported.status !== 200 || !exported.data.includes('SR-FIN-TEST')) throw new Error('Excel export failed');
    console.log('FINANCE REPORT, SETTLEMENT, AUDIT AND EXCEL TESTS PASSED');
  } finally {
    fs.writeFileSync(dbPath, original);
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
