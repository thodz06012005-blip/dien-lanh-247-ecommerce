import { readFileSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const dist = path.resolve(process.argv[2] || 'frontend-user/dist');
const manifestPath = path.join(dist, '.vite', 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const entryKey = Object.keys(manifest).find((key) => manifest[key]?.isEntry);

if (!entryKey) {
  console.error('Unable to locate the customer application entry in the Vite manifest.');
  process.exit(1);
}

const visited = new Set();
const initialFiles = new Set();

function collect(key) {
  if (visited.has(key)) return;
  visited.add(key);
  const record = manifest[key];
  if (!record) return;
  if (record.file) initialFiles.add(record.file);
  for (const css of record.css || []) initialFiles.add(css);
  for (const importedKey of record.imports || []) collect(importedKey);
}

collect(entryKey);

function gzipSize(relativePath) {
  const buffer = readFileSync(path.join(dist, relativePath));
  return gzipSync(buffer, { level: 9 }).byteLength;
}

const initialJs = [...initialFiles].filter((file) => file.endsWith('.js'));
const initialCss = [...initialFiles].filter((file) => file.endsWith('.css'));
const initialJsGzip = initialJs.reduce((total, file) => total + gzipSize(file), 0);
const initialCssGzip = initialCss.reduce((total, file) => total + gzipSize(file), 0);
const budgets = {
  initialJsGzip: 250 * 1024,
  initialCssGzip: 80 * 1024,
  individualImage: 250 * 1024,
  individualJsMinified: 350 * 1024,
};

let failed = false;
function check(label, actual, maximum) {
  const passed = actual <= maximum;
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}: ${(actual / 1024).toFixed(1)} KB (maximum ${(maximum / 1024).toFixed(1)} KB)`);
  if (!passed) failed = true;
}

console.log('Phase 13 customer build budgets');
console.log('================================');
check('Initial JavaScript gzip', initialJsGzip, budgets.initialJsGzip);
check('Initial CSS gzip', initialCssGzip, budgets.initialCssGzip);

const assetsDirectory = path.join(dist, 'assets');
for (const file of readdirSync(assetsDirectory)) {
  const fullPath = path.join(assetsDirectory, file);
  const size = statSync(fullPath).size;
  if (/\.(?:avif|webp|png|jpe?g)$/i.test(file)) {
    check(`Image ${file}`, size, budgets.individualImage);
  }
  if (/\.js$/i.test(file)) {
    check(`JavaScript chunk ${file}`, size, budgets.individualJsMinified);
  }
}

console.log('\nInitial entry files:');
for (const file of [...initialFiles].sort()) {
  console.log(`- ${file}: ${(gzipSize(file) / 1024).toFixed(1)} KB gzip`);
}

if (failed) {
  console.error('\nOne or more Phase 13 build budgets were exceeded.');
  process.exit(1);
}

console.log('\nAll Phase 13 customer build budgets passed.');
