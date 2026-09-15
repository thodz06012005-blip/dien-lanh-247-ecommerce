# HANDOVER ADMIN SECURITY PLAN 11 — BÁO CÁO INPUT VALIDATION HARDENING

## 1. Thông tin nhánh & Commit gốc
- **Branch đang làm việc**: `security/admin-phase-11-input-validation`
- **Commit gốc (Plan 10)**: `c902576` (security: protect dev-only endpoints and demo access)

---

## 2. Các file đã kiểm tra
- `backend/src/main.ts`
- `backend/src/modules/products/dto/*`
- `backend/src/modules/orders/dto/*`
- `backend/src/modules/service-requests/dto/*`
- `backend/src/modules/technicians/dto/*`
- `backend/src/modules/settings/dto/*`
- `backend/src/modules/auth/dto/*`
- `mock-api/server.js`
- `mock-api/routes/*`

---

## 3. Các file đã sửa đổi & Tạo mới

| Đường dẫn file | Thay đổi chính |
|---|---|
| `mock-api/utils/validation.js` | **[NEW]** Định nghĩa các validation helper và hàm `sendValidationError` trả về mã lỗi 400 Bad Request thống nhất. |
| `mock-api/routes/adminProducts.js` | Áp dụng validation chặt chẽ cho body (POST/PATCH), query (GET) và path param `:id` (PATCH/DELETE). |
| `mock-api/routes/orders.js` | Áp dụng validation cho query (GET `/admin/orders`), param `:id` (GET/PATCH), và status/paymentStatus enum (PATCH). |
| `mock-api/routes/serviceRequests.js` | Áp dụng validation cho query (GET `/admin/service-requests`), param `:id` (GET/PATCH), và body properties (PATCH status/assign). |
| `mock-api/routes/technicians.js` | Áp dụng validation cho query (GET `/admin/technicians`), param `:id` (GET/PATCH/DELETE), và technician body fields (POST/PATCH). |
| `mock-api/routes/adminSettings.js` | Bảo vệ hệ thống bằng cách lọc whitelisted keys. Chặn hoàn toàn các thuộc tính lạ hoặc sai kiểu dữ liệu. |
| `mock-api/routes/adminCustomers.js` | Bổ sung phân trang & lọc tham số cơ bản cho API quản lý khách hàng. |
| `mock-api/routes/public.js` | Validate các tham số tìm kiếm, phân trang và khoảng giá trong danh sách sản phẩm public để đảm bảo tính an toàn. |
| `backend/src/modules/products/dto/create-product.dto.ts` | Bổ sung `@Min(0)` cho giá gốc, giá bán, số lượng tồn kho và giới hạn độ dài ký tự cho name/slug. |
| `backend/src/modules/orders/dto/create-order.dto.ts` | Bổ sung `@IsInt()`, `@Min(1)` cho số lượng vật phẩm trong giỏ hàng, regex điện thoại Việt Nam, và `@IsEnum` cho phương thức thanh toán. |
| `backend/src/modules/orders/dto/update-order-status.dto.ts` | Ràng buộc `@IsEnum` cho trạng thái đơn hàng và trạng thái thanh toán. |
| `backend/src/modules/settings/dto/update-settings.dto.ts` | Giới hạn độ dài ký tự và kiểm tra email hợp lệ qua `@IsEmail`. |

---

## 4. Hiện trạng và Cải tiến Bảo mật Validation

### 4.1. Cấu hình NestJS Backend
- NestJS Backend đã bật sẵn global `ValidationPipe` trong `backend/src/main.ts` với các flag quan trọng:
  - `whitelist: true` (Tự động loại bỏ các thuộc tính không khai báo trong DTO).
  - `forbidNonWhitelisted: true` (Từ chối request nếu chứa thuộc tính lạ).
  - `transform: true` (Tự động chuyển đổi kiểu dữ liệu).
- Chúng tôi đã siết chặt các luật trong DTO của Backend NestJS để đảm bảo tính đồng nhất với logic của Mock API.

