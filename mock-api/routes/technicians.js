const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../utils/db');
const { respondSuccess, respondCreated, respondError } = require('../utils/response');
const { isValidPhone, isValidEmail } = require('../utils/validators');
const { requirePermission } = require('../utils/auth');
const { auditSuccess } = require('../utils/auditLog');
const { requireDangerousConfirmation, getDangerousReason } = require('../utils/dangerousAction');
const { VALID_TECHNICIAN_STATUSES, ACTIVE_SERVICE_REQUEST_STATUSES } = require('../constants');
const {
  validateRequiredString,
  validateOptionalString,
  validateEnum,
  validateNumber,
  validateInteger,
  validateArrayOfStrings,
  validatePaginationStrict,
  validateSortStrict,
  validateAllowedQueryKeys,
  validateSearchQuery,
  sendValidationError
} = require('../utils/validation');
const activeStatuses = ['assigned', 'in_progress', 'waiting_customer_approval'];
const areaIdsFor = (tech, db) => tech.workingAreaIds || (tech.workingAreas || []).map(name => db.settings?.businessConfig?.serviceAreas?.find(area => area.name === name)?.id).filter(Boolean);
const operational = (tech, db) => {
  const accountStatus=tech.accountStatus||(tech.status==='inactive'?'inactive':'active'),presence=tech.presence||(tech.status==='offline'?'offline':'on_shift');
  const activeJobs=(db.serviceRequests||[]).filter(job=>job.assignedTechnicianId===tech.id&&activeStatuses.includes(job.status));
  return {...tech,workingAreaIds:areaIdsFor(tech,db),accountStatus,presence,busy:activeJobs.length>0,operationalStatus:accountStatus==='inactive'?'inactive':presence==='offline'?'offline':activeJobs.length?'busy':'available'};
};
const validReferences = (body, db) => (body.skills || []).every(id => (db.serviceCategories || []).some(category => category.id === id)) && (body.workingAreaIds || []).every(id => db.settings?.businessConfig?.serviceAreas?.some(area => area.active && area.id === id));

