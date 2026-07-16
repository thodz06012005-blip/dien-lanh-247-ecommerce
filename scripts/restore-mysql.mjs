import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  createReadStream,
  existsSync,
  readFileSync,
  realpathSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';

function required(name) {
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

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

const databaseUrl = new URL(required('DATABASE_URL'));
if (!['mysql:', 'mariadb:'].includes(databaseUrl.protocol)) {
  throw new Error('DATABASE_URL must use mysql:// or mariadb://.');
}

const databaseName = safeDecode(databaseUrl.pathname.replace(/^\//, ''));
if (!databaseName) throw new Error('DATABASE_URL must include a database name.');
if (required('RESTORE_CONFIRM') !== databaseName) {
  throw new Error('RESTORE_CONFIRM must exactly match the target database name.');
}
if (
  process.env.NODE_ENV === 'production' &&
  process.env.ALLOW_PRODUCTION_RESTORE !== 'true'
) {
  throw new Error('Production restore requires ALLOW_PRODUCTION_RESTORE=true.');
}

const backupDirectory = realpathSync(
  path.resolve(process.env.BACKUP_DIRECTORY?.trim() || 'var/backups'),
);
const restoreFile = realpathSync(path.resolve(required('RESTORE_FILE')));
const relative = path.relative(backupDirectory, restoreFile);
if (relative.startsWith('..') || path.isAbsolute(relative)) {
  throw new Error('RESTORE_FILE must be inside BACKUP_DIRECTORY.');
}
if (!restoreFile.endsWith('.sql.gz') || !statSync(restoreFile).isFile()) {
  throw new Error('RESTORE_FILE must be a readable .sql.gz backup.');
}

const checksumFile = `${restoreFile}.sha256`;
if (!existsSync(checksumFile)) throw new Error('Missing SHA-256 sidecar file.');
const expectedChecksum = readFileSync(checksumFile, 'utf8').trim().split(/\s+/)[0];
const actualChecksum = sha256(restoreFile);
if (!/^[a-f0-9]{64}$/i.test(expectedChecksum) || expectedChecksum !== actualChecksum) {
  throw new Error('Backup checksum verification failed.');
}

const mysql = spawn(
  process.env.MYSQL_BIN || 'mysql',
  [
    '--host',
    databaseUrl.hostname,
    '--port',
    databaseUrl.port || '3306',
    '--user',
    safeDecode(databaseUrl.username),
    '--default-character-set=utf8mb4',
    databaseName,
  ],
  {
    env: {
      ...process.env,
      MYSQL_PWD: safeDecode(databaseUrl.password),
    },
    stdio: ['pipe', 'inherit', 'pipe'],
  },
);

let stderr = '';
mysql.stderr.setEncoding('utf8');
mysql.stderr.on('data', (chunk) => {
  stderr += chunk;
  if (stderr.length > 4_000) stderr = stderr.slice(-4_000);
});

const exitPromise = new Promise((resolve, reject) => {
  mysql.once('error', reject);
  mysql.once('close', (code) => {
    if (code === 0) resolve();
    else reject(new Error(`Database restore failed: ${stderr.trim().slice(0, 500)}`));
  });
});

await Promise.all([
  pipeline(createReadStream(restoreFile), createGunzip(), mysql.stdin),
  exitPromise,
]);

console.log(`Restore completed and checksum verified for database: ${databaseName}`);
