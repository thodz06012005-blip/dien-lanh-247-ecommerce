# Release Notes: v1.0.0-security-hardened

Bản phát hành đầu tiên tập trung củng cố toàn diện kiến trúc bảo mật hệ thống Điện Lạnh 247, chuyển dịch từ trạng thái phát triển nguyên bản (development phase) sang hệ thống sẵn sàng vận hành an toàn trên Production.

---

## 1. Thông tin Phiên bản
- **Tên phiên bản:** `v1.0.0-security-hardened`
- **Mức độ ưu tiên:** **Khẩn cấp** (Cần thiết trước khi go-live)
- **Mục tiêu:** Cắt giảm hoàn toàn nguy cơ rò rỉ dữ liệu, tấn công leo thang đặc quyền, tấn công từ chối dịch vụ (DoS), và bảo vệ các giao thức kết nối.

---

## 2. Nhật Ký Thay Đổi Bảo Mật (Plan 1-18)

Bản phát hành này tích hợp toàn bộ các kết quả nâng cấp an toàn từ 18 kế hoạch bảo mật trước đó:

### 🔑 Xác thực & Quản lý Phiên (Auth & Session Hardening)
- **Token an toàn:** Loại bỏ việc lưu token JWT hoặc session token ở `localStorage`. Toàn bộ thông tin phiên làm việc của Admin được truyền và lưu trữ qua **HttpOnly Cookie** (`accessToken`), bật cờ `Secure` ở Production và `SameSite=Strict` để chống tấn công XSS trộm token và giảm thiểu CSRF.
- **Mật khẩu an toàn:** Loại bỏ toàn bộ mật khẩu mặc định dạng plain-text khỏi mã nguồn. Bắt buộc băm mật khẩu bằng thuật toán **bcrypt** (với số vòng băm `saltRounds = 10`) khi lưu trữ vào DB.

### 🛡️ Phân quyền & Kiểm soát truy cập (RBAC & CORS)
- **Đóng gói định dạng RBAC:** Chia nhỏ quyền hạn quản trị viên rõ ràng (`staff`, `admin`, `superadmin`). Chặn đứng mọi hành vi chỉnh sửa/phá hủy hệ thống của nhân viên kỹ thuật hoặc CSKH (`staff`). Chỉ cho phép `superadmin` xem nhật ký vận hành (Audit Logs).
- **Thắt chặt CORS:** Loại bỏ cấu hình wildcard CORS rộng rãi. Cấu hình mảng whitelist chỉ định rõ ràng từ cấu hình môi trường, ngăn chặn các nguồn giả mạo thực hiện yêu cầu kèm Cookie xác thực.

### 🛑 Bảo vệ Đầu Vào & Chống DoS (Input Hardening & Rate Limit)
- **Kiểm duyệt đầu vào nâng cao:** Kích hoạt `class-validator` với chế độ Whitelist nghiêm ngặt tại NestJS Backend, chặn đứng mọi tham số không được khai báo. Lọc và định kiểu an toàn cho query parameters (`limit`, `page`, `sort`) chống prototype pollution.
- **Tần suất yêu cầu (Rate Limit):** Giới hạn tần suất đăng nhập thất bại theo IP và Email để chặn tấn công dò mật khẩu (Brute-force). Khi bị khóa, hệ thống trả về mã lỗi `429` và không phân biệt lỗi email tồn tại hay không nhằm chống tấn công dò tìm tài khoản.
- **Payload & Request Limits:** Khóa kích thước body tối đa của request (`1mb` cho JSON, `100kb` cho urlencoded) để chống DoS bằng payload nặng. Tự động kiểm tra `Content-Type: application/json` trước khi parser chạy, trả về `415 Unsupported Media Type` nếu sai định dạng.

