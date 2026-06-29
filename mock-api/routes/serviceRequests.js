const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../utils/db');
const { respondSuccess, respondCreated, respondError } = require('../utils/response');
const { isValidPhone } = require('../utils/validators');
const { requireAdminAuth } = require('../utils/auth');
const { VALID_SERVICE_PRIORITIES, VALID_SERVICE_STATUSES, ACTIVE_SERVICE_REQUEST_STATUSES } = require('../constants');

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
    images: body.images || [],
    preferredDate,
    preferredTimeSlot,
    note: body.note || '',
    status: 'pending',
    assignedTechnicianId: null,
    priority,
    estimatedPrice: 0,
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
    createdAt: now,
    updatedAt: now
  };

  if (!db.serviceRequests) db.serviceRequests = [];
  db.serviceRequests.unshift(newRequest);
  writeDB(db);

  return respondCreated(res, newRequest, 'Đặt lịch dịch vụ thành công');
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

// GET /my-service-requests (Customer views their service request history)
router.get('/my-service-requests', (req, res) => {
  const db = readDB();
  const rawPhone = req.query.phone;
  if (!rawPhone || typeof rawPhone !== 'string' || rawPhone.trim() === '') {
    return respondError(res, 400, 'Thiếu thông tin số điện thoại khách hàng', 'MISSING_PHONE');
  }

  const phone = rawPhone.replace(/\s+/g, '').trim();
  
  const requests = (db.serviceRequests || []).filter(r => {
    const requestPhone = (r.customerPhone || '').replace(/\s+/g, '').trim();
    return requestPhone === phone;
  });
  const populated = requests.map(r => populateTechnician(r, db));
  return respondSuccess(res, populated);
});

// GET /admin/service-requests (Admin views all service requests with filters)
router.get('/admin/service-requests', requireAdminAuth, (req, res) => {
  const db = readDB();
  let list = db.serviceRequests || [];
  
  if (req.query.status) {
    list = list.filter(r => r.status === req.query.status);
  }
  if (req.query.serviceCategoryId) {
    list = list.filter(r => r.serviceCategoryId === req.query.serviceCategoryId);
  }
  if (req.query.district) {
    list = list.filter(r => r.district === req.query.district);
  }
  if (req.query.q) {
    const q = req.query.q.toLowerCase();
    list = list.filter(r => 
      r.customerName.toLowerCase().includes(q) || 
      r.customerPhone.includes(q)
    );
  }
  const populatedList = list.map(r => populateTechnician(r, db));
  return respondSuccess(res, populatedList);
});

// GET /admin/service-requests/:id
router.get('/admin/service-requests/:id', requireAdminAuth, (req, res) => {
  const db = readDB();
  const request = (db.serviceRequests || []).find(r => r.id === req.params.id);
  if (!request) {
    return respondError(res, 404, 'Không tìm thấy yêu cầu dịch vụ', 'SERVICE_REQUEST_NOT_FOUND');
  }
  const populated = populateTechnician(request, db);
  return respondSuccess(res, populated);
});

// PATCH /admin/service-requests/:id/status
router.patch('/admin/service-requests/:id/status', requireAdminAuth, (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const { status, finalPrice, note } = req.body;

  const request = (db.serviceRequests || []).find(r => r.id === id);
  if (!request) {
    return respondError(res, 404, 'Không tìm thấy yêu cầu dịch vụ', 'SERVICE_REQUEST_NOT_FOUND');
  }

  if (status) {
    const oldStatus = request.status;
    
    const whitelist = VALID_SERVICE_STATUSES;
    if (!whitelist.includes(status)) {
      return respondError(res, 400, 'Trạng thái yêu cầu dịch vụ không hợp lệ', 'INVALID_STATUS');
    }
    
    if (status !== oldStatus) {
      if (oldStatus === 'completed' || oldStatus === 'cancelled') {
        return respondError(res, 400, 'Không thể thay đổi trạng thái của yêu cầu dịch vụ đã hoàn thành hoặc đã hủy', 'INVALID_TRANSITION');
      }
      
      const validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['assigned', 'cancelled'],
        'assigned': ['completed', 'cancelled']
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
      request.finalPrice = Number(finalPrice);
      request.paymentStatus = 'paid';
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

  const populated = populateTechnician(request, db);
  return respondSuccess(res, populated, 'Cập nhật trạng thái thành công');
});

// PATCH /admin/service-requests/:id/assign-technician
router.patch('/admin/service-requests/:id/assign-technician', requireAdminAuth, (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const { technicianId } = req.body;

  const request = (db.serviceRequests || []).find(r => r.id === id);
  if (!request) {
    return respondError(res, 404, 'Không tìm thấy yêu cầu dịch vụ', 'SERVICE_REQUEST_NOT_FOUND');
  }

  if (request.status === 'completed' || request.status === 'cancelled') {
    return respondError(res, 400, 'Không thể phân công kỹ thuật viên cho yêu cầu dịch vụ đã hoàn thành hoặc đã hủy', 'INVALID_REQUEST_STATUS');
  }

  const tech = (db.technicians || []).find(t => t.id === technicianId);
  if (!tech) {
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
  request.assignedTechnicianId = technicianId;
  request.status = 'assigned';
  request.updatedAt = new Date().toISOString();

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
  const populated = populateTechnician(request, db);
  return respondSuccess(res, populated, 'Phân công kỹ thuật viên thành công');
});

module.exports = {
  router,
  updateTechnicianStatusAfterJobChange
};
