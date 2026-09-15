# Kế Hoạch Thiết Kế Schema Database Cho Backend NestJS (Phase 10A)

Tài liệu này chi tiết các thiết kế và thay đổi đã thực hiện trên tệp [backend/prisma/schema.prisma](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/prisma/schema.prisma) để chuẩn bị nền tảng dữ liệu đầy đủ thay thế `mock-api` trong tương lai.

---

## 1. Các Model & Enum Đã Thêm Vào Schema

Để hỗ trợ đầy đủ các tính năng dịch vụ sửa chữa và thông tin cấu hình, các thực thể sau đã được bổ sung vào schema:

### A. Các Enum Mới
1. **`ServiceRequestStatus` (Trạng thái yêu cầu dịch vụ):**
   * Giá trị: `pending`, `confirmed`, `assigned`, `completed`, `cancelled`.
   * *Thiết kế chữ thường để tương thích 100% với giá trị trả về của mock-api và tránh các lớp ánh xạ (mapping) phức tạp ở tầng ứng dụng.*
2. **`ServiceRequestPriority` (Độ ưu tiên yêu cầu):**
   * Giá trị: `low`, `medium`, `high`, `urgent`.
3. **`TechnicianStatus` (Trạng thái hoạt động của kỹ thuật viên):**
   * Giá trị: `available`, `busy`, `offline`, `inactive`.

### B. Các Model Mới
1. **`ServiceCategory` (Danh mục dịch vụ kỹ thuật):**
   * Biểu diễn các dịch vụ như: Sửa điều hòa, Vệ sinh máy lạnh, Sửa máy giặt, v.v.
2. **`Technician` (Kỹ thuật viên):**
   * Lưu trữ hồ sơ thợ sửa chữa, điểm đánh giá, kỹ năng chuyên môn và địa bàn hoạt động.
3. **`ServiceRequest` (Yêu cầu sửa chữa dịch vụ):**
   * Lưu trữ thông tin lịch hẹn của khách hàng, mô tả sự cố, thợ phụ trách, chi phí và lịch sử cập nhật.
4. **`SystemSetting` (Cấu hình hệ thống):**
   * Lưu trữ Hotline, Zalo, địa chỉ, phí ship và ngưỡng miễn phí ship.
5. **`Contact` (Ý kiến phản hồi liên hệ):**
   * Nhận thông tin liên hệ từ khách hàng gửi về.

---

## 2. Giải Pháp Giữ Vững Hợp Đồng Dữ Liệu (API Contract)

Để đảm bảo Frontend không bị gãy định dạng liên kết và hiển thị, cấu trúc ID và mảng dữ liệu được thiết kế đặc thù như sau:

### A. Định Dạng ID Dạng Chuỗi (String ID)
Thay vì sử dụng số tự tăng (`Int @id @default(autoincrement())`), các thực thể chính sử dụng kiểu dữ liệu `String` làm khóa chính:
* **`ServiceRequest.id`:** Kiểu `String @id` (giữ nguyên định dạng `SR-240601`, `SR-240602` của hệ thống cũ).
* **`Technician.id`:** Kiểu `String @id` (giữ nguyên định dạng `TECH-001`, `TECH-002`).
* **`ServiceCategory.id`:** Kiểu `String @id` (sử dụng slug dạng chuỗi như `sua-dieu-hoa`, `ve-sinh-dieu-hoa` làm ID trực tiếp, giúp truy vấn cực kỳ nhanh gọn mà không cần qua bảng ánh xạ).

### B. Lưu Trữ Mảng Và Đối Tượng Phức Tạp Bằng Kiểu JSON
Do hệ quản trị cơ sở dữ liệu MySQL không hỗ trợ kiểu mảng nguyên bản (như PostgreSQL), các thuộc tính danh sách phức tạp được lưu trữ dưới dạng `Json`:
* **`Technician.skills`:** Kiểu `Json` (lưu mảng các ID danh mục dịch vụ, ví dụ: `["sua-dieu-hoa", "ve-sinh-dieu-hoa"]`).
* **`Technician.workingAreas`:** Kiểu `Json` (lưu mảng tên các Quận/Huyện hoạt động, ví dụ: `["Quận Cầu Giấy", "Quận Đống Đa"]`).
* **`ServiceRequest.statusHistory`:** Kiểu `Json?` (lưu trữ mảng các đối tượng lịch sử thay đổi trạng thái bao gồm: `status`, `note`, `updatedBy`, `createdAt`).

---

## 3. Các Mối Quan Hệ Đã Thiết Lập (Relationships)

* **Một danh mục dịch vụ có nhiều yêu cầu sửa chữa:**
  * `ServiceCategory` (1) <---> `ServiceRequest` (N) qua trường liên kết `serviceCategoryId`.
* **Một kỹ thuật viên phụ trách nhiều yêu cầu sửa chữa:**
  * `Technician` (1) <---> `ServiceRequest` (N) qua trường liên kết `assignedTechnicianId` (được phép `null` khi chưa phân công).

---

## 4. Tại Sao Chưa Chạy Migration / DB Push?

Trong giai đoạn **Phase 10A**, chúng ta chỉ tập trung vào việc **thiết kế và xác thực cấu trúc dữ liệu trên mã nguồn** (Prisma Schema). Việc chạy migration hoặc db push chưa được thực hiện vì:
1. **Tránh phá hủy dữ liệu thử nghiệm:** Tránh việc vô tình làm trống (truncate) hoặc làm sai lệch dữ liệu trong cơ sở dữ liệu MySQL đang hoạt động phục vụ các mục đích khác.
2. **Quy trình tích hợp từng bước:** Đảm bảo mã nguồn NestJS biên dịch thành công với schema mới trước khi thực hiện bất kỳ lệnh thay đổi cấu trúc vật lý nào trên DB.
3. **An toàn kiểm thử:** Giữ nguyên trạng thái hoạt động 100% của `mock-api` làm nền tảng kiểm thử tích hợp động.

---

## 5. Các Bước Tiếp Theo Cần Làm (Migration Phase)

Ở các bước tiếp theo (Phase 10B trở đi), khi bắt đầu chuyển giao backend:
1. Thiết lập kết nối cơ sở dữ liệu MySQL cục bộ trong file `.env`.
2. Chạy lệnh tạo bảng vật lý:
   ```bash
   npx prisma migrate dev --name init_service_requests_and_technicians
   ```
3. Viết mã nguồn khởi tạo dữ liệu mẫu (Seed Script) cho các bảng mới dựa trên dữ liệu từ [mock-api/seed/initialData.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/mock-api/seed/initialData.js).
