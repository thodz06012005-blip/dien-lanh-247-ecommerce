const { businessDate, calculateTechnicianPay, createFinanceSnapshot, ensureFinanceSnapshots } = require('../../backend/src/domain/finance');
const express = require('express');
const crypto = require('crypto');
const { readDB, writeDB } = require('../utils/db');
const { respondSuccess, respondError } = require('../utils/response');
const { isValidPhone } = require('../utils/validators');
const router = express.Router();
const sessions = new Map();
const PIN = process.env.TECHNICIAN_DEMO_PIN || '123456';

const publicTech = (tech) => ({ id: tech.id, name: tech.name, phone: tech.phone, avatar: tech.avatar, rating: tech.rating, skills: tech.skills, workingAreas: tech.workingAreas, status: tech.status, completedCount: tech.completedCount });
const auth = (req, res, next) => {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) return respondError(res, 401, 'Phiên đăng nhập đã hết hạn', 'TECHNICIAN_UNAUTHORIZED');
  req.technicianId = session.technicianId;
  next();
};
const log = (request, label, actor, detail = '') => { if (!request.activityLog) request.activityLog = []; request.activityLog.unshift({ action: 'TECHNICIAN_UPDATE', label, actor, detail, createdAt: new Date().toISOString() }); };

router.post('/technician/auth/login', (req, res) => {
  if (process.env.NODE_ENV === 'production' && !process.env.TECHNICIAN_DEMO_PIN) return respondError(res, 503, 'Cổng kỹ thuật viên chưa được cấu hình', 'TECHNICIAN_AUTH_NOT_CONFIGURED');
  const phone = String(req.body?.phone || '').replace(/[\s.-]/g, '');
  const pin = String(req.body?.pin || '');
  if (!isValidPhone(phone) || pin.length !== 6) return respondError(res, 400, 'Số điện thoại hoặc mã PIN không hợp lệ', 'INVALID_LOGIN');
  const db = readDB();
  const tech = (db.technicians || []).find(item => !item.deletedAt && item.phone.replace(/\s/g, '') === phone && item.status !== 'inactive');
  if (!tech || pin !== PIN) return respondError(res, 401, 'Thông tin đăng nhập không chính xác', 'INVALID_CREDENTIALS');
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { technicianId: tech.id, expiresAt: Date.now() + 12 * 60 * 60 * 1000 });
  return respondSuccess(res, { token, technician: publicTech(tech), expiresIn: 43200 }, 'Đăng nhập thành công');
});
router.post('/technician/auth/logout', auth, (req, res) => { const token = String(req.headers.authorization).replace(/^Bearer\s+/i, ''); sessions.delete(token); return respondSuccess(res, null, 'Đã đăng xuất'); });
router.get('/technician/me', auth, (req, res) => { const tech = (readDB().technicians || []).find(item => item.id === req.technicianId); if (!tech) return respondError(res, 404, 'Không tìm thấy kỹ thuật viên', 'NOT_FOUND'); return respondSuccess(res, publicTech(tech)); });
router.get('/technician/jobs', auth, (req, res) => {
  const db = readDB();
  const jobs = (db.serviceRequests || []).filter(item => item.assignedTechnicianId === req.technicianId).sort((a, b) => `${a.preferredDate} ${a.preferredTimeSlot}`.localeCompare(`${b.preferredDate} ${b.preferredTimeSlot}`));
  return respondSuccess(res, jobs);
});
router.get('/technician/jobs/:id', auth, (req, res) => { const job = (readDB().serviceRequests || []).find(item => item.id === req.params.id && item.assignedTechnicianId === req.technicianId); if (!job) return respondError(res, 404, 'Không tìm thấy công việc', 'JOB_NOT_FOUND'); return respondSuccess(res, job); });
router.patch('/technician/jobs/:id/decision', auth, (req, res) => {
  const decision = req.body?.decision; if (!['accepted', 'rejected'].includes(decision)) return respondError(res, 400, 'Quyết định không hợp lệ', 'INVALID_DECISION');
  const db = readDB(); const job = (db.serviceRequests || []).find(item => item.id === req.params.id && item.assignedTechnicianId === req.technicianId); const tech = (db.technicians || []).find(item => item.id === req.technicianId);
  if (!job || !tech) return respondError(res, 404, 'Không tìm thấy công việc', 'JOB_NOT_FOUND');
  if (!['assigned', 'confirmed'].includes(job.status)) return respondError(res, 400, 'Công việc không còn chờ phản hồi', 'INVALID_JOB_STATUS');
  if (decision === 'rejected') { const reason = String(req.body?.reason || '').trim(); if (reason.length < 3) return respondError(res, 400, 'Vui lòng nhập lý do từ chối', 'REASON_REQUIRED'); job.assignedTechnicianId = null; job.status = 'confirmed'; job.technicianDecision = 'rejected'; tech.status = 'available'; log(job, 'Kỹ thuật viên từ chối công việc', tech.name, reason); }
  else { job.technicianDecision = 'accepted'; job.acceptedAt = new Date().toISOString(); tech.status = 'busy'; log(job, 'Kỹ thuật viên đã nhận công việc', tech.name); }
  job.updatedAt = new Date().toISOString(); writeDB(db); return respondSuccess(res, job, decision === 'accepted' ? 'Đã nhận công việc' : 'Đã từ chối công việc');
});
router.patch('/technician/jobs/:id/progress', auth, (req, res) => {
  const status = req.body?.status; if (!['in_progress'].includes(status)) return respondError(res, 400, 'Trạng thái không hợp lệ', 'INVALID_STATUS');
  const db = readDB(); const job = (db.serviceRequests || []).find(item => item.id === req.params.id && item.assignedTechnicianId === req.technicianId); const tech = (db.technicians || []).find(item => item.id === req.technicianId);
  if (!job || !tech) return respondError(res, 404, 'Không tìm thấy công việc', 'JOB_NOT_FOUND'); if (job.technicianDecision !== 'accepted') return respondError(res, 400, 'Bạn cần nhận công việc trước', 'JOB_NOT_ACCEPTED');
  if (job.status !== 'assigned') return respondError(res, 409, 'Công việc không còn chờ bắt đầu', 'INVALID_JOB_STATUS');
  job.status = status; job.updatedAt = new Date().toISOString(); if (!job.statusHistory) job.statusHistory = []; job.statusHistory.push({ status, note: 'Kỹ thuật viên bắt đầu kiểm tra/sửa chữa', updatedBy: 'technician', createdAt: job.updatedAt }); log(job, 'Bắt đầu kiểm tra và sửa chữa', tech.name); writeDB(db); return respondSuccess(res, job);
});
router.patch('/technician/jobs/:id/inspection', auth, (req, res) => {
  const estimatedPrice = Number(req.body?.estimatedPrice); const diagnosis = String(req.body?.diagnosis || '').trim(); const approval = req.body?.customerApprovalStatus;
  if (!Number.isFinite(estimatedPrice) || estimatedPrice <= 0 || diagnosis.length < 3 || !['pending', 'approved', 'rejected'].includes(approval)) return respondError(res, 400, 'Thông tin chẩn đoán hoặc chi phí không hợp lệ', 'INVALID_INSPECTION');
  const db = readDB(); const job = (db.serviceRequests || []).find(item => item.id === req.params.id && item.assignedTechnicianId === req.technicianId); const tech = (db.technicians || []).find(item => item.id === req.technicianId); if (!job || !tech) return respondError(res, 404, 'Không tìm thấy công việc', 'JOB_NOT_FOUND');
  if (job.status !== 'in_progress') return respondError(res, 409, 'Công việc chưa kiểm tra hoặc đã đóng', 'INVALID_JOB_STATUS');
  job.estimatedPrice = estimatedPrice; job.inspectionNote = diagnosis; job.customerApprovalStatus = approval; job.customerApprovedAt = approval === 'approved' ? new Date().toISOString() : null; job.updatedAt = new Date().toISOString(); log(job, approval === 'approved' ? 'Khách đã đồng ý chi phí' : 'Kỹ thuật viên cập nhật chẩn đoán', tech.name, `${diagnosis} · ${estimatedPrice.toLocaleString('vi-VN')}đ`); writeDB(db); return respondSuccess(res, job, 'Đã lưu chẩn đoán');
});
router.patch('/technician/jobs/:id/complete', auth, (req, res) => {
  const finalPrice = Number(req.body?.finalPrice); const completionNote = String(req.body?.completionNote || '').trim(); const photos = req.body?.photos || [];
  if (!Number.isFinite(finalPrice) || finalPrice <= 0 || completionNote.length < 3 || !Array.isArray(photos) || photos.length > 4) return respondError(res, 400, 'Thông tin hoàn thành không hợp lệ', 'INVALID_COMPLETION');
  if (photos.some(photo => typeof photo !== 'string' || !photo.startsWith('data:image/') || photo.length > 250000) || photos.reduce((sum, photo) => sum + photo.length, 0) > 800000) return respondError(res, 413, 'Ảnh hoàn thành không hợp lệ hoặc vượt quá dung lượng cho phép', 'PHOTOS_TOO_LARGE');
  const db = readDB(); const job = (db.serviceRequests || []).find(item => item.id === req.params.id && item.assignedTechnicianId === req.technicianId); const tech = (db.technicians || []).find(item => item.id === req.technicianId); if (!job || !tech) return respondError(res, 404, 'Không tìm thấy công việc', 'JOB_NOT_FOUND'); if (job.customerApprovalStatus !== 'approved') return respondError(res, 400, 'Khách hàng chưa đồng ý chi phí', 'CUSTOMER_NOT_APPROVED');
  if (job.status !== 'in_progress') return respondError(res, 409, 'Công việc không còn đang thực hiện', 'INVALID_JOB_STATUS');
  if (finalPrice !== Number(job.estimatedPrice)) return respondError(res, 409, 'Giá thay đổi cần được khách duyệt lại', 'PRICE_NOT_APPROVED');
  const now = new Date().toISOString(); job.status = 'completed'; job.finalPrice = finalPrice; job.completionNote = completionNote; job.completionPhotos = photos; job.completedAt = now; job.updatedAt = now; job.paymentStatus = req.body?.paymentStatus === 'paid' ? 'paid' : 'unpaid'; job.amountCollected = job.paymentStatus === 'paid' ? finalPrice : 0; job.paidAt = job.paymentStatus === 'paid' ? now : null; job.financeSnapshot = createFinanceSnapshot(job, db.settings.businessConfig.finance, now); if (!job.statusHistory) job.statusHistory = []; job.statusHistory.push({ status: 'completed', note: completionNote, updatedBy: 'technician', createdAt: now }); log(job, 'Kỹ thuật viên hoàn thành công việc', tech.name, completionNote); tech.status = (db.serviceRequests || []).some(item => item.id !== job.id && item.assignedTechnicianId === tech.id && ['assigned', 'in_progress'].includes(item.status)) ? 'busy' : 'available'; tech.completedCount = Number(tech.completedCount || 0) + 1; writeDB(db); return respondSuccess(res, job, 'Đã hoàn thành công việc');
});
router.get('/technician/earnings', auth, (req, res) => { const db = readDB(); if (ensureFinanceSnapshots(db)) writeDB(db); const config = db.settings?.businessConfig?.finance || {}; const completed = (db.serviceRequests || []).filter(item => item.assignedTechnicianId === req.technicianId && item.status === 'completed'); const items = completed.map(job => ({ id: job.id, completedAt: job.completedAt || job.updatedAt, revenue: Number(job.finalPrice || 0), earning: calculateTechnicianPay(job, config) })); return respondSuccess(res, { total: items.reduce((sum, item) => sum + item.earning, 0), thisMonth: items.filter(item => businessDate(item.completedAt).startsWith(businessDate(new Date()).slice(0, 7))).reduce((sum, item) => sum + item.earning, 0), jobs: items }); });
module.exports = router;
