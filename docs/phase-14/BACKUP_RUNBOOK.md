# Backup và restore runbook

## Mục tiêu

Giảm rủi ro mất dữ liệu bằng backup nhất quán, nén, có checksum và retention; mật khẩu database không xuất hiện trong process arguments hoặc log.

## Yêu cầu máy chạy backup

- Node.js 22.
- `mysqldump` tương thích với MySQL/MariaDB production.
- `DATABASE_URL` được inject từ secret manager hoặc protected CI environment.
- Thư mục backup chỉ tài khoản vận hành đọc được.
- Dung lượng trống tối thiểu bằng 2 lần kích thước database trước nén.

## Tạo backup

```bash
export DATABASE_URL='mysql://USER:PASSWORD@HOST:3306/DATABASE'
export BACKUP_DIRECTORY='/secure/dien-lanh-247/backups'
export BACKUP_RETENTION_DAYS='14'
npm run backup:mysql
```

Script thực hiện:

1. Parse `DATABASE_URL` trong memory.
2. Truyền password qua `MYSQL_PWD` chỉ cho process `mysqldump`.
3. Chạy `--single-transaction --quick --routines --triggers --events --hex-blob`.
4. Ghi file SQL với permission `0600`.
5. Nén gzip level 9.
6. Xóa SQL chưa nén.
7. Tạo file SHA-256.
8. Xóa backup quá retention.

Không chạy lệnh có `DATABASE_URL=...` trực tiếp trên terminal được ghi shell history. Production nên dùng systemd EnvironmentFile có quyền `0600`, Docker/Kubernetes secret hoặc CI secret injection.

## Kiểm tra checksum

```bash
cd /secure/dien-lanh-247/backups
sha256sum -c dien_lanh_247-YYYY-MM-DDTHH-MM-SS.sql.gz.sha256
```

Kết quả phải là `OK`. Backup checksum lỗi không được dùng để restore.

## Restore vào staging

Không restore thử trực tiếp vào production.

```bash
gunzip -c dien_lanh_247-YYYY-MM-DDTHH-MM-SS.sql.gz \
  | mysql --host=STAGING_HOST --port=3306 --user=RESTORE_USER --password STAGING_DATABASE
```

Sau restore:

1. Chạy Prisma migration status.
2. Kiểm tra số lượng User, Product, Order, ServiceRequest và AuthSession.
3. Đăng nhập bằng tài khoản staging.
4. Kiểm tra một đơn hàng, một service request và một bài CMS.
5. Xác nhận dữ liệu audit không nằm trong `/uploads`.
6. Ghi thời gian restore, RPO và RTO thực tế vào biên bản vận hành.

## Lịch đề xuất

- Full logical backup: mỗi ngày, ngoài giờ cao điểm.
- Backup trước migration hoặc release có thay đổi dữ liệu.
- Copy backup mã hóa sang object storage khác máy chủ ứng dụng.
- Retention ngắn tại máy chạy ứng dụng: 14 ngày.
- Retention object storage: 30 ngày daily, 12 bản monthly.
- Restore drill: ít nhất mỗi tháng một lần.

## Mã hóa và quyền truy cập

Script hiện tạo gzip + checksum, chưa tự mã hóa để tránh quản lý key sai trong source code. Production phải mã hóa ở storage layer bằng KMS/SSE hoặc pipeline vận hành dùng age/GPG với key nằm ngoài repository.

Chỉ nhóm vận hành được phép:

- đọc backup;
- chạy restore;
- xem secret database;
- thay đổi retention.

## Sự cố backup thất bại

1. Không xóa bản backup hợp lệ gần nhất.
2. Kiểm tra dung lượng, quyền thư mục và phiên bản `mysqldump`.
3. Không gửi stderr chứa hostname/database nội bộ lên kênh công khai.
4. Tạo incident nếu không có backup hợp lệ trong 24 giờ.
5. Chạy lại sau khi sửa nguyên nhân và xác minh checksum.
