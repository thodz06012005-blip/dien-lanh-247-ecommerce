import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(repoRoot, 'assets', 'images', 'manifest.json');
const canonicalRoot = path.join(repoRoot, 'assets', 'images');
const strict = process.argv.includes('--strict');

const ignoredDirectories = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  'var',
]);
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.html']);
const imageExtensions = new Set(['.svg', '.avif', '.webp', '.png', '.jpg', '.jpeg', '.gif']);

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

if (!existsSync(manifestPath)) {
  console.error('Image audit failed: assets/images/manifest.json does not exist.');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
const keys = new Set();
const duplicateKeys = [];
const missingRequired = [];
const oversizedLocalFiles = [];
const documentedExternalSources = new Set();

for (const entry of entries) {
  if (keys.has(entry.key)) duplicateKeys.push(entry.key);
  keys.add(entry.key);
  if (entry.currentSource) documentedExternalSources.add(entry.currentSource);

  const targetFile = path.join(canonicalRoot, entry.targetFile);
  if (entry.requiredLocal && !existsSync(targetFile)) {
    missingRequired.push(entry.targetFile);
    continue;
  }
  if (existsSync(targetFile) && Number.isFinite(entry.maxBytes)) {
    const size = statSync(targetFile).size;
    if (size > entry.maxBytes) oversizedLocalFiles.push({ file: entry.targetFile, size, limit: entry.maxBytes });
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

for (const reference of localPublicReferences) {
  const canonicalPath = path.join(canonicalRoot, reference.publicPath.replace(/^\/images\//, ''));
  if (!existsSync(canonicalPath)) missingPublicTargets.push(reference);
}

console.log('IMAGE ASSET AUDIT');
console.log(`- Manifest entries: ${entries.length}`);
console.log(`- Canonical local images: ${localImages.length}`);
console.log(`- External image references: ${externalImageReferences.length}`);
console.log(`- Undocumented external references: ${undocumentedExternal.length}`);
console.log(`- Raw <img> occurrences outside OptimizedImage lines: ${rawImageElements.length}`);
console.log(`- Missing required local files: ${missingRequired.length}`);
console.log(`- Missing canonical targets for /images references: ${missingPublicTargets.length}`);
console.log(`- Oversized local files: ${oversizedLocalFiles.length}`);

function printItems(title, items, formatter, max = 30) {
  if (!items.length) return;
  console.log(`\n${title}`);
  items.slice(0, max).forEach((item) => console.log(`- ${formatter(item)}`));
  if (items.length > max) console.log(`- ... and ${items.length - max} more`);
}

printItems('Duplicate manifest keys', duplicateKeys, (item) => item);
printItems('Missing required local images', missingRequired, (item) => item);
printItems(
  'Oversized local images',
  oversizedLocalFiles,
  (item) => `${item.file}: ${item.size} bytes > ${item.limit} bytes`,
);
printItems(
  'Undocumented external image references',
  undocumentedExternal,
  (item) => `${item.file}:${item.line} ${item.url}`,
);
printItems(
  'Local /images references without canonical source file',
  missingPublicTargets,
  (item) => `${item.file}:${item.line} ${item.publicPath}`,
);
printItems(
  'Raw image element review list',
  rawImageElements,
  (item) => `${item.file}:${item.line}`,
);

const hardFailures = duplicateKeys.length + missingRequired.length + oversizedLocalFiles.length;
const strictFailures = undocumentedExternal.length + missingPublicTargets.length;

if (hardFailures > 0 || (strict && strictFailures > 0)) {
  console.error(`\nImage audit failed with ${hardFailures + (strict ? strictFailures : 0)} blocking issue(s).`);
  process.exit(1);
}

console.log('\nImage audit passed. Warnings above remain replacement work unless --strict is used.');
