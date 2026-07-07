# Production Readiness Checklist

Tài liệu này tổng hợp toàn bộ các hướng dẫn cấu hình, kiểm tra bảo mật, quy trình deploy cơ sở dữ liệu và vận hành hệ thống Điện Lạnh 247 khi đưa lên các môi trường Staging và Production.

---

## 1. Tổng Quan Kiến Trúc Production

Kiến trúc hệ thống hoàn chỉnh trên Production bao gồm:
1. **Frontend User:** Giao diện cho khách hàng (React/Vite), giao tiếp trực tiếp với NestJS Backend thông qua REST API công khai.
2. **Frontend Admin:** Giao diện quản trị viên (React/Vite), giao tiếp trực tiếp với NestJS Backend qua cookie an toàn.
3. **NestJS Backend:** Lớp logic nghiệp vụ cốt lõi, tích hợp xác thực Cookie HttpOnly, phân quyền RBAC, kiểm duyệt đầu vào và ghi log audit.
4. **Database (PostgreSQL):** Cơ sở dữ liệu chính thức, quản lý qua Prisma ORM.
5. **Mock API (Khuyến cáo):** Chỉ được dùng ở môi trường phát triển (Dev) hoặc thử nghiệm (Demo). Không bao giờ được dùng cho Production chính thức một khi NestJS Backend đã tích hợp đầy đủ.

---

## 2. Production Environment Variables (Biến môi trường)

Bắt buộc cấu hình đầy đủ các biến môi trường sau trên hệ thống Host (như AWS ECS, Docker, hoặc Render/Heroku):

### Backend & Database
```ini
# Chế độ môi trường (Bắt buộc)
NODE_ENV=production

# Kết nối cơ sở dữ liệu production chính thức
DATABASE_URL="postgresql://user:secure_password@host:port/dbname?schema=public"

# Khóa bí mật JWT (Không sử dụng giá trị mặc định, tối thiểu 32 ký tự ngẫu nhiên)
JWT_ACCESS_SECRET="super_secret_access_key_generate_using_random_bytes"
JWT_REFRESH_SECRET="super_secret_refresh_key_generate_using_random_bytes"

# Mật khẩu khởi tạo Admin mặc định (nếu cần chạy prisma seed)
ADMIN_SEED_PASSWORD="VerySecureAdminPassword123!"

# Domain của frontend để xử lý CORS
FRONTEND_USER_URL="https://dienlanh247.vn"
FRONTEND_ADMIN_URL="https://admin.dienlanh247.vn"

# Danh sách CORS được phép kết nối (phân cách bằng dấu phẩy)
CORS_ALLOWED_ORIGINS="https://dienlanh247.vn,https://admin.dienlanh247.vn"

# Cấu hình Cookie & endpoints phát triển
COOKIE_SECURE=true
ENABLE_DEV_ENDPOINTS=false
ENABLE_DEMO_ACCOUNTS=false
```

### Mock API (Nếu triển khai môi trường Demo/UAT tạm thời)
```ini
NODE_ENV=production
MOCK_ENABLE_DEMO_ACCOUNTS=false
ENABLE_DEV_ENDPOINTS=false
PORT=3001
CORS_ORIGINS="https://demo.dienlanh247.vn,https://demo-admin.dienlanh247.vn"
```

---

## 3. Database Deployment (Quy trình Deploy DB)

Để đảm bảo an toàn tuyệt đối cho dữ liệu trên Production, quy trình di chuyển schema (DB Migration) bắt buộc tuân thủ:

- [ ] **Bước 1: Backup DB trước khi Deploy**
  - Chạy lệnh sao lưu toàn bộ cơ sở dữ liệu hiện tại (Full Backup) trước bất kỳ thay đổi nào.
- [ ] **Bước 2: Sử dụng lệnh di chuyển an toàn**
  - Chỉ chạy: `npx prisma migrate deploy` để nạp các tệp migration đã biên soạn trước.
  - ⚠️ **Tuyệt đối không chạy:** `npx prisma migrate dev` trên môi trường Production (nguy cơ mất dữ liệu do tự động reset).
  - ⚠️ **Tuyệt đối không chạy:** `npx prisma db push` trực tiếp lên Production nếu chưa được hội đồng kỹ thuật phê duyệt.

