const express = require('express');
const { paymentSummary, freezeSnapshot } = require('../domain/finance');
const crypto = require('crypto');
const router = express.Router();
const { readDB, writeDB } = require('../utils/db');
const { respondSuccess, respondCreated, respondError } = require('../utils/response');
const { isValidPhone } = require('../utils/validators');
const { requirePermission } = require('../utils/auth');
const { requireCustomer, getCustomerFromRequest } = require('./customerAuth');
const { customerDetail, guestDetail, adminList, adminDetail } = require('../utils/serviceRequestViews');
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

// POST /service-requests (Customer creates new service request)
router.post('/service-requests', (req, res) => {
  const db = readDB();
  const body = req.body;
  const allowedBodyKeys = ['customerName', 'customerPhone', 'customerAddress', 'district', 'areaId', 'serviceCategoryId', 'applianceType', 'issueDescription', 'preferredDate', 'preferredTimeSlot', 'note', 'priority', 'images', 'mediaMetadata'];
  const unknownKey = Object.keys(body).find(key => !allowedBodyKeys.includes(key));
  if (unknownKey) return respondError(res, 400, `Trường ${unknownKey} không được phép`, 'UNKNOWN_FIELD');

  // 1. Required fields validation
  const requiredFields = [
    'customerName',
    'customerPhone',
    'customerAddress',
    'district',
    'areaId',
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
  const area = businessConfig?.serviceAreas?.find(item => item.active && item.id === body.areaId);

  if (businessConfig) {
    const appliance = businessConfig.appliances.find(item => item.active && item.name === applianceType);
    if (!appliance) return respondError(res, 400, 'Thiết bị không nằm trong danh sách đang phục vụ', 'INVALID_APPLIANCE');
    if (!area) return respondError(res, 400, 'Khu vực hiện chưa được phục vụ', 'INVALID_SERVICE_AREA');
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

  const districtNormalized = area.name;

  const newRequest = {
    id: requestId,
    userId: getCustomerFromRequest(req)?.id || null,
    customerName,
    customerPhone,
    customerAddress,
    district: districtNormalized,
    areaId: area.id,
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

  return respondCreated(res, customerDetail(newRequest, db), 'Đặt lịch dịch vụ thành công');
});

const lookupGrants = [];
const lookupRequestWindows = new Map();
const lookupHash = value => crypto.createHash('sha256').update(`${value}:${process.env.LOOKUP_TOKEN_PEPPER || 'mock-local-pepper'}`).digest('hex');
const quoteTotal = body => ['labor','parts','travel','other'].reduce((sum,key)=>sum+Number(body[key]||0),0);
const latestQuote = (db, requestId) => (db.serviceQuotes || []).filter(q=>q.serviceRequestId===requestId).sort((a,b)=>b.version-a.version)[0];
router.post('/service-requests/lookup/request-otp', (req, res) => {
  const id = String(req.body?.requestCode || '').trim().toUpperCase();
  const phone = String(req.body?.phone || '').replace(/[\s.-]/g, '');
  const db = readDB();
  const key = `${req.ip}:${id}`; const cutoff = Date.now() - 60000;
  const recent = (lookupRequestWindows.get(key) || []).filter(value => value > cutoff);
  if (recent.length >= 5) return res.status(202).json({ success: true, message: 'Nếu thông tin hợp lệ, mã xác thực sẽ được gửi.' });
  recent.push(Date.now()); lookupRequestWindows.set(key, recent);
  const request = (db.serviceRequests || []).find(item => item.id.toUpperCase() === id);
  if (request && String(request.customerPhone || '').replace(/[\s.-]/g, '') === phone) {
    const otp = process.env.NODE_ENV !== 'production' && process.env.LOOKUP_TEST_OTP || String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    lookupGrants.push({ requestId: id, otpHash: lookupHash(otp), attempts: 0, expiresAt: Date.now() + 300000, usedAt: null, tokenHash: null });
  }
  return res.status(202).json({ success: true, message: 'Nếu thông tin hợp lệ, mã xác thực sẽ được gửi.' });
});
router.post('/service-requests/lookup/verify', (req, res) => {
  const id = String(req.body?.requestCode || '').trim().toUpperCase();
  const grant = [...lookupGrants].reverse().find(item => item.requestId === id && !item.usedAt);
  if (!grant || grant.expiresAt <= Date.now() || grant.attempts >= 5 || grant.otpHash !== lookupHash(String(req.body?.otp || ''))) {
    if (grant && grant.attempts < 5) grant.attempts += 1;
    return respondError(res, 401, 'Mã xác thực không hợp lệ hoặc đã hết hạn', 'INVALID_LOOKUP_OTP');
  }
  const token = crypto.randomBytes(32).toString('base64url');
  grant.usedAt = Date.now(); grant.expiresAt = Date.now() + 600000; grant.tokenHash = lookupHash(token);
  return respondSuccess(res, { token, requestId: id, expiresAt: new Date(grant.expiresAt).toISOString() });
});
router.get('/service-requests/lookup/:id', (req, res) => {
  const id = String(req.params.id || '').trim().toUpperCase();
  const auth = String(req.headers.authorization || '');
  const token = auth.startsWith('Lookup ') ? auth.slice(7) : '';
  const grant = lookupGrants.find(item => item.requestId === id && item.tokenHash === lookupHash(token) && item.usedAt && item.expiresAt > Date.now());
  if (!token || !grant) return respondError(res, 401, 'Quyền tra cứu không hợp lệ hoặc đã hết hạn', 'INVALID_LOOKUP_GRANT');
  const db = readDB(); const request = (db.serviceRequests || []).find(item => item.id.toUpperCase() === id);
  if (!request) return respondError(res, 401, 'Quyền tra cứu không hợp lệ hoặc đã hết hạn', 'INVALID_LOOKUP_GRANT');
  return respondSuccess(res, guestDetail(request, db));
});

router.post('/me/service-quotes/:id/decision', requireCustomer, (req,res)=>{
  const db=readDB(),quote=(db.serviceQuotes||[]).find(q=>q.id===req.params.id),request=quote&&(db.serviceRequests||[]).find(r=>r.id===quote.serviceRequestId);
  if(!quote||!request||request.userId!==req.customer.id)return respondError(res,403,'Forbidden','FORBIDDEN'); return decideQuote(req,res,db,quote,'customer',String(req.customer.id),'account');
});
router.get('/me/service-requests/:id/quote',requireCustomer,(req,res)=>{const db=readDB(),request=(db.serviceRequests||[]).find(r=>r.id===req.params.id&&r.userId===req.customer.id);if(!request)return respondError(res,404,'Không tìm thấy yêu cầu','NOT_FOUND');const quote=(db.serviceQuotes||[]).filter(q=>q.serviceRequestId===request.id&&['sent','approved','rejected'].includes(q.status)).sort((a,b)=>b.version-a.version)[0]||null;return respondSuccess(res,quote);});
router.post('/service-quotes/:id/guest-decision',(req,res)=>{const db=readDB(),quote=(db.serviceQuotes||[]).find(q=>q.id===req.params.id);const auth=String(req.headers.authorization||''),token=auth.startsWith('Lookup ')?auth.slice(7):'';const grant=quote&&lookupGrants.find(g=>g.requestId===quote.serviceRequestId&&g.tokenHash===lookupHash(token)&&g.usedAt&&g.expiresAt>Date.now());if(!quote||!grant)return respondError(res,401,'Quyền tra cứu không hợp lệ','INVALID_LOOKUP_GRANT');return decideQuote(req,res,db,quote,'guest',null,'lookup_token');});
function decideQuote(req,res,db,quote,actorType,actorId,channel){const decision=req.body?.decision;if(!['approved','rejected'].includes(decision))return respondError(res,400,'Quyết định không hợp lệ','INVALID_DECISION');if(quote!==latestQuote(db,quote.serviceRequestId)||quote.status!=='sent'||new Date(quote.validUntil)<=new Date())return respondError(res,400,'Báo giá không còn hiệu lực','QUOTE_NOT_CURRENT');const now=new Date().toISOString();const approval={id:`QA-${Date.now()}`,quoteId:quote.id,version:quote.version,decision,actorType,actorId,channel,evidence:req.body?.evidence||req.body?.note||'',createdAt:now};if(!db.quoteApprovals)db.quoteApprovals=[];db.quoteApprovals.push(approval);quote.status=decision;const request=db.serviceRequests.find(r=>r.id===quote.serviceRequestId);if(decision==='approved')request.status='in_progress';if(!request.activityLog)request.activityLog=[];request.activityLog.unshift({action:decision==='approved'?'QUOTE_APPROVED':'QUOTE_REJECTED',label:`Báo giá v${quote.version} ${decision==='approved'?'được duyệt':'bị từ chối'}`,actor:actorType,detail:`Kênh: ${channel}`,createdAt:now});writeDB(db);return respondSuccess(res,approval);}

router.get('/admin/service-requests/:id/quotes',requirePermission('serviceRequests:read'),(req,res)=>{const db=readDB();return respondSuccess(res,(db.serviceQuotes||[]).filter(q=>q.serviceRequestId===req.params.id).sort((a,b)=>b.version-a.version).map(q=>({...q,approvals:(db.quoteApprovals||[]).filter(a=>a.quoteId===q.id)})));});
router.post('/admin/service-quotes/:id/send',requirePermission('serviceRequests:update'),(req,res)=>{const db=readDB(),quote=(db.serviceQuotes||[]).find(q=>q.id===req.params.id);if(!quote||quote.status!=='draft')return respondError(res,400,'Chỉ có thể gửi báo giá nháp','INVALID_QUOTE_STATUS');quote.status='sent';const request=db.serviceRequests.find(r=>r.id===quote.serviceRequestId);request.status='waiting_customer_approval';if(!request.activityLog)request.activityLog=[];request.activityLog.unshift({action:'QUOTE_SENT',label:`Đã gửi báo giá v${quote.version}`,actor:req.admin.name,detail:`Tổng ${Number(quote.total).toLocaleString('vi-VN')}đ`,createdAt:new Date().toISOString()});writeDB(db);return respondSuccess(res,quote,'Đã gửi báo giá');});
router.post('/admin/service-quotes/:id/phone-decision',requirePermission('technicians:assign'),(req,res)=>{if(req.body?.channel!=='phone'||String(req.body?.note||'').trim().length<3)return respondError(res,400,'Cần kênh và ghi chú xác nhận','INVALID_PHONE_APPROVAL');const db=readDB(),quote=(db.serviceQuotes||[]).find(q=>q.id===req.params.id);if(!quote)return respondError(res,404,'Không tìm thấy báo giá','QUOTE_NOT_FOUND');return decideQuote(req,res,db,quote,'staff',req.admin.id,'phone');});
router.post('/admin/service-requests/:id/payment-entries',requirePermission('finance:update'),(req,res)=>{const db=readDB(),request=(db.serviceRequests||[]).find(r=>r.id===req.params.id),type=req.body?.type,amount=Number(req.body?.amount),occurredAt=req.body?.occurredAt,idempotencyKey=String(req.body?.idempotencyKey||'');if(!request||request.status!=='completed'||!['collection','refund','adjustment'].includes(type)||!Number.isFinite(amount)||(type!=='adjustment'&&amount<=0)||(type==='adjustment'&&amount===0)||!occurredAt||Number.isNaN(Date.parse(occurredAt))||idempotencyKey.length<8)return respondError(res,400,'Thông tin bút toán không hợp lệ','INVALID_PAYMENT_ENTRY');if(!db.servicePaymentEntries)db.servicePaymentEntries=[];const existing=db.servicePaymentEntries.find(p=>p.idempotencyKey===idempotencyKey);if(existing&&existing.serviceRequestId!==request.id)return respondError(res,409,'Idempotency key đã được sử dụng','IDEMPOTENCY_KEY_CONFLICT');if(existing)return respondSuccess(res,{entry:existing,paymentSummary:paymentSummary(request.finalPrice,db.servicePaymentEntries.filter(p=>p.serviceRequestId===request.id))},'Bút toán đã tồn tại');const current=db.servicePaymentEntries.filter(p=>p.serviceRequestId===request.id),candidate={type,amount},next=paymentSummary(request.finalPrice,[...current,candidate]);const rawNet=current.reduce((sum,p)=>sum+(p.type==='refund'?-Math.abs(Number(p.amount)):p.type==='collection'?Math.abs(Number(p.amount)):Number(p.amount)),0)+(type==='refund'?-Math.abs(amount):type==='collection'?Math.abs(amount):amount);if(rawNet<0||rawNet>Number(request.finalPrice))return respondError(res,400,'Số dư sau giao dịch không hợp lệ','INVALID_PAYMENT_BALANCE');const entry={id:`PAY-${Date.now()}`,serviceRequestId:request.id,type,amount,method:String(req.body?.method||''),reference:req.body?.reference||'',actorId:req.admin.id,occurredAt:new Date(occurredAt).toISOString(),idempotencyKey,createdAt:new Date().toISOString()};db.servicePaymentEntries.push(entry);if(!db.financeAuditLogs)db.financeAuditLogs=[];db.financeAuditLogs.unshift({id:`FIN-${Date.now()}`,requestId:request.id,action:'PAYMENT_ENTRY_APPENDED',after:entry,actorId:req.admin.id,actorName:req.admin.name,createdAt:entry.createdAt});writeDB(db);return respondCreated(res,{entry,paymentSummary:next},'Đã ghi nhận bút toán');});
router.get('/admin/service-requests/:id/payment-entries',requirePermission('finance:read'),(req,res)=>{const db=readDB(),request=(db.serviceRequests||[]).find(r=>r.id===req.params.id);if(!request)return respondError(res,404,'Không tìm thấy yêu cầu','REQUEST_NOT_FOUND');const entries=(db.servicePaymentEntries||[]).filter(p=>p.serviceRequestId===request.id).sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt));return respondSuccess(res,{entries,paymentSummary:paymentSummary(request.finalPrice,entries)});});

// PATCH /admin/service-requests/:id/inspection — record diagnosis and create an approval-neutral draft quote.
router.patch('/admin/service-requests/:id/inspection', requirePermission('serviceRequests:update'), (req, res) => {
  const allowed=['diagnosis','labor','parts','travel','other','validUntil']; if(Object.keys(req.body||{}).some(k=>!allowed.includes(k)))return respondError(res,400,'Payload inspection có trường không được phép','UNKNOWN_FIELD');
  const { diagnosis } = req.body || {}; const total=quoteTotal(req.body||{});
  if (!Number.isFinite(total) || total <= 0 || total > 1000000000) return respondError(res, 400, 'Tổng báo giá phải lớn hơn 0', 'INVALID_ESTIMATED_PRICE');
  if (typeof diagnosis !== 'string' || diagnosis.trim().length < 3 || diagnosis.trim().length > 2000) return respondError(res, 400, 'Chẩn đoán phải có từ 3 đến 2000 ký tự', 'INVALID_INSPECTION_NOTE');
  const db = readDB();
  const request = (db.serviceRequests || []).find(item => item.id === req.params.id);
  if (!request) return respondError(res, 404, 'Không tìm thấy yêu cầu dịch vụ', 'SERVICE_REQUEST_NOT_FOUND');
  if (['completed', 'cancelled'].includes(request.status)) return respondError(res, 400, 'Không thể cập nhật yêu cầu đã kết thúc', 'REQUEST_CLOSED');
  const now = new Date().toISOString();
  if(!db.serviceQuotes)db.serviceQuotes=[];const previous=latestQuote(db,request.id);if(previous&&['sent','approved'].includes(previous.status)){previous.status='superseded';request.status='waiting_customer_approval';}
  const quote={id:`QUOTE-${Date.now()}`,serviceRequestId:request.id,version:(previous?.version||0)+1,diagnosis:diagnosis.trim(),labor:Number(req.body.labor||0),parts:Number(req.body.parts||0),travel:Number(req.body.travel||0),other:Number(req.body.other||0),total,status:'draft',validUntil:req.body.validUntil||new Date(Date.now()+7*86400000).toISOString(),createdBy:req.admin.id,createdAt:now};db.serviceQuotes.push(quote);
  request.estimatedPrice = total;
  request.inspectionNote = diagnosis.trim();
  request.updatedAt = now;
  if (!request.activityLog) request.activityLog = [];
  request.activityLog.unshift({ action: 'QUOTE_DRAFT_CREATED', label: `Tạo báo giá nháp v${quote.version}`, actor: req.admin.name, detail: `${diagnosis.trim()} · ${total.toLocaleString('vi-VN')}đ`, createdAt: now });
  writeDB(db);
  auditSuccess(req, 'SERVICE_QUOTE_DRAFT_CREATED', 'serviceRequest', request.id, { quoteId:quote.id,version:quote.version,total }, 'Inspection draft quote created');
  return respondSuccess(res, quote, 'Đã lưu chẩn đoán và tạo báo giá nháp');
});

// GET /service-requests/:id (Customer views their service request)
router.get('/me/service-requests/:id', requireCustomer, (req, res) => {
  const db = readDB();
  const request = (db.serviceRequests || []).find(r => r.id === req.params.id && r.userId === req.customer.id);
  if (!request) {
    return respondError(res, 404, 'Không tìm thấy yêu cầu dịch vụ', 'SERVICE_REQUEST_NOT_FOUND');
  }

  return respondSuccess(res, customerDetail(request, db));
});
router.get('/me/service-requests', requireCustomer, (req, res) => {
  const db = readDB();
  return respondSuccess(res, (db.serviceRequests || []).filter(r => r.userId === req.customer.id).map(r => customerDetail(r, db)));
});

// GET /admin/service-requests (Admin views all service requests with filters) — requires: serviceRequests:read
router.get('/admin/service-requests', requirePermission('serviceRequests:read'), (req, res) => {
  const errors = [];
  
  validateAllowedQueryKeys(req.query, [
    'page', 'limit', 'q', 'search', 'status', 'priority', 'serviceCategoryId', 'district', 'areaId', 'technicianId', 'createdFrom', 'createdTo', 'scheduledFrom', 'scheduledTo', 'sortBy', 'sortOrder'
  ], errors);

  validatePaginationStrict(req.query, errors);
  validateSortStrict(req.query, ['createdAt', 'updatedAt', 'status', 'priority', 'preferredDate', 'district', 'customerName'], errors);

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
  if (req.query.areaId !== undefined) validateOptionalString(req.query.areaId, 'areaId', errors, 100);
  if (req.query.technicianId !== undefined) {
    validateOptionalString(req.query.technicianId, 'technicianId', errors, 50);
  }
  validateDateRangeQuery(req.query, 'createdFrom', 'createdTo', errors);
  validateDateRangeQuery(req.query, 'scheduledFrom', 'scheduledTo', errors);

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
  if (req.query.areaId) list = list.filter(r => r.areaId === req.query.areaId);
  if (req.query.technicianId) {
    list = list.filter(r => r.assignedTechnicianId === req.query.technicianId);
  }
  if (req.query.q) {
    const q = req.query.q.toLowerCase().trim();
    list = list.filter(r => 
      r.id.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) || 
      r.customerPhone.includes(q)
    );
  }
  const vnStart = value => new Date(`${String(value).slice(0, 10)}T00:00:00+07:00`).getTime();
  if (req.query.createdFrom) list = list.filter(r => new Date(r.createdAt).getTime() >= vnStart(req.query.createdFrom));
  if (req.query.createdTo) list = list.filter(r => new Date(r.createdAt).getTime() < vnStart(req.query.createdTo) + 86400000);
  if (req.query.scheduledFrom) list = list.filter(r => r.preferredDate >= String(req.query.scheduledFrom).slice(0, 10));
  if (req.query.scheduledTo) list = list.filter(r => r.preferredDate <= String(req.query.scheduledTo).slice(0, 10));
  const sortBy = req.query.sortBy || 'createdAt'; const direction = String(req.query.sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;
  list.sort((a, b) => String(a[sortBy] || '').localeCompare(String(b[sortBy] || '')) * direction);
  const page = Number(req.query.page || 1); const limit = Number(req.query.limit || 10); const total = list.length;
  const populatedList = list.slice((page - 1) * limit, page * limit).map(r => adminList(r, db));
  return respondSuccess(res, populatedList, 'Thành công', { page, limit, total, totalPages: Math.ceil(total / limit) });
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
  const populated = adminDetail(request, db);
  return respondSuccess(res, populated);
});

// PATCH /admin/service-requests/:id/status — requires: serviceRequests:update (superadmin, admin, staff)
router.patch('/admin/service-requests/:id/status', requirePermission('serviceRequests:update'), (req, res) => {
  const errors = [];
  validateRequiredString(req.params.id, 'id', errors, 1, 50);
  
  const allowedStatusFields=['status','finalPrice','note','completionNote','quoteId','version'];if(Object.keys(req.body||{}).some(k=>!allowedStatusFields.includes(k)))return respondError(res,400,'Payload trạng thái có trường không được phép','UNKNOWN_FIELD');
  const { status, finalPrice, note, completionNote, quoteId, version } = req.body;
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

  if (status) {
    if (status !== oldStatus) {
      if (oldStatus === 'completed' || oldStatus === 'cancelled') {
        return respondError(res, 400, 'Không thể thay đổi trạng thái của yêu cầu dịch vụ đã hoàn thành hoặc đã hủy', 'INVALID_TRANSITION');
      }
      
      const validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['assigned', 'cancelled'],
        'assigned': ['in_progress', 'waiting_customer_approval', 'cancelled'],
        'waiting_customer_approval': ['in_progress', 'cancelled'],
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
      const quote=latestQuote(db,request.id),approval=quote&&(db.quoteApprovals||[]).find(a=>a.quoteId===quote.id&&a.version===quote.version&&a.decision==='approved');
      if(!completionNote||!quoteId||!version||!quote||quote.id!==quoteId||quote.version!==Number(version)||quote.status!=='approved'||!approval)return respondError(res,400,'Báo giá mới nhất chưa được khách hàng duyệt','QUOTE_NOT_APPROVED');
      request.finalPrice = Number(finalPrice);
      request.paymentStatus = request.paymentStatus || 'unpaid';
      request.completedAt = new Date().toISOString();
      freezeSnapshot(db,request,quote,request.completedAt);

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
    const logNote = completionNote || note || `Cập nhật trạng thái thành ${status}`;
    if (!request.statusHistory) request.statusHistory = [];
    request.statusHistory.push({
      status: request.status,
      note: logNote,
      updatedBy: 'admin',
      createdAt: now
    });
    if (!request.activityLog) request.activityLog = [];
    request.activityLog.unshift({ action: 'STATUS_UPDATED', label: `Cập nhật trạng thái thành ${request.status}`, actor: req.admin.name, detail: logNote, createdAt: now });

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

  const populated = adminDetail(request, db);
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

  if ((tech.accountStatus || (tech.status === 'inactive' ? 'inactive' : 'active')) !== 'active' || (tech.presence || (tech.status === 'offline' ? 'offline' : 'on_shift')) !== 'on_shift') return respondError(res,400,`Kỹ thuật viên ${tech.name} hiện không trong ca hoạt động`,'TECHNICIAN_NOT_AVAILABLE');
  const overlap=(db.serviceRequests||[]).find(item=>item.id!==request.id&&item.assignedTechnicianId===technicianId&&item.preferredDate===request.preferredDate&&item.preferredTimeSlot===request.preferredTimeSlot&&['assigned','in_progress','waiting_customer_approval'].includes(item.status));if(overlap)return respondError(res,400,`Kỹ thuật viên ${tech.name} đã có lịch trùng khung giờ`,'TECHNICIAN_SCHEDULE_CONFLICT');

  if (!tech.skills || !tech.skills.includes(request.serviceCategoryId)) {
    return respondError(res, 400, `Kỹ thuật viên ${tech.name} không có kỹ năng sửa chữa loại thiết bị này!`, 'SKILL_MISMATCH');
  }

  const configuredAreas=db.settings?.businessConfig?.serviceAreas||[],requestAreaId=request.areaId||configuredAreas.find(area=>area.name===request.district)?.id,areaIds=tech.workingAreaIds||(tech.workingAreas||[]).map(name=>configuredAreas.find(area=>area.name===name)?.id).filter(Boolean);
  if (!requestAreaId || !areaIds.includes(requestAreaId)) {
    return respondError(res, 400, `Kỹ thuật viên ${tech.name} không hỗ trợ hoạt động tại khu vực ${request.district}!`, 'AREA_MISMATCH');
  }

  const oldTechnicianId = request.assignedTechnicianId;
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
  
  
  writeDB(db);
  auditSuccess(req, 'SERVICE_REQUEST_ASSIGNED', 'serviceRequest', id, { oldTechnicianId, newTechnicianId: technicianId }, 'Technician assigned to service request');
  const populated = adminDetail(request, db);
  return respondSuccess(res, populated, 'Phân công kỹ thuật viên thành công');
});

module.exports = { router };
