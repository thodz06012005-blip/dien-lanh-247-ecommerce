const { spawnSync } = require('node:child_process');
const { readFileSync, writeFileSync, unlinkSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');

const sourcePath = resolve(__dirname, 'test_technician_rules.js');
const temporaryPath = join(tmpdir(), `dien-lanh-247-technician-rules-${process.pid}.js`);

const preferredDate = new Date();
preferredDate.setDate(preferredDate.getDate() + 7);
const preferredDateValue = preferredDate.toISOString().slice(0, 10);

const source = readFileSync(sourcePath, 'utf8');
const normalizedSource = source.replaceAll("'2026-07-10'", JSON.stringify(preferredDateValue));

if (normalizedSource === source) {
  console.error('Technician test runner could not locate the legacy fixed-date fixtures.');
  process.exit(1);
}

try {
  writeFileSync(temporaryPath, normalizedSource, 'utf8');
  const result = spawnSync(process.execPath, [temporaryPath], {
    cwd: resolve(__dirname, '..'),
    env: process.env,
    stdio: 'inherit'
  });

  process.exitCode = result.status ?? 1;
} finally {
  try {
    unlinkSync(temporaryPath);
  } catch {
    // The temporary file may not exist when execution fails before it is written.
  }
}
