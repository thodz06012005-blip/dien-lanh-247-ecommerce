# Tiến Độ Phát Triển Các Module Backend NestJS (Cập Nhật Phase 10I-4A)

Tài liệu này ghi nhận tiến độ phát triển và các module bảo vệ trên Backend NestJS, đảm bảo an toàn và tương thích 100% với cả hai phân hệ frontend.

---

## 1. Các Module Mới Bổ Sung (Phase 10I-4A)

### A. CustomersModule (Quản lý Khách hàng)
* **Tệp mới:**
  * [backend/src/modules/customers/customers.module.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/src/modules/customers/customers.module.ts)
  * [backend/src/modules/customers/customers.controller.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/src/modules/customers/customers.controller.ts)
  * [backend/src/modules/customers/customers.service.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/src/modules/customers/customers.service.ts)
* **Nội dung:** Xây dựng endpoint `/api/v1/admin/customers` tự động tổng hợp thông tin khách hàng thông minh từ bảng `User` (vai trò CUSTOMER), thông tin đặt hàng `Order` (khách hàng vãng lai) và lịch sử `ServiceRequest` theo số điện thoại duy nhất. Trả về đầy đủ số lượng đơn đã mua, số tiền chi tiêu tích lũy và ngày tham gia khớp hoàn hảo với UI.

---

## 2. Trạng Thái Bảo Vệ Các Endpoint (Access Control List)

### A. Các Endpoint Admin Được Bảo Vệ
Toàn bộ các endpoint quản trị dưới đây đã được cấu hình chặt chẽ để chỉ cho phép tài khoản có quyền `ADMIN` hoặc `SUPERADMIN` truy cập (thông qua `@UseGuards(JwtAuthGuard, RolesGuard)` và `@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)`):
* **Sản phẩm:**
  * `POST /api/v1/products` & `POST /api/v1/admin/products`
  * `PATCH /api/v1/products/:id` & `PATCH /api/v1/admin/products/:id`
  * `DELETE /api/v1/products/:id` & `DELETE /api/v1/admin/products/:id`
* **Đơn hàng:**
  * `GET /api/v1/admin/orders`
  * `GET /api/v1/admin/orders/:id`
  * `PATCH /api/v1/admin/orders/:id/status`
* **Khách hàng:**
  * `GET /api/v1/admin/customers`
* **Kỹ thuật viên:**
  * Toàn bộ các API tại `admin/technicians` (Lấy danh sách, Xem chi tiết, Tạo mới, Cập nhật, Đổi trạng thái, Xóa).
* **Yêu cầu dịch vụ:**
  * `GET /api/v1/admin/service-requests`
  * `GET /api/v1/admin/service-requests/:id`
  * `PATCH /api/v1/admin/service-requests/:id/status`
  * `PATCH /api/v1/admin/service-requests/:id/assign-technician`
* **Thống kê:**
  * `GET /api/v1/admin/dashboard`
* **Cấu hình:**
  * `GET /api/v1/admin/settings`
  * `PATCH /api/v1/admin/settings`

### B. Các Endpoint Public Được Giữ Mở
Đảm bảo khách hàng vãng lai không bị chặn truy cập:
* `GET /api/v1/products` & `GET /api/v1/products/:id`
* `GET /api/v1/categories` & `GET /api/v1/brands`
* `GET /api/v1/service-categories`
* `GET /api/v1/settings/public`
* `POST /api/v1/contact`
* `POST /api/v1/orders` & `GET /api/v1/orders` (tra cứu theo số điện thoại).
* `POST /api/v1/service-requests` & `GET /api/v1/my-service-requests` (tra cứu lịch hẹn).

---

## 3. Xác Nhận Trạng Thái
* **Chạy Migration / DB Push:** **PASS** (Đã đồng bộ với database local).
* **Prisma validate:** **PASS**.
* **NestJS build:** **PASS**.
* **Kịch bản Test API Thật (`test_nestjs_api.js`):** **PASS 100%**.
* **Root check:all & 4 test mock-api:** **PASS 100%**.
