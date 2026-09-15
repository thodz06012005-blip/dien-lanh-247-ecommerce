const express = require('express');
const { readDB, writeDB } = require('../utils/db');
const { respondSuccess, respondError } = require('../utils/response');
const { requirePermission } = require('../utils/auth');
const { paymentSummary, signedAmount, vietnamMonth } = require('../domain/finance');

const router = express.Router();
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
const settlementStatuses = ['pending', 'settled'];

function buildReport(db, month) {
  const technicians = new Map((db.technicians || []).map(item => [item.id, item]));
  const requests = new Map((db.serviceRequests || []).map(item => [item.id, item]));
  const allEntries = db.servicePaymentEntries || [];
  const snapshots = (db.serviceFinanceSnapshots || []).filter(item => vietnamMonth(item.completedAt) === month);
  const completed = snapshots.map(snapshot => {
    const request = requests.get(snapshot.serviceRequestId) || {};
    const summary = paymentSummary(snapshot.revenue, allEntries.filter(entry => entry.serviceRequestId === snapshot.serviceRequestId));
    return {
      id: snapshot.serviceRequestId, completedAt: snapshot.completedAt, customerName: request.customerName || '',
      applianceType: request.applianceType || 'Dịch vụ khác', technicianId: request.assignedTechnicianId || null,
      technicianName: technicians.get(request.assignedTechnicianId)?.name || 'Chưa xác định', revenue: Number(snapshot.revenue),
      collected: summary.collected, debt: summary.debt, partsCost: Number(snapshot.partsCost), technicianPay: Number(snapshot.technicianPay),
      estimatedProfit: Number(snapshot.revenue) - Number(snapshot.partsCost) - Number(snapshot.technicianPay), paymentStatus: summary.status,
      settlementStatus: request.technicianSettlementStatus || 'pending'
    };
  });
  const cashEntries = allEntries.filter(entry => vietnamMonth(entry.occurredAt) === month);
  const cashCollected = cashEntries.reduce((sum, entry) => sum + signedAmount(entry), 0);
  const totals = completed.reduce((sum, item) => ({ ...sum, revenue: sum.revenue + item.revenue, debt: sum.debt + item.debt, partsCost: sum.partsCost + item.partsCost, technicianPay: sum.technicianPay + item.technicianPay, estimatedProfit: sum.estimatedProfit + item.estimatedProfit }), { revenue: 0, collected: cashCollected, debt: 0, partsCost: 0, technicianPay: 0, estimatedProfit: 0 });
  const group = (key, labelKey) => Array.from(completed.reduce((map, item) => { const id=item[key]||'unknown',current=map.get(id)||{id,label:item[labelKey]||id,jobs:0,revenue:0,collected:0,technicianPay:0,estimatedProfit:0};current.jobs++;current.revenue+=item.revenue;current.collected+=item.collected;current.technicianPay+=item.technicianPay;current.estimatedProfit+=item.estimatedProfit;map.set(id,current);return map; },new Map()).values()).sort((a,b)=>b.revenue-a.revenue);
  const days = new Map();
  completed.forEach(item => { const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(item.completedAt)),current=days.get(day)||{date:day,revenue:0,collected:0,jobs:0};current.revenue+=item.revenue;current.jobs++;days.set(day,current); });
  cashEntries.forEach(entry => { const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(entry.occurredAt)),current=days.get(day)||{date:day,revenue:0,collected:0,jobs:0};current.collected+=signedAmount(entry);days.set(day,current); });
  return { month, timezone:'Asia/Ho_Chi_Minh', recognitionPolicy:'completion_snapshot', totals:{...totals,jobs:completed.length}, byDay:Array.from(days.values()).sort((a,b)=>a.date.localeCompare(b.date)), byTechnician:group('technicianId','technicianName'), byService:group('applianceType','applianceType'), requests:completed.sort((a,b)=>b.completedAt.localeCompare(a.completedAt)), cashEntries, generatedAt:new Date().toISOString() };
}

function validMonth(value) {
  return typeof value === 'string' && monthPattern.test(value);
}

router.get('/admin/finance/report', requirePermission('finance:read'), (req, res) => {
  const month = String(req.query.month || vietnamMonth(new Date()));
  if (!validMonth(month)) return respondError(res, 400, 'Tháng báo cáo không hợp lệ', 'INVALID_MONTH');
  return respondSuccess(res, buildReport(readDB(), month));
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

router.get('/admin/finance/audit-logs', requirePermission('finance:audit'), (req, res) => {
  const month = String(req.query.month || '');
  const logs = (readDB().financeAuditLogs || []).filter(item => !month || item.createdAt.startsWith(month)).slice(0, 200);
  return respondSuccess(res, logs);
});

const xmlEscape = value => String(value ?? '').replace(/[<>&'\"]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char]));
router.get('/admin/finance/export', requirePermission('finance:read'), (req, res) => {
  const month = String(req.query.month || vietnamMonth(new Date()));
  if (!validMonth(month)) return respondError(res, 400, 'Tháng báo cáo không hợp lệ', 'INVALID_MONTH');
  const report = buildReport(readDB(), month);
  const headings = ['Mã yêu cầu', 'Ngày hoàn thành', 'Khách hàng', 'Dịch vụ', 'Kỹ thuật viên', 'Doanh thu', 'Đã thu', 'Công nợ', 'Linh kiện', 'Công thợ', 'Lợi nhuận', 'Thanh toán', 'Đối soát'];
  const rows = report.requests.map(item => [item.id, item.completedAt.slice(0, 10), item.customerName, item.applianceType, item.technicianName, item.revenue, item.collected, item.debt, item.partsCost, item.technicianPay, item.estimatedProfit, item.paymentStatus, item.settlementStatus]);
  const rowXml = [headings, ...rows].map(row => `<Row>${row.map(value => `<Cell><Data ss:Type="${typeof value === 'number' ? 'Number' : 'String'}">${xmlEscape(value)}</Data></Cell>`).join('')}</Row>`).join('');
  const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Doanh thu ${xmlEscape(month)}"><Table>${rowXml}</Table></Worksheet></Workbook>`;
  res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="doi-soat-${month}.xls"`); return res.send(xml);
});

module.exports = router;
