# Handover Staging Deployment Preparation

Bàn giao tài liệu cấu hình, checklist kiểm thử nghiệm thu và hướng dẫn triển khai môi trường Staging cho hệ thống Điện Lạnh 247.

---

## 1. Thông Tin Phiên Bản Staging
- **Commit chính trên main dùng làm Staging:** `8459340b6164d1f28b7e28939a7cd67ebf1d2cd8`
- **Release tag tương ứng:** `v1.0.0-security-hardened`
- **Các tệp đã tạo mới trong Repo:**
  - [STAGING_DEPLOYMENT_CHECKLIST.md](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/STAGING_DEPLOYMENT_CHECKLIST.md) (Checklist Go-live Staging)
  - [backend/.env.staging.example](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/.env.staging.example) (Môi trường mẫu backend)
  - [frontend-admin/.env.staging.example](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/frontend-admin/.env.staging.example) (Môi trường mẫu admin portal)
  - [frontend-user/.env.staging.example](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/frontend-user/.env.staging.example) (Môi trường mẫu user portal)
  - [HANDOVER_STAGING_DEPLOYMENT_PREPARATION.md](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/HANDOVER_STAGING_DEPLOYMENT_PREPARATION.md) (Biên bản bàn giao này)

---

## 2. Kết Quả Verification Local
Trước khi đẩy tài liệu lên GitHub, toàn bộ hệ thống đã chạy qua các kiểm duyệt chất lượng cục bộ:
- `npm run check:all` (lint & typecheck): **PASS** (100% sạch lỗi).
- `npm run test:mock` (tích hợp nghiệp vụ): **PASS** (100% thành công).
- `backend` build: **PASS**
- `frontend-admin` build: **PASS**
- `frontend-user` build: **PASS**
- **Cam kết an toàn dữ liệu:**
  - Không commit tệp cấu hình `.env` thật.
  - Không commit các khoá bí mật (secrets) thật.
  - Không commit dữ liệu rác/test của `mock-db.json` (được khôi phục nguyên bản).

---

## 3. Các Việc Cần Thực Hiện Thủ Công Bởi Người Vận Hành (Ops/DevOps)

Để đưa hệ thống lên môi trường Staging hoạt động thực tế, người vận hành cần làm theo các bước:

1. **Khởi tạo Database Staging:**
   - Tạo một instance PostgreSQL độc lập (ví dụ trên AWS RDS hoặc một VPS riêng).
   - Thiết lập tài khoản và mật khẩu mạnh.
2. **Cấu hình Biến Môi Trường (Secrets):**
   - Sao chép các tệp `.env.staging.example` thành `.env` trên môi trường Host.
   - Điền đầy đủ kết nối `DATABASE_URL` thực tế của staging DB.
   - Sử dụng các lệnh ngẫu nhiên để sinh khóa bí mật cho `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET`.
   - Thiết lập `COOKIE_SECURE=true` (yêu cầu cấu hình SSL/TLS HTTPS trên Staging).
   - Đảm bảo đặt `ENABLE_DEV_ENDPOINTS=false` để khóa các API reset/restore nguy hiểm.
3. **Cấu hình Domain & Web server:**
   - Trỏ domain/subdomain staging tương ứng về host (Ví dụ: `staging.dienlanh247.vn`, `staging-admin.dienlanh247.vn`, `staging-api.dienlanh247.vn`).
   - Cài đặt chứng chỉ SSL (như Let's Encrypt) để bắt buộc dùng giao thức HTTPS.
4. **Chạy Migration Database Staging:**
   - Tại thư mục backend của Staging, thực hiện chạy di chuyển cấu trúc bảng:
     ```bash
     npx prisma migrate deploy
     ```
   - Chạy lệnh nạp dữ liệu mẫu ban đầu (như danh mục thiết bị, khu vực hành chính):
     ```bash
     npx prisma db seed
     ```
     *(Nhớ cấu hình biến `ADMIN_SEED_PASSWORD` mạnh để bảo vệ tài khoản admin mặc định)*.
5. **Chạy Smoke Test Nghiệm Thu:**
   - Thực hiện kiểm duyệt theo checklist chi tiết trong `STAGING_DEPLOYMENT_CHECKLIST.md` để đảm bảo hệ thống an toàn và sẵn sàng.

---

## 4. Kết Luận
Hệ thống đã hoàn toàn sẵn sàng cho việc Deploy lên Staging.
