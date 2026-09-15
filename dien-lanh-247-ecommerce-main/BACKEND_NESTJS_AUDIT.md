# Báo Cáo Kiểm Toán & Đánh Giá Backend NestJS

Tài liệu này đánh giá tính sẵn sàng của mã nguồn Backend NestJS hiện tại so với tài liệu đặc tả [API_CONTRACT.md](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/API_CONTRACT.md) và hệ thống `mock-api` đang vận hành ổn định.

---

## 1. Tổng Quan Backend NestJS Hiện Tại

### A. Công nghệ (Tech Stack)
* **Framework:** NestJS (v11.0.1)
* **ORM:** Prisma (v6.4.0)
* **Cơ sở dữ liệu cấu hình:** MySQL (qua Prisma Client)
* **Tính năng phụ trợ:** Mailer (nodemailer), Logger (winston), Payment (vnpay), Upload (cloudinary).
* **Trạng thái biên dịch:** **PASS** (lệnh `npm run build` chạy thành công không có lỗi TypeScript).

### B. Các Module Hiện Có
1. `auth`: Xác thực, đăng nhập và cấp quyền chung (dành cho người dùng).
2. `users`: Quản lý tài khoản và thông tin người dùng.
3. `products`: Quản lý danh mục sản phẩm và biến thể.
4. `categories`: Quản lý danh mục.
5. `brands`: Quản lý thương hiệu.
6. `cart`: Quản lý giỏ hàng của khách hàng.
7. `orders`: Đặt hàng và tra cứu đơn hàng.

### C. Các Module Hoàn Toàn Còn Thiếu
1. **`service-requests` (Yêu cầu sửa chữa dịch vụ):** Chưa hề có controller, service hay thực thể lưu trữ nào!
2. **`technicians` (Kỹ thuật viên):** Chưa có module quản lý thợ, phân khu vực hoạt động và kỹ năng.
3. **`dashboard` (Thống kê quản trị):** Chưa có API phục vụ việc tính toán các KPI của trang chủ Admin.
4. **`settings` (Cấu hình hệ thống):** Chưa có API quản lý thông số Hotline, Zalo, Phí ship mặc định.
5. **`contact` (Phản hồi liên hệ):** Chưa có API nhận thông tin liên hệ.
6. **`dev` (Reset cơ sở dữ liệu):** Chưa có API phục vụ dọn dẹp và reset database cho môi trường test (`/dev/reset-db`).

---

## 2. Bảng So Sánh Các Nhóm API

| Nhóm API | Mock-api / API_CONTRACT.md | Backend NestJS Hiện Có | Trạng Thái | Ghi Chú |
| :--- | :--- | :--- | :--- | :--- |
| **Auth Admin** | Đăng nhập, đăng xuất, lấy thông tin cá nhân. | Có `/auth/login`, `/auth/register` chung. | **Lệch / Thiếu** | Chưa phân biệt rõ luồng admin auth riêng biệt với token hết hạn động. |
| **Customer Auth** | Đăng ký, đăng nhập, lấy thông tin cá nhân. | Có `/auth/login`, `/auth/register` chung. | **Đã có** | Cần kiểm tra độ khớp của các thuộc tính response. |
| **Products** | Xem danh sách, tìm kiếm, bộ lọc, CRUD admin. | Có module `products`. | **Khớp 80%** | NestJS sử dụng `basePrice` dạng Decimal và có bảng `Variant`. Mock-api lưu phẳng thuộc tính giá. |
| **Categories** | Xem danh sách, CRUD admin. | Có module `categories`. | **Khớp 90%** | Hoạt động tốt. |
| **Brands** | Xem danh sách, CRUD admin. | Có module `brands`. | **Khớp 90%** | Hoạt động tốt. |
| **Orders** | Tính giá server-side, đặt hàng, cập nhật trạng thái. | Có module `orders`. | **Lệch** | NestJS chưa tích hợp đầy đủ tính toán server-side pricing, trừ kho tự động, khôi phục kho khi hủy. |
| **Service Requests**| Đặt lịch dịch vụ, gán thợ, chuyển trạng thái. | Không có. | **THIẾU 100%** | Chưa xây dựng. |
| **Technicians** | CRUD thợ, khóa trạng thái khi thợ bận. | Không có. | **THIẾU 100%** | Chưa xây dựng. |
| **Dashboard** | Tính toán doanh thu hôm nay, KPI, Sparkline. | Không có. | **THIẾU 100%** | Chưa xây dựng. |
| **Settings** | Lấy cấu hình và cập nhật cấu hình hệ thống. | Không có. | **THIẾU 100%** | Chưa xây dựng. |
| **Contact** | Gửi form liên hệ khách hàng. | Không có. | **THIẾU 100%** | Chưa xây dựng. |
| **Dev Reset** | `/api/v1/dev/reset-db`. | Không có. | **THIẾU 100%** | Chưa xây dựng. |

---

## 3. Đánh Giá Prisma Schema (`schema.prisma`)

Các thực thể lưu trữ trong cơ sở dữ liệu MySQL hiện tại bị thiếu hụt nghiêm trọng để có thể chạy được các tính năng nghiệp vụ cốt lõi:

