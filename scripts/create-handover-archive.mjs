import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(repoRoot, 'artifacts');
const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
const outputFile = path.join(outputDir, `dien-lanh-247-ma-nguon-gd15-${date}.zip`);

mkdirSync(outputDir, { recursive: true });
if (existsSync(outputFile)) rmSync(outputFile);

const head = execFileSync('git', ['rev-parse', '--verify', 'HEAD'], {
  cwd: repoRoot,
  encoding: 'utf8',
}).trim();

execFileSync(
  'git',
  [
    'archive',
    '--format=zip',
    `--output=${outputFile}`,
    '--prefix=dien-lanh-247-ecommerce/',
    head,
  ],
  { cwd: repoRoot, stdio: 'inherit' },
);

console.log(`Handover archive created from tracked files only: ${path.relative(repoRoot, outputFile)}`);
console.log(`Commit: ${head}`);
console.log('Excluded automatically: .git, node_modules, ignored secrets, local backups and untracked runtime files.');
