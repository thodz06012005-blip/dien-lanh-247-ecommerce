# Production Readiness Checklist

Tài liệu này tổng hợp toàn bộ các hướng dẫn cấu hình, kiểm tra bảo mật, quy trình deploy cơ sở dữ liệu và vận hành hệ thống Điện Lạnh 247 khi đưa lên các môi trường Staging và Production.

---

## 1. Tổng Quan Kiến Trúc Production

Kiến trúc hệ thống hoàn chỉnh trên Production bao gồm:
1. **Frontend User:** Giao diện cho khách hàng (React/Vite), giao tiếp trực tiếp với NestJS Backend thông qua REST API công khai.
2. **Frontend Admin:** Giao diện quản trị viên (React/Vite), giao tiếp trực tiếp với NestJS Backend qua cookie an toàn.
3. **NestJS Backend:** Lớp logic nghiệp vụ cốt lõi, tích hợp xác thực Cookie HttpOnly, phân quyền RBAC, kiểm duyệt đầu vào và ghi log audit.
4. **Database (MySQL/MariaDB):** Cơ sở dữ liệu chính thức, quản lý qua Prisma ORM.
5. **Mock API (Khuyến cáo):** Chỉ được dùng ở môi trường phát triển (Dev) hoặc thử nghiệm (Demo). Không bao giờ được dùng cho Production chính thức một khi NestJS Backend đã tích hợp đầy đủ.

---

## 2. Production Environment Variables (Biến môi trường)

Bắt buộc inject đầy đủ các biến môi trường sau từ secret manager của hệ thống Host. Không chép giá trị thật vào tài liệu, Dockerfile, workflow hoặc repository.

### Backend & Database
```ini
# Chế độ môi trường (Bắt buộc)
NODE_ENV=production

# Các biến dưới đây là tham chiếu secret manager, không phải giá trị để copy nguyên văn.
DATABASE_URL="${SECRET_MANAGER_DATABASE_URL}"
JWT_ACCESS_SECRET="${SECRET_MANAGER_JWT_ACCESS_SECRET}"
JWT_REFRESH_SECRET="${SECRET_MANAGER_JWT_REFRESH_SECRET}"
AUDIT_LOG_HASH_SALT="${SECRET_MANAGER_AUDIT_LOG_HASH_SALT}"
ADMIN_SEED_PASSWORD="${SECRET_MANAGER_ADMIN_SEED_PASSWORD}"

# Domain của frontend để xử lý CORS
FRONTEND_USER_URL="https://dienlanh247.vn"
FRONTEND_ADMIN_URL="https://admin.dienlanh247.vn"
CORS_ORIGINS="https://dienlanh247.vn,https://admin.dienlanh247.vn"

# Cấu hình Cookie & endpoints phát triển
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
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
  - Chạy `npm run backup:mysql` với secret được inject từ secret manager.
  - Kiểm tra file SHA-256 trước khi tiếp tục.
- [ ] **Bước 2: Sử dụng lệnh di chuyển an toàn**
  - Chỉ chạy: `npx prisma migrate deploy` để nạp các tệp migration đã biên soạn trước.
  - ⚠️ **Tuyệt đối không chạy:** `npx prisma migrate dev` trên môi trường Production.
  - ⚠️ **Tuyệt đối không chạy:** `npx prisma db push` trực tiếp lên Production nếu chưa được hội đồng kỹ thuật phê duyệt.

---

## 4. Security Checklist (Xác nhận Bảo mật)

Tất cả các cơ chế bảo mật bắt buộc phải được kích hoạt và kiểm duyệt thành công:

- [ ] **Auth/Session:** Token nằm hoàn toàn trong Cookie HttpOnly, Secure, SameSite=Strict.
- [ ] **RBAC phân quyền:** Chặn STAFF gọi API admin nhạy cảm; Superadmin là vai trò duy nhất xem được Audit Logs.
- [ ] **CORS:** Không chứa wildcard `*` đi kèm Credentials, chỉ cho phép whitelist chỉ định.
- [ ] **Rate Limit:** Trả về 429 khi đăng nhập sai nhiều lần hoặc spam request.
- [ ] **Body Limit:** Payload tối đa 1 MB cho JSON và 100 KB cho urlencoded, chặn Content-Type không hợp lệ.
- [ ] **Audit Log:** Log sự kiện nhạy cảm, hash-chain hợp lệ và lọc bỏ password, token, cookie, dữ liệu thẻ.
- [ ] **Soft Delete:** Chặn delete cứng, kích hoạt xóa mềm cho tài nguyên hỗ trợ.
- [ ] **Backup/Restore:** Backup gzip có checksum, retention và restore drill trên staging.
- [ ] **Security Headers:** Có CSP, HSTS, `nosniff`, frame denial, COOP, CORP, Referrer Policy và Permissions Policy.
- [ ] **Secret Scan:** `npm run security:scan` PASS và không có credential thật trong tracked files.

---

## 5. Build Checklist (Kiểm duyệt Compile)

Trước khi đóng gói Docker Image hoặc build bundle:

- [ ] Chạy `npm run check:all` đảm bảo secret scan, TypeScript, contract, linter và build thành công.
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
- [ ] **Kiểm tra Audit Logs:** Đảm bảo các hành động trên Staging ghi nhận đúng người thực hiện và integrity hợp lệ.
- [ ] **Thử nghiệm khôi phục:** Chạy thử khôi phục cơ sở dữ liệu trên staging để xác thực quy trình.

---

## 7. Production Checklist (Quy trình Go-Live)

Các bước Go-Live chính thức:

- [ ] **Sao lưu DB:** Tạo bản backup và xác minh checksum.
- [ ] **Deploy Backend chính thức:** Cấu hình Auto-Scaling, Healthcheck API `/api/v1/health`.
- [ ] **Deploy Frontend:** Đẩy CDN, cấu hình SSL/TLS và ép buộc HTTPS.
- [ ] **Chạy Smoke Test nhanh:** Đăng nhập, kiểm tra danh mục sản phẩm bằng tài khoản test riêng.
- [ ] **Theo dõi Logs:** Bật giám sát lỗi; xác minh log không chứa secret hoặc dữ liệu thẻ.
- [ ] **Bật Monitoring:** Cấu hình cảnh báo CPU, RAM, IOPS, rate-limit spike và backup failure.
