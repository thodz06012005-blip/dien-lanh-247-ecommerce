# Staging Deployment Runbook

Tài liệu vận hành này cung cấp quy trình và các câu lệnh chi tiết để thiết lập, deploy và vận hành môi trường Staging thực tế cho hệ thống Điện Lạnh 247.

---

## 1. Thông Tin Phiên Bản Staging
- **Nhánh Git để deploy:** `main`
- **Mã Commit chính xác:** `33c949bbabf7de0e61f2f0be875e5331fe2a3f78`
- **Các Service Staging:**
  - **NestJS Backend Staging**
  - **Frontend User Staging** (Trang khách hàng)
  - **Frontend Admin Staging** (Trang quản trị)
  - **Database Staging** (PostgreSQL)

---

## 2. Các Bước Chuẩn Bị Trên Môi Trường Hosting (Thủ công)

Trước khi chạy các lệnh deploy, kỹ sư vận hành (Ops) bắt buộc phải cấu hình thủ công các tài nguyên sau trên hosting provider (ví dụ: AWS, Docker, Render, Heroku):

### 2.1. Khởi tạo Database Staging
- Tạo một cơ sở dữ liệu PostgreSQL độc lập cho Staging.
- Đảm bảo cấu hình Firewall/Security Groups chỉ cho phép Backend Staging kết nối tới database này.

### 2.2. Khai báo các Biến Môi Trường (Environment Variables)
Cấu hình các biến này trên môi trường host của Backend Staging:
- `NODE_ENV=production`
- `DATABASE_URL`: Đường dẫn kết nối database PostgreSQL Staging vừa tạo.
- `JWT_ACCESS_SECRET`: Khóa ký token JWT (Tối thiểu 32 ký tự ngẫu nhiên).
- `JWT_REFRESH_SECRET`: Khóa ký refresh token JWT (Tối thiểu 32 ký tự ngẫu nhiên).
- `ADMIN_SEED_PASSWORD`: Mật khẩu ban đầu của tài khoản admin (Được sử dụng khi chạy seed DB).
- `FRONTEND_USER_URL`: Domain Staging của trang User (ví dụ: `https://staging.dienlanh247.vn`).
- `FRONTEND_ADMIN_URL`: Domain Staging của trang Admin (ví dụ: `https://staging-admin.dienlanh247.vn`).
- `CORS_ALLOWED_ORIGINS`: Danh sách CORS (ví dụ: `https://staging.dienlanh247.vn,https://staging-admin.dienlanh247.vn`).
- `COOKIE_SECURE=true` (Yêu cầu bắt buộc khi chạy qua HTTPS).
- `ENABLE_DEV_ENDPOINTS=false` (Vô hiệu hóa toàn bộ endpoint debug/reset database).
- `ENABLE_DEMO_ACCOUNTS=false` (Vô hiệu hóa tài khoản demo trên staging).

---

## 3. Quy Trình Câu Lệnh Deployment (Execution Commands)

### 3.1. Triển Khai Backend Staging
Tại thư mục chứa dự án backend (`/backend`) trên môi trường staging host, chạy tuần tự các lệnh sau:

```bash
# 1. Cài đặt dependencies
npm install

# 2. Sinh Prisma Client cục bộ
npx prisma generate

# 3. Chạy di chuyển cấu trúc cơ sở dữ liệu (Migration)
npx prisma migrate deploy

# 4. Nạp dữ liệu mẫu ban đầu (Database Seed)
npx prisma db seed

# 5. Biên dịch NestJS application sang production
npm run build

# 6. Khởi chạy server backend ở chế độ production
npm run start:prod
```

### 3.2. Triển Khai Frontend Admin Staging
Tại thư mục chứa dự án admin (`/frontend-admin`), chạy các lệnh:

```bash
# 1. Cài đặt dependencies
npm install

# 2. Biên dịch React/Vite portal
npm run build

# 3. Đưa nội dung thư mục build lên Web server:
# Triển khai toàn bộ nội dung trong thư mục 'dist/' lên Staging Web Server (Nginx/Apache/S3 Static Hosting).
```

### 3.3. Triển Khai Frontend User Staging
Tại thư mục chứa dự án user (`/frontend-user`), chạy các lệnh:

```bash
# 1. Cài đặt dependencies
npm install

# 2. Biên dịch React/Vite portal
npm run build

# 3. Đưa nội dung thư mục build lên Web server:
# Triển khai toàn bộ nội dung trong thư mục 'dist/' lên Staging Web Server (Nginx/Apache/S3 Static Hosting).
```

---

## 4. Kế Hoạch Smoke Test Staging

Sau khi deploy hoàn tất, đội ngũ vận hành thực hiện kiểm tra nhanh các chức năng chính để nghiệm thu môi trường (Smoke Test):
1. **Kiểm tra Healthcheck:** Gọi API `/api/v1/health` để xác minh trạng thái backend.
2. **Kiểm tra Giao diện:** Mở trang khách hàng (`frontend-user`) và trang quản trị (`frontend-admin`) xem có hiển thị lỗi trắng trang không.
3. **Đăng nhập & Lưu Cookie:** Thử đăng nhập admin bằng tài khoản seed, kiểm tra cookie `accessToken` được lưu dạng HttpOnly, Secure.
4. **CORS:** Đảm bảo API chỉ chấp nhận request từ domain Staging.
5. **Nghiệp vụ cốt lõi:** Thử nghiệm tạo sản phẩm, xóa mềm sản phẩm, đặt đơn hàng, tạo lịch sửa chữa và phân phối công việc cho kỹ thuật viên staging.
6. **Kiểm tra Security Headers:** Đảm bảo các headers bảo mật từ Plan 18 được trả về trên mọi response.