### 📝 Nhật ký vận hành & Bảo vệ dữ liệu (Audit Logs & Soft Delete)
- **Audit Logs Bảo mật:** Hệ thống ghi nhận mọi biến động nhạy cảm trong hệ thống (đăng nhập, thay đổi thông tin thợ, đặt hàng, cập nhật cấu hình). Metadata log được lọc sạch tự động các giá trị nhạy cảm như `password`, `accessToken`, `Cookie`.
- **Soft Delete:** Chuyển đổi toàn bộ lệnh DELETE vật lý đối với Sản phẩm và Kỹ thuật viên sang xóa mềm (cập nhật trạng thái `inactive` và lưu `deletedAt`). Yêu cầu xác nhận nguy hiểm `X-Confirm-Dangerous-Action: true` và chặn xóa thợ đang có lịch sửa chữa chưa hoàn thành.
- **An toàn Backup/Restore:** Chặn đứng Path Traversal khi khôi phục cơ sở dữ liệu trên Dev bằng các bộ lọc `path.basename` kết hợp khởi đầu `.startsWith()`. Tự động sao lưu dữ liệu hiện tại trước khi reset DB mẫu.

### 🌐 Bảo mật lớp Giao tiếp (Security Headers & Hardening)
- Triển khai custom middleware thiết lập HTTP Security Headers ở cả NestJS Backend và Mock API (không cần cài thêm thư viện ngoài):
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: no-referrer-when-downgrade`
  - `Content-Security-Policy` (CSP)
  - `Strict-Transport-Security` (HSTS) trên HTTPS.

---

## 3. Kết Quả Kiểm Thử & Build Cuối Cùng
- **Kiểm thử tích hợp độc lập bảo mật:** **100% ĐẠT** (chạy thành công toàn bộ test case độc lập cho rate limit, body limit, path traversal, RBAC, soft delete).
- **TypeScript compile & Linter:** **PASS** (`check:all` thành công không lỗi).
- **Bộ kiểm thử nghiệp vụ:** **PASS** (`test:mock` thành công cho đơn hàng, đặt lịch, thợ).
- **Biên dịch dự án:** Toàn bộ dự án (`backend`, `frontend-admin`, `frontend-user`) build thành công không lỗi biên dịch.

---

## 4. Hướng Dẫn Rollback (Khi xảy ra sự cố)

Trong trường hợp phát hiện lỗi nghiêm trọng sau khi deploy:

### Bước 1: Rollback Source Code bằng Git Tag
1. Xác định tag ổn định trước đó (hoặc commit ID gần nhất trước khi merge Plan 18-19).
2. Thực hiện checkout hoặc redeploy phiên bản cũ:
   ```bash
   git checkout <previous-stable-tag-or-commit-hash>
   ```
3. Đóng gói và deploy lại lên hệ thống.

### Bước 2: Khôi phục Cơ sở Dữ liệu (Restore DB Backup)
1. Tải bản sao lưu cơ sở dữ liệu gần nhất được tạo tự động trước khi deploy (xem quy trình trong `PRODUCTION_DB_BACKUP_RESTORE_CHECKLIST.md`).
2. Giải mã tệp sao lưu (nếu có mã hóa GPG) và khôi phục lại cơ sở dữ liệu:
   - *Đối với PostgreSQL (Production chính thức):*
     ```bash
     pg_restore -h <db_host> -U <db_user> -d <db_name> <backup_file.dump>
     ```
   - *Đối với Mock API (Dev/Staging):*
     Gửi yêu cầu REST POST kèm mã xác nhận đến `/api/v1/dev/restore` để khôi phục tệp JSON mong muốn.

---

## 5. Rủi Ro Còn Lại (Known Risks)
- **Tác động kiểm soát Rate Limit:** Giới hạn 20 lần thử đăng nhập IP/Email có thể gây khóa tài khoản tạm thời cho người dùng hợp trị nếu họ quên mật khẩu nhiều lần hoặc dùng chung mạng NAT công cộng (cần thiết lập chính sách reset mật khẩu an toàn ở giai đoạn sau).
- **Header HSTS:** Cần cấu hình SSL/TLS hoạt động ổn định trên Production trước khi kích hoạt cờ HSTS, tránh trường hợp client không thể truy cập HTTP thường nếu chứng chỉ SSL bị lỗi.
