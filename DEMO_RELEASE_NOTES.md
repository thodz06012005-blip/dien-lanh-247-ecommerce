# Ghi Chú Phát Hành Bản Demo (DEMO RELEASE NOTES)

## 1. Thông Tin Mốc Bàn Giao
* **Tên mốc:** `Demo Local Release — Backend NestJS Migration Ready`
* **Ngày tạo mốc:** 29 tháng 06 năm 2026
* **Tác giả:** Antigravity (AI Coding Assistant)

---

## 2. Trạng Thái Hiện Tại Của Hệ Thống

| Thành phần | Trạng thái | Ghi chú |
| :--- | :---: | :--- |
| **Mock API Mode** | **PASS** | Hoạt động như một chế độ chạy thử độc lập và dự phòng an toàn. |
| **Backend NestJS Mode** | **PASS** | Kết nối trực tiếp máy chủ NestJS thật và lưu trữ MySQL. |
| **Kiểm thử E2E Giao diện Khách hàng** | **PASS** | Mua hàng trừ kho, hủy đơn trả kho, đặt lịch sửa chữa, gửi liên hệ. |
| **Kiểm thử E2E Giao diện Quản trị** | **PASS** | Dashboard, phân công thợ theo kỹ năng/địa bàn, quản lý thợ bận, quản lý đơn hàng. |
| **MySQL Local Seed** | **PASS** | Cấu trúc bảng và dữ liệu seed mẫu đầy đủ trên localhost. |
| **Production Deploy** | **CHƯA THỰC HIỆN** | Chỉ vận hành tại môi trường local/staging. |

---

## 3. Các Module Nghiệp Vụ Đã Hoàn Thành

### A. Phân Hệ Khách Hàng (frontend-user)
* **Giao dịch mua sắm:** Xem sản phẩm nổi bật, tìm kiếm, lọc theo hãng/danh mục, giỏ hàng, áp dụng voucher giảm giá, đặt hàng COD.
* **Theo dõi & Hủy đơn hàng:** Tra cứu lịch sử đặt hàng theo số điện thoại, hủy đơn hàng và tự động khôi phục số lượng tồn kho.
* **Dịch vụ lắp đặt:** Đặt lịch hẹn sửa chữa thiết bị, chọn quận/huyện hoạt động.
* **Liên hệ:** Gửi biểu mẫu tư vấn trực tuyến.

### B. Phân Hệ Quản Trị (frontend-admin)
* **Xác thực an toàn:** Cơ chế đăng nhập lấy Bearer Token, kiểm tra quyền `ADMIN`/`SUPERADMIN` qua Route Guard.
* **Bảng điều khiển:** Thống kê doanh thu, đơn hàng chờ duyệt, số kỹ thuật viên trong ngày.
* **Quản lý Sản phẩm:** Xem, thêm mới, sửa đổi thông tin và xóa sản phẩm.
* **Quản lý Đơn hàng:** Cập nhật trạng thái đơn hàng (đang xử lý, hoàn thành, hủy).
* **Quản lý Khách hàng:** Xem tổng hợp số đơn đã mua và tổng số tiền tích lũy của khách hàng.
* **Quản lý Thợ sửa chữa:** Khóa trạng thái thợ bận khi đang thực hiện lịch hẹn, chặn xóa thợ có job hoạt động.
* **Yêu cầu dịch vụ:** Phân công thợ dựa trên độ ưu tiên, kỹ năng chuyên môn phù hợp và địa bàn thợ hỗ trợ.

---

## 4. Hướng Dẫn Khởi Chạy Nhanh

### Cách 1: Chạy Mock API Mode (Mặc định)
Dự án được cấu hình mặc định kết nối tới Mock API cổng 3001.
1. Khởi động Mock API:
   ```bash
   npm run dev:mock
   ```
2. Khởi động các dự án Frontend:
   * **User:** `npm run dev:user`
   * **Admin:** `npm run dev:admin`

### Cách 2: Chạy Backend NestJS Mode (Thật)
1. Khởi động dịch vụ MySQL (ví dụ qua XAMPP Control Panel).
2. Khởi động máy chủ NestJS:
   ```bash
   cd backend
   npm run start
   ```
3. Tạo tệp `.env.local` ở cả hai thư mục `frontend-user/` và `frontend-admin/` chứa:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   ```
4. Khởi động các dự án Frontend (`npm run dev:user`, `npm run dev:admin`).

---

## 5. Tài Khoản Đăng Nhập Quản Trị Local/Dev
* **Email:** `admin@dienlanh247.vn`
* **Mật khẩu:** `admin123`
*(Lưu ý: Chỉ sử dụng cho môi trường phát triển cục bộ và môi trường thử nghiệm).*

---

## 6. Các Lệnh Kiểm Tra Chất Lượng & Regression
Luôn chạy các lệnh sau để tự động kiểm tra cú pháp và logic nghiệp vụ trước khi bàn giao:
* **Kiểm tra cú pháp & kiểu dữ liệu toàn bộ dự án:**
  ```bash
  npm run check:all
  ```
* **Chạy 4 kịch bản test nghiệp vụ Mock API:**
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

---

## 7. Các Điểm Chưa Sẵn Sàng Cho Môi Trường Production
* Chưa triển khai lên máy chủ thật (VPS/Cloud).
* Chưa thiết lập tệp tin migration chính thức từ Prisma schema (hiện đang dùng `prisma db push` trên local).
* Chưa thay đổi mật khẩu tài khoản quản trị mặc định và `JWT_SECRET` mặc định.
* Chưa cấu hình tên miền chính thức, chứng chỉ SSL/HTTPS và CORS chặt chẽ.
* Chưa thiết lập sao lưu dữ liệu tự động và hệ thống giám sát log lỗi (Monitoring).

---

## 8. Kết Luận
Bản phát hành thử nghiệm cục bộ đã **hoàn thành và sẵn sàng 100%** cho việc bàn giao, trình diễn nội bộ và đánh giá E2E của khách hàng. Để chuẩn bị đưa hệ thống ra vận hành thực tế, vui lòng đi tiếp theo hướng dẫn tại [PRODUCTION_DEPLOY_CHECKLIST.md](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/PRODUCTION_DEPLOY_CHECKLIST.md).
