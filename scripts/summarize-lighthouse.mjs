import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const reportPaths = process.argv.slice(2);
if (!reportPaths.length) {
  console.error('Usage: node scripts/summarize-lighthouse.mjs <report.json> [...]');
  process.exit(1);
}

function score(report, category) {
  const value = report.categories?.[category]?.score;
  return typeof value === 'number' ? Math.round(value * 100) : null;
}

function numeric(report, auditId, divisor = 1, digits = 0) {
  const value = report.audits?.[auditId]?.numericValue;
  return typeof value === 'number' ? Number((value / divisor).toFixed(digits)) : null;
}

const rows = reportPaths.map((reportPath) => {
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  const label = path.basename(reportPath, path.extname(reportPath)).replace(/^lighthouse-/, '');
  return {
    label,
    url: report.finalDisplayedUrl || report.finalUrl || report.requestedUrl,
    performance: score(report, 'performance'),
    accessibility: score(report, 'accessibility'),
    bestPractices: score(report, 'best-practices'),
    seo: score(report, 'seo'),
    fcpSeconds: numeric(report, 'first-contentful-paint', 1_000, 2),
    lcpSeconds: numeric(report, 'largest-contentful-paint', 1_000, 2),
    speedIndexSeconds: numeric(report, 'speed-index', 1_000, 2),
    totalBlockingTimeMs: numeric(report, 'total-blocking-time'),
    cls: numeric(report, 'cumulative-layout-shift', 1, 3),
    transferKilobytes: numeric(report, 'total-byte-weight', 1_024, 1),
  };
});

const generatedAt = new Date().toISOString();
const payload = {
  generatedAt,
  note: 'INP is a field Core Web Vital and must be collected through real-user monitoring; Lighthouse reports TBT as the lab responsiveness proxy.',
  routes: rows,
};
writeFileSync('phase13-performance-report.json', `${JSON.stringify(payload, null, 2)}\n`);

const tableRows = rows.map((row) => [
  row.label,
  row.performance ?? 'N/A',
  row.accessibility ?? 'N/A',
  row.bestPractices ?? 'N/A',
  row.seo ?? 'N/A',
  row.fcpSeconds ?? 'N/A',
  row.lcpSeconds ?? 'N/A',
  row.totalBlockingTimeMs ?? 'N/A',
  row.cls ?? 'N/A',
  row.transferKilobytes ?? 'N/A',
].join(' | '));

const markdown = [
  '# Phase 13 Performance Report',
  '',
  `Generated: ${generatedAt}`,
  '',
  '| Route profile | Performance | Accessibility | Best Practices | SEO | FCP (s) | LCP (s) | TBT (ms) | CLS | Transfer (KB) |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
  ...tableRows.map((row) => `| ${row} |`),
  '',
  '## Acceptance targets',
  '',
  '- Mobile Performance ≥ 85; desktop Performance ≥ 90.',
  '- Accessibility and Best Practices ≥ 90; SEO ≥ 95.',
  '- LCP ≤ 2.5 s; CLS ≤ 0.1; mobile TBT ≤ 300 ms; desktop TBT ≤ 200 ms.',
  '- INP is not a reliable Lighthouse lab metric. Production INP must come from the Phase 13 real-user monitoring hook.',
  '',
].join('\n');
writeFileSync('phase13-performance-report.md', markdown);
console.log(markdown);
