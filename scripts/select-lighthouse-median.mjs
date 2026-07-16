import { copyFileSync, readFileSync } from 'node:fs';

const [outputPath, ...inputPaths] = process.argv.slice(2);
if (!outputPath || inputPaths.length === 0 || inputPaths.length % 2 === 0) {
  console.error(
    'Usage: node scripts/select-lighthouse-median.mjs <output.json> <run1.json> [run2.json run3.json ...]',
  );
  process.exit(1);
}

function metric(report, auditId) {
  return Number(report.audits?.[auditId]?.numericValue ?? Number.POSITIVE_INFINITY);
}

const runs = inputPaths.map((filePath) => {
  const report = JSON.parse(readFileSync(filePath, 'utf8'));
  return {
    filePath,
    report,
    performance: Number(report.categories?.performance?.score ?? 0) * 100,
    lcpMs: metric(report, 'largest-contentful-paint'),
    tbtMs: metric(report, 'total-blocking-time'),
    fcpMs: metric(report, 'first-contentful-paint'),
  };
});

// Pick the median by performance score. LCP then TBT provide deterministic
// tie-breaking while preserving an actual Lighthouse report for verification.
runs.sort(
  (left, right) =>
    left.performance - right.performance ||
    right.lcpMs - left.lcpMs ||
    right.tbtMs - left.tbtMs,
);
const selected = runs[Math.floor(runs.length / 2)];
copyFileSync(selected.filePath, outputPath);

console.log('Lighthouse repeated-run results:');
for (const run of runs) {
  console.log(
    `- ${run.filePath}: performance=${run.performance.toFixed(0)}, ` +
      `FCP=${(run.fcpMs / 1000).toFixed(2)}s, ` +
      `LCP=${(run.lcpMs / 1000).toFixed(2)}s, TBT=${run.tbtMs.toFixed(0)}ms`,
  );
}
console.log(`Selected median report: ${selected.filePath} -> ${outputPath}`);
