import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const reportPath = resolve(process.argv[2] || 'lighthouse-report.json');
const profileArgument = process.argv.find((argument) => argument.startsWith('--profile='));
const profile = profileArgument?.split('=')[1] || 'legacy';
const report = JSON.parse(readFileSync(reportPath, 'utf8'));

const profiles = {
  legacy: {
    categories: { performance: 0.65, accessibility: 0.85, 'best-practices': 0.8, seo: 0.8 },
    metrics: {},
  },
  mobile: {
    categories: { performance: 0.85, accessibility: 0.9, 'best-practices': 0.9, seo: 0.95 },
    metrics: {
      'largest-contentful-paint': 2_500,
      'cumulative-layout-shift': 0.1,
      'total-blocking-time': 300,
    },
  },
  desktop: {
    categories: { performance: 0.9, accessibility: 0.9, 'best-practices': 0.9, seo: 0.95 },
    metrics: {
      'largest-contentful-paint': 2_500,
      'cumulative-layout-shift': 0.1,
      'total-blocking-time': 200,
    },
  },
};

const selected = profiles[profile];
if (!selected) {
  console.error(`Unknown Lighthouse profile: ${profile}`);
  process.exit(1);
}

let hasFailure = false;
console.log(`Lighthouse acceptance results (${profile})`);
console.log('========================================');

for (const [category, threshold] of Object.entries(selected.categories)) {
  const score = report.categories?.[category]?.score;
  if (typeof score !== 'number') {
    console.error(`Missing Lighthouse category: ${category}`);
    hasFailure = true;
    continue;
  }

  const percentage = Math.round(score * 100);
  const required = Math.round(threshold * 100);
  const passed = score >= threshold;
  console.log(`${passed ? 'PASS' : 'FAIL'} ${category}: ${percentage} (required ${required})`);
  if (!passed) hasFailure = true;
}

for (const [auditId, maximum] of Object.entries(selected.metrics)) {
  const audit = report.audits?.[auditId];
  const value = audit?.numericValue;
  if (typeof value !== 'number') {
    console.error(`Missing Lighthouse metric: ${auditId}`);
    hasFailure = true;
    continue;
  }

  const normalizedValue = auditId === 'cumulative-layout-shift' ? value : Math.round(value);
  const passed = value <= maximum;
  console.log(`${passed ? 'PASS' : 'FAIL'} ${audit.title}: ${normalizedValue} (maximum ${maximum})`);
  if (!passed) hasFailure = true;
}

for (const auditId of ['document-title', 'meta-description', 'canonical', 'robots-txt', 'image-size-responsive']) {
  const audit = report.audits?.[auditId];
  if (!audit || audit.scoreDisplayMode === 'notApplicable') continue;
  if (audit.score !== 1) {
    console.error(`FAIL priority audit: ${audit.title || auditId}`);
    hasFailure = true;
  }
}

const failedAudits = Object.values(report.audits || {})
  .filter((audit) => audit?.scoreDisplayMode === 'binary' && audit.score === 0)
  .map((audit) => audit.title)
  .slice(0, 12);

if (failedAudits.length > 0) {
  console.log('\nTop binary audit findings:');
  for (const title of failedAudits) console.log(`- ${title}`);
}

if (hasFailure) {
  console.error('\nLighthouse acceptance thresholds were not met.');
  process.exit(1);
}

console.log('\nAll Lighthouse acceptance thresholds passed.');
