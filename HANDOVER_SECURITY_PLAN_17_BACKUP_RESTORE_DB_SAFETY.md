# Biên bản bàn giao: Plan 17 — Backup / Restore / DB Safety

Biên bản bàn giao chi tiết các nâng cấp bảo mật và an toàn dữ liệu liên quan đến sao lưu (Backup), phục hồi (Restore) cơ sở dữ liệu và chống tấn công leo thang mục lục (Path Traversal) cho hệ thống Điện Lạnh 247.

## 1. Thông tin chung
- **Branch đang làm:** `security/admin-phase-17-backup-restore-db-safety`
- **Commit gốc từ Plan 16:** `483b036d67d6bce692020db432fa478a2d6d313f`

## 2. File thay đổi & tạo mới

### Cấu hình dự án
- **Cập nhật:**
  - [.gitignore](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/.gitignore) (Loại trừ các tệp sao lưu khỏi Git)
- **Tạo mới:**
  - [PRODUCTION_DB_BACKUP_RESTORE_CHECKLIST.md](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/PRODUCTION_DB_BACKUP_RESTORE_CHECKLIST.md) (Quy trình sao lưu khôi phục an toàn trên Production)
  - [HANDOVER_SECURITY_PLAN_17_BACKUP_RESTORE_DB_SAFETY.md](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/HANDOVER_SECURITY_PLAN_17_BACKUP_RESTORE_DB_SAFETY.md) (Biên bản bàn giao này)

### Mock API & Test Scripts
- **Cập nhật:**
  - [mock-api/routes/dev.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/mock-api/routes/dev.js) (Thêm cơ chế tự động backup trước khi reset-db, endpoints backup/restore mới)
  - [tests/test_order_pricing.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/tests/test_order_pricing.js) (Bổ sung `limit=100` để đảm bảo test ổn định khi reset DB)

---

## 3. Các điểm nâng cấp an toàn cơ sở dữ liệu

### 1. Tự động Sao lưu trước khi Reset DB (Pre-reset Backup)
- Khi gọi endpoint `POST /api/v1/dev/reset-db` ở môi trường phát triển, hệ thống tự động ghi lại toàn bộ nội dung cơ sở dữ liệu hiện tại vào thư mục `mock-api/backups/` dưới dạng tệp `backup-before-reset-<timestamp>.json` trước khi nạp dữ liệu mẫu mới.
- Sự kiện này được ghi audit log rõ ràng dưới dạng `DEV_DB_BACKUP_CREATED`.

### 2. Các Endpoint Sao lưu / Khôi phục mới (Dev-Only)
- **`POST /api/v1/dev/backup`:** Cho phép tạo thủ công một tệp sao lưu dữ liệu. Yêu cầu chốt chặn xác nhận nguy hiểm (`confirm: true` hoặc header `X-Confirm-Dangerous-Action: true`) và chỉ chạy ở dev.
- **`POST /api/v1/dev/restore`:** Cho phép khôi phục cơ sở dữ liệu từ một bản sao lưu cụ thể qua tham số `backupFile`. Chỉ chạy ở dev và yêu cầu xác nhận nguy hiểm.

### 3. Phòng Chống Tấn Công Leo Thang Mục Lục (Path Traversal Protection)
- Trong endpoint `/dev/restore`, tệp sao lưu đầu vào được làm sạch tuyệt đối bằng `path.basename(backupFile)` để trích xuất tên tệp thuần túy, loại bỏ các ký tự leo thang (ví dụ: `..`, `/`, `\`).
- Đường dẫn đích sau đó được resolve tuyệt đối và kiểm tra khởi đầu bằng `resolvedPath.startsWith(BACKUP_DIR)` để đảm bảo chỉ đọc các tệp nằm chính xác trong thư mục `mock-api/backups/`.
- Nếu phát hiện leo thang mục lục, hệ thống lập tức từ chối, ghi audit log `DANGEROUS_ACTION_BLOCKED` với nhãn lỗi `PATH_TRAVERSAL_DETECTED`.

### 4. Loại trừ tệp sao lưu khỏi Git (.gitignore)
- Cập nhật `.gitignore` để loại bỏ các tệp tin backup thực tế tránh rò rỉ dữ liệu lên repo công khai:
  ```gitignore
  mock-api/backups/
  backups/
  *.sql
  *.bak
  ```

---

## 4. Tài liệu Vận hành Production
Đã xây dựng cẩm nang chi tiết tại [PRODUCTION_DB_BACKUP_RESTORE_CHECKLIST.md](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/PRODUCTION_DB_BACKUP_RESTORE_CHECKLIST.md) bao gồm:
- Tần suất sao lưu hàng ngày (Full Backup) và mỗi 15 phút (Binlog Backup - PITR).
- Quy trình mã hóa bất đối xứng khóa GPG trước khi đồng bộ lên AWS S3 Glacier (có cấu hình Object Lock bảo vệ chống Ransomware).
- Quy trình khôi phục qua môi trường Sandbox kiểm tra tính toàn vẹn (MD5/SHA256 checksum) trước khi nạp dữ liệu thật.
- Áp dụng nguyên tắc xác nhận kép (4-Eyes Principle) yêu cầu ít nhất 2 vai trò DevOps + Security phê duyệt hành động nguy hiểm.

---

## 5. Kết quả kiểm thử & tích hợp hệ thống

### Kết quả chạy kiểm thử tự động Plan 17:
Đã chạy kịch bản kiểm thử tích hợp tự động [test_plan17_backup_restore.js](file:///C:/Users/Admin/.gemini/antigravity/brain/1ec938c5-52e2-4bd6-87ad-22231bc04644/scratch/test_plan17_backup_restore.js):
- **Kết quả:** **14/14 PASS / 0 FAIL**.
- Các trường hợp kiểm thử đã xác minh:
  - Chặn đứng hoàn toàn tất cả các endpoint `/dev/*` khi chạy ở chế độ Production (trả về 404) -> ĐẠT
  - Chặn request tạo backup thủ công khi thiếu confirm -> ĐẠT
  - Tạo backup thủ công thành công khi đầy đủ confirm -> ĐẠT
  - Chặn request restore dữ liệu khi thiếu confirm -> ĐẠT
  - Chặn đứng tấn công leo thang mục lục (Path Traversal) khi truyền `backupFile: '../../package.json'` -> ĐẠT
  - Trả về mã lỗi 404 khi restore tệp sao lưu không tồn tại -> ĐẠT
  - Khôi phục cơ sở dữ liệu thành công từ tệp hợp lệ kèm xác nhận -> ĐẠT
  - Tự động tạo tệp backup trước khi thực hiện reset-db -> ĐẠT

### Kết quả tích hợp toàn dự án:
- `npm run check:all` (lint + typecheck): **PASS**
- `npm run test:mock` (tất cả các test case cũ): **PASS**
- `backend` build: **PASS**
- `frontend-admin` build: **PASS**
- `frontend-user` build: **PASS**
- Không commit file backup thật, dump thật, mock-db test hay tệp env nào.

---

## 6. Đề xuất Plan 18 tiếp theo
- Triển khai **XSS / Content Security Policy (CSP)** và bảo vệ Header HTTP bằng Helmet để củng cố tầng giao diện web.
