/**
 * Mock API Login Rate Limiter (Plan 13)
 * In-memory brute force protection.
 */

const WINDOW_MS = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 900000; // Default 15 mins
const MAX_PER_EMAIL = Number(process.env.LOGIN_RATE_LIMIT_MAX_PER_EMAIL) || 5;
const MAX_PER_IP = Number(process.env.LOGIN_RATE_LIMIT_MAX_PER_IP) || 20;
const MAX_PER_IP_EMAIL = Number(process.env.LOGIN_RATE_LIMIT_MAX_PER_IP_EMAIL) || 5;
const LOCK_MS = Number(process.env.LOGIN_RATE_LIMIT_LOCK_MS) || 900000; // Default 15 mins
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';

// Stores failed attempts: Array of { timestamp: number, ip: string, email: string }
let failedAttempts = [];

const normalizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

const getClientIp = (req) => {
  if (TRUST_PROXY && req.headers['x-forwarded-for']) {
    const ips = req.headers['x-forwarded-for'].split(',');
    return ips[0].trim();
  }
  return req.ip || (req.socket && req.socket.remoteAddress) || (req.connection && req.connection.remoteAddress) || '127.0.0.1';
};

const clearExpiredAttempts = () => {
  const now = Date.now();
  // Keep attempts that occurred within window duration OR within lock duration (since a lock remains active for LOCK_MS from the latest attempt)
  const maxKeepAge = Math.max(WINDOW_MS, LOCK_MS);
  failedAttempts = failedAttempts.filter(attempt => now - attempt.timestamp < maxKeepAge);
};

const checkLoginRateLimit = (req, email) => {
  clearExpiredAttempts();
  const ip = getClientIp(req);
  const normEmail = normalizeEmail(email);
  const now = Date.now();

  // Find all active failed attempts for this email, IP, and combination within the window
  const emailAttempts = failedAttempts.filter(a => a.email === normEmail && now - a.timestamp < WINDOW_MS);
  const ipAttempts = failedAttempts.filter(a => a.ip === ip && now - a.timestamp < WINDOW_MS);
  const comboAttempts = failedAttempts.filter(a => a.ip === ip && a.email === normEmail && now - a.timestamp < WINDOW_MS);

  let isLocked = false;
  let latestTimestamp = 0;

  if (emailAttempts.length >= MAX_PER_EMAIL) {
    isLocked = true;
    latestTimestamp = Math.max(latestTimestamp, ...emailAttempts.map(a => a.timestamp));
  }
  if (ipAttempts.length >= MAX_PER_IP) {
    isLocked = true;
    latestTimestamp = Math.max(latestTimestamp, ...ipAttempts.map(a => a.timestamp));
  }
  if (comboAttempts.length >= MAX_PER_IP_EMAIL) {
    isLocked = true;
    latestTimestamp = Math.max(latestTimestamp, ...comboAttempts.map(a => a.timestamp));
  }

  if (isLocked) {
    const elapsedSinceLatest = now - latestTimestamp;
    if (elapsedSinceLatest < LOCK_MS) {
      const retryAfterSeconds = Math.ceil((LOCK_MS - elapsedSinceLatest) / 1000);
      return { locked: true, retryAfterSeconds };
    }
  }

  return { locked: false, retryAfterSeconds: 0 };
};

const recordLoginFailure = (req, email) => {
  const ip = getClientIp(req);
  const normEmail = normalizeEmail(email);
  failedAttempts.push({
    timestamp: Date.now(),
    ip,
    email: normEmail
  });
  clearExpiredAttempts();
};

const recordLoginSuccess = (req, email) => {
  const ip = getClientIp(req);
  const normEmail = normalizeEmail(email);
  
  // Reset attempts for email and IP + email combination
  failedAttempts = failedAttempts.filter(a => a.email !== normEmail && !(a.ip === ip && a.email === normEmail));
  clearExpiredAttempts();
};

module.exports = {
  normalizeEmail,
  getClientIp,
  checkLoginRateLimit,
  recordLoginFailure,
  recordLoginSuccess,
  clearExpiredAttempts,
  failedAttempts
};
