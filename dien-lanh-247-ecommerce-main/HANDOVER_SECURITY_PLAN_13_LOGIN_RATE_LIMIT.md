# HANDOVER — Security Plan 13: Login Rate Limit & Brute Force Protection

## Branch & Commit

- **Branch:** `security/admin-phase-13-login-rate-limit`
- **Base Commit (Plan 12):** `3e3f90a`
- **`.env` kiểm tra:** Không có file `.env` nào bị commit trong Plan 12 hoặc Plan 13. `.gitignore` hoạt động chính xác.

---

## Mục Tiêu

Triển khai cơ chế giới hạn tần suất đăng nhập (Login Rate Limit) và chống dò mật khẩu (Brute Force) cho luồng đăng nhập quản trị (Admin Login) ở cả `mock-api` và NestJS `backend`.

---

## Chính Sách Cấu Hình (Rate Limit Policy)

- **Failed Attempts Window:** **15 phút** (`LOGIN_RATE_LIMIT_WINDOW_MS = 900000`).
- **Lockout Duration:** **15 phút** (`LOGIN_RATE_LIMIT_LOCK_MS = 900000`) kể từ lần thất bại gần nhất.
- **Max Email attempts:** **5 lần** thất bại liên tiếp.
- **Max IP attempts:** **20 lần** thất bại liên tiếp (không phân biệt email).
- **Max IP + Email attempts:** **5 lần** thất bại liên tiếp.
- **Proxy Trust:** `TRUST_PROXY=false` (chỉ tin cậy header `X-Forwarded-For` khi `TRUST_PROXY === true`).

---

## Nguyên Lý Bảo Mật Thực Hiện

1. **Kiểm tra trạng thái khóa trước:** 
   - Kiểm tra xem IP, Email hoặc cặp IP+Email có đang bị khóa không ở ngay đầu handler (trước khi so sánh password / bcrypt). Nếu đang bị khóa, trả ngay lỗi `429` mà không so khớp mật khẩu và không tạo session mới.
2. **Không rò rỉ Email tồn tại:**
   - Khi đăng nhập sai email không tồn tại, hệ thống vẫn ghi nhận failed attempts cho IP, Email đó, và cặp IP+Email. Phản hồi lỗi khi email không tồn tại hoàn toàn đồng nhất với email tồn tại (trả về 401 hoặc 429 khi bị khóa).
3. **Cơ chế Reset thông minh:**
   - Khi đăng nhập thành công: Reset bộ đếm đăng nhập sai cho **Email** và cặp **IP + Email**.
   - **Không** reset bộ đếm cho **IP** để tránh tình trạng kẻ tấn công chung IP (NAT) bypass bộ đếm IP thông qua việc đăng nhập đúng một tài khoản khác.

---

## File Đã Sửa / Tạo Mới

### 1. Mock API Server

| File | Hành Động | Mô Tả |
|------|-----------|-------|
| `mock-api/utils/rateLimit.js` | **NEW** | Module in-memory rate limiter quản lý trạng thái, IP extraction, email normalization, lockout checking, reset success & record failure. |
| `mock-api/server.js` | Modified | Import rate limiter, tích hợp checkLockout trước verify, recordLoginFailure khi sai và recordLoginSuccess khi đăng nhập thành công. |
| `mock-api/.env.example` | Modified | Bổ sung các cấu hình mặc định cho Rate Limit. |

### 2. NestJS Backend

| File | Hành Động | Mô Tả |
|------|-----------|-------|
| `backend/src/modules/auth/login-rate-limit.service.ts` | **NEW** | `@Injectable()` service quản lý login rate limiting in-memory tương thích cấu hình env và hỗ trợ giải phóng bộ nhớ định kỳ. |
| `backend/src/modules/auth/auth.module.ts` | Modified | Khai báo và cấu hình `LoginRateLimitService` provider. |
| `backend/src/modules/auth/auth.service.ts` | Modified | Tiêm `LoginRateLimitService`, sửa signature `loginAdmin` để nhận `req` object, thực hiện checkLockout trước và recordFailure / recordSuccess tương ứng. |
| `backend/src/modules/auth/admin-auth.controller.ts` | Modified | Sửa signature route handler để nhận `@Req() req: Request` từ express và truyền vào `authService.loginAdmin(loginDto, req)`. |
| `backend/.env.example` | Modified | Bổ sung các cấu hình mặc định cho Rate Limit. |

