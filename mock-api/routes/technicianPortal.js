const express = require('express');
const { freezeSnapshot } = require('../domain/finance');
const crypto = require('crypto');
const { readDB, writeDB } = require('../utils/db');
const { respondSuccess, respondError } = require('../utils/response');
const { isValidPhone } = require('../utils/validators');
const router = express.Router();
const sessions = new Map();
const PIN = process.env.TECHNICIAN_DEMO_PIN || '123456';

const publicTech = (tech) => ({ id: tech.id, name: tech.name, phone: tech.phone, avatar: tech.avatar, rating: tech.rating, skills: tech.skills, workingAreaIds: tech.workingAreaIds || [], accountStatus: tech.accountStatus || (tech.status === 'inactive' ? 'inactive' : 'active'), presence: tech.presence || (tech.status === 'offline' ? 'offline' : 'on_shift'), completedCount: tech.completedCount });
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
  const tech = (db.technicians || []).find(item => !item.deletedAt && item.phone.replace(/\s/g, '') === phone && (item.accountStatus || (item.status === 'inactive' ? 'inactive' : 'active')) === 'active');
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
  return respondSuccess(res, jobs.map(job=>({...job,latestQuote:(db.serviceQuotes||[]).filter(q=>q.serviceRequestId===job.id).sort((a,b)=>b.version-a.version)[0]||null})));
});
router.get('/technician/jobs/:id', auth, (req, res) => { const job = (readDB().serviceRequests || []).find(item => item.id === req.params.id && item.assignedTechnicianId === req.technicianId); if (!job) return respondError(res, 404, 'Không tìm thấy công việc', 'JOB_NOT_FOUND'); return respondSuccess(res, job); });
router.patch('/technician/jobs/:id/decision', auth, (req, res) => {
  const decision = req.body?.decision; if (!['accepted', 'rejected'].includes(decision)) return respondError(res, 400, 'Quyết định không hợp lệ', 'INVALID_DECISION');
  const db = readDB(); const job = (db.serviceRequests || []).find(item => item.id === req.params.id && item.assignedTechnicianId === req.technicianId); const tech = (db.technicians || []).find(item => item.id === req.technicianId);
  if (!job || !tech) return respondError(res, 404, 'Không tìm thấy công việc', 'JOB_NOT_FOUND');
  if (!['assigned', 'confirmed'].includes(job.status)) return respondError(res, 400, 'Công việc không còn chờ phản hồi', 'INVALID_JOB_STATUS');
  if (decision === 'rejected') { const reason = String(req.body?.reason || '').trim(); if (reason.length < 3) return respondError(res, 400, 'Vui lòng nhập lý do từ chối', 'REASON_REQUIRED'); job.assignedTechnicianId = null; job.status = 'confirmed'; job.technicianDecision = 'rejected'; log(job, 'Kỹ thuật viên từ chối công việc', tech.name, reason); }
  else { job.technicianDecision = 'accepted'; job.acceptedAt = new Date().toISOString(); log(job, 'Kỹ thuật viên đã nhận công việc', tech.name); }
  job.updatedAt = new Date().toISOString(); writeDB(db); return respondSuccess(res, job, decision === 'accepted' ? 'Đã nhận công việc' : 'Đã từ chối công việc');
});
router.patch('/technician/jobs/:id/progress', auth, (req, res) => {
  const status = req.body?.status; if (!['in_progress'].includes(status)) return respondError(res, 400, 'Trạng thái không hợp lệ', 'INVALID_STATUS');
  const db = readDB(); const job = (db.serviceRequests || []).find(item => item.id === req.params.id && item.assignedTechnicianId === req.technicianId); const tech = (db.technicians || []).find(item => item.id === req.technicianId);
  if (!job || !tech) return respondError(res, 404, 'Không tìm thấy công việc', 'JOB_NOT_FOUND'); if (job.technicianDecision !== 'accepted') return respondError(res, 400, 'Bạn cần nhận công việc trước', 'JOB_NOT_ACCEPTED');
  job.status = status; job.updatedAt = new Date().toISOString(); if (!job.statusHistory) job.statusHistory = []; job.statusHistory.push({ status, note: 'Kỹ thuật viên bắt đầu kiểm tra/sửa chữa', updatedBy: 'technician', createdAt: job.updatedAt }); log(job, 'Bắt đầu kiểm tra và sửa chữa', tech.name); writeDB(db); return respondSuccess(res, job);
});
router.patch('/technician/jobs/:id/inspection', auth, (req, res) => {
  const allowed=['diagnosis','labor','parts','travel','other','validUntil'];if(Object.keys(req.body||{}).some(k=>!allowed.includes(k)))return respondError(res,400,'Payload inspection có trường không được phép','UNKNOWN_FIELD');
  const estimatedPrice = ['labor','parts','travel','other'].reduce((s,k)=>s+Number(req.body?.[k]||0),0); const diagnosis = String(req.body?.diagnosis || '').trim();
  if (!Number.isFinite(estimatedPrice) || estimatedPrice <= 0 || diagnosis.length < 3) return respondError(res, 400, 'Thông tin chẩn đoán hoặc chi phí không hợp lệ', 'INVALID_INSPECTION');
  const db = readDB(); const job = (db.serviceRequests || []).find(item => item.id === req.params.id && item.assignedTechnicianId === req.technicianId); const tech = (db.technicians || []).find(item => item.id === req.technicianId); if (!job || !tech) return respondError(res, 404, 'Không tìm thấy công việc', 'JOB_NOT_FOUND');
  if(!db.serviceQuotes)db.serviceQuotes=[];const previous=db.serviceQuotes.filter(q=>q.serviceRequestId===job.id).sort((a,b)=>b.version-a.version)[0];if(previous&&['sent','approved'].includes(previous.status)){previous.status='superseded';job.status='waiting_customer_approval';}const quote={id:`QUOTE-${Date.now()}`,serviceRequestId:job.id,version:(previous?.version||0)+1,diagnosis,labor:Number(req.body.labor||0),parts:Number(req.body.parts||0),travel:Number(req.body.travel||0),other:Number(req.body.other||0),total:estimatedPrice,status:'draft',validUntil:req.body.validUntil||new Date(Date.now()+7*86400000).toISOString(),createdBy:tech.id,createdAt:new Date().toISOString()};db.serviceQuotes.push(quote);job.estimatedPrice=estimatedPrice;job.inspectionNote=diagnosis;job.updatedAt=new Date().toISOString();log(job,`Kỹ thuật viên tạo báo giá nháp v${quote.version}`,tech.name,`${diagnosis} · ${estimatedPrice.toLocaleString('vi-VN')}đ`);writeDB(db);return respondSuccess(res,quote,'Đã lưu chẩn đoán và báo giá nháp');
});
router.patch('/technician/jobs/:id/complete', auth, (req, res) => {
  const finalPrice = Number(req.body?.finalPrice); const completionNote = String(req.body?.completionNote || '').trim(); const photos = req.body?.photos || [];
  if (!Number.isFinite(finalPrice) || finalPrice <= 0 || completionNote.length < 3 || !Array.isArray(photos) || photos.length > 4) return respondError(res, 400, 'Thông tin hoàn thành không hợp lệ', 'INVALID_COMPLETION');
  if (photos.some(photo => typeof photo !== 'string' || !photo.startsWith('data:image/') || photo.length > 250000) || photos.reduce((sum, photo) => sum + photo.length, 0) > 800000) return respondError(res, 413, 'Ảnh hoàn thành không hợp lệ hoặc vượt quá dung lượng cho phép', 'PHOTOS_TOO_LARGE');
  const allowed=['finalPrice','completionNote','photos','quoteId','version'];if(Object.keys(req.body||{}).some(k=>!allowed.includes(k)))return respondError(res,400,'Payload hoàn thành có trường không được phép','UNKNOWN_FIELD');
  const db = readDB(); const job = (db.serviceRequests || []).find(item => item.id === req.params.id && item.assignedTechnicianId === req.technicianId); const tech = (db.technicians || []).find(item => item.id === req.technicianId); if (!job || !tech) return respondError(res, 404, 'Không tìm thấy công việc', 'JOB_NOT_FOUND');const quote=(db.serviceQuotes||[]).filter(q=>q.serviceRequestId===job.id).sort((a,b)=>b.version-a.version)[0],approval=quote&&(db.quoteApprovals||[]).find(a=>a.quoteId===quote.id&&a.version===quote.version&&a.decision==='approved');if(!quote||quote.id!==req.body.quoteId||quote.version!==Number(req.body.version)||quote.status!=='approved'||!approval)return respondError(res,400,'Báo giá mới nhất chưa được khách hàng duyệt','QUOTE_NOT_APPROVED');
  const now = new Date().toISOString(); job.status = 'completed'; job.finalPrice = finalPrice; job.completionNote = completionNote; job.completionPhotos = photos; job.completedAt = now; freezeSnapshot(db,job,quote,now); job.updatedAt = now; job.paymentStatus = job.paymentStatus || 'unpaid'; if (!job.statusHistory) job.statusHistory = []; job.statusHistory.push({ status: 'completed', note: completionNote, updatedBy: 'technician', createdAt: now }); log(job, 'Kỹ thuật viên hoàn thành công việc', tech.name, completionNote); tech.completedCount = Number(tech.completedCount || 0) + 1; writeDB(db); return respondSuccess(res, job, 'Đã hoàn thành công việc');
});
router.get('/technician/earnings', auth, (req, res) => { const db=readDB(),requestIds=new Set((db.serviceRequests||[]).filter(item=>item.assignedTechnicianId===req.technicianId).map(item=>item.id)),items=(db.serviceFinanceSnapshots||[]).filter(item=>requestIds.has(item.serviceRequestId)).map(item=>({id:item.serviceRequestId,completedAt:item.completedAt,revenue:Number(item.revenue),earning:Number(item.technicianPay)})),month=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit'}).format(new Date());return respondSuccess(res,{total:items.reduce((sum,item)=>sum+item.earning,0),thisMonth:items.filter(item=>item.completedAt&&new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit'}).format(new Date(item.completedAt))===month).reduce((sum,item)=>sum+item.earning,0),jobs:items});});
module.exports = router;
