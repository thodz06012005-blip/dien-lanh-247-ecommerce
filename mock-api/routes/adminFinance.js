const express = require('express');
const { readDB, writeDB } = require('../utils/db');
const { respondSuccess, respondError } = require('../utils/response');
const { requirePermission } = require('../utils/auth');

const router = express.Router();
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
const paymentStatuses = ['paid', 'unpaid', 'partial'];
const settlementStatuses = ['pending', 'settled'];

const requestDate = (request) => request.completedAt || request.updatedAt || request.createdAt || '';
const requestRevenue = (request) => Number(request.finalPrice || 0);
const requestPartsCost = (request) => Number(request.partsCost || 0);

function calculateTechnicianPay(request, finance) {
  const rate = Number(finance.technicianPayRate || 0);
  if (finance.technicianPayType === 'fixed') return Math.max(0, rate);
  const commissionBase = finance.includePartsInCommission
    ? requestRevenue(request)
    : Math.max(0, requestRevenue(request) - requestPartsCost(request));
  return Math.round(commissionBase * rate / 100);
}

function buildReport(db, month) {
  const finance = db.settings?.businessConfig?.finance || {};
  const technicians = new Map((db.technicians || []).map(item => [item.id, item]));
  const completed = (db.serviceRequests || [])
    .filter(item => item.status === 'completed' && requestDate(item).startsWith(month))
    .map(item => {
      const revenue = requestRevenue(item);
      const partsCost = requestPartsCost(item);
      const technicianPay = calculateTechnicianPay(item, finance);
      const collected = item.paymentStatus === 'paid'
        ? revenue
        : item.paymentStatus === 'partial' ? Math.min(revenue, Number(item.amountCollected || 0)) : 0;
      return {
        id: item.id,
        completedAt: requestDate(item),
        customerName: item.customerName,
        applianceType: item.applianceType || 'Dịch vụ khác',
        technicianId: item.assignedTechnicianId || null,
        technicianName: technicians.get(item.assignedTechnicianId)?.name || 'Chưa xác định',
        revenue,
        collected,
        debt: Math.max(0, revenue - collected),
        partsCost,
        technicianPay,
        estimatedProfit: revenue - partsCost - technicianPay,
        paymentStatus: item.paymentStatus || 'unpaid',
        settlementStatus: item.technicianSettlementStatus || 'pending'
      };
    });

  const totals = completed.reduce((sum, item) => ({
    revenue: sum.revenue + item.revenue,
    collected: sum.collected + item.collected,
    debt: sum.debt + item.debt,
    partsCost: sum.partsCost + item.partsCost,
    technicianPay: sum.technicianPay + item.technicianPay,
    estimatedProfit: sum.estimatedProfit + item.estimatedProfit
  }), { revenue: 0, collected: 0, debt: 0, partsCost: 0, technicianPay: 0, estimatedProfit: 0 });

  const group = (key, labelKey) => Array.from(completed.reduce((map, item) => {
    const id = item[key] || 'unknown';
    const current = map.get(id) || { id, label: item[labelKey] || id, jobs: 0, revenue: 0, collected: 0, technicianPay: 0, estimatedProfit: 0 };
    current.jobs += 1; current.revenue += item.revenue; current.collected += item.collected; current.technicianPay += item.technicianPay; current.estimatedProfit += item.estimatedProfit;
    map.set(id, current); return map;
  }, new Map()).values()).sort((a, b) => b.revenue - a.revenue);

  const byDay = Array.from(completed.reduce((map, item) => {
    const day = item.completedAt.slice(0, 10);
    const current = map.get(day) || { date: day, revenue: 0, collected: 0, jobs: 0 };
    current.revenue += item.revenue; current.collected += item.collected; current.jobs += 1; map.set(day, current); return map;
  }, new Map()).values()).sort((a, b) => a.date.localeCompare(b.date));

  return {
    month,
    recognitionPolicy: finance.revenueRecognition || 'completed',
    totals: { ...totals, jobs: completed.length },
    byDay,
    byTechnician: group('technicianId', 'technicianName'),
    byService: group('applianceType', 'applianceType'),
    requests: completed.sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
    generatedAt: new Date().toISOString()
  };
}

function validMonth(value) {
  return typeof value === 'string' && monthPattern.test(value);
}

router.get('/admin/finance/report', requirePermission('finance:read'), (req, res) => {
  const month = String(req.query.month || new Date().toISOString().slice(0, 7));
  if (!validMonth(month)) return respondError(res, 400, 'Tháng báo cáo không hợp lệ', 'INVALID_MONTH');
  return respondSuccess(res, buildReport(readDB(), month));
});

