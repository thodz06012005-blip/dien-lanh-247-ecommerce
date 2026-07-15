# Staging Deployment Checklist

Tài liệu này hướng dẫn chi tiết quy trình chuẩn bị, cấu hình biến môi trường, thiết lập cơ sở dữ liệu và kịch bản nghiệm thu kiểm thử (Smoke Test) cho môi trường **Staging** của hệ thống Điện Lạnh 247.

---

## 1. Kiến Trúc Môi Trường Staging

Hệ thống Staging là bản sao gần tương đương Production nhưng chạy trên tài nguyên và cơ sở dữ liệu tách biệt để phục vụ kiểm thử tích hợp trước go-live:
1. **Frontend User Staging:** Host độc lập, ví dụ `https://staging.dienlanh247.vn`.
2. **Frontend Admin Staging:** Host độc lập, ví dụ `https://staging-admin.dienlanh247.vn`.
3. **Backend Staging:** NestJS trên host riêng, ví dụ `https://staging-api.dienlanh247.vn`.
4. **Database Staging:** MySQL/MariaDB độc lập. **Nghiêm cấm chia sẻ hoặc kết nối với database Production chính thức.**

---

## 2. Biến Môi Trường Staging

Bắt buộc inject tham số qua secret manager hoặc protected environment của nền tảng triển khai. Không commit tệp `.env` staging có giá trị thật.

### Backend Staging Configuration
```ini
NODE_ENV=staging

# Tham chiếu secret manager; không copy nguyên văn làm secret.
DATABASE_URL="${SECRET_MANAGER_STAGING_DATABASE_URL}"
JWT_ACCESS_SECRET="${SECRET_MANAGER_STAGING_JWT_ACCESS_SECRET}"
JWT_REFRESH_SECRET="${SECRET_MANAGER_STAGING_JWT_REFRESH_SECRET}"
AUDIT_LOG_HASH_SALT="${SECRET_MANAGER_STAGING_AUDIT_LOG_HASH_SALT}"
ADMIN_SEED_PASSWORD="${SECRET_MANAGER_STAGING_ADMIN_SEED_PASSWORD}"

FRONTEND_USER_URL="https://staging.dienlanh247.vn"
FRONTEND_ADMIN_URL="https://staging-admin.dienlanh247.vn"
CORS_ORIGINS="https://staging.dienlanh247.vn,https://staging-admin.dienlanh247.vn"

COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
ENABLE_DEV_ENDPOINTS=false
ENABLE_DEMO_ACCOUNTS=false
```

---

## 3. Quy Trình Triển Khai Cơ Sở Dữ Liệu Staging

- [ ] **Tạo Database Staging:** Khởi tạo instance riêng biệt, không dùng chung credential với dev hoặc production.
- [ ] **Tạo backup trước migration:** Chạy `npm run backup:mysql` và xác minh SHA-256.
- [ ] **Chạy Migration:**
  ```bash
  npx prisma migrate deploy
  ```
  Không dùng `npx prisma migrate dev` hoặc `npx prisma db push` trên staging.
- [ ] **Seed Dữ Liệu Staging:** Khi thực sự cần:
  ```bash
  npx prisma db seed
  ```
  `ADMIN_SEED_PASSWORD` phải được inject từ secret manager và thu hồi sau khi seed nếu không còn cần.

---

## 4. Kịch Bản Nghiệm Thu & Kiểm Thử Staging

### Giao diện & Kết nối API
- [ ] Frontend User mở được và tải danh mục sản phẩm.
- [ ] Frontend Admin mở được trang đăng nhập.
- [ ] `https://staging-api.dienlanh247.vn/api/v1/health` trả `200 OK`.

### Xác thực & Bảo mật
- [ ] Admin đăng nhập thành công bằng tài khoản staging riêng.
- [ ] Cookie là **HttpOnly, Secure, SameSite=Strict**; không có token trong `localStorage`.
- [ ] Domain ngoài `CORS_ORIGINS` không nhận CORS permission.
- [ ] STAFF bị chặn API audit, settings manage và product mutation.
- [ ] Login sai quá ngưỡng trả 429 hoặc trạng thái khóa tạm cùng `Retry-After`.
- [ ] Refresh token cũ bị từ chối sau rotation; phát hiện reuse thu hồi token family.

### Upload
- [ ] JPEG, PNG, WebP hợp lệ được nhận.
- [ ] Tệp đổi đuôi, MIME giả, SVG, HTML, script và executable bị từ chối.
- [ ] Tệp trên 5 MB hoặc hơn 5 tệp/lần bị từ chối.

### Nghiệp vụ Hệ thống
- [ ] Thêm và cập nhật sản phẩm hoạt động bình thường.
- [ ] Product delete cần confirmation và chuyển `isActive=false`.
- [ ] Order flow không thay đổi sau hardening.
- [ ] Service request flow và phân công kỹ thuật viên không thay đổi.
- [ ] Không thể xóa kỹ thuật viên khi đang có lịch active.

### Hardening & Vận hành
- [ ] Audit log ghi login failure, RBAC denied, rate limit và thao tác nguy hiểm.
- [ ] `GET /api/v1/admin/audit-logs/integrity` trả `valid=true` cho SUPERADMIN.
- [ ] Audit metadata không chứa password, token, cookie, authorization hoặc dữ liệu thẻ.
- [ ] Response API có CSP, HSTS trên HTTPS, `nosniff`, frame denial, COOP, CORP và Permissions Policy.
- [ ] `npm run security:scan` PASS.
- [ ] Backup staging có gzip, SHA-256 và restore drill thành công.
