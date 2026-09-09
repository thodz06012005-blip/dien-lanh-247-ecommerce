const express = require('express');
const { readDB, writeDB } = require('../utils/db');
const { respondSuccess, respondError } = require('../utils/response');
const { requirePermission } = require('../utils/auth');

const router = express.Router();
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
const paymentStatuses = ['paid', 'unpaid', 'partial'];
const settlementStatuses = ['pending', 'settled'];

const { buildReport, createFinanceSnapshot, ensureFinanceSnapshots, exportFinanceXml } = require('../../backend/src/domain/finance');
const requestRevenue = request => Number(request.finalPrice || 0);
const requestPartsCost = request => Number(request.partsCost || 0);
const financeDB = () => { const db = readDB(); if (ensureFinanceSnapshots(db)) writeDB(db); return db; };

function validMonth(value) {
  return typeof value === 'string' && monthPattern.test(value);
}

router.get('/admin/finance/report', requirePermission('finance:read'), (req, res) => {
  const month = String(req.query.month || new Date().toISOString().slice(0, 7));
  if (!validMonth(month)) return respondError(res, 400, 'Tháng báo cáo không hợp lệ', 'INVALID_MONTH');
  return respondSuccess(res, buildReport(financeDB(), month));
});

router.patch('/admin/finance/requests/:id', requirePermission('finance:update'), (req, res) => {
  const db = financeDB();
  const request = (db.serviceRequests || []).find(item => item.id === req.params.id);
  if (!request || request.status !== 'completed') return respondError(res, 404, 'Không tìm thấy dịch vụ đã hoàn thành', 'REQUEST_NOT_FOUND');
  const partsCost = Number(req.body?.partsCost);
  const amountCollected = Number(req.body?.amountCollected);
  const paymentStatus = req.body?.paymentStatus;
  const note = String(req.body?.note || '').trim();
  if (!Number.isFinite(partsCost) || partsCost < 0 || !Number.isFinite(amountCollected) || amountCollected < 0 || amountCollected > requestRevenue(request) || !paymentStatuses.includes(paymentStatus)) return respondError(res, 400, 'Thông tin tài chính không hợp lệ', 'INVALID_FINANCE_DATA');
  if (paymentStatus === 'paid' && amountCollected !== requestRevenue(request)) return respondError(res, 400, 'Số tiền đã thu phải bằng doanh thu khi đánh dấu đã thanh toán', 'INVALID_COLLECTED_AMOUNT');
  if (paymentStatus === 'unpaid' && amountCollected !== 0) return respondError(res, 400, 'Công việc chưa thanh toán không thể có tiền đã thu', 'INVALID_COLLECTED_AMOUNT');

  if (request.technicianSettlementStatus === 'settled') return respondError(res, 409, 'Mở lại đối soát trước khi chỉnh sửa tài chính', 'SETTLEMENT_LOCKED');
  const oldSnapshot = request.financeSnapshot;
  const before = { financeSnapshot: oldSnapshot, partsCost: requestPartsCost(request), amountCollected: Number(request.amountCollected || 0), paymentStatus: request.paymentStatus || 'unpaid' };
  request.partsCost = partsCost; request.amountCollected = amountCollected; request.paymentStatus = paymentStatus; request.financeNote = note; request.updatedAt = new Date().toISOString();
  if (!db.financeAuditLogs) db.financeAuditLogs = [];
  request.financeSnapshot = createFinanceSnapshot(request, oldSnapshot.policy, request.updatedAt, 'finance-correction');
  request.paidAt = paymentStatus === 'paid' ? (request.paidAt || request.updatedAt) : null;
  db.financeAuditLogs.unshift({ id: `FIN-${Date.now()}`, requestId: request.id, action: 'UPDATE_FINANCIALS', before, after: { partsCost, amountCollected, paymentStatus, financeSnapshot: request.financeSnapshot }, note, actorId: req.admin.id, actorName: req.admin.name, createdAt: request.updatedAt });
  writeDB(db);
  return respondSuccess(res, request, 'Đã cập nhật số liệu tài chính');
});

router.patch('/admin/finance/requests/:id/settlement', requirePermission('finance:update'), (req, res) => {
  const status = req.body?.status;
  if (!settlementStatuses.includes(status)) return respondError(res, 400, 'Trạng thái đối soát không hợp lệ', 'INVALID_SETTLEMENT_STATUS');
  const db = financeDB(); const request = (db.serviceRequests || []).find(item => item.id === req.params.id);
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

router.get('/admin/finance/export', requirePermission('finance:read'), (req, res) => {
  const month = String(req.query.month || new Date().toISOString().slice(0, 7));
  if (!validMonth(month)) return respondError(res, 400, 'Tháng báo cáo không hợp lệ', 'INVALID_MONTH');
  const report = buildReport(financeDB(), month);
  const xml = exportFinanceXml(report, month);
  res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="doi-soat-${month}.xls"`); return res.send(xml);
});

module.exports = router;
