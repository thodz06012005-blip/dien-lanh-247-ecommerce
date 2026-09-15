const { createFinanceSnapshot } = require('../../backend/src/domain/finance');
const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../utils/db');
const { respondSuccess, respondCreated, respondError } = require('../utils/response');
const { isValidPhone } = require('../utils/validators');
const { requirePermission } = require('../utils/auth');
const { auditSuccess } = require('../utils/auditLog');
const { VALID_SERVICE_PRIORITIES, VALID_SERVICE_STATUSES, ACTIVE_SERVICE_REQUEST_STATUSES } = require('../constants');
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
  validateDateRangeQuery,
  sendValidationError
} = require('../utils/validation');

// Helper to dynamically update technician status based on active assigned jobs
const updateTechnicianStatusAfterJobChange = (techId, db, excludeRequestId = null) => {
  const tech = (db.technicians || []).find(t => t.id === techId);
  if (!tech) return;

  const activeJobs = (db.serviceRequests || []).filter(r => 
    r.assignedTechnicianId === techId && 
    ACTIVE_SERVICE_REQUEST_STATUSES.includes(r.status) && 
    r.id !== excludeRequestId
  );

  if (activeJobs.length > 0) {
    tech.status = 'busy';
  } else {
    tech.status = 'available';
  }
};

