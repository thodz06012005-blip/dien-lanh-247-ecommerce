# Quy Trình & Checklist Sao Lưu / Khôi Phục Cơ Sở Dữ Liệu Production (MySQL)

Tài liệu này hướng dẫn chi tiết quy trình vận hành và kiểm tra an toàn hệ thống cơ sở dữ liệu trên môi trường Production của Điện Lạnh 247, áp dụng cho cơ sở dữ liệu chính (MySQL).

---

## 1. Chính Sách & Tần Suất Sao Lưu (Backup Policy)

### Tần suất sao lưu
- **Full Backup (Sao lưu toàn bộ):** Thực hiện tự động mỗi ngày vào lúc **02:00 AM** (khi lưu lượng truy cập hệ thống ở mức thấp nhất).
- **Binlog Backup (Sao lưu gia tăng):** Kích hoạt MySQL Binary Logs (`binlog`) và sao lưu binlog tự động mỗi **15 phút** để đảm bảo khả năng phục hồi dữ liệu về bất kỳ thời điểm nào (Point-in-Time Recovery - PITR).

### Cơ chế tự động hóa
- Sử dụng công cụ `mysqldump` kết hợp với lệnh nén `gzip` thông qua Cron Job trên máy chủ cơ sở dữ liệu Linux.
- Ví dụ Script Backup tự động:
  ```bash
  #!/bin/bash
  BACKUP_DIR="/var/backups/mysql"
  TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
  DB_NAME="ecommerce"
  BACKUP_FILE="${BACKUP_DIR}/db-${DB_NAME}-${TIMESTAMP}.sql.gz"
  
  # Tạo thư mục nếu chưa tồn tại
  mkdir -p ${BACKUP_DIR}
  
  # Chạy mysqldump an toàn (không khóa bảng với --single-transaction)
  mysqldump --single-transaction --quick --routines --triggers ${DB_NAME} | gzip > ${BACKUP_FILE}
  
  # Kiểm tra tính toàn vẹn
  sha256sum ${BACKUP_FILE} > ${BACKUP_FILE}.sha256
  ```

---

## 2. Mã Hóa & Lưu Trữ An Toàn (Encryption & Offsite Storage)

### Quy tắc mã hóa
- Tuyệt đối không lưu trữ các bản sao lưu dạng plain-text (SQL thô).
- Mọi tệp sao lưu phải được mã hóa bất đối xứng sử dụng khóa **GPG** trước khi truyền qua mạng.
  ```bash
  gpg --encrypt --recipient security@dienlanh247.vn db-ecommerce-*.sql.gz
  ```

### Lưu trữ bảo mật (Offsite Storage)
- **Quy tắc 3-2-1:** Giữ 3 bản sao dữ liệu, trên 2 loại phương tiện lưu trữ khác nhau, với ít nhất 1 bản lưu trữ ở địa điểm khác (offsite).
- Tệp backup sau khi mã hóa sẽ tự động đẩy lên **AWS S3** hoặc **Google Cloud Storage (GCS)** thông qua kết nối mã hóa TLS.
- Áp dụng chính sách **Object Lock (WORM - Write Once Read Many)** trên S3 với thời hạn lưu giữ tối thiểu 30 ngày để chống lại các cuộc tấn công ransomware cố ý xóa/mã hóa tệp backup.
- Cấu hình vòng đời tệp lưu trữ (Lifecycle Policy) tự động di chuyển các bản sao lưu cũ hơn 30 ngày sang **AWS Glacier Deep Archive** để tối ưu hóa chi phí.

---

## 3. Quy Trình Khôi Phục Từng Bước (Step-by-Step Restore Process)

> [!CAUTION]
> **CẢNH BÁO:** Không bao giờ được thực hiện khôi phục (restore) trực tiếp trên cơ sở dữ liệu đang chạy của môi trường Production mà không chạy thử nghiệm trước trên môi trường Staging/Sandbox.

### Bước 1: Chuẩn bị tệp khôi phục
1. Tải bản sao lưu tương ứng về máy chủ khôi phục biệt lập.
2. Kiểm tra tính toàn vẹn của tệp bằng cách đối chiếu mã SHA-256:
   ```bash
   sha256sum -c db-ecommerce-xxxx.sql.gz.sha256
   ```
3. Giải mã tệp GPG bằng khóa bí mật được lưu trong hòm bảo mật (Vault).

### Bước 2: Khôi phục và kiểm tra trên Sandbox (Offline Verification)
1. Dựng một instance MySQL trống trên môi trường Sandbox.
2. Nạp dữ liệu từ tệp sao lưu vào:
   ```bash
   gunzip < db-ecommerce-xxxx.sql.gz | mysql -u root -p ecommerce_sandbox
   ```
3. Chạy các lệnh kiểm tra cấu trúc bảng (`CHECK TABLE`), tính nhất quán của dữ liệu liên kết (foreign key constraints), số lượng bản ghi chính (sản phẩm, đơn hàng, khách hàng) để đảm bảo bản sao lưu không bị lỗi nửa chừng.

### Bước 3: Áp dụng khôi phục lên Production (nếu xảy ra sự cố thật)
1. Đặt hệ thống vào trạng thái **Bảo trì (Maintenance Mode)** để dừng tất cả các request ghi từ phía người dùng.
2. Tạo một bản backup nóng ngay lập tức (Snapshot) của DB lỗi hiện tại để phục vụ đối chiếu hoặc rollback nếu khôi phục thất bại.
3. Thực hiện khôi phục từ tệp đã kiểm duyệt:
   ```bash
   gunzip < db-ecommerce-xxxx.sql.gz | mysql -u admin_user -p ecommerce
   ```
4. Đọc binlog để nạp thêm các dữ liệu giao dịch gia tăng phát sinh giữa thời điểm backup cuối cùng và thời điểm xảy ra sự cố (Point-in-Time Recovery).
5. Kiểm tra kết nối ứng dụng, tắt chế độ bảo trì và đưa hệ thống hoạt động trở lại.

---

## 4. Quy Tắc Xác Nhận Kép (Dual-Authorization / 4-Eyes Principle)
- Các hành động khôi phục cơ sở dữ liệu trên Production được xếp vào nhóm hành động cực kỳ nguy hiểm (Destructive Actions).
- Hệ thống quản lý truy cập (Access Control) phải bắt buộc thực thi quy trình **xác nhận kép**:
  - Yêu cầu ít nhất **2 chữ ký số/chốt xác nhận** từ hai nhân sự có vai trò khác nhau (ví dụ: **Lead DevOps** đề xuất khôi phục, và **Chief Security Officer (CSO)** phê duyệt hành động).
  - Mọi yêu cầu phê duyệt và hành động thực thi phải được ghi lại vĩnh viễn vào hệ thống audit logs nằm trên một máy chủ chuyên biệt độc lập (Immutable Log Server) để ngăn ngừa việc quản trị viên tự xóa dấu vết.
