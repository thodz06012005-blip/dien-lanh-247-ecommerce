import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const MAX_TEXT_FILE_BYTES = 2 * 1024 * 1024;
const PLACEHOLDER_PATTERN = /replace|change[_-]?me|placeholder|example|dummy|test[_-]?only|your[_-]/i;
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
  { name: 'jwt-token', regex: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/ },
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
      if (PLACEHOLDER_PATTERN.test(candidate) || PLACEHOLDER_PATTERN.test(line)) {
        continue;
      }
      findings.push({
        file: path.normalize(filePath),
        line: index + 1,
        rule: pattern.name,
      });
    }
  });
}

if (findings.length > 0) {
  console.error(`Secret scan failed with ${findings.length} high-confidence finding(s).`);
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.rule}]`);
  }
  console.error('Matched values are intentionally not printed. Rotate any exposed credential before removing it from history.');
  process.exit(1);
}

console.log('Secret scan passed: no high-confidence credentials were found in tracked files.');
