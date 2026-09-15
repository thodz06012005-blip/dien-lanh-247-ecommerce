/**
 * Dangerous Action Confirmation Helper for mock-api
 */

const { auditFailure } = require('./auditLog');
const { respondError } = require('./response');

/**
 * Sanitizes the reason for delete or other dangerous actions.
 * Limits to 300 chars, sanitizes raw HTML/JS injections, and handles default values.
 */
function sanitizeDeleteReason(reason) {
  if (reason === undefined || reason === null) return 'No reason provided';
  let clean = String(reason).trim();
  if (clean.length > 300) {
    clean = clean.substring(0, 297) + '...';
  }
  // Sanitize simple XSS/script patterns
  return clean.replace(/[<>]/g, '');
}

/**
 * Checks if the confirm value is truthy (true or 'true').
 */
function isTruthyConfirm(value) {
  return value === true || value === 'true';
}

/**
 * Extracts the confirmation flag from body, query or headers.
 */
function getDangerousConfirm(req) {
  if (!req) return false;
  if (req.body && isTruthyConfirm(req.body.confirm)) return true;
  if (req.headers && isTruthyConfirm(req.headers['x-confirm-dangerous-action'])) return true;
  if (req.query && isTruthyConfirm(req.query.confirm)) return true;
  return false;
}

/**
 * Extracts and sanitizes the reason from body or query.
 */
function getDangerousReason(req) {
  if (!req) return 'No reason provided';
  const reason = (req.body && req.body.reason) || (req.query && req.query.reason);
  return sanitizeDeleteReason(reason);
}

/**
 * Express middleware or inline checker that requires confirmation.
 * Returns true if confirmed, otherwise writes audit failure log, sends error response and returns false.
 */
function requireDangerousConfirmation(req, res, actionName, resource, resourceId) {
  if (getDangerousConfirm(req)) {
    return true;
  }

  // Block the request
  const reason = getDangerousReason(req);
  auditFailure(
    req,
    'DANGEROUS_ACTION_BLOCKED',
    resource,
    resourceId || 'none',
    { action: actionName, reason: 'Missing confirmation', clientReason: reason },
    `Dangerous action blocked: ${actionName} requires confirmation`
  );

  res.status(400).json({
    success: false,
    message: 'Dangerous action confirmation required'
  });
  return false;
}

module.exports = {
  sanitizeDeleteReason,
  isTruthyConfirm,
  getDangerousConfirm,
  getDangerousReason,
  requireDangerousConfirmation
};