### 3. Frontend Admin

| File | Hành Động | Mô Tả |
|------|-----------|-------|
| `frontend-admin/src/store/adminAuthStore.ts` | Modified | Catch lỗi status `429` và trả về message thân thiện: `"Bạn thử đăng nhập quá nhiều lần. Vui lòng thử lại sau."` |
| `frontend-admin/src/services/api.ts` | Checked | Đảm bảo interceptor tự động logout chỉ kích hoạt khi status code là **chính xác `401`**. Đối với lỗi `429` không trigger redirect hay clear session. |

---

## Response Lỗi 429

```json
{
  "success": false,
  "message": "Too many login attempts. Please try again later.",
  "retryAfterSeconds": 900
}
```

---

## Kết Quả Test

### Plan 13 Rate Limiting Script (25/25 PASS)

| Test Case | Mô tả | Kết quả |
|-----------|-------|---------|
| Sai password dưới ngưỡng | Sai 1 đến 4 lần đều trả về `401 Unauthorized` kèm generic message | ✅ PASS |
| Vượt ngưỡng email | Sai lần 6 cùng email trả về `429 Too Many Requests` | ✅ PASS |
| Không lộ email tồn tại | Spam email không tồn tại cũng trả về `429` giống email thật | ✅ PASS |
| Đúng mật khẩu khi đang lock | Nhập đúng mật khẩu khi đang bị lock vẫn trả về `429`, không tạo session | ✅ PASS |
| Reset sau success | Đăng nhập đúng dưới ngưỡng làm sạch bộ đếm attempts của email/ip-email | ✅ PASS |
| Vượt ngưỡng IP | Spam nhiều email khác nhau từ một IP vượt 20 lần -> Khóa toàn IP | ✅ PASS |
| Không ảnh hưởng public API | GET `/api/v1/health` và GET `/api/v1/products` hoạt động bình thường | ✅ PASS |
| Không ảnh hưởng auth/RBAC | Sau khi login đúng, cookie hoạt động bình thường, phân quyền STAFF/ADMIN chuẩn | ✅ PASS |

### Full Test & Build Verification Suite

| Command | Kết quả |
|---------|---------|
| `npm run check:all` | ✅ PASS |
| `npm run test:mock` | ✅ PASS |
| `npm --prefix backend run build` | ✅ PASS |
| `npm --prefix frontend-admin run build` | ✅ PASS |
| `npm --prefix frontend-user run build` | ✅ PASS |

---

## Rủi Ro Còn Lại

1. **In-memory Storage:** Bộ đếm rate limit lưu trữ trong RAM. Khi restart backend server hoặc mock-api server, bộ đếm bị xóa và chu kỳ đếm bắt đầu lại. Ở môi trường production chịu tải cao hoặc chạy nhiều cluster, cần chuyển in-memory store này sang Redis.
2. **IP spoofing nếu TRUST_PROXY bật:** Nếu `TRUST_PROXY=true` mà proxy phía trước không lọc header `X-Forwarded-For` cẩn thận, attacker có thể fake IP bằng cách gửi header tùy ý.

---

## Đề Xuất Plan 14

**Audit Logging & Security Event Monitoring**
- Ghi lại nhật ký các sự kiện bảo mật quan trọng (Security Event Logs): Đăng nhập thành công, đăng nhập sai, IP bị lockout, thay đổi cấu hình hệ thống, phân công thợ, cập nhật trạng thái đơn hàng.
- Lưu trữ logs an toàn để truy vết sự cố.