// Helper to populate technician info in service request
const populateTechnician = (request, db) => {
  if (!request) return request;
  const clone = { ...request };
  if (clone.assignedTechnicianId) {
    const tech = (db.technicians || []).find(t => t.id === clone.assignedTechnicianId);
    if (tech) {
      clone.technician = {
        id: tech.id,
        name: tech.name,
        phone: tech.phone,
        avatar: tech.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(tech.name)}&background=f1f5f9&color=0f172a`,
        rating: tech.rating || 5,
        skills: tech.skills || []
      };
    } else {
      clone.technician = null;
    }
  } else {
    clone.technician = null;
  }
  return clone;
};

// POST /service-requests (Customer creates new service request)
router.post('/service-requests', (req, res) => {
  const db = readDB();
  const body = req.body;
  const allowedBodyKeys = ['customerName', 'customerPhone', 'customerAddress', 'district', 'serviceCategoryId', 'applianceType', 'issueDescription', 'preferredDate', 'preferredTimeSlot', 'note', 'priority', 'images', 'mediaMetadata'];
  const unknownKey = Object.keys(body).find(key => !allowedBodyKeys.includes(key));
  if (unknownKey) return respondError(res, 400, `Trường ${unknownKey} không được phép`, 'UNKNOWN_FIELD');

  // 1. Required fields validation
  const requiredFields = [
    'customerName',
    'customerPhone',
    'customerAddress',
    'district',
    'serviceCategoryId',
    'applianceType',
    'issueDescription',
    'preferredDate',
    'preferredTimeSlot'
  ];

  for (const field of requiredFields) {
    if (!body[field] || typeof body[field] !== 'string' || body[field].trim() === '') {
      return respondError(res, 400, `Trường ${field} là bắt buộc`, 'MISSING_REQUIRED_FIELD');
    }
  }

  const customerName = body.customerName.trim();
  const customerPhone = body.customerPhone.replace(/\s+/g, '').trim();
  const customerAddress = body.customerAddress.trim();
  const district = body.district.trim();
  const serviceCategoryId = body.serviceCategoryId.trim();
  const applianceType = body.applianceType.trim();
  const issueDescription = body.issueDescription.trim();
  const preferredDate = body.preferredDate.trim();
  const preferredTimeSlot = body.preferredTimeSlot.trim();
  const businessConfig = db.settings?.businessConfig;

  if (businessConfig) {
    const appliance = businessConfig.appliances.find(item => item.active && item.name === applianceType);
    if (!appliance) return respondError(res, 400, 'Thiết bị không nằm trong danh sách đang phục vụ', 'INVALID_APPLIANCE');
    if (!businessConfig.serviceAreas.some(item => item.active && item.name === district)) return respondError(res, 400, 'Khu vực hiện chưa được phục vụ', 'INVALID_SERVICE_AREA');
    if (!businessConfig.timeSlots.some(item => item.active && item.label === preferredTimeSlot)) return respondError(res, 400, 'Khung giờ hiện không còn khả dụng', 'INVALID_TIME_SLOT');
  }

  const images = body.images || [];
  if (!Array.isArray(images) || images.length > 4 || images.some(item => typeof item !== 'string' || item.length > 700000 || !/^data:(image|video)\/[a-z0-9.+-]+;base64,/i.test(item))) {
    return respondError(res, 400, 'Tệp đính kèm không hợp lệ hoặc vượt quá giới hạn', 'INVALID_MEDIA');
  }
  if (images.reduce((total, item) => total + item.length, 0) > 900000) return respondError(res, 400, 'Tổng dung lượng tệp đính kèm vượt quá giới hạn', 'MEDIA_TOO_LARGE');
  const mediaMetadata = body.mediaMetadata || [];
  if (!Array.isArray(mediaMetadata) || mediaMetadata.length !== images.length || mediaMetadata.some(item => !item || typeof item.name !== 'string' || typeof item.type !== 'string' || !Number.isFinite(Number(item.size)))) {
    return respondError(res, 400, 'Thông tin tệp đính kèm không hợp lệ', 'INVALID_MEDIA_METADATA');
  }

  // 2. Validate customerPhone (basic Vietnamese phone number format)
  if (!isValidPhone(customerPhone)) {
    return respondError(res, 400, 'Số điện thoại không hợp lệ', 'INVALID_PHONE');
  }

  // 3. Validate serviceCategoryId exists in db.serviceCategories
  const categories = db.serviceCategories || [];
  const categoryExists = categories.some(cat => cat.id === serviceCategoryId);
  if (!categoryExists) {
    return respondError(res, 400, 'Danh mục dịch vụ không tồn tại', 'INVALID_SERVICE_CATEGORY');
  }

  // 4. Validate preferredDate is not in the past
  const requestDate = new Date(preferredDate);
  if (isNaN(requestDate.getTime())) {
    return respondError(res, 400, 'Ngày hẹn không hợp lệ', 'INVALID_DATE');
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(requestDate);
  compareDate.setHours(0, 0, 0, 0);
  if (compareDate < today) {
    return respondError(res, 400, 'Ngày hẹn không được ở quá khứ', 'PAST_DATE');
  }

  // 5. Whitelist priority
  const priority = body.priority || 'medium';
  if (!VALID_SERVICE_PRIORITIES.includes(priority)) {
    return respondError(res, 400, `Độ ưu tiên không hợp lệ. Chỉ chấp nhận: ${VALID_SERVICE_PRIORITIES.join(', ')}`, 'INVALID_PRIORITY');
  }

  // 6. Create request
  const now = new Date().toISOString();
  const requestId = `SR-${Date.now().toString().slice(-6)}`;

  const districtNormalized = district.startsWith('Quận ') ? district : `Quận ${district}`;

  const newRequest = {
    id: requestId,
    customerName,
    customerPhone,
    customerAddress,
    district: districtNormalized,
    serviceCategoryId,
    applianceType,
    issueDescription,
    images,
    mediaMetadata,
    preferredDate,
    preferredTimeSlot,
    note: body.note || '',
    status: 'pending',
    assignedTechnicianId: null,
    priority,
    estimatedPrice: 0,
    indicativePriceRange: (() => {
      const appliance = businessConfig?.appliances?.find(item => item.name === applianceType);
      return appliance && businessConfig?.pricing?.showPriceRanges ? { min: appliance.priceMin, max: appliance.priceMax, disclaimer: businessConfig.pricing.disclaimer } : null;
    })(),
    inspectionNote: '',
    customerApprovalStatus: 'not_requested',
    customerApprovedAt: null,
    finalPrice: 0,
    paymentStatus: 'unpaid',
    statusHistory: [
      {
        status: 'pending',
        note: 'Khách hàng vừa gửi yêu cầu dịch vụ',
        updatedBy: 'customer',
        createdAt: now
      }
    ],
    activityLog: [{ action: 'REQUEST_CREATED', label: 'Khách hàng gửi yêu cầu', actor: 'Khách hàng', createdAt: now }],
    createdAt: now,
    updatedAt: now
  };

  if (!db.serviceRequests) db.serviceRequests = [];
  db.serviceRequests.unshift(newRequest);
  writeDB(db);

  return respondCreated(res, newRequest, 'Đặt lịch dịch vụ thành công');
});

// GET /service-requests/lookup/:id — public lookup requires both request code and phone.
router.get('/service-requests/lookup/:id', (req, res) => {
  const id = String(req.params.id || '').trim().toUpperCase();
  const phone = String(req.query.phone || '').replace(/[\s.-]/g, '').trim();
  if (!id || !isValidPhone(phone)) return respondError(res, 400, 'Vui lòng nhập đúng mã yêu cầu và số điện thoại', 'INVALID_LOOKUP');
  const db = readDB();
  const request = (db.serviceRequests || []).find(item => item.id.toUpperCase() === id);
  if (!request || String(request.customerPhone || '').replace(/[\s.-]/g, '') !== phone) return respondError(res, 404, 'Không tìm thấy yêu cầu phù hợp với thông tin đã nhập', 'SERVICE_REQUEST_NOT_FOUND');
  return respondSuccess(res, populateTechnician(request, db));
});

// PATCH /admin/service-requests/:id/inspection — record post-inspection estimate and customer decision.
router.patch('/admin/service-requests/:id/inspection', requirePermission('serviceRequests:update'), (req, res) => {
  const { estimatedPrice, inspectionNote, customerApprovalStatus } = req.body || {};
  const allowedApproval = ['not_requested', 'pending', 'approved', 'rejected'];
  if (!Number.isFinite(Number(estimatedPrice)) || Number(estimatedPrice) <= 0 || Number(estimatedPrice) > 1000000000) return respondError(res, 400, 'Chi phí sau kiểm tra phải lớn hơn 0', 'INVALID_ESTIMATED_PRICE');
  if (typeof inspectionNote !== 'string' || inspectionNote.trim().length < 3 || inspectionNote.trim().length > 1000) return respondError(res, 400, 'Kết luận kiểm tra phải có từ 3 đến 1000 ký tự', 'INVALID_INSPECTION_NOTE');
  if (!allowedApproval.includes(customerApprovalStatus)) return respondError(res, 400, 'Trạng thái xác nhận của khách không hợp lệ', 'INVALID_CUSTOMER_APPROVAL');
  const db = readDB();
  const request = (db.serviceRequests || []).find(item => item.id === req.params.id);
  if (!request) return respondError(res, 404, 'Không tìm thấy yêu cầu dịch vụ', 'SERVICE_REQUEST_NOT_FOUND');
  if (['completed', 'cancelled'].includes(request.status)) return respondError(res, 400, 'Không thể cập nhật yêu cầu đã kết thúc', 'REQUEST_CLOSED');
  const now = new Date().toISOString();
  request.estimatedPrice = Number(estimatedPrice);
  request.inspectionNote = inspectionNote.trim();
  request.customerApprovalStatus = customerApprovalStatus;
  request.customerApprovedAt = customerApprovalStatus === 'approved' ? now : null;
  request.updatedAt = now;
  if (!request.activityLog) request.activityLog = [];
  request.activityLog.unshift({ action: 'INSPECTION_UPDATED', label: customerApprovalStatus === 'approved' ? 'Khách đã đồng ý chi phí sau kiểm tra' : 'Cập nhật kết quả kiểm tra và chi phí dự kiến', actor: req.admin.name, detail: `${inspectionNote.trim()} · ${Number(estimatedPrice).toLocaleString('vi-VN')}đ`, createdAt: now });
  writeDB(db);
  auditSuccess(req, 'SERVICE_REQUEST_INSPECTION_UPDATED', 'serviceRequest', request.id, { estimatedPrice: request.estimatedPrice, customerApprovalStatus }, 'Inspection estimate updated');
  return respondSuccess(res, populateTechnician(request, db), 'Đã cập nhật kết quả kiểm tra');
});

// GET /service-requests/:id (Customer views their service request)
router.get('/service-requests/:id', (req, res) => {
  const db = readDB();
  const rawPhone = req.query.phone;
  if (!rawPhone || typeof rawPhone !== 'string' || rawPhone.trim() === '') {
    return respondError(res, 400, 'Thiếu thông tin số điện thoại để xác thực', 'MISSING_PHONE');
  }
  const phone = rawPhone.replace(/\s+/g, '').trim();

  const request = (db.serviceRequests || []).find(r => r.id === req.params.id);
  if (!request) {
    return respondError(res, 404, 'Không tìm thấy yêu cầu dịch vụ', 'SERVICE_REQUEST_NOT_FOUND');
  }

  const customerPhone = (request.customerPhone || '').replace(/\s+/g, '').trim();
  if (customerPhone !== phone) {
    return respondError(res, 403, 'Bạn không có quyền xem yêu cầu dịch vụ này', 'FORBIDDEN');
  }

  const populated = populateTechnician(request, db);
  return respondSuccess(res, populated);
});
// GET /service-requests/track (Customer tracking by phone)
router.get('/service-requests/track', (req, res) => {
  const errors = [];
  validateRequiredString(req.query.phone, 'phone', errors, 8, 20);
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const phone = req.query.phone.replace(/\s+/g, '').trim();
  const db = readDB();
  const requests = (db.serviceRequests || []).filter(r => {
    const requestPhone = (r.customerPhone || '').replace(/\s+/g, '').trim();
    return requestPhone === phone;
  });
  const populated = requests.map(r => populateTechnician(r, db));
  return respondSuccess(res, populated);
});

// GET /admin/service-requests (Admin views all service requests with filters) — requires: serviceRequests:read
router.get('/admin/service-requests', requirePermission('serviceRequests:read'), (req, res) => {
  const errors = [];
  
  validateAllowedQueryKeys(req.query, [
    'page', 'limit', 'q', 'search', 'status', 'priority', 'serviceCategoryId', 'district', 'technicianId', 'dateFrom', 'dateTo', 'sortBy', 'sortOrder'
  ], errors);

  validatePaginationStrict(req.query, errors);
  validateSortStrict(req.query, ['createdAt', 'updatedAt', 'status', 'priority', 'scheduledAt', 'district', 'customerName'], errors);

  if (req.query.q !== undefined) validateSearchQuery(req.query, 'q', errors, 100);
  if (req.query.search !== undefined) validateSearchQuery(req.query, 'search', errors, 100);
  if (req.query.status !== undefined) {
    validateEnum(req.query.status, VALID_SERVICE_STATUSES, 'status', errors, false);
  }
  if (req.query.priority !== undefined) {
    validateEnum(req.query.priority, VALID_SERVICE_PRIORITIES, 'priority', errors, false);
  }
  if (req.query.serviceCategoryId !== undefined) {
    validateOptionalString(req.query.serviceCategoryId, 'serviceCategoryId', errors, 50);
  }
  if (req.query.district !== undefined) {
    validateOptionalString(req.query.district, 'district', errors, 100);
  }
  if (req.query.technicianId !== undefined) {
    validateOptionalString(req.query.technicianId, 'technicianId', errors, 50);
  }
  validateDateRangeQuery(req.query, 'dateFrom', 'dateTo', errors);

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const db = readDB();
  let list = db.serviceRequests || [];
  
  if (req.query.status) {
    list = list.filter(r => r.status === req.query.status);
  }
  if (req.query.priority) {
    list = list.filter(r => r.priority === req.query.priority);
  }
  if (req.query.serviceCategoryId) {
    list = list.filter(r => r.serviceCategoryId === req.query.serviceCategoryId);
  }
  if (req.query.district) {
    list = list.filter(r => r.district === req.query.district);
  }
  if (req.query.technicianId) {
    list = list.filter(r => r.assignedTechnicianId === req.query.technicianId);
  }
  if (req.query.q) {
    const q = req.query.q.toLowerCase().trim();
    list = list.filter(r => 
      r.customerName.toLowerCase().includes(q) || 
      r.customerPhone.includes(q)
    );
  }
  const populatedList = list.map(r => populateTechnician(r, db));
  return respondSuccess(res, populatedList);
});

// GET /admin/service-requests/:id — requires: serviceRequests:read
router.get('/admin/service-requests/:id', requirePermission('serviceRequests:read'), (req, res) => {
  const errors = [];
  validateRequiredString(req.params.id, 'id', errors, 1, 50);
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const db = readDB();
  const request = (db.serviceRequests || []).find(r => r.id === req.params.id);
  if (!request) {
    return respondError(res, 404, 'Không tìm thấy yêu cầu dịch vụ', 'SERVICE_REQUEST_NOT_FOUND');
  }
  const populated = populateTechnician(request, db);
  return respondSuccess(res, populated);
});

// PATCH /admin/service-requests/:id/status — requires: serviceRequests:update (superadmin, admin, staff)
router.patch('/admin/service-requests/:id/status', requirePermission('serviceRequests:update'), (req, res) => {
  const errors = [];
  validateRequiredString(req.params.id, 'id', errors, 1, 50);
  
  const { status, finalPrice, note } = req.body;
  if (status !== undefined) {
    validateEnum(status, VALID_SERVICE_STATUSES, 'status', errors);
  }
  if (finalPrice !== undefined && finalPrice !== null) {
    validateNumber(finalPrice, 'finalPrice', errors, 0, 1000000000);
  }
  if (note !== undefined && note !== null) {
    validateOptionalString(note, 'note', errors, 1000);
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const db = readDB();
  const { id } = req.params;

  const request = (db.serviceRequests || []).find(r => r.id === id);
  if (!request) {
    return respondError(res, 404, 'Không tìm thấy yêu cầu dịch vụ', 'SERVICE_REQUEST_NOT_FOUND');
  }

  const oldStatus = request.status;
  if (['completed', 'cancelled'].includes(oldStatus)) return respondError(res, 409, 'Công việc đã đóng', 'JOB_CLOSED');

  if (status) {
    if (status !== oldStatus) {
      if (oldStatus === 'completed' || oldStatus === 'cancelled') {
        return respondError(res, 400, 'Không thể thay đổi trạng thái của yêu cầu dịch vụ đã hoàn thành hoặc đã hủy', 'INVALID_TRANSITION');
      }
      
      const validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['assigned', 'cancelled'],
        'assigned': ['in_progress', 'completed', 'cancelled'],
        'in_progress': ['completed', 'cancelled']
      };
      
      if (validTransitions[oldStatus] && !validTransitions[oldStatus].includes(status)) {
        return respondError(res, 400, `Không thể chuyển trạng thái từ ${oldStatus} sang ${status}`, 'INVALID_TRANSITION');
      }
    }

    if (status === 'completed') {
      if (!request.assignedTechnicianId) {
        return respondError(res, 400, 'Không thể hoàn thành yêu cầu dịch vụ chưa được phân công kỹ thuật viên', 'NO_TECHNICIAN');
      }
      if (finalPrice === undefined || finalPrice === null || isNaN(Number(finalPrice)) || Number(finalPrice) < 0) {
        return respondError(res, 400, 'Giá cuối cùng không hợp lệ', 'INVALID_FINAL_PRICE');
      }
      if (request.customerApprovalStatus !== 'approved' || Number(finalPrice) !== Number(request.estimatedPrice)) return respondError(res, 409, 'Giá phải khớp báo giá khách đã đồng ý', 'PRICE_NOT_APPROVED');
      request.finalPrice = Number(finalPrice);
      request.paymentStatus = 'unpaid';
      request.amountCollected = 0;
      request.paidAt = null;
      request.financeSnapshot = createFinanceSnapshot(request, db.settings.businessConfig.finance);
      request.completedAt = new Date().toISOString();

      // Increase technician completedCount
      const tech = (db.technicians || []).find(t => t.id === request.assignedTechnicianId);
      if (tech) {
        tech.completedCount = (tech.completedCount || 0) + 1;
      }
    }

    if (status === 'cancelled') {
      request.cancelledAt = new Date().toISOString();
    }

    request.status = status;
    
    const now = new Date().toISOString();
    const logNote = note || `Cập nhật trạng thái thành ${status}`;
    if (!request.statusHistory) request.statusHistory = [];
    request.statusHistory.push({
      status: request.status,
      note: logNote,
      updatedBy: 'admin',
      createdAt: now
    });
    if (!request.activityLog) request.activityLog = [];
    request.activityLog.unshift({ action: 'STATUS_UPDATED', label: `Cập nhật trạng thái thành ${request.status}`, actor: req.admin.name, detail: logNote, createdAt: now });

    // Release technician if completed/cancelled
    if ((status === 'completed' || status === 'cancelled') && request.assignedTechnicianId) {
      updateTechnicianStatusAfterJobChange(request.assignedTechnicianId, db, request.id);
    }
  }

  if (note && !status) {
    const now = new Date().toISOString();
    if (!request.statusHistory) request.statusHistory = [];
    request.statusHistory.push({
      status: request.status,
      note: note,
      updatedBy: 'admin',
      createdAt: now
    });
  }

  request.updatedAt = new Date().toISOString();
  writeDB(db);
  auditSuccess(req, 'SERVICE_REQUEST_STATUS_UPDATED', 'serviceRequest', id, { from: oldStatus, to: request.status, finalPrice: request.finalPrice }, 'Service request status updated successfully');

  const populated = populateTechnician(request, db);
  return respondSuccess(res, populated, 'Cập nhật trạng thái thành công');
});

// PATCH /admin/service-requests/:id/assign-technician — requires: technicians:assign (superadmin, admin)
router.patch('/admin/service-requests/:id/assign-technician', requirePermission('technicians:assign'), (req, res) => {
  const errors = [];
  validateRequiredString(req.params.id, 'id', errors, 1, 50);
  
  const { technicianId } = req.body;
  validateRequiredString(technicianId, 'technicianId', errors, 1, 50);

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const db = readDB();
  const { id } = req.params;

  const request = (db.serviceRequests || []).find(r => r.id === id);
  if (!request) {
    return respondError(res, 404, 'Không tìm thấy yêu cầu dịch vụ', 'SERVICE_REQUEST_NOT_FOUND');
  }

  if (request.status === 'completed' || request.status === 'cancelled') {
    return respondError(res, 400, 'Không thể phân công kỹ thuật viên cho yêu cầu dịch vụ đã hoàn thành hoặc đã hủy', 'INVALID_REQUEST_STATUS');
  }

  const tech = (db.technicians || []).find(t => t.id === technicianId);
  if (!tech || tech.deletedAt) {
    return respondError(res, 404, 'Không tìm thấy kỹ thuật viên', 'TECHNICIAN_NOT_FOUND');
  }

  if (tech.status !== 'available' && request.assignedTechnicianId !== technicianId) {
    return respondError(res, 400, `Kỹ thuật viên ${tech.name} hiện đang bận hoặc ngừng hoạt động!`, 'TECHNICIAN_NOT_AVAILABLE');
  }

  if (!tech.skills || !tech.skills.includes(request.serviceCategoryId)) {
    return respondError(res, 400, `Kỹ thuật viên ${tech.name} không có kỹ năng sửa chữa loại thiết bị này!`, 'SKILL_MISMATCH');
  }

  if (!tech.workingAreas || !tech.workingAreas.includes(request.district)) {
    return respondError(res, 400, `Kỹ thuật viên ${tech.name} không hỗ trợ hoạt động tại khu vực ${request.district}!`, 'AREA_MISMATCH');
  }

  const oldTechnicianId = request.assignedTechnicianId;
  request.technicianDecision = null;
  request.acceptedAt = null;
  request.assignedTechnicianId = technicianId;
  request.status = 'assigned';
  request.updatedAt = new Date().toISOString();
  if (!request.activityLog) request.activityLog = [];
  request.activityLog.unshift({ action: 'TECHNICIAN_ASSIGNED', label: `Phân công kỹ thuật viên ${tech.name}`, actor: req.admin.name, createdAt: request.updatedAt });

  const now = new Date().toISOString();
  const logNote = `Phân công kỹ thuật viên ${tech.name}`;
  
  if (!request.statusHistory) request.statusHistory = [];
  request.statusHistory.push({
    status: request.status,
    note: logNote,
    updatedBy: 'admin',
    createdAt: now
  });
  
  tech.status = 'busy';

  // Release old technician if they have no other active jobs
  if (oldTechnicianId && oldTechnicianId !== technicianId) {
    updateTechnicianStatusAfterJobChange(oldTechnicianId, db, request.id);
  }
  
  writeDB(db);
  auditSuccess(req, 'SERVICE_REQUEST_ASSIGNED', 'serviceRequest', id, { oldTechnicianId, newTechnicianId: technicianId }, 'Technician assigned to service request');
  const populated = populateTechnician(request, db);
  return respondSuccess(res, populated, 'Phân công kỹ thuật viên thành công');
});

module.exports = {
  router,
  updateTechnicianStatusAfterJobChange
};
