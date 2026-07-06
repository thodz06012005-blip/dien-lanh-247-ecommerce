# HANDOVER ADMIN SECURITY PLAN 10 — BÁO CÁO DEV ENDPOINT PROTECTION

## 1. Thông tin nhánh & Commit gốc
- **Branch đang làm việc**: `security/admin-phase-10-dev-endpoint-protection`
- **Commit gốc (Plan 9)**: `4dcc809` (harden cors for admin cookie sessions)

---

## 2. Các file đã kiểm tra
- `mock-api/server.js`
- `mock-api/utils/auth.js`
- `mock-api/routes/dev.js`
- `backend/src/main.ts`
- `backend/prisma/seed.ts`
- `frontend-admin/src/pages/Login.tsx`
- `backend/.env.example`
- `mock-api/.env.example`

---

## 3. Các file đã sửa đổi

| Đường dẫn file | Thay đổi chính |
|---|---|
| `mock-api/utils/auth.js` | Định nghĩa các helper: `isProduction`, `isDevFeatureEnabled`, `isDemoAccountsEnabled` và middleware `requireDevOnly`. |
| `mock-api/server.js` | 1) Loại bỏ duplicate endpoint `/dev/reset-db` (dùng chung router bảo vệ `/routes/dev.js`). <br> 2) Cấu hình login kiểm tra `isDemoAccountsEnabled()`, chặn demo login khi tắt/production. <br> 3) Cấu hình PORT động cho mock server thay vì hardcode 3001 để chạy test an toàn. |
| `mock-api/routes/dev.js` | Áp dụng middleware `requireDevOnly` cho endpoint `/dev/reset-db`. Trả về 404 thay vì 403 khi bị từ chối để che giấu endpoint. |
| `mock-api/.env.example` | Bổ sung hướng dẫn cấu hình flags: `NODE_ENV`, `ENABLE_DEV_ENDPOINTS`, `ENABLE_DEMO_ACCOUNTS`, `MOCK_ENABLE_DEMO_ACCOUNTS`. |
| `backend/.env.example` | Bổ sung cấu hình flags: `ENABLE_DEV_ENDPOINTS`, `ENABLE_DEMO_ACCOUNTS`. |

---

## 4. Phân loại phát hiện endpoints/helpers (A/B/C/D)

Chúng tôi đã thực hiện tìm kiếm toàn diện các từ khóa `dev`, `debug`, `test`, `mock`, `demo`, `seed`, `reset`, `bypass`, `skipAuth`, `fake` trong codebase và phân loại như sau:

### Nhóm A — An toàn (Không ảnh hưởng runtime)
- Chỉ là text hướng dẫn trong các file `HANDOVER_*.md` và `walkthrough.md`.
- Các file test script tạm nằm ngoài repository.
- Các comment mang tính chất giải thích trong source code.

### Nhóm B — Dev-only hợp lệ (Cần được bảo vệ chặt chẽ)
- Hộp chứa demo credentials và nút điền thông tin đăng nhập trong `Login.tsx`.
- Lệnh reset DB mẫu phục vụ kiểm thử cục bộ (`/dev/reset-db` trong mock-api).
- Script seed dữ liệu khởi tạo của Prisma (`backend/prisma/seed.ts`).

### Nhóm C — Rủi ro cần sửa
- Endpoint `/dev/reset-db` trong mock-api trước đây chỉ kiểm tra `process.env.NODE_ENV === 'production'` bằng cách trả về 403 (vẫn để lộ sự tồn tại của endpoint).
- Login mock admin (`admin@dienlanh247.vn` và `staff@dienlanh247.vn`) có mật khẩu mặc định hardcoded và không kiểm tra chặt chẽ môi trường production.
- PORT 3001 bị gán cứng trong `mock-api/server.js`, cản trở chạy nhiều instance mock server để viết kịch bản kiểm thử độc lập.

### Nhóm D — Critical (Bị cấm / Đã xóa hoặc khóa ngay)
- Không phát hiện trường hợp bypass auth bằng query parameter hay header không qua guard.
- Không phát hiện trường hợp in secrets/configs trực tiếp ra console hoặc response.
- Không phát hiện secret/mật khẩu thật của production trong source code.

---

## 5. Thiết lập Bảo vệ Endpoint & Tài khoản thử nghiệm

### 5.1. Cơ chế hoạt động của `requireDevOnly`
Middleware `requireDevOnly` kiểm tra điều kiện an toàn:
- Nếu `NODE_ENV === 'production'` -> Luôn từ chối.
- Chỉ cho phép nếu chạy trong môi trường phát triển (development) **VÀ** biến môi trường `ENABLE_DEV_ENDPOINTS === 'true'`.
- Khi từ chối, phản hồi mã lỗi **404 Not Found** kèm body:
  ```json
  { "success": false, "message": "Not Found" }
  ```
  Việc dùng 404 giúp che giấu cấu trúc endpoint khỏi các máy quét bên ngoài.