router.patch('/admin/finance/requests/:id', requirePermission('finance:update'), (req, res) => {
  const db = readDB();
  const request = (db.serviceRequests || []).find(item => item.id === req.params.id);
  if (!request || request.status !== 'completed') return respondError(res, 404, 'Không tìm thấy dịch vụ đã hoàn thành', 'REQUEST_NOT_FOUND');
  const partsCost = Number(req.body?.partsCost);
  const amountCollected = Number(req.body?.amountCollected);
  const paymentStatus = req.body?.paymentStatus;
  const note = String(req.body?.note || '').trim();
  if (!Number.isFinite(partsCost) || partsCost < 0 || !Number.isFinite(amountCollected) || amountCollected < 0 || amountCollected > requestRevenue(request) || !paymentStatuses.includes(paymentStatus)) return respondError(res, 400, 'Thông tin tài chính không hợp lệ', 'INVALID_FINANCE_DATA');
  if (paymentStatus === 'paid' && amountCollected !== requestRevenue(request)) return respondError(res, 400, 'Số tiền đã thu phải bằng doanh thu khi đánh dấu đã thanh toán', 'INVALID_COLLECTED_AMOUNT');
  if (paymentStatus === 'unpaid' && amountCollected !== 0) return respondError(res, 400, 'Công việc chưa thanh toán không thể có tiền đã thu', 'INVALID_COLLECTED_AMOUNT');

  const before = { partsCost: requestPartsCost(request), amountCollected: Number(request.amountCollected || 0), paymentStatus: request.paymentStatus || 'unpaid' };
  request.partsCost = partsCost; request.amountCollected = amountCollected; request.paymentStatus = paymentStatus; request.financeNote = note; request.updatedAt = new Date().toISOString();
  if (!db.financeAuditLogs) db.financeAuditLogs = [];
  db.financeAuditLogs.unshift({ id: `FIN-${Date.now()}`, requestId: request.id, action: 'UPDATE_FINANCIALS', before, after: { partsCost, amountCollected, paymentStatus }, note, actorId: req.admin.id, actorName: req.admin.name, createdAt: request.updatedAt });
  writeDB(db);
  return respondSuccess(res, request, 'Đã cập nhật số liệu tài chính');
});

router.patch('/admin/finance/requests/:id/settlement', requirePermission('finance:update'), (req, res) => {
  const status = req.body?.status;
  if (!settlementStatuses.includes(status)) return respondError(res, 400, 'Trạng thái đối soát không hợp lệ', 'INVALID_SETTLEMENT_STATUS');
  const db = readDB(); const request = (db.serviceRequests || []).find(item => item.id === req.params.id);
  if (!request || request.status !== 'completed') return respondError(res, 404, 'Không tìm thấy dịch vụ đã hoàn thành', 'REQUEST_NOT_FOUND');
  const previous = request.technicianSettlementStatus || 'pending'; const now = new Date().toISOString();
  request.technicianSettlementStatus = status; request.technicianSettledAt = status === 'settled' ? now : null; request.updatedAt = now;
  if (!db.financeAuditLogs) db.financeAuditLogs = [];
  db.financeAuditLogs.unshift({ id: `FIN-${Date.now()}`, requestId: request.id, action: 'UPDATE_SETTLEMENT', before: { status: previous }, after: { status }, note: String(req.body?.note || '').trim(), actorId: req.admin.id, actorName: req.admin.name, createdAt: now });
  writeDB(db); return respondSuccess(res, request, status === 'settled' ? 'Đã đối soát tiền công thợ' : 'Đã mở lại đối soát');
});

router.get('/admin/finance/audit-logs', requirePermission('finance:read'), (req, res) => {
  const month = String(req.query.month || '');
  const logs = (readDB().financeAuditLogs || []).filter(item => !month || item.createdAt.startsWith(month)).slice(0, 200);
  return respondSuccess(res, logs);
});

const xmlEscape = value => String(value ?? '').replace(/[<>&'\"]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char]));
router.get('/admin/finance/export', requirePermission('finance:read'), (req, res) => {
  const month = String(req.query.month || new Date().toISOString().slice(0, 7));
  if (!validMonth(month)) return respondError(res, 400, 'Tháng báo cáo không hợp lệ', 'INVALID_MONTH');
  const report = buildReport(readDB(), month);
  const headings = ['Mã yêu cầu', 'Ngày hoàn thành', 'Khách hàng', 'Dịch vụ', 'Kỹ thuật viên', 'Doanh thu', 'Đã thu', 'Công nợ', 'Linh kiện', 'Công thợ', 'Lợi nhuận', 'Thanh toán', 'Đối soát'];
  const rows = report.requests.map(item => [item.id, item.completedAt.slice(0, 10), item.customerName, item.applianceType, item.technicianName, item.revenue, item.collected, item.debt, item.partsCost, item.technicianPay, item.estimatedProfit, item.paymentStatus, item.settlementStatus]);
  const rowXml = [headings, ...rows].map(row => `<Row>${row.map(value => `<Cell><Data ss:Type="${typeof value === 'number' ? 'Number' : 'String'}">${xmlEscape(value)}</Data></Cell>`).join('')}</Row>`).join('');
  const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Doanh thu ${xmlEscape(month)}"><Table>${rowXml}</Table></Worksheet></Workbook>`;
  res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="doi-soat-${month}.xls"`); return res.send(xml);
});

module.exports = router;