// GET /admin/technicians — requires: technicians:read (superadmin, admin, staff)
router.get('/admin/technicians', requirePermission('technicians:read'), (req, res) => {
  const errors = [];
  
  validateAllowedQueryKeys(req.query, [
    'page', 'limit', 'q', 'search', 'status', 'skill', 'workingArea', 'sortBy', 'sortOrder'
  ], errors);

  validatePaginationStrict(req.query, errors);
  validateSortStrict(req.query, ['name', 'phone', 'status', 'rating', 'createdAt', 'updatedAt'], errors);

  if (req.query.q !== undefined) validateSearchQuery(req.query, 'q', errors, 100);
  if (req.query.search !== undefined) validateSearchQuery(req.query, 'search', errors, 100);
  if (req.query.status !== undefined) {
    validateEnum(req.query.status, VALID_TECHNICIAN_STATUSES, 'status', errors, false);
  }
  if (req.query.skill !== undefined) {
    validateOptionalString(req.query.skill, 'skill', errors, 50);
  }
  if (req.query.workingArea !== undefined) {
    validateOptionalString(req.query.workingArea, 'workingArea', errors, 100);
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const db = readDB();
  let list = (db.technicians || []).filter(t => !t.deletedAt);
  
  const { status, skill, workingArea, q } = req.query;
  
  if (skill) {
    list = list.filter(t => t.skills && t.skills.includes(skill));
  }
  if (workingArea) {
    list = list.filter(t => areaIdsFor(t, db).includes(workingArea));
  }
  if (q) {
    const searchVal = q.toLowerCase().trim();
    list = list.filter(t => 
      t.name.toLowerCase().includes(searchVal) || 
      t.phone.includes(searchVal) ||
      (t.email && t.email.toLowerCase().includes(searchVal))
    );
  }
  
  const todayStr = new Date().toISOString().split('T')[0];
  const serviceRequests = db.serviceRequests || [];
  
  let enrichedList = list.map(t => {
    const todayJobsCount = serviceRequests.filter(r => 
      r.assignedTechnicianId === t.id &&
      r.preferredDate === todayStr &&
      r.status !== 'cancelled'
    ).length;

    let currentJob = null;
    if (operational(t, db).busy) {
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
      ...operational(t, db),
      todayJobs: todayJobsCount,
      currentJob: currentJob
    };
  });
  if (status) enrichedList = enrichedList.filter(t => t.operationalStatus === status);
  const sortBy = req.query.sortBy || 'createdAt';
  const direction = String(req.query.sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;
  enrichedList.sort((a, b) => { const first = a[sortBy]; const second = b[sortBy]; if (typeof first === 'string' && typeof second === 'string') return first.localeCompare(second) * direction; return (Number(first || 0) - Number(second || 0)) * direction; });
  const page = Number(req.query.page || 1); const limit = Number(req.query.limit || 10); const total = enrichedList.length;
  return respondSuccess(res, enrichedList.slice((page - 1) * limit, page * limit), 'Thành công', { page, limit, total, totalPages: Math.ceil(total / limit) });
});

// GET /admin/technicians/:id — requires: technicians:read (superadmin, admin, staff)
router.get('/admin/technicians/:id', requirePermission('technicians:read'), (req, res) => {
  const db = readDB();
  const tech = (db.technicians || []).find(t => t.id === req.params.id);
  if (!tech) {
    return respondError(res, 404, 'Không tìm thấy kỹ thuật viên', 'TECHNICIAN_NOT_FOUND');
  }
  return respondSuccess(res, operational(tech, db));
});

// POST /admin/technicians — requires: technicians:create (superadmin, admin)
router.post('/admin/technicians', requirePermission('technicians:create'), (req, res) => {
  const body = req.body;
  const errors = [];
  if (body.status !== undefined || body.workingAreas !== undefined) return respondError(res,400,'busy/status và workingAreas legacy không thể cập nhật','DERIVED_STATUS');
  
  validateRequiredString(body.name, 'name', errors, 2, 100);
  validateRequiredString(body.phone, 'phone', errors, 9, 20);
  
  if (body.email !== undefined && body.email !== '') {
    validateOptionalString(body.email, 'email', errors, 100);
  }
  if (body.accountStatus !== undefined) validateEnum(body.accountStatus, ['active','inactive'], 'accountStatus', errors);
  if (body.presence !== undefined) validateEnum(body.presence, ['on_shift','offline'], 'presence', errors);
  if (body.skills !== undefined) {
    validateArrayOfStrings(body.skills, 'skills', errors, 1, 50);
  } else {
    errors.push({ field: 'skills', message: 'Kỹ năng chuyên môn không được để trống' });
  }
  if (body.workingAreaIds !== undefined) validateArrayOfStrings(body.workingAreaIds, 'workingAreaIds', errors, 1, 50); else errors.push({ field: 'workingAreaIds', message: 'Địa bàn hoạt động không được để trống' });
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

  if (!validReferences(body, db)) return respondError(res,400,'Kỹ năng hoặc khu vực không tồn tại','INVALID_TECHNICIAN_REFERENCE');

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
    workingAreaIds: body.workingAreaIds,
    workingAreas: [],
    accountStatus: body.accountStatus || 'active',
    presence: body.presence || 'on_shift',
    completedCount: 0,
    createdAt: new Date().toISOString()
  };
  
  if (!db.technicians) db.technicians = [];
  db.technicians.unshift(newTech);
  writeDB(db);
  auditSuccess(req, 'TECHNICIAN_CREATED', 'technician', newTech.id, { name: newTech.name }, 'Technician created successfully');
  
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
  if (body.status !== undefined || body.workingAreas !== undefined) return respondError(res,400,'busy/status và workingAreas legacy không thể cập nhật','DERIVED_STATUS');
  const errors = [];

  if (body.name !== undefined) validateRequiredString(body.name, 'name', errors, 2, 100);
  if (body.phone !== undefined) validateRequiredString(body.phone, 'phone', errors, 9, 20);
  if (body.email !== undefined && body.email !== '') {
    validateOptionalString(body.email, 'email', errors, 100);
  }
  if (body.accountStatus !== undefined) validateEnum(body.accountStatus, ['active','inactive'], 'accountStatus', errors);
  if (body.presence !== undefined) validateEnum(body.presence, ['on_shift','offline'], 'presence', errors);
  if (body.skills !== undefined) {
    validateArrayOfStrings(body.skills, 'skills', errors, 1, 50);
  }
  if (body.workingAreaIds !== undefined) validateArrayOfStrings(body.workingAreaIds, 'workingAreaIds', errors, 1, 50);
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
  if (!validReferences({ skills: body.skills || existing.skills, workingAreaIds: body.workingAreaIds || areaIdsFor(existing, db) }, db)) return respondError(res,400,'Kỹ năng hoặc khu vực không tồn tại','INVALID_TECHNICIAN_REFERENCE');

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
  if (body.workingAreaIds !== undefined) updates.workingAreaIds = body.workingAreaIds;
  if (body.accountStatus !== undefined) updates.accountStatus = body.accountStatus;
  if (body.presence !== undefined) updates.presence = body.presence;


  const updatedTech = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  db.technicians[techIndex] = updatedTech;
  writeDB(db);
  auditSuccess(req, 'TECHNICIAN_UPDATED', 'technician', updatedTech.id, { name: updatedTech.name }, 'Technician updated successfully');

  return respondSuccess(res, operational(updatedTech, db), 'Cập nhật thông tin kỹ thuật viên thành công');
});

// PATCH /admin/technicians/:id/status — requires: technicians:update (superadmin, admin)
router.patch('/admin/technicians/:id/status', requirePermission('technicians:update'), (req,res)=>{const db=readDB(),tech=(db.technicians||[]).find(item=>item.id===req.params.id);if(!tech)return respondError(res,404,'Không tìm thấy kỹ thuật viên','TECHNICIAN_NOT_FOUND');if(req.body?.status!==undefined)return respondError(res,400,'busy là trạng thái dẫn xuất','DERIVED_STATUS');const {accountStatus,presence}=req.body||{};if(accountStatus!==undefined&&!['active','inactive'].includes(accountStatus)||presence!==undefined&&!['on_shift','offline'].includes(presence)||accountStatus===undefined&&presence===undefined)return respondError(res,400,'Trạng thái không hợp lệ','INVALID_STATUS');if(accountStatus!==undefined)tech.accountStatus=accountStatus;if(presence!==undefined)tech.presence=presence;tech.updatedAt=new Date().toISOString();writeDB(db);auditSuccess(req,'TECHNICIAN_AVAILABILITY_UPDATED','technician',tech.id,{accountStatus,presence},'Technician account/presence updated');return respondSuccess(res,operational(tech,db),'Cập nhật trạng thái kỹ thuật viên thành công');});

// DELETE /admin/technicians/:id — requires: technicians:delete (superadmin ONLY)
router.delete('/admin/technicians/:id', requirePermission('technicians:delete'), (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const techIndex = (db.technicians || []).findIndex(t => t.id === id);
  
  if (techIndex === -1) {
    return respondError(res, 404, 'Không tìm thấy kỹ thuật viên', 'TECHNICIAN_NOT_FOUND');
  }

  const technician = db.technicians[techIndex];
  if (technician.deletedAt) {
    return respondError(res, 400, 'Kỹ thuật viên đã được xóa mềm trước đó', 'TECHNICIAN_ALREADY_DELETED');
  }

  // Dangerous confirmation check
  if (!requireDangerousConfirmation(req, res, 'DELETE_TECHNICIAN', 'technician', id)) {
    return; // Response handled by helper
  }

  const reason = getDangerousReason(req);
  
  const hasActiveRequest = (db.serviceRequests || []).some(r => 
    r.assignedTechnicianId === id && 
    ACTIVE_SERVICE_REQUEST_STATUSES.includes(r.status)
  );
  
  if (hasActiveRequest) {
    // Audit blocking as dangerous action violation
    const { auditFailure } = require('../utils/auditLog');
    auditFailure(
      req,
      'DANGEROUS_ACTION_BLOCKED',
      'technician',
      id,
      { action: 'DELETE_TECHNICIAN', reason: 'Technician has active request', clientReason: reason },
      'Dangerous action blocked: cannot delete technician with active service request'
    );
    return respondError(res, 400, 'Không thể xóa kỹ thuật viên đang có lịch sửa chữa đang hoạt động!', 'TECHNICIAN_HAS_ACTIVE_JOB');
  }
  
  // Perform soft delete
  technician.deletedAt = new Date().toISOString();
  technician.deletedBy = req.admin ? req.admin.id : 'unknown';
  technician.deleteReason = reason;
  technician.accountStatus = 'inactive';
  technician.presence = 'offline';

  writeDB(db);
  auditSuccess(req, 'TECHNICIAN_SOFT_DELETED', 'technician', id, { id, reason }, 'Technician soft deleted successfully');
  
  return respondSuccess(res, {}, 'Xóa thông tin kỹ thuật viên thành công');
});

module.exports = router;
