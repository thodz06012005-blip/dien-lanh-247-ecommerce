# HANDOVER ADMIN SECURITY PLAN 1 — AUDIT BÁO CÁO HIỆN TRẠNG BẢO MẬT

## 1. Thông tin nhánh & Commit gốc
- **Branch đang làm**: `security/admin-phase-1-audit`
- **Commit gốc**: `f21635a8a9f74d27f5ba2d125cd939b8128bb63e` (nhánh `stage2-product-query-admin-products` trước đó)

---

## 2. Tóm tắt hiện trạng bảo mật Admin

Hệ thống hiện tại đã có cơ chế phân quyền, bảo vệ route cơ bản và middleware auth ở cả phía frontend và backend, cụ thể:
- **Frontend Admin** sử dụng **Zustand** làm Auth Store, lưu token và thông tin phiên làm việc trong `localStorage`. Các trang quản trị được bao bọc bởi component `AdminProtectedRoute` để lọc quyền truy cập.
- **Backend (NestJS)** bảo vệ các API quản trị (`/api/v1/admin/*`) bằng `JwtAuthGuard` kết hợp `RolesGuard` sử dụng phân quyền `ADMIN` hoặc `SUPERADMIN`.
- **Mock API (dev fallback)** mô phỏng xác thực bằng middleware tự chế `requireAdminAuth` để kiểm tra Bearer token trong headers.
- **CORS** và **Rate Limiting** cơ bản đã được kích hoạt.

Tuy nhiên, hệ thống vẫn tồn tại một số **lỗ hổng bảo mật nghiêm trọng (Critical & High)** liên quan đến khóa bí mật JWT dự phòng (fallback secrets), mật khẩu seed mặc định, và phương thức lưu trữ token phía client.

---

## 3. Khảo sát chi tiết hiện trạng

### 3.1. Hiện trạng Login / Logout & ProtectedRoute
- **Trang Login**: Đã có tại route `/login` của `frontend-admin`.
- **Protected Routes**: Các route `/`, `/products`, `/orders`, `/customers`, `/settings`, `/service-requests`, `/technicians` của admin đều **không bị public**. Chúng được bảo vệ bởi `<AdminProtectedRoute requiredRole="owner">`.
- **Hành vi khi chưa đăng nhập**: Nếu người dùng cố tình truy cập trực tiếp các route admin mà không có token hợp lệ, `AdminProtectedRoute` sẽ bắt được trạng thái `!token || !isAuthValid` và chuyển hướng (redirect) người dùng về trang `/login` ngay lập tức.
- **Hành vi F5 / Reload**: Component protected route kích hoạt `useEffect` gọi hàm `fetchCurrentUser()` đến endpoint `/admin/auth/me` để kiểm tra token còn hiệu lực phía server hay không.
- **Hiện trạng Logout**: Phía frontend sẽ gọi API `/admin/auth/logout`, đồng thời thực thi `clearAuth()` để xóa toàn bộ token và user info khỏi `localStorage`.

### 3.2. Hiện trạng API Admin
- **Middleware Auth**: Các API quản trị `/api/v1/admin/*` ở cả NestJS và Mock API đều được bảo vệ bởi middleware auth (`JwtAuthGuard`/`RolesGuard` ở NestJS, `requireAdminAuth` ở Mock API).
- **Gọi API qua Postman/curl**: Không thể gọi các API admin nếu thiếu Bearer Token hợp lệ. Nếu gửi request không có token hoặc token sai, API sẽ trả về lỗi `401 Unauthorized` đúng quy chuẩn.
- **Các API POST/PATCH/DELETE**: Đã được bảo vệ dưới các route `/admin/*` tương ứng. Tuy nhiên, ở Mock API, các API public `/orders/:id` và `/service-requests/:id` cho phép truy xuất thông tin khách hàng dựa trên param số điện thoại gửi kèm trong Query (`?phone=...`), đây là một cơ chế xác thực rất yếu dễ bị tấn công vét cạn hoặc thu thập thông tin cá nhân.

### 3.3. Hiện trạng CORS
- **Mock API**: Cho phép cụ thể 2 origins `http://localhost:5173` và `http://localhost:5174`. Bật cấu hình `credentials: true`.
- **NestJS Backend**: Đọc danh sách cấu hình từ biến môi trường `process.env.CORS_ORIGINS` (fallback: `['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000']`).
- **Đánh giá**: CORS không mở quá rộng (không dùng `*`), cấu hình an toàn cho môi trường development nhưng cần chuẩn hóa chặt chẽ khi triển khai production.

### 3.4. Hiện trạng Token / Session
- **Vị trí lưu trữ**: Lưu trữ trực tiếp tại `localStorage` ở client. Điều này mang lại rủi ro cao bị tấn công đánh cắp token qua XSS (Cross-Site Scripting).
- **Dữ liệu nhạy cảm**: Không lưu trữ mật khẩu thật ở client. Thông tin lưu trữ gồm: `admin` profile (dạng JSON an toàn), `token`, và `expiresAt`.
- **Hardcode secret**: 
  - File `backend/src/modules/auth/strategies/jwt.strategy.ts` và `jwt-refresh.strategy.ts` có chứa **fallback hardcoded secret** (`'access_secret'` và `'refresh_secret'`) phòng trường hợp biến môi trường không tồn tại. Đây là một điểm yếu bảo mật.

