# Trạng Thái Kiểm Thử Độc Lập API Backend NestJS (Phase 10H-1)

Tài liệu này ghi nhận kết quả và phương pháp kiểm thử độc lập toàn bộ hệ thống API trên Backend NestJS trước khi tích hợp vào giao diện.

---

## 1. Kịch Bản Kiểm Thử Tự Động (API Test Script)
Để phục vụ việc kiểm thử nhanh và chính xác, chúng tôi đã xây dựng kịch bản kiểm thử tự động tại [scratch/test_nestjs_api.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/scratch/test_nestjs_api.js). Kịch bản này tự động bao phủ 5 nhóm chức năng chính:
1. **Public APIs:** Kiểm tra các API công khai `/service-categories`, `/settings/public`, `/categories`, `/brands`, `/products`, và `POST /contact`.
2. **Security & Auth:** Kiểm tra chặn truy cập khi thiếu token hoặc token sai; đăng nhập admin lấy `accessToken` và lấy thông tin cá nhân `/admin/auth/me`.
3. **Admin Protected Endpoints:** Gửi Bearer Token để truy cập `/admin/dashboard`, `/admin/settings`, `/admin/technicians`, `/admin/service-requests`, và `/admin/orders`.
4. **Vòng đời Yêu cầu dịch vụ:** Tạo mới lịch hẹn, xác nhận (confirmed), phân công thợ (assigned), cập nhật trạng thái bận/rỗi của thợ, và hoàn thành lịch hẹn (completed).
5. **Vòng đời Đơn hàng & Kho hàng:** Tạo đơn hàng mới, kiểm tra tự động tính toán giá trị và khấu trừ tồn kho (stock), hủy đơn hàng và kiểm tra tự động khôi phục tồn kho (stock restore).

---

## 2. Nhật Ký Lỗi Phát Hiện & Đã Khắc Phục (Bug Fixes)
Trong quá trình chạy thử nghiệm, chúng tôi đã phát hiện và xử lý thành công các lỗi sau:

### Lỗi 1: Khởi động NestJS bị lỗi `ReferenceError: Cannot access 'class_validator_2' before initialization`
* **Nguyên nhân:** Trong tệp `update-service-request-status.dto.ts`, decorator `@IsString()` được sử dụng ở dòng 14 nhưng câu lệnh `import { IsString } from 'class-validator'` lại nằm ở cuối tệp (dòng 20). Do đó, khi NestJS load lớp này để khởi tạo, `IsString` chưa được định nghĩa.
* **Khắc phục:** Đã di chuyển `IsString` vào dòng import chung ở đầu tệp và xóa bỏ phần import thừa ở cuối tệp.

### Lỗi 2: Lỗi kết nối cơ sở dữ liệu `PrismaClientInitializationError (P1001)`
* **Nguyên nhân:** Trên hệ điều hành Windows, chuỗi kết nối sử dụng `localhost` đôi khi bị phân giải nhầm sang địa chỉ IPv6 `::1`, trong khi dịch vụ MySQL của XAMPP chỉ lắng nghe trên IPv4 `127.0.0.1`.
* **Khắc phục:** Đã cập nhật chuỗi kết nối trong tệp `.env` thành địa chỉ IPv4 cụ thể:
  `DATABASE_URL="mysql://root:@127.0.0.1:3306/ecommerce"`

---

## 3. Trạng Thái Kết Quả Chạy Thử Nghiệm API Thật (MySQL Local)
* **MySQL Cục Bộ:** **Hoạt động ổn định** (Cổng `3306` đang lắng nghe).
* **Cơ sở dữ liệu `ecommerce`:** Truy cập thành công. Dữ liệu seed còn đầy đủ (4 thợ, 6 danh mục dịch vụ, 2 yêu cầu dịch vụ, 1 cấu hình hệ thống).
* **Backend Build (`npm run build`):** **PASS**.
* **Backend Runtime:** **PASS** (NestJS khởi chạy thành công và lắng nghe tại cổng `3000`).
* **Test Script (`test_nestjs_api.js`):** **PASS 100%**.
  * **Public API:** **PASS** (Tất cả 6 API public chạy ổn định).
  * **Admin Auth:** **PASS** (Đăng nhập lấy Token và xác thực `/me` hoạt động tốt).
  * **Admin Protected Routes:** **PASS** (Chặn truy cập trái phép và cho phép truy cập khi có Token hợp lệ).
  * **Service Requests API:** **PASS** (Luồng tạo mới, gán thợ, chuyển trạng thái thợ sang busy và giải phóng sang available khi hoàn thành chạy hoàn hảo).
  * **Orders API:** **PASS** (Tạo đơn hàng, khấu trừ tồn kho sản phẩm, tính toán giá trị đơn, hủy đơn hàng và khôi phục tồn kho chạy hoàn hảo).
* **Trạng thái di chuyển Frontend:** Vẫn giữ nguyên kết nối tới `mock-api` (cổng 3001) để đảm bảo hệ thống hoạt động ổn định.

---

## 4. Kết Luận
**10H PASS hoàn toàn, backend API thật đã sẵn sàng để lập kế hoạch 10I.**
*(Hệ thống đã đủ điều kiện để bắt đầu chuyển đổi từng phần giao diện Frontend sang Backend NestJS thật).*
