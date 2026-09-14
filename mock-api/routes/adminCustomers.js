const express = require('express');
const router = express.Router();
const { readDB } = require('../utils/db');
const { respondSuccess } = require('../utils/response');
const { requirePermission } = require('../utils/auth');
const { validatePaginationStrict, validateSortStrict, validateAllowedQueryKeys, validateSearchQuery, sendValidationError } = require('../utils/validation');

const SORT_FIELDS = ['name', 'phone', 'email', 'serviceRequestCount', 'completedServiceCount', 'lastServiceAt', 'serviceRevenue', 'serviceDebt', 'createdAt'];
const normalizePhone = (phone = '') => phone.replace(/\s+/g, '').trim();

function buildServiceCustomers(db) {
  const customers = new Map();
  const contacts = new Map((db.customers || []).map((customer) => [normalizePhone(customer.phone), customer]));
  for (const request of db.serviceRequests || []) {
    const phone = normalizePhone(request.customerPhone);
    if (!phone) continue;
    const price = Number(request.finalPrice || 0);
    const contact = contacts.get(phone);
    const existing = customers.get(phone) || {
      id: phone,
      name: request.customerName || contact?.name || 'Khách hàng',
      phone,
      email: contact?.email || '',
      serviceRequestCount: 0,
      completedServiceCount: 0,
      lastServiceAt: request.updatedAt || request.createdAt,
      serviceRevenue: 0,
      serviceDebt: 0,
      createdAt: request.createdAt,
    };
    existing.serviceRequestCount += 1;
    if (request.status === 'completed') {
      existing.completedServiceCount += 1;
      existing.serviceRevenue += price;
      if (request.paymentStatus !== 'paid') existing.serviceDebt += price;
    }
    if (new Date(request.updatedAt) > new Date(existing.lastServiceAt)) existing.lastServiceAt = request.updatedAt;
    if (new Date(request.createdAt) < new Date(existing.createdAt)) existing.createdAt = request.createdAt;
    customers.set(phone, existing);
  }
  return Array.from(customers.values());
}

router.get('/admin/customers', requirePermission('customers:read'), (req, res) => {
  const errors = [];
  validateAllowedQueryKeys(req.query, ['page', 'limit', 'q', 'search', 'sortBy', 'sortOrder'], errors);
  validatePaginationStrict(req.query, errors);
  validateSortStrict(req.query, SORT_FIELDS, errors);
  if (req.query.q !== undefined) validateSearchQuery(req.query, 'q', errors, 100);
  if (req.query.search !== undefined) validateSearchQuery(req.query, 'search', errors, 100);
  if (errors.length) return sendValidationError(res, errors);

  let customers = buildServiceCustomers(readDB());
  const search = String(req.query.q || req.query.search || '').toLowerCase().trim();
  if (search) customers = customers.filter((customer) => customer.name.toLowerCase().includes(search) || customer.phone.includes(search) || customer.email.toLowerCase().includes(search));
  const sortBy = req.query.sortBy || 'lastServiceAt';
  const direction = String(req.query.sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;
  customers.sort((a, b) => {
    const first = ['lastServiceAt', 'createdAt'].includes(sortBy) ? new Date(a[sortBy]).getTime() : a[sortBy];
    const second = ['lastServiceAt', 'createdAt'].includes(sortBy) ? new Date(b[sortBy]).getTime() : b[sortBy];
    if (typeof first === 'string') return first.localeCompare(second) * direction;
    return (Number(first) - Number(second)) * direction;
  });
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  return respondSuccess(res, customers.slice((page - 1) * limit, page * limit), 'Thành công', { page, limit, total: customers.length, totalPages: Math.ceil(customers.length / limit) });
});

router.buildServiceCustomers = buildServiceCustomers;
module.exports = router;
