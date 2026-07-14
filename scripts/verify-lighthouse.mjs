import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const reportPath = resolve(process.argv[2] || 'lighthouse-report.json');
const report = JSON.parse(readFileSync(reportPath, 'utf8'));

const thresholds = {
  performance: 0.65,
  accessibility: 0.85,
  'best-practices': 0.8,
  seo: 0.8,
};

let hasFailure = false;

console.log('Lighthouse acceptance results');
console.log('=============================');

for (const [category, threshold] of Object.entries(thresholds)) {
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

const failedAudits = Object.values(report.audits || {})
  .filter((audit) => audit?.scoreDisplayMode === 'binary' && audit.score === 0)
  .map((audit) => audit.title)
  .slice(0, 10);

if (failedAudits.length > 0) {
  console.log('\nTop binary audit findings:');
  for (const title of failedAudits) console.log(`- ${title}`);
}

if (hasFailure) {
  console.error('\nLighthouse acceptance thresholds were not met.');
  process.exit(1);
}

console.log('\nAll Lighthouse acceptance thresholds passed.');
