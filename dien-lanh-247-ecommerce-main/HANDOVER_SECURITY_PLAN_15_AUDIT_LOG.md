# Biên bản bàn giao: Plan 15 — Audit Log / Security Event Monitoring

Kế hoạch này triển khai hệ thống ghi nhật ký kiểm toán (Audit Log) và giám sát sự kiện bảo mật cho toàn bộ admin system của Điện Lạnh 247, bao gồm cả Mock API và NestJS Backend.

## 1. Thông tin chung
- **Branch đang làm:** `security/admin-phase-15-audit-log`
- **Commit gốc từ Plan 14:** `5b78f37`

## 2. File thay đổi & tạo mới

### Mock API
- **Tạo mới:**
  - [auditLog.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/mock-api/utils/auditLog.js) (Helper xử lý log, lọc nhạy cảm, giới hạn size)
  - [auditLogs.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/mock-api/routes/auditLogs.js) (Router API quản lý log cho SUPERADMIN)
- **Cập nhật:**
  - [server.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/mock-api/server.js) (Tích hợp auth audit & mount route)
  - [utils/auth.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/mock-api/utils/auth.js) (Tích hợp RBAC denied)
  - [routes/adminProducts.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/mock-api/routes/adminProducts.js) (Product CRUD audit)
  - [routes/orders.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/mock-api/routes/orders.js) (Order status update audit)
  - [routes/serviceRequests.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/mock-api/routes/serviceRequests.js) (Service request status/assign audit)
  - [routes/technicians.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/mock-api/routes/technicians.js) (Technician CRUD/status audit)
  - [routes/adminSettings.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/mock-api/routes/adminSettings.js) (Settings update audit)
  - [routes/dev.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/mock-api/routes/dev.js) (Reset DB audit)
  - [.env.example](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/mock-api/.env.example) (Thêm các cấu hình env mẫu)

### NestJS Backend
- **Tạo mới:**
  - [audit-log.service.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/src/modules/audit/audit-log.service.ts)
  - [audit-log-query.dto.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/src/modules/audit/dto/audit-log-query.dto.ts)
  - [audit-log.controller.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/src/modules/audit/audit-log.controller.ts)
  - [audit-log.module.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/src/modules/audit/audit-log.module.ts)
- **Cập nhật:**
  - [app.module.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/src/app.module.ts)
  - [modules/auth/auth.service.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/src/modules/auth/auth.service.ts)
  - [modules/auth/admin-auth.controller.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/src/modules/auth/admin-auth.controller.ts)
  - [common/guards/roles.guard.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/src/common/guards/roles.guard.ts)
  - [modules/products/products.controller.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/src/modules/products/products.controller.ts)
  - [modules/orders/orders.controller.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/src/modules/orders/orders.controller.ts)
  - [modules/service-requests/service-requests.controller.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/src/modules/service-requests/service-requests.controller.ts)
  - [modules/technicians/technicians.controller.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/src/modules/technicians/technicians.controller.ts)
  - [modules/settings/settings.controller.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/src/modules/settings/settings.controller.ts)
  - [.env.example](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/.env.example)

---

## 3. Thiết kế Chính Sách Nhật Ký Kiểm Toán (Audit Policy)

### Nguyên trạng trước khi sửa
- Hệ thống hoàn toàn không ghi nhận logs hoạt động hoặc logs sự kiện bảo mật.
- Khi quản trị viên thay đổi cài đặt hoặc sửa giá sản phẩm, hệ thống không lưu lại tác nhân thực hiện và các giá trị trước/sau khi sửa đổi.

### Chính sách sau khi sửa
- Hệ thống bắt buộc phải ghi lại mọi hoạt động quản trị nhạy cảm của tài khoản Admin/Staff/Superadmin.
- Mỗi bản ghi audit log lưu các trường sau:
  - `id`: Mã log duy nhất (`AUD-` + timestamp + random).
  - `timestamp`: Thời gian xảy ra sự kiện (ISO 8601).
  - `actorId`: ID của tài khoản thực hiện hành động.
  - `actorEmail`: Email của tài khoản.
  - `actorRole`: Vai trò phân quyền của tài khoản.
  - `action`: Mã hành động (Hỗ trợ: `AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILED`, `AUTH_LOGIN_RATE_LIMITED`, `AUTH_LOGOUT`, `RBAC_FORBIDDEN`, `PRODUCT_CREATED`, `PRODUCT_UPDATED`, `PRODUCT_DELETED`, `ORDER_STATUS_UPDATED`, `SERVICE_REQUEST_STATUS_UPDATED`, `SERVICE_REQUEST_ASSIGNED`, `TECHNICIAN_CREATED`, `TECHNICIAN_UPDATED`, `TECHNICIAN_STATUS_UPDATED`, `TECHNICIAN_DELETED`, `SETTINGS_UPDATED`, `DEV_RESET_DB`).
  - `resource`: Tên tài nguyên (ví dụ: `auth`, `product`, `order`, `serviceRequest`, `technician`, `settings`, `system`).
  - `resourceId`: ID của tài nguyên cụ thể (nếu có).
  - `status`: Kết quả thực thi (`success`, `failure`, `denied`, `rate_limited`).
  - `ip`: Địa chỉ IP nguồn của client (tương thích proxy qua header `X-Forwarded-For`).
  - `userAgent`: Chuỗi thông tin trình duyệt/HTTP client gửi request.
  - `metadata`: Dữ liệu bổ sung đi kèm sự kiện đã được lọc sạch bảo mật.
  - `message`: Mô tả ngắn gọn về hành động.

