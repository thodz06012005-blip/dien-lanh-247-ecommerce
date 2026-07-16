import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  closeSync,
  createReadStream,
  createWriteStream,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function sha256File(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function removeExpiredBackups(directory, retentionDays) {
  const cutoff = Date.now() - retentionDays * 86_400_000;
  for (const fileName of readdirSync(directory)) {
    if (!/\.sql\.gz(?:\.sha256)?$/.test(fileName)) continue;
    const filePath = path.join(directory, fileName);
    if (statSync(filePath).mtimeMs < cutoff) rmSync(filePath, { force: true });
  }
}

const databaseUrl = new URL(requiredEnvironment('DATABASE_URL'));
if (!['mysql:', 'mariadb:'].includes(databaseUrl.protocol)) {
  throw new Error('DATABASE_URL must use mysql:// or mariadb:// for this backup utility.');
}

const databaseName = safeDecode(databaseUrl.pathname.replace(/^\//, ''));
if (!databaseName) throw new Error('DATABASE_URL must include a database name.');

const backupDirectory = path.resolve(
  process.env.BACKUP_DIRECTORY?.trim() || 'var/backups',
);
const retentionDays = Math.max(
  1,
  Math.min(365, Number(process.env.BACKUP_RETENTION_DAYS || 14)),
);
mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });

const baseName = `${databaseName}-${timestamp()}`;
const sqlPath = path.join(backupDirectory, `${baseName}.sql`);
const gzipPath = `${sqlPath}.gz`;
const checksumPath = `${gzipPath}.sha256`;
const outputFd = openSync(sqlPath, 'w', 0o600);

const result = spawnSync(
  process.env.MYSQLDUMP_BIN || 'mysqldump',
  [
    '--host',
    databaseUrl.hostname,
    '--port',
    databaseUrl.port || '3306',
    '--user',
    safeDecode(databaseUrl.username),
    '--single-transaction',
    '--quick',
    '--routines',
    '--triggers',
    '--events',
    '--hex-blob',
    '--default-character-set=utf8mb4',
    '--no-tablespaces',
    databaseName,
  ],
  {
    env: {
      ...process.env,
      MYSQL_PWD: safeDecode(databaseUrl.password),
    },
    stdio: ['ignore', outputFd, 'pipe'],
    encoding: 'utf8',
  },
);
closeSync(outputFd);

if (result.error || result.status !== 0) {
  rmSync(sqlPath, { force: true });
  const reason = result.error?.message || result.stderr?.trim() || 'mysqldump failed';
  throw new Error(`Database backup failed: ${reason.slice(0, 500)}`);
}

await pipeline(
  createReadStream(sqlPath),
  createGzip({ level: 9 }),
  createWriteStream(gzipPath, { mode: 0o600 }),
);
rmSync(sqlPath, { force: true });
chmodSync(gzipPath, 0o600);

const checksum = sha256File(gzipPath);
writeFileSync(checksumPath, `${checksum}  ${path.basename(gzipPath)}\n`, {
  encoding: 'utf8',
  mode: 0o600,
});
removeExpiredBackups(backupDirectory, retentionDays);

console.log(`Backup created: ${gzipPath}`);
console.log(`SHA-256: ${checksum}`);
console.log(`Retention: ${retentionDays} day(s)`);
