# Hướng Dẫn Mở Gói Và Khởi Chạy Demo (HANDOVER & RUN GUIDE)

Chào mừng bạn đến với tài liệu hướng dẫn khôi phục và khởi chạy hệ thống Điện Lạnh 247. Tài liệu này giúp bạn khởi chạy nhanh dự án từ gói ZIP bàn giao hoặc từ Git repository.

---

## 1. Tổng Quan Dự Án
Hệ thống Điện Lạnh 247 là nền tảng thương mại điện tử và đặt lịch dịch vụ sửa chữa điện lạnh, bao gồm 4 phân hệ chính:
1. **frontend-user (Cổng khách hàng):** Giao diện mua sắm, đặt hàng, đặt lịch hẹn và liên hệ tư vấn.
2. **frontend-admin (Cổng quản trị):** Quản trị đơn hàng, cấu hình hệ thống, quản lý thợ sửa chữa và phân công công việc.
3. **mock-api (Máy chủ mô phỏng):** Cung cấp API tĩnh phục vụ demo và phát triển nhanh độc lập.
4. **backend (Máy chủ NestJS thật):** Máy chủ NestJS kết nối cơ sở dữ liệu MySQL, thực hiện các nghiệp vụ tính giá, kiểm tra tồn kho và phân công thợ tự động.

* **Link GitHub chính thức:** [thodz06012005-blip/dien-lanh-247-ecommerce](https://github.com/thodz06012005-blip/dien-lanh-247-ecommerce)

---

## 2. Hướng Dẫn Khởi Chạy Nhanh

### Bước 1: Mở gói và cài đặt thư viện
Giải nén gói ZIP vào thư mục làm việc của bạn. Tại thư mục gốc của dự án, chạy lệnh dưới đây để tự động cài đặt toàn bộ thư viện cho tất cả các phân hệ:
```bash
npm run install:all
```
*(Hoặc bạn có thể chạy `npm install` ở từng thư mục: root, `backend`, `frontend-user`, `frontend-admin`, và `mock-api`).*

---

### Chế Độ 1: Khởi Chạy Với Mock API (Demo Nhanh)
Chế độ này sử dụng dữ liệu tĩnh mô phỏng từ tệp `mock-db.json`, không yêu cầu cài đặt MySQL.

1. **Khởi động Mock API Server** (cổng 3001):
   ```bash
   npm run dev:mock
   ```
2. **Khởi động các phân hệ Frontend**:
   * **Giao diện Khách hàng:** `npm run dev:user` (cổng 5173).
   * **Giao diện Quản trị:** `npm run dev:admin` (cổng 5174).

---

### Chế Độ 2: Khởi Chạy Với Backend NestJS Thật (MySQL)
Chế độ này kết nối trực tiếp giao diện Frontend với máy chủ NestJS thật và lưu trữ dữ liệu vào database MySQL.

1. **Khởi động máy chủ MySQL** (ví dụ qua XAMPP Control Panel).
2. **Tạo cơ sở dữ liệu:** Tạo một database rỗng tên là `ecommerce` trong MySQL.
3. **Đồng bộ và Nạp dữ liệu hạt giống (Seed):**
   Di chuyển vào thư mục `backend/` và chạy các lệnh:
   ```bash
   cd backend
   npx prisma db push
   npx prisma db seed
   ```
4. **Khởi động máy chủ NestJS** (cổng 3000):
   ```bash
   npm run start
   ```
5. **Cấu hình cục bộ cho các Frontend:**
   Tạo tệp `.env.local` ở cả hai thư mục `frontend-user/` và `frontend-admin/` với nội dung:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   ```
6. **Khởi động các phân hệ Frontend**:
   * **Giao diện Khách hàng:** `npm run dev:user`
   * **Giao diện Quản trị:** `npm run dev:admin`

---

## 3. Các Địa Chỉ Kết Nối Cục Bộ (Local URLs)
* **Giao diện Khách hàng:** `http://localhost:5173`
* **Giao diện Quản trị:** `http://localhost:5174`
* **Cổng Mock API Server:** `http://localhost:3001/api/v1`
* **Cổng Backend NestJS Server:** `http://localhost:3000/api/v1`

---

## 4. Tài Khoản Đăng Nhập Quản Trị Local/Dev
Đăng nhập vào trang quản trị `http://localhost:5174` bằng tài khoản:
* **Email:** `admin@dienlanh247.vn`
* **Mật khẩu:** `admin123`
*(Lưu ý: Chỉ sử dụng cho môi trường phát triển cục bộ và môi trường thử nghiệm).*

---

## 5. Các Lệnh Kiểm Tra Chất Lượng & Kiểm Thử Tự Động
Chạy các lệnh này ở thư mục gốc để đảm bảo hệ thống không có lỗi cú pháp và nghiệp vụ:
* **Kiểm tra cú pháp & kiểu dữ liệu toàn bộ dự án:**
  ```bash
  npm run check:all
  ```
* **Chạy các kịch bản test nghiệp vụ Mock API:**
  ```bash
  node scratch/test_order_pricing.js
  node scratch/test_service_request_lifecycle.js
  node scratch/test_technician_rules.js
  node scratch/test_enum_contract.js
  ```
* **Chạy kịch bản test tích hợp API NestJS thật:**
  ```bash
  node scratch/test_nestjs_api.js
  ```