### 5.2. Khóa Demo Accounts trong Production
Trong hàm login của mock-api, chúng tôi thực hiện kiểm duyệt tài khoản đăng nhập:
```javascript
const demoEmails = ['admin@dienlanh247.vn', 'staff@dienlanh247.vn'];
const isDefaultOwner = email === 'owner@dienlanh247.vn' && password === 'Admin@123';

if ((demoEmails.includes(email) || isDefaultOwner) && !isDemoAccountsEnabled()) {
  return respondError(res, 401, 'Email hoặc mật khẩu không chính xác', 'INVALID_CREDENTIALS');
}
```
- Khi chạy production, hoặc khi tắt flag `ENABLE_DEMO_ACCOUNTS`, toàn bộ tài khoản demo (staff, admin) bị vô hiệu hóa hoàn toàn.
- Tài khoản owner mặc định (`owner@dienlanh247.vn` với mật khẩu `Admin@123`) cũng bị chặn đứng. Điều này buộc quản trị viên phải đặt email/mật khẩu tùy chỉnh thông qua môi trường để đăng nhập ở production.

### 5.3. Cấu hình an toàn trong `Login.tsx` (Frontend Admin)
Hộp hiển thị thông tin tài khoản demo được bảo vệ bằng cấu hình build của Vite:
```typescript
{import.meta.env.DEV && (
  <div className="mt-6 bg-slate-900/40 ...">
     ...
  </div>
)}
```
- `import.meta.env.DEV` được Vite gán tĩnh là `false` khi build cho môi trường sản xuất (`vite build`). Trình duyệt hoàn toàn không tải và không dựng giao diện hộp demo này khi deploy thật.

---

## 6. Kết quả Test tự động (test_plan10_dev_protection.js)

Chúng tôi đã chạy kiểm thử tự động giả lập 4 ngữ cảnh môi trường khác nhau đối với mock-api:

### SCENARIO 1: NODE_ENV=production
- POST `/api/v1/dev/reset-db` -> **404 Not Found** (Thành công).
- Login staff (`staff@dienlanh247.vn` / `Staff@789`) -> **401 Unauthorized** (Thành công).
- Login owner bằng mật khẩu mặc định (`owner@dienlanh247.vn` / `Admin@123`) -> **401 Unauthorized** (Thành công).

### SCENARIO 2: NODE_ENV=development, Flags=false
- POST `/api/v1/dev/reset-db` -> **404 Not Found** (Thành công).
- Login staff -> **401 Unauthorized** (Thành công).

### SCENARIO 3: NODE_ENV=development, Flags=true
- POST `/api/v1/dev/reset-db` -> **200 OK** (Thành công).
- Login staff -> **200 OK** (Thành công).
- Login owner mặc định -> **200 OK** (Thành công).

### SCENARIO 4: Public APIs
- GET `/api/v1/health` và `/api/v1/products` vẫn mở và trả về **200 OK** bình thường trong mọi trường hợp (Thành công).

**🎉 10/10 CASES PASSED SUCCESSFULLY**

---

## 7. Kết quả các lệnh kiểm thử & Build tự động

| Lệnh | Trạng thái |
|---|---|
| `npm run check:all` | **✅ PASS** |
| `npm run test:mock` | **✅ PASS** |
| `npm --prefix backend run build` | **✅ PASS** |
| `npm --prefix frontend-admin run build` | **✅ PASS** |
| `npm --prefix frontend-user run build` | **✅ PASS** |

- **CORS & RBAC**: Tất cả các kịch bản kiểm tra CORS và phân quyền RBAC từ các Plan trước vẫn chạy trơn tru, không có sự cố nào phát sinh.

---

## 8. Rủi ro còn lại
- Mặc dù mock-api đã được bảo vệ tối đa, nhưng mock-api vẫn chỉ là một giả lập phát triển. Trong môi trường production thật, mock-api không được chạy; thay vào đó toàn bộ API phải hướng về Backend NestJS thật.

---

## 9. Đề xuất Plan 11 tiếp theo: INPUT VALIDATION & SANITIZATION HARDENING
Mục tiêu: Siết chặt dữ liệu đầu vào của các API (lọc ký tự đặc biệt, kiểm tra kiểu dữ liệu, giới hạn độ dài ký tự) nhằm ngăn chặn các lỗ hổng tiêm mã độc hại (SQL Injection, XSS, NoSQL Injection, Command Injection) đối với cả backend và mock-api.
