# Tóm Tắt Bàn Giao Dự Án (HANDOVER SUMMARY)

## 1. Thông Tin Chung
* **Tên dự án:** Điện Lạnh 247 Ecommerce Platform
* **Mục tiêu:** Nền tảng thương mại điện tử mua bán thiết bị và đặt lịch sửa chữa dịch vụ điện lạnh (điều hòa, tủ lạnh, máy giặt...).
* **Repository GitHub:** [thodz06012005-blip/dien-lanh-247-ecommerce](https://github.com/thodz06012005-blip/dien-lanh-247-ecommerce)
* **Gói ZIP bàn giao sạch (không node_modules/env/.git):**
  `C:\Users\Admin\.gemini\antigravity\scratch\dien-lanh-247-demo-backend-nestjs-ready.zip`

---

## 2. Các Thành Phần Chính Của Dự Án
1. **frontend-user (Cổng khách hàng):** Giao diện mua sắm, đặt hàng trừ kho, tra cứu/hủy đơn, đặt lịch sửa chữa và liên hệ.
2. **frontend-admin (Cổng quản trị):** Dashboard thống kê doanh thu, duyệt/phân công thợ, quản lý thợ bận, quản lý đơn hàng và cấu hình hệ thống.
3. **mock-api (Mô phỏng độc lập):** Chạy API giả lập phục vụ demo nhanh không cần cơ sở dữ liệu.
4. **backend (NestJS thật):** Máy chủ NestJS kết nối MySQL xử lý các nghiệp vụ tính tiền, kiểm tra kho, và gán thợ.

---

## 3. Trạng Thái Hiện Tại (100% PASS)
* **Mock API Mode:** **PASS**
* **Backend NestJS Mode:** **PASS**
* **Frontend-User E2E:** **PASS**
* **Frontend-Admin E2E:** **PASS**
* **GitHub Push:** **PASS** (Đã đồng bộ nhánh `main`).
* **Production Deploy:** **CHƯA THỰC HIỆN** (Mới sẵn sàng local/staging).

---

## 4. Hướng Dẫn Khởi Chạy Nhanh

### Cách 1: Chạy Mock API Mode (Demo Nhanh)
* **Khởi động Mock API:** `npm run dev:mock` (cổng 3001).
* **Khởi động Frontend User:** `npm run dev:user` (cổng 5173).
* **Khởi động Frontend Admin:** `npm run dev:admin` (cổng 5174).

### Cách 2: Chạy Backend NestJS Mode (MySQL Thật)
1. Bật dịch vụ MySQL (XAMPP).
2. Tạo database rỗng tên `ecommerce`.
3. Đồng bộ bảng & Nạp dữ liệu hạt giống (Seed):
   ```bash
   cd backend
   npx prisma db push
   npx prisma db seed
   npm run start
   ```
4. Tạo tệp `.env.local` ở cả hai thư mục `frontend-user/` và `frontend-admin/` chứa:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   ```
5. Khởi động các phân hệ Frontend (`npm run dev:user`, `npm run dev:admin`).

---

## 5. Địa Chỉ Các Cổng Dịch Vụ Cục Bộ (Local URLs)
* **Giao diện Khách hàng:** `http://localhost:5173`
* **Giao diện Quản trị:** `http://localhost:5174`
* **Cổng Mock API Server:** `http://localhost:3001/api/v1`
* **Cổng Backend NestJS Server:** `http://localhost:3000/api/v1`

---

## 6. Tài Khoản Đăng Nhập Quản Trị Local/Dev
* **Email:** `admin@dienlanh247.vn`
* **Mật khẩu:** `admin123`
*(Lưu ý: Chỉ dùng cho môi trường phát triển cục bộ và thử nghiệm).*

---

## 7. Các Lệnh Kiểm Tra Chất Lượng & Nghiệp Vụ
* **Kiểm tra cú pháp & kiểu dữ liệu toàn bộ dự án:** `npm run check:all`
* **Kiểm thử tự động Mock API:**
  `node scratch/test_order_pricing.js`
  `node scratch/test_service_request_lifecycle.js`
  `node scratch/test_technician_rules.js`
  `node scratch/test_enum_contract.js`
* **Kiểm thử tự động API NestJS thật:** `node scratch/test_nestjs_api.js`

---

## 8. Lưu Ý Bảo Mật & Đưa Lên Production
* Không được commit các tệp `.env` và `.env.local` cục bộ.
* Thay đổi mật khẩu tài khoản quản trị mặc định và thiết lập `JWT_SECRET` mạnh.
* Cấu hình CORS và domain HTTPS chuẩn xác.
* Bắt buộc sử dụng cơ chế migration chính thức (`npx prisma migrate deploy`) trên production, tuyệt đối không dùng `db push`.

---

## 9. Kết Luận
Dự án đã **hoàn thành di trú xuất sắc sang Backend NestJS**, hệ thống chạy mượt mà, sạch lỗi và sẵn sàng bàn giao/trình diễn demo. Chi tiết lộ trình đưa lên môi trường chạy thật có tại [PRODUCTION_DEPLOY_CHECKLIST.md](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/PRODUCTION_DEPLOY_CHECKLIST.md).
