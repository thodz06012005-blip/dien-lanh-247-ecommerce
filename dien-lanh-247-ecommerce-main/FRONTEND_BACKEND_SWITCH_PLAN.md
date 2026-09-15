# Kế Hoạch Chuyển Đổi Kết Nối Từ Mock API Sang Backend NestJS (Cập Nhật Phase 10I-4A)

Tài liệu này hướng dẫn cách cấu hình chuyển đổi động kết nối của các ứng dụng Frontend (`frontend-user` và `frontend-admin`) giữa Mock API và Backend NestJS thật.

---

## 1. Cấu Hình Địa Chỉ API (API Base URL)
Cả hai ứng dụng Frontend hiện tại đã được cấu hình để sử dụng biến môi trường động thay vì hardcode:
* **Frontend User:** Sử dụng `import.meta.env.VITE_API_BASE_URL` trong [frontend-user/src/services/api.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/frontend-user/src/services/api.ts).
* **Frontend Admin:** Sử dụng `import.meta.env.VITE_API_BASE_URL` trong [frontend-admin/src/services/api.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/frontend-admin/src/services/api.ts).

### Địa chỉ kết nối các môi trường:
* **Mock API (Mặc định an toàn):** `http://localhost:3001/api/v1`
* **Backend NestJS (Thật):** `http://localhost:3000/api/v1`

---

## 2. Hướng Dẫn Chạy Các Môi Trường

### Cách 1: Chạy với Mock API (Mặc định)
Tệp `.env` mặc định của cả hai dự án đã được đặt cấu hình trỏ tới Mock API.
1. Khởi động Mock API tại thư mục gốc:
   ```bash
   npm run dev:mock
   ```
2. Khởi động các dự án Frontend:
   * **User App:** `npm run dev:user`
   * **Admin App:** `npm run dev:admin`

### Cách 2: Chạy với Backend NestJS Thật (Local)
Để kiểm thử với cơ sở dữ liệu thật mà không làm thay đổi tệp tin cấu hình chung, hãy tạo một tệp tin cấu hình cục bộ `.env.local` ở từng thư mục dự án (tệp này được `.gitignore` bỏ qua không commit):

1. Tạo tệp [frontend-user/.env.local](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/frontend-user/.env.local) và [frontend-admin/.env.local](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/frontend-admin/.env.local) chứa nội dung:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   ```
2. Khởi động MySQL Server cục bộ (XAMPP).
3. Khởi động Backend NestJS:
   ```bash
   cd backend
   npm run start
   ```
4. Khởi động các dự án Frontend (`npm run dev:user`, `npm run dev:admin`). Lúc này, các cuộc gọi API từ trình duyệt sẽ được gửi trực tiếp tới NestJS cổng 3000.

---

## 3. Trạng Tải Các Phân Hệ Đã Kiểm Chứng (NestJS Mode)
* **Phân hệ Khách hàng (Frontend User):** **PASS 100%**. Gửi liên hệ, xem sản phẩm, đặt hàng trừ kho, xem đơn hàng, hủy đơn hàng khôi phục kho, đặt lịch sửa chữa hoạt động hoàn hảo.
* **Phân hệ Quản trị (Frontend Admin):** **PASS 100%**. Đăng nhập admin, cấp token Bearer, thống kê dashboard, xem/sửa đơn hàng, xem/thêm/sửa/xóa thợ sửa chữa, phân công thợ, hoàn tất lịch sửa chữa và quản lý danh sách khách hàng hoạt động hoàn hảo.

---

## 4. Kế Hoạch Tiếp Theo (Phase 10I-5)
Chuẩn hóa chế độ chạy đa cấu hình (dev mode / fallback) để sẵn sàng bàn giao sản phẩm.
