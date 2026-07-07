# Staging Deployment Checklist

Tài liệu này hướng dẫn chi tiết quy trình chuẩn bị, cấu hình biến môi trường, thiết lập cơ sở dữ liệu và kịch bản nghiệm thu kiểm thử (Smoke Test) cho môi trường **Staging** của hệ thống Điện Lạnh 247.

---

## 1. Kiến Trúc Môi Trường Staging

Hệ thống Staging là bản sao chính xác của hệ thống Production nhưng chạy trên các tài nguyên và cơ sở dữ liệu tách biệt để phục vụ việc kiểm thử tích hợp (UAT) trước khi go-live:
1. **Frontend User Staging:** Host độc lập (ví dụ: `https://staging.dienlanh247.vn`).
2. **Frontend Admin Staging:** Host độc lập (ví dụ: `https://staging-admin.dienlanh247.vn`).
3. **Backend Staging:** Chạy ứng dụng NestJS trên môi trường Cloud (ví dụ: `https://staging-api.dienlanh247.vn`).
4. **Database Staging:** Cơ sở dữ liệu PostgreSQL độc lập (ví dụ chạy trên AWS RDS hoặc Docker Container riêng biệt). **Nghiêm cấm chia sẻ hoặc kết nối với database Production chính thức.**

---

## 2. Biến Môi Trường Staging (Staging Environment Variables)

Bắt buộc cấu hình các tham số môi trường sau trên Host Staging (qua giao diện console dịch vụ cloud hoặc tệp `.env` được bảo mật):

### Backend Staging Configuration
```ini
# Chế độ vận hành
NODE_ENV=production

# Kết nối cơ sở dữ liệu staging (Không sử dụng database production)
DATABASE_URL="postgresql://staging_user:staging_secure_pass@staging-db-host:5432/staging_db?schema=public"

# Khóa bí mật JWT cho staging (Khác với dev và production)
JWT_ACCESS_SECRET="strong_staging_jwt_access_secret_key_32_characters"
JWT_REFRESH_SECRET="strong_staging_jwt_refresh_secret_key_32_characters"

# URL giao diện phục vụ cookie và CORS
FRONTEND_USER_URL="https://staging.dienlanh247.vn"
FRONTEND_ADMIN_URL="https://staging-admin.dienlanh247.vn"

# Danh sách CORS được phép
CORS_ALLOWED_ORIGINS="https://staging.dienlanh247.vn,https://staging-admin.dienlanh247.vn"

# Cấu hình an toàn cookie & tắt endpoint phát triển
COOKIE_SECURE=true
ENABLE_DEV_ENDPOINTS=false
ENABLE_DEMO_ACCOUNTS=false
```

---

## 3. Quy Trình Triển Khai Cơ Sở Dữ Liệu Staging

Để chuẩn bị và cập nhật schema cơ sở dữ liệu trên môi trường Staging:
- [ ] **Tạo Database Staging:** Khởi tạo instance database riêng biệt, không trùng tài khoản với database dev.
- [ ] **Chạy Migration:** Thực hiện di chuyển schema từ repo bằng lệnh:
  ```bash
  npx prisma migrate deploy
  ```
  *Lưu ý: Không dùng `npx prisma migrate dev` hay `npx prisma db push` trên staging để giữ tính nhất quán của lịch sử migration.*
- [ ] **Seed Dữ Liệu Staging:** Nếu cần tạo tài khoản admin/dữ liệu mẫu ban đầu, chạy:
  ```bash
  npx prisma db seed
  ```
  *Yêu cầu:* Đảm bảo đặt mật khẩu admin seed mạnh (qua biến môi trường `ADMIN_SEED_PASSWORD`), không dùng mật khẩu mặc định yếu.

---

## 4. Kịch Bản Nghiệm Thu & Kiểm Thử Staging (Smoke Test Checklist)

Sau khi deploy thành công các module lên Staging, kiểm thử viên (QA) thực hiện kiểm duyệt theo các bước sau:

### Giao diện & Kết nối API
- [ ] **Frontend User mở được:** Truy cập trang chủ staging, kiểm tra tải danh mục sản phẩm.
- [ ] **Frontend Admin mở được:** Truy cập trang đăng nhập portal admin staging.
- [ ] **Backend Healthcheck OK:** Truy cập `https://staging-api.dienlanh247.vn/api/v1/health` trả về trạng thái hoạt động bình thường (`200 OK`).

### Xác thực & Bảo mật
- [ ] **Admin đăng nhập thành công (Login OK):** Đăng nhập với tài khoản có quyền.
- [ ] **Cookie HttpOnly hoạt động:** Kiểm tra Application Storage trên DevTools trình duyệt, xác nhận `accessToken` được lưu trong cookie dưới dạng **HttpOnly, Secure, SameSite=Strict**. Không có token nào lưu trong `localStorage`.
- [ ] **Bảo vệ CORS:** Kiểm tra xem frontend-admin có gọi API thành công hay không. Thử gọi API từ một domain không nằm trong whitelist CORS để đảm bảo request bị block.
- [ ] **RBAC (Phân quyền):** Đăng nhập tài khoản quyền `staff` và kiểm duyệt xem có bị chặn truy cập API logs hoặc thay đổi sản phẩm không.

### Nghiệp vụ Hệ thống
- [ ] **Quản lý Sản phẩm (Products list/soft delete):** Kiểm tra thêm mới, cập nhật sản phẩm. Thử thực hiện xóa sản phẩm, xác nhận trạng thái được cập nhật thành `inactive` (xóa mềm), và sản phẩm đó biến mất khỏi danh sách của trang User.
- [ ] **Quy trình đặt đơn hàng (Orders flow):** Khách hàng đặt mua sản phẩm, thanh toán. Admin nhận thông tin đơn hàng trên Dashboard.
- [ ] **Quy trình sửa chữa (Service Requests):** Khách hàng tạo yêu cầu sửa chữa. Admin xác nhận, phân phối công việc cho kỹ thuật viên staging.
- [ ] **Xóa kỹ thuật viên:** Xác nhận không thể xóa kỹ thuật viên khi đang có lịch active.

### Hardening & Vận hành
- [ ] **Nhật ký Audit Logs:** Vào mục lịch sử hoạt động của Superadmin, xác nhận các hành động đăng nhập, sửa thợ, đặt hàng đã ghi lại đầy đủ và không bị lộ mật khẩu/cookie trong metadata.
- [ ] **Security Headers:** Sử dụng công cụ (như DevTools Network hoặc Web Security Scanner) để kiểm tra các response headers từ Staging API chứa đầy đủ `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, và `Content-Security-Policy`.
- [ ] **Backup:** Thực hiện kiểm tra tính toàn vẹn của tệp backup database staging.