---

## 4. Security Checklist (Xác nhận Bảo mật)

Tất cả các cơ chế bảo mật từ Plan 1-18 bắt buộc phải được kích hoạt và kiểm duyệt thành công:

- [ ] **Auth/Session:** Token nằm hoàn toàn trong Cookie HttpOnly, Secure, SameSite=Strict.
- [ ] **RBAC phân quyền:** Chặn STAFF gọi API admin nhạy cảm; Superadmin là vai trò duy nhất xem được Audit Logs.
- [ ] **CORS:** Không chứa wildcard `*` đi kèm Credentials, chỉ cho phép whitelist chỉ định.
- [ ] **Rate Limit:** Trả về 429 khi đăng nhập sai nhiều lần hoặc spam request.
- [ ] **Body Limit:** Payload tối đa 1mb cho JSON và 100kb cho urlencoded, chặn Content-Type không hợp lệ.
- [ ] **Audit Log:** Log đầy đủ các sự kiện nghiệp vụ nhạy cảm, lọc bỏ thông tin `password`, `token`, `cookie` trong metadata.
- [ ] **Soft Delete:** Chặn delete cứng, kích hoạt xóa mềm cho Sản phẩm và Kỹ thuật viên.
- [ ] **Backup/Restore:** Đã có checklist bảo vệ chống Path Traversal khi khôi phục dữ liệu dev.
- [ ] **Security Headers:** Trình duyệt nhận đủ các headers `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Content-Security-Policy` (CSP) và `HSTS` (HTTPS).

---

## 5. Build Checklist (Kiểm duyệt Compile)

Trước khi đóng gói Docker Image hoặc build bundle:

- [ ] Chạy `npm run check:all` đảm bảo TypeScript compile không lỗi và linter sạch sẽ.
- [ ] Chạy `npm run test:mock` xác nhận không có lỗi logic tích hợp.
- [ ] Biên dịch thành công backend: `npm --prefix backend run build`.
- [ ] Biên dịch thành công admin portal: `npm --prefix frontend-admin run build`.
- [ ] Biên dịch thành công user portal: `npm --prefix frontend-user run build`.

---

## 6. Staging Checklist (Môi trường Thử nghiệm)

Các bước kiểm duyệt trên môi trường Staging:

- [ ] **Deploy backend staging:** Nạp đầy đủ biến môi trường và chạy thử.
- [ ] **Deploy frontend-user & frontend-admin staging:** Cấu hình chuẩn API endpoint.
- [ ] **Smoke Test chức năng:**
    - Kiểm tra đăng nhập tài khoản admin.
    - Thực hiện quy trình đặt đơn hàng, tạo yêu cầu dịch vụ sửa chữa.
    - Phân phối việc và cập nhật trạng thái thợ.
- [ ] **Kiểm tra CORS/Cookie:** Đảm bảo trình duyệt lưu được cookie HttpOnly và gửi kèm trong các request sau.
- [ ] **Kiểm tra Audit Logs:** Đảm bảo các hành động trên Staging ghi nhận đúng người thực hiện.
- [ ] **Thử nghiệm khôi phục:** Chạy thử khôi phục cơ sở dữ liệu trên staging để xác thực quy trình khôi phục.

---

## 7. Production Checklist (Quy trình Go-Live)

Các bước Go-Live chính thức:

- [ ] **Sao lưu DB:** Tạo bản dump ban đầu cho DB trống hoặc DB cũ.
- [ ] **Deploy Backend chính thức:** Cấu hình Auto-Scaling, Healthcheck API `/api/v1/health`.
- [ ] **Deploy Frontend:** Đẩy CDN, cấu hình SSL/TLS (ép buộc HTTPS).
- [ ] **Chạy Smoke Test nhanh:** Đăng nhập, kiểm tra danh mục sản phẩm (sử dụng tài khoản test riêng).
- [ ] **Theo dõi Logs:** Bật giám sát lỗi (như Sentry, Winston Logs) theo thời gian thực.
- [ ] **Bật Monitoring:** Cấu hình cảnh báo CPU, RAM, IOPS của server và database.