* **Thực thể đã có:** `User`, `Category`, `Brand`, `Product`, `ProductImage`, `Variant`, `Cart`, `CartItem`, `Address`, `Order`, `OrderItem`, `Payment`, `Shipping`, `Review`, `Coupon`.
* **Thực thể hoàn toàn thiếu:**
  1. `ServiceCategory`: Danh mục dịch vụ sửa chữa thiết bị (Vệ sinh máy lạnh, Sửa tủ lạnh, v.v.).
  2. `ServiceRequest`: Các yêu cầu sửa chữa dịch vụ từ khách hàng.
  3. `Technician`: Thông tin hồ sơ kỹ thuật viên.
  4. `Settings`: Cấu hình hệ thống (tên cửa hàng, hotline, zalo, địa chỉ, phí ship, ngưỡng miễn ship).
  5. `Contact`: Phản hồi liên hệ của khách hàng.
* **Mối quan hệ cần bổ sung:**
  * Liên kết giữa `ServiceRequest` và `Technician` (gán thợ sửa chữa).
  * Mối quan hệ giữa `ServiceRequest` và `ServiceCategory`.

---

## 4. Các Rủi Ro Nghiệp Vụ Khi Dịch Chuyển (Migration Risks)

1. **Rủi ro hình dạng dữ liệu (Response Shape):**
   * Mock-api trả về định dạng phẳng `{ success: true, data: ... }`. NestJS theo mặc định sẽ trả trực tiếp thực thể. Nếu không dùng `Interceptor` để bao bọc phản hồi, giao diện Frontend sẽ bị crash ngay lập tức do không đọc được thuộc tính `.data`.
2. **Rủi ro kiểu dữ liệu (ID Types):**
   * Mock-api sử dụng chuỗi ngẫu nhiên (string UUID) cho các ID (`id: "PROD-xxx"`, `id: "TECH-xxx"`, `id: "SR-xxx"`).
   * Prisma schema hiện tại của NestJS định nghĩa ID là dạng số tăng dần (`Int @id @default(autoincrement())`). Điều này sẽ làm gãy toàn bộ định dạng hiển thị mã số và đường dẫn liên kết của Frontend.
3. **Rủi ro nghiệp vụ tiền tệ và tồn kho (Server-side Pricing & Stock):**
   * NestJS chưa có logic tính toán và đối chiếu giá trị thực tế trên server khi đặt hàng, và chưa có cơ chế khôi phục tồn kho tự động khi hủy đơn hàng.
4. **Rủi ro logic điều phối dịch vụ (Service Request Lifecycle):**
   * Các quy tắc kiểm tra nghiêm ngặt (chỉ gán thợ thuộc khu vực của khách, thợ có kỹ năng tương thích thiết bị, thợ đang rảnh và tự động khóa/mở trạng thái thợ) chưa được hiện thực hóa trên NestJS.

---

## 5. Đề Xuất Kế Hoạch Dịch Chuyển An Toàn (Safe Migration Plan)

Để không làm gián đoạn hệ thống và đảm bảo tính liên tục, tuyệt đối **không dịch chuyển ồ ạt**. Đề xuất chia nhỏ thành các giai đoạn như sau:

### Phase 1: Bổ sung Database Schema & Cấu Trúc Thực Thể
* Viết thêm các thực thể `ServiceCategory`, `ServiceRequest`, `Technician`, `Settings`, `Contact` vào `schema.prisma`.
* Đổi kiểu dữ liệu ID của các thực thể chính sang dạng `String` (hoặc cấu hình sinh mã số tùy chỉnh) để khớp với định dạng mã hiển thị của Frontend (`SR-240601`, `TECH-001`, `ORD-123`).
* Chạy migration để cập nhật cơ sở dữ liệu local.

### Phase 2: Phát triển các Module cốt lõi còn thiếu trên NestJS
* Xây dựng module `technicians` và `service-requests`.
* Hiện thực hóa toàn bộ logic so khớp kỹ năng, địa bàn hoạt động và khóa trạng thái kỹ thuật viên bận.

### Phase 3: Đồng bộ luồng Tính Giá và Kho hàng (Orders)
* Viết logic server-side pricing và restore stock khi hủy đơn hàng trên NestJS.

### Phase 4: Thiết lập Response Interceptor & Auth Guard
* Xây dựng một NestJS Interceptor để chuẩn hóa mọi phản hồi về dạng `{ success: true, data }` để tương thích ngược hoàn toàn với Frontend.
* Hoàn thiện phân quyền tài khoản (Admin với vai trò `owner` và Khách hàng).

### Phase 5: Thay thế từng phần trên Frontend (API Base URL Switch)
* Tiến hành đổi API endpoint của từng module trên Frontend sang port của NestJS (ví dụ: chuyển các API tĩnh như `/products`, `/categories` trước, sau đó chuyển dần các API phức tạp hơn như `/orders` và `/service-requests`).

---

## 6. Kết Luận

* **Backend hiện tại đã đủ để thay thế mock-api chưa?** **CHƯA**. Hiện tại thiếu hơn 50% tính năng cốt lõi (toàn bộ nghiệp vụ sửa chữa dịch vụ và kỹ thuật viên).
* **Có nên tiến hành dịch chuyển (migrate) ngay không?** **CHƯA**. Cần phải bổ sung các thực thể vào Prisma schema và phát triển các module còn thiếu trên NestJS trước khi tiến hành kết nối giao diện Frontend.
