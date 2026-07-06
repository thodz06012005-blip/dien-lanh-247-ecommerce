const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../utils/db');
const { respondSuccess, respondCreated, respondError } = require('../utils/response');
const { isValidPhone, isValidEmail } = require('../utils/validators');
const { requirePermission } = require('../utils/auth');
const { VALID_TECHNICIAN_STATUSES, ACTIVE_SERVICE_REQUEST_STATUSES } = require('../constants');
const {
  validateRequiredString,
  validateOptionalString,
  validateEnum,
  validateNumber,
  validateInteger,
  validateArrayOfStrings,
  validatePagination,
  validateSort,
  sendValidationError
} = require('../utils/validation');

// GET /admin/technicians — requires: technicians:read (superadmin, admin, staff)
router.get('/admin/technicians', requirePermission('technicians:read'), (req, res) => {
  const errors = [];
  validatePagination(req.query, errors);
  validateSort(req.query, ['name', 'phone', 'status', 'rating', 'createdAt', 'updatedAt'], errors);
  if (req.query.status) {
    validateEnum(req.query.status, VALID_TECHNICIAN_STATUSES, 'status', errors, false);
  }
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const db = readDB();
  let list = db.technicians || [];
  
  const { status, skill, workingArea, q } = req.query;
  
  if (status) {
    list = list.filter(t => t.status === status);
  }
  if (skill) {
    list = list.filter(t => t.skills && t.skills.includes(skill));
  }
  if (workingArea) {
    list = list.filter(t => t.workingAreas && t.workingAreas.includes(workingArea));
  }
  if (q) {
    const searchVal = q.toLowerCase();
    list = list.filter(t => 
      t.name.toLowerCase().includes(searchVal) || 
      t.phone.includes(searchVal) ||
      (t.email && t.email.toLowerCase().includes(searchVal))
    );
  }
  
  const todayStr = new Date().toISOString().split('T')[0];
  const serviceRequests = db.serviceRequests || [];
  
  const enrichedList = list.map(t => {
    const todayJobsCount = serviceRequests.filter(r => 
      r.assignedTechnicianId === t.id &&
      r.preferredDate === todayStr &&
      r.status !== 'cancelled'
    ).length;

    let currentJob = null;
    if (t.status === 'busy') {
      const activeRequests = serviceRequests.filter(r => 
        r.assignedTechnicianId === t.id &&
        (r.status === 'assigned' || r.status === 'confirmed')
      );
      activeRequests.sort((a, b) => a.preferredDate.localeCompare(b.preferredDate));
      if (activeRequests[0]) {
        currentJob = {
          id: activeRequests[0].id,
          customerName: activeRequests[0].customerName,
          district: activeRequests[0].district,
          preferredTimeSlot: activeRequests[0].preferredTimeSlot,
          preferredDate: activeRequests[0].preferredDate
        };
      }
    }

    return {
      ...t,
      todayJobs: todayJobsCount,
      currentJob: currentJob
    };
  });
  
  return respondSuccess(res, enrichedList);
});

// GET /admin/technicians/:id — requires: technicians:read (superadmin, admin, staff)
router.get('/admin/technicians/:id', requirePermission('technicians:read'), (req, res) => {
  const db = readDB();
  const tech = (db.technicians || []).find(t => t.id === req.params.id);
  if (!tech) {
    return respondError(res, 404, 'Không tìm thấy kỹ thuật viên', 'TECHNICIAN_NOT_FOUND');
  }
  return respondSuccess(res, tech);
});

