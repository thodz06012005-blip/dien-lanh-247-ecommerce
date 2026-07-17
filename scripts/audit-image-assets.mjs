import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(repoRoot, 'assets', 'images', 'manifest.json');
const canonicalRoot = path.join(repoRoot, 'assets', 'images');
const strict = process.argv.includes('--strict');

const ignoredDirectories = new Set([
  '.git', 'node_modules', 'dist', 'build', 'coverage', 'var', '.vite', '.cache', 'playwright-report', 'test-results',
]);
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.html', '.css']);
const imageExtensions = new Set(['.svg', '.avif', '.webp', '.png', '.jpg', '.jpeg', '.gif']);
const allowedImageName = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:svg|avif|webp|png|jpe?g|gif)$/;

function walk(directory, predicate) {
  const results = [];
  if (!existsSync(directory)) return results;
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) continue;
    const absolutePath = path.join(directory, entry);
    const stat = statSync(absolutePath);
    if (stat.isDirectory()) results.push(...walk(absolutePath, predicate));
    else if (predicate(absolutePath, stat)) results.push(absolutePath);
  }
  return results;
}

function normalize(value) {
  return value.replaceAll('\\', '/');
}

function hashFile(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

if (!existsSync(manifestPath)) {
  console.error('Image audit failed: assets/images/manifest.json does not exist.');
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch (error) {
  console.error(`Image audit failed: invalid manifest JSON: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
const keys = new Set();
const targets = new Set();
const duplicateKeys = [];
const duplicateTargets = [];
const missingRequired = [];
const oversizedLocalFiles = [];
const invalidNames = [];
const missingAlt = [];
const documentedExternalSources = new Set();
const manifestLocalTargets = new Set();
const localHashMap = new Map();

for (const entry of entries) {
  const key = entry.assetKey || entry.key;
  const target = entry.tepCanonical || entry.targetFile;
  const maxBytes = entry.dungLuongToiDa ?? entry.maxBytes;
  const alt = entry.alt || entry.tenHienThi;
  const source = entry.nguonCu || entry.currentSource;

  if (!key) duplicateKeys.push('[missing-key]');
  else if (keys.has(key)) duplicateKeys.push(key);
  else keys.add(key);

  if (!target) {
    invalidNames.push({ file: '[missing-target]', reason: `entry ${key || '[missing-key]'}` });
    continue;
  }

  if (targets.has(target)) duplicateTargets.push(target);
  targets.add(target);
  manifestLocalTargets.add(normalize(target));

  if (source) documentedExternalSources.add(source);
  if (!alt) missingAlt.push(key || target);

  const baseName = path.basename(target);
  if (!allowedImageName.test(baseName) || /[^\x00-\x7F]/.test(baseName) || /\s/.test(baseName)) {
    invalidNames.push({ file: target, reason: 'Tên file phải là tiếng Việt không dấu dạng kebab-case.' });
  }
  if (/^(?:image|img|anh)[-_]?\d+\./i.test(baseName) || /final[-_]?final|new[-_]?new/i.test(baseName)) {
    invalidNames.push({ file: target, reason: 'Tên file quá chung chung hoặc có hậu tố phiên bản không rõ nghĩa.' });
  }

  const targetFile = path.join(canonicalRoot, target);
  if (entry.requiredLocal && !existsSync(targetFile)) {
    missingRequired.push(target);
    continue;
  }
  if (existsSync(targetFile)) {
    const size = statSync(targetFile).size;
    if (Number.isFinite(maxBytes) && size > maxBytes) {
      oversizedLocalFiles.push({ file: target, size, limit: maxBytes });
    }
    const hash = hashFile(targetFile);
    localHashMap.set(hash, [...(localHashMap.get(hash) ?? []), target]);
  }
}

const textFiles = walk(repoRoot, (file) => sourceExtensions.has(path.extname(file).toLowerCase()));
const externalImageReferences = [];
const rawImageElements = [];
const localPublicReferences = [];

const externalPattern = /https:\/\/(?:images\.)?(?:unsplash\.com|pexels\.com|cloudinary\.com|res\.cloudinary\.com)[^\s'"`)]+/g;
const localPattern = /["'`](\/images\/[^"'`?\s)]+)/g;

for (const file of textFiles) {
  const relativeFile = normalize(path.relative(repoRoot, file));
  if (relativeFile === 'assets/images/manifest.json') continue;
  const content = readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const match of line.matchAll(externalPattern)) {
      const url = match[0].replace(/[),.;]+$/, '');
      const documented = [...documentedExternalSources].some((source) => url.startsWith(source));
      externalImageReferences.push({ file: relativeFile, line: index + 1, url, documented });
    }
    for (const match of line.matchAll(localPattern)) {
      localPublicReferences.push({ file: relativeFile, line: index + 1, publicPath: match[1] });
    }
    if (/<img\b/i.test(line) && !/OptimizedImage/.test(line)) {
      rawImageElements.push({ file: relativeFile, line: index + 1 });
    }
  });
}

