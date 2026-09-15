const express = require('express');
const router = express.Router();
const { readDB } = require('../utils/db');
const { requireAdminAuth } = require('../utils/auth');
const { auditDenied, auditSuccess } = require('../utils/auditLog');
const {
  validateAllowedQueryKeys,
  validatePaginationStrict,
  validateDateRangeQuery,
  validateSearchQuery,
  validateEnum,
  sendValidationError
} = require('../utils/validation');

router.get('/admin/audit-logs', requireAdminAuth, (req, res) => {
  if (req.admin.role !== 'superadmin') {
    auditDenied(req, 'RBAC_FORBIDDEN', 'auditLogs', null, { path: req.path, method: req.method }, 'Attempt to read audit logs denied by RBAC');
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const errors = [];
  
  validateAllowedQueryKeys(req.query, [
    'page', 'limit', 'action', 'actorEmail', 'resource', 'status', 'dateFrom', 'dateTo'
  ], errors);

  validatePaginationStrict(req.query, errors);
  validateDateRangeQuery(req.query, 'dateFrom', 'dateTo', errors);

  if (req.query.action !== undefined) {
    validateSearchQuery(req.query, 'action', errors, 100);
  }
  if (req.query.actorEmail !== undefined) {
    validateSearchQuery(req.query, 'actorEmail', errors, 100);
  }
  if (req.query.resource !== undefined) {
    validateSearchQuery(req.query, 'resource', errors, 100);
  }
  if (req.query.status !== undefined) {
    validateEnum(req.query.status, ['success', 'failure', 'denied', 'rate_limited'], 'status', errors, false);
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const db = readDB();
  let logs = db.auditLogs || [];

  // Filtering
  if (req.query.action) {
    const act = req.query.action.trim();
    logs = logs.filter(l => l.action === act);
  }
  if (req.query.actorEmail) {
    const email = req.query.actorEmail.trim().toLowerCase();
    logs = logs.filter(l => l.actorEmail.toLowerCase() === email);
  }
  if (req.query.resource) {
    const resName = req.query.resource.trim();
    logs = logs.filter(l => l.resource === resName);
  }
  if (req.query.status) {
    logs = logs.filter(l => l.status === req.query.status);
  }
  if (req.query.dateFrom) {
    const fromTime = new Date(req.query.dateFrom).getTime();
    logs = logs.filter(l => new Date(l.timestamp).getTime() >= fromTime);
  }
  if (req.query.dateTo) {
    const toTime = new Date(req.query.dateTo).getTime() + 86400000; // include full end day
    logs = logs.filter(l => new Date(l.timestamp).getTime() <= toTime);
  }

  // Pagination
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const paginatedLogs = logs.slice(startIndex, startIndex + limit);

  // Note: we don't log the reading of audit logs to avoid infinite loop
  return res.json({
    success: true,
    data: paginatedLogs,
    pagination: {
      page,
      limit,
      totalItems: logs.length,
      totalPages: Math.ceil(logs.length / limit)
    }
  });
});

module.exports = router;