### 3.5. Hiện trạng Rate Limiting & Audit Log & RBAC
- **Rate Limit**: NestJS đã bật `ThrottlerGuard` toàn cục (giới hạn 100 requests trong 60 giây). Tuy nhiên, **chưa có cơ chế giới hạn riêng biệt nghiêm ngặt** cho API Login để ngăn chặn Brute Force.
- **Audit Log (Ghi vết)**: **Chưa có**. Các hành động quản trị quan trọng (như chỉnh sửa sản phẩm, thay đổi trạng thái đơn hàng, hủy lịch dịch vụ) chưa được ghi lại vào cơ sở dữ liệu hay log file bảo mật để phục vụ giám sát.
- **RBAC**: 
  - Cơ sở dữ liệu Prisma định nghĩa enum: `enum UserRole { CUSTOMER, ADMIN, SUPERADMIN }`.
  - Mock API định nghĩa role admin mặc định là `owner`.
  - Frontend chuyển đổi linh hoạt bằng cách gọi `.toLowerCase()` để kiểm tra quyền.

---

## 4. Danh sách Rủi ro Bảo mật (Risk Registry)

| Mức độ | Lỗ hổng / Rủi ro | Mô tả |
|---|---|---|
| 🚨 **CRITICAL** | **Mật khẩu Seed mặc định** | File `seed.ts` tự động tạo tài khoản `admin@dienlanh247.vn` với mật khẩu hardcode là `admin123`. Nếu không đổi trước khi seed thực tế sẽ bị xâm nhập dễ dàng. |
| 🚨 **CRITICAL** | **JWT Access/Refresh Secret Fallback** | Chiến lược xác thực JWT sử dụng giá trị mặc định `'access_secret'` / `'refresh_secret'` nếu thiếu `.env`. Kẻ tấn công có thể tự ký token giả để truy cập hệ thống. |
| ⚠️ **HIGH** | **Token lưu trữ tại LocalStorage** | Token lưu ở `localStorage` rất dễ bị đánh cắp bởi mã độc JavaScript chạy ở client (tấn công XSS). |
| ⚠️ **HIGH** | **Xác thực yếu tại API Public Client** | Endpoint public lấy chi tiết đơn hàng/yêu cầu dịch vụ chỉ so khớp số điện thoại phẳng qua query parameter (`?phone=...`), dễ bị rò rỉ dữ liệu thông tin cá nhân. |
| 💡 **MEDIUM** | **Thiếu rate limit riêng cho Login** | Hệ thống dùng chung giới hạn 100 requests/phút. Kẻ tấn công có thể gửi hàng vạn request dò mật khẩu từ các IP khác nhau mà không bị khóa tài khoản nhanh chóng. |
| 💡 **MEDIUM** | **Thiếu Audit Log** | Không có hệ thống ghi lại lịch sử thao tác của các Admin, gây khó khăn cho việc xử lý sự cố hoặc quy trách nhiệm khi có lỗi phát sinh. |
| 📉 **LOW** | **Discrepancy tên phân quyền** | Phân quyền `owner` ở Mock API khác với `ADMIN`/`SUPERADMIN` trong Database thật, có thể gây nhầm lẫn khi chuyển đổi môi trường. |

---

## 5. Đề xuất thứ tự triển khai nâng cấp (Roadmap Security Plan 2-8)

- **Plan 2 (Loại bỏ Hardcode JWT & Password Seed)**: Cấu hình `seed.ts` đọc mật khẩu admin từ `.env`, đồng thời loại bỏ toàn bộ các fallback string bí mật trong Passport JWT Strategy (ném lỗi trực tiếp nếu thiếu biến môi trường).
- **Plan 3 (Cookie HttpOnly cho Admin)**: Chuyển cơ chế lưu trữ token của trang Admin từ `localStorage` sang Cookie bảo mật (HttpOnly, Secure, SameSite=Strict) để phòng chống XSS triệt để.
- **Plan 4 (Admin Login Rate Limiter)**: Cấu hình throttler riêng biệt cho endpoint `/admin/auth/login` (ví dụ: tối đa 5 lần thử sai mỗi 5 phút cho một tài khoản/IP).
- **Plan 5 (Chuẩn hóa & Đồng bộ RBAC)**: Đồng bộ phân quyền giữa frontend, backend và mock-api về cùng một chuẩn enum thống nhất.
- **Plan 6 (Khắc phục lộ lọt thông tin public)**: Nâng cấp cơ chế lấy chi tiết đơn hàng/yêu cầu dịch vụ ở phía client bằng token OTP ngắn hạn hoặc mã xác thực bảo mật thay vì so khớp số điện thoại phẳng.
- **Plan 7 (Xây dựng hệ thống Audit Logging)**: Thiết lập interceptor ghi lại nhật ký thao tác dữ liệu của admin (ai đã làm gì, lúc nào, thay đổi dữ liệu ra sao) vào database hoặc file logs an toàn.
- **Plan 8 (Deployment Security Checklist)**: Tạo bộ tài liệu hướng dẫn cấu hình production an toàn (SSL, setup Database credentials, ẩn thông tin máy chủ).

---

## 6. Kết quả chạy kiểm thử baseline

Tất cả các bài kiểm tra đã chạy thành công trước khi đóng dấu Audit:

1. `npm run check:all`: **✅ PASS**
2. `npm run test:mock`: **✅ PASS**
3. Backend build: **✅ PASS**
4. Frontend-user build: **✅ PASS**
5. Frontend-admin build: **✅ PASS**
