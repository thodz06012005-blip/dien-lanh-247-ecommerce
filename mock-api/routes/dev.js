const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { writeDB, readDB } = require('../utils/db');
const { respondSuccess, respondError } = require('../utils/response');
const { getInitialData } = require('../seed/initialData');
const { requireDevOnly } = require('../utils/auth');
const { auditSuccess, auditFailure } = require('../utils/auditLog');
const { requireDangerousConfirmation, getDangerousReason } = require('../utils/dangerousAction');

const BACKUP_DIR = path.join(__dirname, '../backups');

function ensureBackupDirExists() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// POST /dev/reset-db — dev only, yields 404 in production
router.post('/dev/reset-db', requireDevOnly, (req, res) => {
  try {
    ensureBackupDirExists();
    // 1. Automatically backup current database contents before resetting
    const currentData = readDB();
    const backupFileName = `backup-before-reset-${Date.now()}.json`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    fs.writeFileSync(backupPath, JSON.stringify(currentData, null, 2), 'utf8');

    // Audit backup creation
    auditSuccess(req, 'DEV_DB_BACKUP_CREATED', 'system', 'database', { filename: backupFileName, trigger: 'reset-db' }, `Database backup automatically created before reset: ${backupFileName}`);

    // 2. Perform database reset
    const data = getInitialData();
    writeDB(data);

    auditSuccess(req, 'DEV_RESET_DB', 'system', 'database', null, 'Database reset to default template');
    return respondSuccess(res, {}, 'Đã khôi phục cơ sở dữ liệu mẫu về mặc định thành công!');
  } catch (error) {
    console.error('Error resetting database:', error);
    return respondError(res, 500, 'Không thể khôi phục cơ sở dữ liệu');
  }
});

// POST /dev/backup — dev only, generates manual backup
router.post('/dev/backup', requireDevOnly, (req, res) => {
  // Dangerous confirmation check
  if (!requireDangerousConfirmation(req, res, 'DEV_DB_BACKUP', 'system', 'database')) {
    return;
  }

  try {
    ensureBackupDirExists();
    const currentData = readDB();
    const backupFileName = `backup-manual-${Date.now()}.json`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    fs.writeFileSync(backupPath, JSON.stringify(currentData, null, 2), 'utf8');

    const reason = getDangerousReason(req);
    auditSuccess(req, 'DEV_DB_BACKUP_CREATED', 'system', 'database', { filename: backupFileName, reason }, `Database manual backup created: ${backupFileName}`);

    return respondSuccess(res, { backupFile: backupFileName }, 'Sao lưu dữ liệu thành công!');
  } catch (error) {
    console.error('Error creating database backup:', error);
    return respondError(res, 500, 'Không thể sao lưu cơ sở dữ liệu');
  }
});

// POST /dev/restore — dev only, restores from a backup file (safe from path traversal)
router.post('/dev/restore', requireDevOnly, (req, res) => {
  // Dangerous confirmation check
  if (!requireDangerousConfirmation(req, res, 'DEV_DB_RESTORE', 'system', 'database')) {
    return;
  }

  const { backupFile } = req.body;
  if (!backupFile) {
    return respondError(res, 400, 'Thiếu tên tệp khôi phục', 'MISSING_BACKUP_FILE');
  }

  try {
    ensureBackupDirExists();

    // 1. Clean the filename to prevent Path Traversal
    const filename = path.basename(backupFile);
    
    // 2. Resolve absolute path and verify it stays inside backup directory
    const resolvedPath = path.resolve(BACKUP_DIR, filename);
    if (!resolvedPath.startsWith(BACKUP_DIR)) {
      auditFailure(req, 'DANGEROUS_ACTION_BLOCKED', 'system', 'database', { action: 'DEV_DB_RESTORE', reason: 'Path traversal attempt detected', backupFile }, 'Path traversal attempt blocked during database restore');
      return respondError(res, 400, 'Tên tệp không hợp lệ', 'PATH_TRAVERSAL_DETECTED');
    }

    // 3. Verify file exists
    if (!fs.existsSync(resolvedPath)) {
      return respondError(res, 404, 'Không tìm thấy tệp khôi phục', 'BACKUP_FILE_NOT_FOUND');
    }

    // 4. Overwrite database
    const raw = fs.readFileSync(resolvedPath, 'utf8');
    const restoredData = JSON.parse(raw);
    writeDB(restoredData);

    const reason = getDangerousReason(req);
    auditSuccess(req, 'DEV_DB_RESTORED', 'system', 'database', { filename, reason }, `Database restored successfully from backup: ${filename}`);

    return respondSuccess(res, {}, 'Khôi phục cơ sở dữ liệu thành công!');
  } catch (error) {
    console.error('Error restoring database:', error);
    return respondError(res, 500, 'Không thể khôi phục cơ sở dữ liệu');
  }
});

module.exports = router;