### 4.2. Chuẩn hóa Định dạng Lỗi 400 Bad Request
Khi dữ liệu đầu vào không hợp lệ, cả Backend NestJS và Mock API đều trả về lỗi cấu trúc thống nhất:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "basePrice",
      "message": "basePrice phải là số"
    }
  ]
}
```
Lỗi phản hồi tuyệt đối không tiết lộ:
- Stack trace hệ thống.
- Biến môi trường hay cấu hình nhạy cảm.
- Câu lệnh SQL/Prisma lỗi bên trong.

---

## 5. Kết quả Test tự động (test_plan11_validation.js)

Chúng tôi đã viết kịch bản tự động kiểm tra 16 trường hợp validation khác nhau đối với mock-api:

### 5.1. Products Validation
- POST product thiếu name -> **400 Bad Request (Validation failed)** (Thành công).
- POST product giá âm -> **400 Bad Request (Validation failed)** (Thành công).
- POST product status không khớp enum -> **400 Bad Request (Validation failed)** (Thành công).
- PATCH product status không khớp enum -> **400 Bad Request (Validation failed)** (Thành công).
- DELETE product với ID quá dài (>50 ký tự) -> **400 Bad Request (Validation failed)** (Thành công).

### 5.2. Orders Validation
- PATCH status đơn hàng sai enum -> **400 Bad Request (Validation failed)** (Thành công).
- GET đơn hàng với phân trang âm (`page=-5`) -> **400 Bad Request (Validation failed)** (Thành công).
- GET đơn hàng sắp xếp theo thuộc tính lạ -> **400 Bad Request (Validation failed)** (Thành công).

### 5.3. Service Requests Validation
- PATCH yêu cầu dịch vụ với trạng thái sai enum -> **400 Bad Request (Validation failed)** (Thành công).
- Phân công kỹ thuật viên thiếu thuộc tính `technicianId` -> **400 Bad Request (Validation failed)** (Thành công).

### 5.4. Technicians Validation
- POST tạo kỹ thuật viên thiếu họ tên -> **400 Bad Request (Validation failed)** (Thành công).
- POST tạo kỹ thuật viên có skills không phải mảng -> **400 Bad Request (Validation failed)** (Thành công).

### 5.5. Settings Validation
- PATCH cài đặt chứa thuộc tính lạ (`hackyKey`) -> **400 Bad Request (Validation failed)** (Thành công).
- PATCH cài đặt sai kiểu dữ liệu (`shippingFee` là chuỗi) -> **400 Bad Request (Validation failed)** (Thành công).

### 5.6. Auth Validation
- POST login thiếu mật khẩu -> **400 Bad Request** (Thành công).

**🎉 16/16 CASES PASSED SUCCESSFULLY**

---

## 6. Kết quả chạy Pipeline kiểm thử toàn bộ

| Lệnh | Kết quả |
|---|---|
| `npm run check:all` | **✅ PASS** (Syntax check, tsc compile, eslint pass) |
| `npm run test:mock` | **✅ PASS** (Gồm tất cả 4 test suite chính của mock-api) |
| `npm --prefix backend run build` | **✅ PASS** (NestJS compile thành công) |
| `npm --prefix frontend-admin run build` | **✅ PASS** (Vite build thành công) |
| `npm --prefix frontend-user run build` | **✅ PASS** (Vite build thành công) |

---

## 7. Rủi ro còn lại & Đề xuất tiếp theo
- Dữ liệu truy vấn (query) phía NestJS backend & mock-api đã được validate các trường cơ bản như page, limit, sortBy. Tuy nhiên, việc siết chặt sâu hơn để ngăn chặn các kiểu tấn công khai thác cơ sở dữ liệu qua query sẽ được triển khai chi tiết ở Plan 12: Query Hardening.
- **Đề xuất bước tiếp theo**: Bắt đầu Plan 12 — Query Hardening.
