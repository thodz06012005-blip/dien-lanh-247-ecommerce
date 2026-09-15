# Biên bản backup và restore database

## Trạng thái hiện tại

`BLOCKED — chưa được thực thi`.

Kiểm tra ngày 2026-08-04 cho thấy:

- `backend/.env` không tồn tại trong checkout; chỉ có `.env.example`.
- Prisma dùng MySQL qua `DATABASE_URL`.
- Máy hiện tại không có lệnh `mysql` hoặc `mysqldump`.
- `sha256sum` có sẵn.

Vì vậy không có thông tin kết nối và công cụ hợp lệ để backup/restore. Không được dùng dữ liệu mẫu hoặc tự điền credential rồi ghi “restore thành công”.

## Điều kiện gỡ blocker

- Operations cung cấp quyền đọc database nguồn và quyền tạo database tạm qua secret manager/environment, không gửi secret vào Git.
- Cài MySQL client tương thích với production.
- Xác nhận tên database nguồn và database tạm; tuyệt đối không restore đè production.
- Xác nhận vị trí lưu backup đã mã hóa, retention và người có quyền truy cập.

## Quy trình nghiệm thu

Các biến dưới đây chỉ là tên minh họa; giá trị phải được inject từ môi trường bảo mật.

```bash
mysqldump --single-transaction --routines --triggers \
  --host="$DL247_DB_HOST" --port="$DL247_DB_PORT" \
  --user="$DL247_DB_USER" --password \
  "$DL247_DB_NAME" > "$DL247_BACKUP_PATH"

sha256sum "$DL247_BACKUP_PATH" > "$DL247_BACKUP_PATH.sha256"
sha256sum --check "$DL247_BACKUP_PATH.sha256"

mysql --host="$DL247_RESTORE_HOST" --port="$DL247_RESTORE_PORT" \
  --user="$DL247_RESTORE_USER" --password \
  "$DL247_RESTORE_DB_NAME" < "$DL247_BACKUP_PATH"
```

Sau restore phải chạy ít nhất:

- kiểm tra số lượng row theo từng bảng commerce và service;
- kiểm tra khóa ngoại và bảng migration;
- khởi động backend trỏ vào database tạm;
- chạy smoke test chỉ đọc;
- xóa database tạm theo quy trình đã phê duyệt sau khi lưu evidence.

## Biên bản cần điền

| Trường | Giá trị |
|---|---|
| Source commit/tag | `bfe7d09` / `legacy-ecommerce-final` |
| Backup timestamp | TBD |
| Backup storage reference | TBD — không ghi secret/path nhạy cảm |
| SHA-256 | TBD |
| Restore database tạm | TBD |
| Row-count reconciliation | TBD |
| Smoke test | TBD |
| Người thực hiện | TBD |
| Người xác nhận | TBD |
| Kết luận | BLOCKED |