### Quy tắc lọc bảo mật (Sanitization Rules)
- Sử dụng hàm kiểm duyệt đệ quy `sanitizeAuditMetadata`.
- Lọc bỏ hoàn toàn các trường nhạy cảm: `password`, `passwordHash`, `accessToken`, `refreshToken`, `cookie`, `Authorization`, `token`, `secret`, `env`, `config` (thay thế bằng giá trị `'[REDACTED]'`).
- Giới hạn kích thước tối đa của metadata chuỗi hóa là **5000 ký tự** để tránh tràn bộ nhớ hoặc phình dữ liệu logs.
- Giới hạn số lượng bản ghi tối đa là **1000 logs** (cắt bớt các bản ghi cũ nhất).

---

## 4. Chi tiết triển khai

### Mock API
- Helper `auditLog.js` thực hiện lưu logs vào thuộc tính `auditLogs` của `mock-db.json`.
- Tự động tạo mảng `auditLogs: []` khi trống.
- Router `auditLogs.js` cung cấp API `GET /api/v1/admin/audit-logs` được bảo vệ: chỉ cho phép người dùng đăng nhập có vai trò `superadmin` truy cập. Bất kỳ tài khoản `staff` hoặc `admin` cố gắng truy cập sẽ bị từ chối truy cập (403) và kích hoạt ghi log sự kiện `RBAC_FORBIDDEN`.

### NestJS Backend
- **Phương án lựa chọn:** **Phương án B — In-memory backend audit log**.
- **Lý do:** Tránh thực hiện migration cơ sở dữ liệu Prisma của môi trường thực, đảm bảo không có rủi ro chết dịch vụ hoặc lỗi Runtime do cấu trúc bảng thay đổi trong giai đoạn bảo mật hiện tại.
- **Rủi ro:** Nhật ký kiểm toán của backend được lưu trữ trên RAM. Logs sẽ bị mất sạch mỗi khi ứng dụng backend bị khởi động lại (restart process).
- **Đề xuất tương lai:** Chuyển đổi in-memory sang Prisma model (`AuditLog`) để lưu trữ an toàn trong DB ở giai đoạn deploy production ổn định.
- **RBAC Denied Logs:** Đã cài đặt tự động bắt giữ trong `RolesGuard` để ghi sự kiện `RBAC_FORBIDDEN` với status `denied` khi phân quyền bị chặn.

---

## 5. Kết quả kiểm thử & tích hợp

### Kết quả chạy kiểm thử Audit Log
Đã chạy kịch bản kiểm thử độc lập [test_plan15_audit_log.js](file:///C:/Users/Admin/.gemini/antigravity/brain/1ec938c5-52e2-4bd6-87ad-22231bc04644/scratch/test_plan15_audit_log.js):
- **Số lượng trường hợp kiểm thử (test cases):** 30 Cases.
- **Kết quả:** **30/30 PASS / 0 FAIL**.
- Các nội dung kiểm tra cụ thể:
  - Auth audit logs (Thành công, thất bại, rate limit, logout) -> ĐẠT
  - CRUD & Settings audit logs -> ĐẠT
  - Access control cấm truy cập API Logs cho vai trò thấp -> ĐẠT
  - Query parameter validation (Chặn page=0, limit > 100) -> ĐẠT
  - Lọc logs đệ quy và che giấu thông tin mật khẩu -> ĐẠT

### Kết quả chạy kiểm thử toàn diện & build hệ thống
- `npm run check:all`: **PASS** (lint và typecheck không có lỗi).
- `npm run test:mock`: **PASS** (tất cả các test case nghiệp vụ đơn hàng, thợ sửa chữa, thợ bận/rảnh, logic tồn kho đều hoạt động bình thường, không bị phá vỡ bởi hệ thống ghi log).
- `backend` build (`npm run build`): **PASS**.
- `frontend-admin` build (`npm run build`): **PASS**.
- `frontend-user` build (`npm run build`): **PASS**.

---

## 6. Đánh giá rủi ro & Khuyến nghị tiếp theo
- **Rủi ro còn lại:** Nhật ký backend sẽ mất khi restart process.
- **Khuyến nghị Plan 16 tiếp theo:** Triển khai **Soft Delete / Dangerous Action Guard** để tăng cường khả năng phục hồi dữ liệu khi admin thao tác lỗi và bảo vệ các hành động phá hoại.