// POST /admin/technicians — requires: technicians:create (superadmin, admin)
router.post('/admin/technicians', requirePermission('technicians:create'), (req, res) => {
  const body = req.body;
  const errors = [];
  
  validateRequiredString(body.name, 'name', errors, 2, 100);
  validateRequiredString(body.phone, 'phone', errors, 9, 20);
  
  if (body.email !== undefined && body.email !== '') {
    validateOptionalString(body.email, 'email', errors, 100);
  }
  if (body.status !== undefined) {
    validateEnum(body.status, VALID_TECHNICIAN_STATUSES, 'status', errors);
  }
  if (body.skills !== undefined) {
    validateArrayOfStrings(body.skills, 'skills', errors, 1, 50);
  } else {
    errors.push({ field: 'skills', message: 'Kỹ năng chuyên môn không được để trống' });
  }
  if (body.workingAreas !== undefined) {
    validateArrayOfStrings(body.workingAreas, 'workingAreas', errors, 1, 50);
  } else {
    errors.push({ field: 'workingAreas', message: 'Địa bàn hoạt động không được để trống' });
  }
  if (body.rating !== undefined) {
    validateNumber(body.rating, 'rating', errors, 0, 5);
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const phoneNormalized = body.phone.replace(/\s+/g, '').trim();
  if (!isValidPhone(phoneNormalized)) {
    errors.push({ field: 'phone', message: 'Số điện thoại không đúng định dạng Việt Nam' });
  }

  let emailNormalized = '';
  if (body.email && body.email.trim() !== '') {
    emailNormalized = body.email.trim().toLowerCase();
    if (!isValidEmail(emailNormalized)) {
      errors.push({ field: 'email', message: 'Email không đúng định dạng' });
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const db = readDB();

  if (emailNormalized) {
    const emailDup = (db.technicians || []).some(t => t.email && t.email.trim().toLowerCase() === emailNormalized);
    if (emailDup) {
      errors.push({ field: 'email', message: 'Email này đã được sử dụng bởi kỹ thuật viên khác' });
      return sendValidationError(res, errors);
    }
  }

  const phoneDup = (db.technicians || []).some(t => t.phone.replace(/\s+/g, '').trim() === phoneNormalized);
  if (phoneDup) {
    errors.push({ field: 'phone', message: 'Số điện thoại này đã được sử dụng bởi kỹ thuật viên khác' });
    return sendValidationError(res, errors);
  }

  if (!body.workingAreas || !Array.isArray(body.workingAreas) || body.workingAreas.length === 0) {
    return respondError(res, 400, 'Kỹ thuật viên phải có ít nhất một địa bàn hoạt động', 'INVALID_WORKING_AREAS');
  }

  const allowedStatuses = VALID_TECHNICIAN_STATUSES;
  const status = body.status || 'available';
  if (!allowedStatuses.includes(status)) {
    return respondError(res, 400, 'Trạng thái hoạt động không hợp lệ', 'INVALID_STATUS');
  }

  let rating = 5.0;
  if (body.rating !== undefined && body.rating !== null) {
    const ratingNum = Number(body.rating);
    if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
      return respondError(res, 400, 'Điểm đánh giá phải từ 0 đến 5', 'INVALID_RATING');
    }
    rating = ratingNum;
  }

  const newTech = {
    id: `TECH-${Math.floor(100 + Math.random() * 900)}`,
    name: body.name.trim(),
    phone: phoneNormalized,
    email: body.email,
    avatar: body.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(body.name.trim())}&background=f1f5f9&color=0f172a`,
    rating: rating,
    skills: body.skills,
    workingAreas: body.workingAreas.map(area => area.startsWith('Quận ') ? area : `Quận ${area}`),
    status: status,
    completedCount: 0,
    createdAt: new Date().toISOString()
  };
  
  if (!db.technicians) db.technicians = [];
  db.technicians.unshift(newTech);
  writeDB(db);
  
  return respondCreated(res, newTech, 'Thêm kỹ thuật viên mới thành công');
});

// PATCH /admin/technicians/:id — requires: technicians:update (superadmin, admin)
router.patch('/admin/technicians/:id', requirePermission('technicians:update'), (req, res) => {
  const paramErrors = [];
  validateRequiredString(req.params.id, 'id', paramErrors, 1, 50);
  if (paramErrors.length > 0) {
    return sendValidationError(res, paramErrors);
  }

  const body = req.body;
  const errors = [];

  if (body.name !== undefined) validateRequiredString(body.name, 'name', errors, 2, 100);
  if (body.phone !== undefined) validateRequiredString(body.phone, 'phone', errors, 9, 20);
  if (body.email !== undefined && body.email !== '') {
    validateOptionalString(body.email, 'email', errors, 100);
  }
  if (body.status !== undefined) {
    validateEnum(body.status, VALID_TECHNICIAN_STATUSES, 'status', errors);
  }
  if (body.skills !== undefined) {
    validateArrayOfStrings(body.skills, 'skills', errors, 1, 50);
  }
  if (body.workingAreas !== undefined) {
    validateArrayOfStrings(body.workingAreas, 'workingAreas', errors, 1, 50);
  }
  if (body.rating !== undefined) {
    validateNumber(body.rating, 'rating', errors, 0, 5);
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  let phoneNormalized = '';
  if (body.phone !== undefined) {
    phoneNormalized = body.phone.replace(/\s+/g, '').trim();
    if (!isValidPhone(phoneNormalized)) {
      errors.push({ field: 'phone', message: 'Số điện thoại không đúng định dạng Việt Nam' });
    }
  }

  let emailNormalized = '';
  if (body.email !== undefined && body.email !== '') {
    emailNormalized = body.email.trim().toLowerCase();
    if (!isValidEmail(emailNormalized)) {
      errors.push({ field: 'email', message: 'Email không đúng định dạng' });
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const db = readDB();
  const id = req.params.id;
  const techIndex = (db.technicians || []).findIndex(t => t.id === id);
  
  if (techIndex === -1) {
    return respondError(res, 404, 'Không tìm thấy kỹ thuật viên', 'TECHNICIAN_NOT_FOUND');
  }
  
  const existing = db.technicians[techIndex];

  if (emailNormalized) {
    const emailDup = (db.technicians || []).some(t => t.id !== id && t.email && t.email.trim().toLowerCase() === emailNormalized);
    if (emailDup) {
      errors.push({ field: 'email', message: 'Email này đã được sử dụng bởi kỹ thuật viên khác' });
      return sendValidationError(res, errors);
    }
  }

  if (phoneNormalized) {
    const phoneDup = (db.technicians || []).some(t => t.id !== id && t.phone.replace(/\s+/g, '').trim() === phoneNormalized);
    if (phoneDup) {
      errors.push({ field: 'phone', message: 'Số điện thoại này đã được sử dụng bởi kỹ thuật viên khác' });
      return sendValidationError(res, errors);
    }
  }

  const updates = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (phoneNormalized) updates.phone = phoneNormalized;
  if (body.email !== undefined) updates.email = emailNormalized;
  if (body.avatar !== undefined) updates.avatar = body.avatar;
  if (body.rating !== undefined) updates.rating = Number(body.rating);
  if (body.skills !== undefined) updates.skills = body.skills;
  if (body.workingAreas !== undefined) {
    updates.workingAreas = body.workingAreas.map(area => area.startsWith('Quận ') ? area : `Quận ${area}`);
  }

  if (body.status !== undefined) {
    // Check if technician has active job
    const hasActiveJob = (db.serviceRequests || []).some(r => 
      r.assignedTechnicianId === id && 
      ACTIVE_SERVICE_REQUEST_STATUSES.includes(r.status)
    );
    if (hasActiveJob && body.status !== 'busy') {
      return respondError(res, 400, 'Không thể thay đổi trạng thái của kỹ thuật viên khi đang có lịch sửa chữa chưa hoàn thành!', 'TECHNICIAN_HAS_ACTIVE_JOB');
    }
    updates.status = body.status;
  }

  const updatedTech = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  db.technicians[techIndex] = updatedTech;
  writeDB(db);

  return respondSuccess(res, updatedTech, 'Cập nhật thông tin kỹ thuật viên thành công');
});

// PATCH /admin/technicians/:id/status — requires: technicians:update (superadmin, admin)
router.patch('/admin/technicians/:id/status', requirePermission('technicians:update'), (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const techIndex = (db.technicians || []).findIndex(t => t.id === id);
  
  if (techIndex === -1) {
    return respondError(res, 404, 'Không tìm thấy kỹ thuật viên', 'TECHNICIAN_NOT_FOUND');
  }
  
  const { status } = req.body;
  const allowedStatuses = VALID_TECHNICIAN_STATUSES;
  if (!status || !allowedStatuses.includes(status)) {
    return respondError(res, 400, 'Trạng thái hoạt động không hợp lệ', 'INVALID_STATUS');
  }

  // Check if technician has active job
  const hasActiveJob = (db.serviceRequests || []).some(r => 
    r.assignedTechnicianId === id && 
    ACTIVE_SERVICE_REQUEST_STATUSES.includes(r.status)
  );
  if (hasActiveJob && status !== 'busy') {
    return respondError(res, 400, 'Không thể thay đổi trạng thái của kỹ thuật viên khi đang có lịch sửa chữa chưa hoàn thành!', 'TECHNICIAN_HAS_ACTIVE_JOB');
  }
  
  db.technicians[techIndex].status = status;
  db.technicians[techIndex].updatedAt = new Date().toISOString();
  
  writeDB(db);
  return respondSuccess(res, db.technicians[techIndex], 'Cập nhật trạng thái kỹ thuật viên thành công');
});

// DELETE /admin/technicians/:id — requires: technicians:delete (superadmin ONLY)
router.delete('/admin/technicians/:id', requirePermission('technicians:delete'), (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const techIndex = (db.technicians || []).findIndex(t => t.id === id);
  
  if (techIndex === -1) {
    return respondError(res, 404, 'Không tìm thấy kỹ thuật viên', 'TECHNICIAN_NOT_FOUND');
  }
  
  const hasActiveRequest = (db.serviceRequests || []).some(r => 
    r.assignedTechnicianId === id && 
    ACTIVE_SERVICE_REQUEST_STATUSES.includes(r.status)
  );
  
  if (hasActiveRequest) {
    return respondError(res, 400, 'Không thể xóa kỹ thuật viên đang có lịch sửa chữa đang hoạt động!', 'TECHNICIAN_HAS_ACTIVE_JOB');
  }
  
  db.technicians.splice(techIndex, 1);
  writeDB(db);
  
  return respondSuccess(res, {}, 'Xóa thông tin kỹ thuật viên thành công');
});

module.exports = router;
