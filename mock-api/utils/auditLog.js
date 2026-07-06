const { readDB, writeDB } = require('./db');

const MAX_LOGS = Number(process.env.AUDIT_LOG_MAX_ENTRIES) || 1000;

const sanitizeValue = (key, val) => {
  if (typeof key === 'string' && /password|hash|token|cookie|authorization/i.test(key)) {
    return '[REDACTED]';
  }
  return val;
};

const sanitizeAuditMetadata = (metadata) => {
  if (!metadata) return null;
  try {
    // deep clone and sanitize
    const serialized = JSON.stringify(metadata, sanitizeValue);
    const parsed = JSON.parse(serialized);
    
    // limit metadata size to prevent bloat
    const sizeStr = JSON.stringify(parsed);
    if (sizeStr.length > 5000) {
      return { warning: 'Metadata truncated due to size limit' };
    }
    return parsed;
  } catch (e) {
    return { error: 'Failed to sanitize metadata' };
  }
};

const getClientIp = (req) => {
  const trustProxy = process.env.TRUST_PROXY === 'true';
  if (trustProxy && req.headers && req.headers['x-forwarded-for']) {
    const ips = req.headers['x-forwarded-for'].split(',');
    return ips[0].trim();
  }
  return req.ip || (req.socket && req.socket.remoteAddress) || (req.connection && req.connection.remoteAddress) || '127.0.0.1';
};

const createAuditLog = (req, entry) => {
  try {
    const db = readDB();
    if (!db.auditLogs) {
      db.auditLogs = [];
    }

    const ip = req ? getClientIp(req) : '127.0.0.1';
    const userAgent = req ? req.headers['user-agent'] || 'unknown' : 'unknown';

    // Extract actor information from req.admin
    let actorId = 'system';
    let actorEmail = 'system';
    let actorRole = 'system';

    if (req && req.admin) {
      actorId = req.admin.id || 'unknown';
      actorEmail = req.admin.email || 'unknown';
      actorRole = req.admin.role || 'unknown';
    }

    const logEntry = {
      id: 'AUD-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
      timestamp: new Date().toISOString(),
      actorId,
      actorEmail,
      actorRole,
      action: entry.action,
      resource: entry.resource || 'unknown',
      resourceId: entry.resourceId ? String(entry.resourceId) : 'none',
      status: entry.status || 'success',
      ip,
      userAgent,
      metadata: sanitizeAuditMetadata(entry.metadata),
      message: entry.message || ''
    };

    db.auditLogs.unshift(logEntry); // newest first

    // Cap audit logs length
    if (db.auditLogs.length > MAX_LOGS) {
      db.auditLogs = db.auditLogs.slice(0, MAX_LOGS);
    }

    writeDB(db);
    return logEntry;
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};

const auditSuccess = (req, action, resource, resourceId, metadata = null, message = '') => {
  return createAuditLog(req, { action, resource, resourceId, status: 'success', metadata, message });
};

const auditFailure = (req, action, resource, resourceId, metadata = null, message = '') => {
  return createAuditLog(req, { action, resource, resourceId, status: 'failure', metadata, message });
};

const auditDenied = (req, action, resource, resourceId, metadata = null, message = '') => {
  return createAuditLog(req, { action, resource, resourceId, status: 'denied', metadata, message });
};

const auditRateLimited = (req, action, resource, resourceId, metadata = null, message = '') => {
  return createAuditLog(req, { action, resource, resourceId, status: 'rate_limited', metadata, message });
};

module.exports = {
  sanitizeAuditMetadata,
  getClientIp,
  createAuditLog,
  auditSuccess,
  auditFailure,
  auditDenied,
  auditRateLimited
};