const localImages = walk(canonicalRoot, (file) => imageExtensions.has(path.extname(file).toLowerCase()));
const undocumentedExternal = externalImageReferences.filter((item) => !item.documented);
const missingPublicTargets = [];
const unregisteredLocalFiles = [];

for (const reference of localPublicReferences) {
  const canonicalRelative = normalize(reference.publicPath.replace(/^\/images\//, ''));
  const canonicalPath = path.join(canonicalRoot, canonicalRelative);
  if (!existsSync(canonicalPath)) missingPublicTargets.push(reference);
}

for (const file of localImages) {
  const relative = normalize(path.relative(canonicalRoot, file));
  if (!manifestLocalTargets.has(relative)) unregisteredLocalFiles.push(relative);
}

const duplicateLocalHashes = [...localHashMap.entries()]
  .filter(([, files]) => files.length > 1)
  .map(([hash, files]) => ({ hash, files }));

console.log('IMAGE ASSET AUDIT');
console.log(`- Manifest entries: ${entries.length}`);
console.log(`- Canonical local images: ${localImages.length}`);
console.log(`- External image references: ${externalImageReferences.length}`);
console.log(`- Undocumented external references: ${undocumentedExternal.length}`);
console.log(`- Raw <img> review entries: ${rawImageElements.length}`);
console.log(`- Missing required local files: ${missingRequired.length}`);
console.log(`- Missing canonical targets for /images references: ${missingPublicTargets.length}`);
console.log(`- Oversized local files: ${oversizedLocalFiles.length}`);
console.log(`- Duplicate manifest keys: ${duplicateKeys.length}`);
console.log(`- Duplicate manifest targets: ${duplicateTargets.length}`);
console.log(`- Invalid image names: ${invalidNames.length}`);
console.log(`- Missing alt metadata: ${missingAlt.length}`);
console.log(`- Local files without manifest entry: ${unregisteredLocalFiles.length}`);
console.log(`- Duplicate local SHA-256 groups: ${duplicateLocalHashes.length}`);

function printItems(title, items, formatter, max = 30) {
  if (!items.length) return;
  console.log(`\n${title}`);
  items.slice(0, max).forEach((item) => console.log(`- ${formatter(item)}`));
  if (items.length > max) console.log(`- ... and ${items.length - max} more`);
}

printItems('Duplicate manifest keys', duplicateKeys, (item) => item);
printItems('Duplicate manifest targets', duplicateTargets, (item) => item);
printItems('Missing required local images', missingRequired, (item) => item);
printItems('Missing alt metadata', missingAlt, (item) => item);
printItems('Invalid image names', invalidNames, (item) => `${item.file}: ${item.reason}`);
printItems('Local files without manifest entry', unregisteredLocalFiles, (item) => item);
printItems('Duplicate local SHA-256 groups', duplicateLocalHashes, (item) => item.files.join(', '));
printItems('Oversized local images', oversizedLocalFiles, (item) => `${item.file}: ${item.size} bytes > ${item.limit} bytes`);
printItems('Undocumented external image references', undocumentedExternal, (item) => `${item.file}:${item.line} ${item.url}`);
printItems('Local /images references without canonical source file', missingPublicTargets, (item) => `${item.file}:${item.line} ${item.publicPath}`);
printItems('Raw image element review list', rawImageElements, (item) => `${item.file}:${item.line}`);

const hardFailures = duplicateKeys.length + duplicateTargets.length + missingRequired.length + oversizedLocalFiles.length;
const strictFailures = undocumentedExternal.length + missingPublicTargets.length + invalidNames.length + missingAlt.length + unregisteredLocalFiles.length;

if (hardFailures > 0 || (strict && strictFailures > 0)) {
  console.error(`\nImage audit failed with ${hardFailures + (strict ? strictFailures : 0)} blocking issue(s).`);
  process.exit(1);
}

console.log('\nImage audit passed. Warnings remain review work unless --strict is used.');
