import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const MAX_TEXT_FILE_BYTES = 2 * 1024 * 1024;
const PLACEHOLDER_PATTERN =
  /replace|change[_-]?me|placeholder|example|dummy|test[_-]?only|your[_-]|generate[_-]?secure|secret[_-]?manager|do[_-]?not[_-]?leak/i;
const EXPLICIT_TEMPLATE_PATTERN = /<[^>]+>|\$\{[A-Z0-9_:.-]+\}/i;
const GENERIC_SAMPLE_VALUE =
  /^(?:user|username|password|host|database|secret|secure_password)$/i;
const NON_PRODUCTION_FIXTURE_PATH =
  /(^|\/)(?:\.github\/workflows|test|tests|docs\/phase-[0-9]+)(\/|$)/i;
const NON_PRODUCTION_FIXTURE_VALUE =
  /^(?:ci(?:[_-]|$)|test(?:[_-]|$)|phase(?:[0-9]+|seven)|changedphase|otheraccount|wrongpassword)/i;
const LOCAL_DATABASE_TARGET = /@(127\.0\.0\.1|localhost)(?::[0-9]+)?\//i;
const RUNTIME_DRILL_PATH = /^deploy\/scripts\/phase15-production-drill\.sh$/;
const RUNTIME_GENERATOR = /\$\(\s*openssl\s+rand\b/i;
const SKIPPED_PATHS = [
  /(^|\/)package-lock\.json$/,
  /(^|\/)node_modules\//,
  /(^|\/)(dist|build|coverage)\//,
  /\.(?:png|jpe?g|gif|webp|avif|ico|pdf|zip|rar|woff2?|ttf|eot)$/i,
];

const patterns = [
  { name: 'private-key', regex: /-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----/ },
  { name: 'aws-access-key', regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'github-token', regex: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/ },
  { name: 'google-api-key', regex: /\bAIza[0-9A-Za-z_-]{30,}\b/ },
  { name: 'slack-token', regex: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/ },
  { name: 'stripe-live-key', regex: /\bsk_live_[A-Za-z0-9]{20,}\b/ },
  {
    name: 'jwt-token',
    regex: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/,
  },
  {
    name: 'hardcoded-sensitive-assignment',
    regex:
      /(?:password|passwd|secret|refresh[_-]?token|access[_-]?token|api[_-]?key|authorization)\s*[:=]\s*['"]([^'"]{12,})['"]/i,
  },
  {
    name: 'credentialed-database-url',
    regex: /\b(?:mysql|postgres(?:ql)?):\/\/[^\s:@]+:([^\s@]+)@/i,
  },
];

function trackedFiles() {
  const output = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' });
  return output.split('\0').filter(Boolean);
}

function shouldSkip(filePath) {
  return SKIPPED_PATHS.some((pattern) => pattern.test(filePath));
}

function isPlaceholder(filePath, line, candidate, ruleName) {
  if (
    PLACEHOLDER_PATTERN.test(candidate) ||
    EXPLICIT_TEMPLATE_PATTERN.test(candidate) ||
    GENERIC_SAMPLE_VALUE.test(candidate)
  ) {
    return true;
  }

  if (
    ruleName === 'hardcoded-sensitive-assignment' &&
    RUNTIME_DRILL_PATH.test(filePath) &&
    RUNTIME_GENERATOR.test(line)
  ) {
    return true;
  }

  if (NON_PRODUCTION_FIXTURE_PATH.test(filePath)) {
    if (NON_PRODUCTION_FIXTURE_VALUE.test(candidate)) return true;
    if (
      ruleName === 'credentialed-database-url' &&
      LOCAL_DATABASE_TARGET.test(line)
    ) {
      return true;
    }
  }

  return (
    /\.env(?:\.[^/]+)?\.example$/i.test(filePath) &&
    (PLACEHOLDER_PATTERN.test(line) || EXPLICIT_TEMPLATE_PATTERN.test(line))
  );
}

const findings = [];
for (const filePath of trackedFiles()) {
  if (shouldSkip(filePath)) continue;
  let stats;
  try {
    stats = statSync(filePath);
  } catch {
    continue;
  }
  if (!stats.isFile() || stats.size > MAX_TEXT_FILE_BYTES) continue;

  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    continue;
  }
  if (content.includes('\u0000')) continue;

  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      const match = line.match(pattern.regex);
      if (!match) continue;
      const candidate = match[1] || match[0];
      if (isPlaceholder(filePath, line, candidate, pattern.name)) continue;
      findings.push({
        file: path.normalize(filePath),
        line: index + 1,
        rule: pattern.name,
      });
    }
  });
}

if (findings.length > 0) {
  console.error(
    `Secret scan failed with ${findings.length} high-confidence finding(s).`,
  );
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.rule}]`);
  }
  console.error(
    'Matched values are intentionally not printed. Rotate any exposed credential before removing it from history.',
  );
  process.exit(1);
}

console.log(
  'Secret scan passed: no high-confidence credentials were found in tracked files.',
);
