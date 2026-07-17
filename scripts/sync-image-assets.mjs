import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(repoRoot, 'assets', 'images');
const manifestPath = path.join(sourceRoot, 'manifest.json');
const destinations = [
  path.join(repoRoot, 'frontend-user', 'public', 'images'),
  path.join(repoRoot, 'frontend-admin', 'public', 'images'),
];

function hashFile(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

if (!existsSync(manifestPath)) {
  console.error('Image sync failed: assets/images/manifest.json does not exist.');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
const sourceFiles = [];
const missingRequired = [];

for (const entry of entries) {
  const relativeFile = entry.tepCanonical || entry.targetFile;
  if (!relativeFile) continue;
  const sourceFile = path.join(sourceRoot, relativeFile);
  if (!existsSync(sourceFile)) {
    if (entry.requiredLocal) missingRequired.push(relativeFile);
    continue;
  }
  if (!statSync(sourceFile).isFile()) continue;
  sourceFiles.push({ sourceFile, relativeFile, aliases: Array.isArray(entry.aliases) ? entry.aliases : [] });
}

if (missingRequired.length > 0) {
  console.error('Image sync failed: required canonical images are missing.');
  missingRequired.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

let copied = 0;
let unchanged = 0;

function copyIfChanged(sourceFile, destinationFile) {
  mkdirSync(path.dirname(destinationFile), { recursive: true });
  if (existsSync(destinationFile) && hashFile(sourceFile) === hashFile(destinationFile)) {
    unchanged += 1;
    return;
  }
  copyFileSync(sourceFile, destinationFile);
  copied += 1;
}

for (const item of sourceFiles) {
  for (const destinationRoot of destinations) {
    copyIfChanged(item.sourceFile, path.join(destinationRoot, item.relativeFile));
    for (const alias of item.aliases) {
      copyIfChanged(item.sourceFile, path.join(destinationRoot, alias));
    }
  }
}

console.log('IMAGE ASSET SYNC');
console.log(`- Manifest entries: ${entries.length}`);
console.log(`- Canonical files found: ${sourceFiles.length}`);
console.log(`- Files copied or updated: ${copied}`);
console.log(`- Files already identical: ${unchanged}`);
console.log('- No destination file was deleted.');
