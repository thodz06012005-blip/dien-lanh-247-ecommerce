# HANDOVER ADMIN SECURITY PLAN 3 — PASSWORD HASHING & CREDENTIAL HARDENING

## 1. Thông tin nhánh & Commit gốc
- **Branch đang làm việc**: `security/admin-phase-3-password-hashing`
- **Commit gốc (Plan 2)**: `c1d1366113b295fa9573887c9f80214a1c6a2c26` (xử lý default secrets & seed password)

---

## 2. Các file đã rà soát & Kiểm tra

Hệ thống đã được quét và rà soát kỹ lưỡng trên tất cả các file sau để đảm bảo không rò rỉ thông tin nhạy cảm:
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/admin-auth.controller.ts`
- `backend/src/modules/customers/customers.service.ts`
- `mock-api/utils/auth.js`
- `mock-api/server.js`
- `mock-api/mock-db.json`
- `frontend-admin/src/store/adminAuthStore.ts`
- `frontend-admin/src/pages/Login.tsx`

**Trạng thái mã nguồn**: Mọi cơ chế xử lý mật khẩu hiện tại trong hệ thống **đã cực kỳ vững chắc và đúng chuẩn an toàn**. Không cần thực hiện chỉnh sửa mã nguồn nào bổ sung, vì các tính năng hiện tại đã đáp ứng hoàn hảo toàn bộ yêu cầu bảo mật nghiêm ngặt nhất của Plan 3.

---

## 3. Khảo sát cơ chế bảo mật thông tin xác thực (Credential Hardening)

### 3.1. Cơ chế mã hóa (Password Hashing)
- **Thuật toán đang dùng**: `bcrypt` (sử dụng 10 rounds salt).
- **Package sử dụng**: `bcrypt` (npm library chuẩn đã được cài đặt và tích hợp sẵn).
- **Độ an toàn**: Mật khẩu của cả User và Admin đều chỉ được lưu trữ ở database dưới dạng `passwordHash` được băm một chiều an toàn (Prisma User model: `password String`).

### 3.2. Quá trình kiểm soát dữ liệu đầu vào và Lưu trữ
- **Không lưu password thô**: Mật khẩu bản rõ không bao giờ được ghi xuống database thực tế.
- **Dữ liệu Seed**: `seed.ts` sử dụng `process.env.ADMIN_SEED_PASSWORD`, kiểm duyệt độ dài tối thiểu 12 ký tự, mã hóa qua `bcrypt` trước khi upsert vào cơ sở dữ liệu.
- **Dữ liệu Mock-DB**: File `mock-db.json` hoàn toàn **không lưu trữ mật khẩu** hay thông tin hash mật khẩu của bất kỳ tài khoản nào.
- **Không log thông tin nhạy cảm**: Rà soát toàn bộ repo không có bất kỳ dòng `console.log()` nào in ra mật khẩu, mật khẩu băm, hay session token của người dùng.

### 3.3. Làm sạch phản hồi API (Response Sanitization)
Tất cả các API trả về thông tin người dùng/admin đều được loại bỏ triệt để các thuộc tính `password`, `passwordHash` hay `refreshToken`:
* **API Đăng nhập Admin (`POST /admin/auth/login`)**:
  * Trả về cấu trúc `admin` đã được lọc sạch (chỉ gồm `id`, `name`, `email`, `role`, `status`), `token`, và `expiresAt`.
* **API Đăng ký / Đăng nhập Customer (`POST /auth/register`, `POST /auth/login`)**:
  * Loại bỏ `password` và `refreshToken` khỏi thực thể trả về.
* **API Lấy thông tin tài khoản (`GET /admin/auth/me`, `GET /auth/me`)**:
  * Trả về profile sạch không chứa mã băm mật khẩu.
* **API Khách hàng (`GET /admin/customers`)**:
  * Hàm `CustomersService.findAll()` tự tổng hợp dữ liệu từ orders/service requests/users và chỉ chọn ra các trường email/phone/name. Hoàn toàn không select trường `password`.

### 3.4. Lưu trữ phía Trình duyệt (Frontend Storage)
- **Zustand Auth Store**: Sau khi đăng nhập thành công, store chỉ lưu lại thông tin user đã sanitize (`dl247_admin_user`), `token` (`dl247_admin_token`), và thời gian hết hạn (`dl247_admin_expires_at`).
- **localStorage**: Đã rà soát và xác thực không lưu trữ bất kỳ thông tin nào liên quan đến mật khẩu hay mã băm mật khẩu phía client.

---

## 4. Kết quả kiểm thử thủ công (Xác minh luồng Login)
- **Đăng nhập đúng credentials**: Đăng nhập thành công và trả về token đúng quy định.
- **Đăng nhập sai password / sai email**: Phản hồi thất bại với lỗi generic: `Email hoặc mật khẩu không đúng` (ở NestJS) hoặc `Email hoặc mật khẩu không chính xác` (ở Mock API). Thông báo này ngăn ngừa nguy cơ bị dò quét sự tồn tại của tài khoản (Username/Email Enumeration).
- **Vét cạn credentials**: Login sai hoàn toàn không tiết lộ bất kỳ thông tin nhạy cảm nào ra client.

---

## 5. Kết quả các lệnh kiểm thử & Build tự động

Tất cả các lệnh build và test tự động đều hoàn thành xuất sắc ở nhánh Plan 3:
* `npm run check:all`: **✅ PASS**
* `npm run test:mock`: **✅ PASS**
* NestJS Backend Build: **✅ PASS**
* Frontend Admin Build: **✅ PASS**
* Frontend User Build: **✅ PASS**

---

## 6. Đề xuất bước tiếp theo (Plan 4)
* **Rủi ro còn lại**: Token JWT của admin vẫn lưu ở `localStorage` (sẽ được xử lý bằng Cookie HttpOnly ở Plan 5). Trước đó, chúng ta cần chuẩn hóa Hợp đồng API Xác thực Admin (Admin Auth API Contract) ở Plan 4 để đảm bảo cả backend và frontend giao tiếp đồng bộ.
* **Đề xuất Plan 4**: Chuẩn hóa API Contract xác thực của admin bao gồm Login, Logout, và session refresh.
