# Biên bản bàn giao: Plan 16 — Soft Delete & Dangerous Action Confirmation Guard

Biên bản bàn giao chi tiết các nâng cấp bảo mật liên quan đến cơ chế xóa mềm (Soft Delete) và chốt chặn xác nhận hành động nguy hiểm (Dangerous Action Confirmation Guard) cho hệ thống Điện Lạnh 247.

## 1. Thông tin chung
- **Branch đang làm:** `security/admin-phase-16-soft-delete-guards`
- **Commit gốc từ Plan 15:** `c9349ef0c650ea8c86ba3d8e7833e2432ffcbfef`

## 2. File thay đổi & tạo mới

### Mock API
- **Tạo mới:**
  - [dangerousAction.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/mock-api/utils/dangerousAction.js) (Helper kiểm soát confirmation và làm sạch lý do xóa)
- **Cập nhật:**
  - [routes/adminProducts.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/mock-api/routes/adminProducts.js) (DELETE sản phẩm)
  - [routes/technicians.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/mock-api/routes/technicians.js) (DELETE kỹ thuật viên)
  - [routes/public.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/mock-api/routes/public.js) (Bộ lọc ẩn sản phẩm đã xóa khỏi view)
  - [routes/serviceRequests.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/mock-api/routes/serviceRequests.js) (Chặn phân công thợ đã xóa mềm)
  - [.env.example](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/mock-api/.env.example)

### NestJS Backend
- **Tạo mới:**
  - [dangerous-action.dto.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/src/common/dto/dangerous-action.dto.ts) (DTO xác nhận hành động nguy hiểm)
- **Cập nhật:**
  - [modules/products/products.controller.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/src/modules/products/products.controller.ts)
  - [modules/technicians/technicians.controller.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/src/modules/technicians/technicians.controller.ts)
  - [modules/technicians/technicians.service.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/src/modules/technicians/technicians.service.ts)
  - [.env.example](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/.env.example)

### Frontend Admin Portal
- **Cập nhật:**
  - [services/api.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/frontend-admin/src/services/api.ts) (Interceptors tự động bổ sung confirmation header)

---

## 3. Chính sách Soft Delete & Chốt Chặn Xác Nhận

### Hiện trạng trước khi sửa
- Hành động xóa sản phẩm hoặc kỹ thuật viên thực hiện việc xóa vật lý (splice/delete) trực tiếp khỏi database. Điều này gây lỗi vi phạm khoá ngoại (Foreign Key Constraints) với lịch sử đơn hàng hoặc lịch sửa chữa trong quá khứ.
- Các yêu cầu xóa không bắt buộc xác nhận từ phía client API, dễ dẫn đến thao tác sai hoặc phá hoại qua API.

### Chính sách sau khi sửa
1. **Xác nhận hành động nguy hiểm (Dangerous Confirmation):**
   - Mọi request `DELETE` sản phẩm và kỹ thuật viên bắt buộc phải gửi cờ xác nhận qua:
     - Header: `X-Confirm-Dangerous-Action: true`
     - HOẶC Body: `{"confirm": true, "reason": "Lý do xóa"}`
   - Nếu thiếu xác nhận, hệ thống trả về mã lỗi `400 Bad Request` dạng sạch:
     `{"success": false, "message": "Dangerous action confirmation required"}`
     đồng thời ghi nhật ký audit `DANGEROUS_ACTION_BLOCKED`.
2. **Cơ chế Soft Delete:**
   - **Product:** Chuyển đổi trạng thái hoạt động và lưu ngày xóa (`deletedAt = new Date().toISOString()`, `status = "inactive"`). Ẩn khỏi các danh mục tìm kiếm công khai và trang chi tiết của người dùng.
   - **Technician:** Cập nhật trạng thái `status: inactive` (đồng bộ với DB thực tế của Prisma mà không cần chạy migration cơ sở dữ liệu) và gắn ngày xóa `deletedAt`. Mặc định lọc bỏ thợ đã xóa mềm khỏi danh sách quản lý và chặn hoàn toàn việc phân công lịch sửa chữa mới.
3. **Các ràng buộc nghiệp vụ (Business Constraints):**
   - Chặn xóa kỹ thuật viên đang có lịch sửa chữa ở trạng thái hoạt động (`assigned` / `confirmed`). Trả về mã lỗi `400 Bad Request` và ghi nhận sự kiện `DANGEROUS_ACTION_BLOCKED`.
   - Ngăn chặn việc thực hiện xóa mềm lại các tài nguyên đã được xóa trước đó.

---

## 4. Tích hợp Audit Logging mới
- **`DANGEROUS_ACTION_BLOCKED`**: Ghi nhận khi request xóa thiếu confirm hoặc vi phạm ràng buộc nghiệp vụ (kèm theo lý do).
- **`PRODUCT_SOFT_DELETED`**: Ghi nhận khi soft-delete sản phẩm thành công.
- **`TECHNICIAN_SOFT_DELETED`**: Ghi nhận khi soft-delete kỹ thuật viên thành công.
- **Lọc bảo mật**: Toàn bộ metadata đi kèm logs được lọc sạch mật khẩu, token và cookie qua bộ lọc đệ quy của Plan 15.

---

## 5. Kết quả kiểm thử & tích hợp hệ thống

### Kết quả chạy kiểm thử Plan 16:
Đã chạy kịch bản kiểm thử tích hợp tự động [test_plan16_soft_delete_guards.js](file:///C:/Users/Admin/.gemini/antigravity/brain/1ec938c5-52e2-4bd6-87ad-22231bc04644/scratch/test_plan16_soft_delete_guards.js):
- **Kết quả:** **27/27 PASS / 0 FAIL**.
- Các trường hợp kiểm thử cụ thể đã kiểm chứng thành công:
  - Chặn xóa sản phẩm khi thiếu confirm -> ĐẠT
  - Xóa sản phẩm thành công khi đầy đủ confirm (qua Body) -> ĐẠT
  - Lọc sản phẩm đã xóa khỏi admin list, public list và public detail -> ĐẠT
  - Chặn xóa lại sản phẩm đã bị xóa trước đó -> ĐẠT
  - Chặn xóa kỹ thuật viên đang có lịch sửa chữa active -> ĐẠT
  - Xóa kỹ thuật viên thành công khi đầy đủ confirm (qua Header) -> ĐẠT
  - Chặn phân công việc mới cho kỹ thuật viên đã bị xóa mềm -> ĐẠT
  - Chặn quyền của STAFF và Guest theo quy tắc RBAC -> ĐẠT
  - Ghi log audit chính xác các nhãn `DANGEROUS_ACTION_BLOCKED`, `PRODUCT_SOFT_DELETED`, `TECHNICIAN_SOFT_DELETED` -> ĐẠT

### Kết quả tích hợp toàn dự án:
- `npm run check:all` (lint + typecheck): **PASS**
- `npm run test:mock` (tất cả các test case cũ): **PASS**
- `backend` build: **PASS**
- `frontend-admin` build: **PASS**
- `frontend-user` build: **PASS**

---

## 6. Rủi ro còn lại & Đề xuất tiếp theo
- **Rủi ro:** Các log xóa mềm in-memory trên backend sẽ reset khi backend khởi động lại.
- **Đề xuất Plan 17:** Triển khai cơ chế **Backup / Restore / DB Safety** để đảm bảo an toàn tuyệt đối cho cơ sở dữ liệu.
