import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(repoRoot, 'assets', 'images');
const destinations = [
  path.join(repoRoot, 'frontend-user', 'public', 'images'),
  path.join(repoRoot, 'frontend-admin', 'public', 'images'),
];
const supportedExtensions = new Set(['.svg', '.avif', '.webp', '.png', '.jpg', '.jpeg']);

function walkImages(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory)) {
    const absolutePath = path.join(directory, entry);
    const stat = statSync(absolutePath);
    if (stat.isDirectory()) files.push(...walkImages(absolutePath));
    else if (supportedExtensions.has(path.extname(entry).toLowerCase())) files.push(absolutePath);
  }
  return files;
}

const sourceFiles = walkImages(sourceRoot);
let copied = 0;

for (const sourceFile of sourceFiles) {
  const relativePath = path.relative(sourceRoot, sourceFile);
  for (const destinationRoot of destinations) {
    const destinationFile = path.join(destinationRoot, relativePath);
    mkdirSync(path.dirname(destinationFile), { recursive: true });
    copyFileSync(sourceFile, destinationFile);
    copied += 1;
  }
}

console.log(`Image asset sync completed: ${sourceFiles.length} source file(s), ${copied} copy operation(s).`);
