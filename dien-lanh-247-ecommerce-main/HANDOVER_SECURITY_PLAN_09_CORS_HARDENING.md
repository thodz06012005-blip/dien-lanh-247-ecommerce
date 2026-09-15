# HANDOVER ADMIN SECURITY PLAN 9 — BÁO CÁO CẤU HÌNH CORS HARDENING

## 1. Thông tin nhánh & Commit gốc
- **Branch đang làm việc**: `security/admin-phase-9-cors-hardening`
- **Commit gốc (Plan 8)**: `3a8d3ab` (add admin rbac permission checks)

---

## 2. Các file đã kiểm tra
- `mock-api/server.js`
- `backend/src/main.ts`
- `frontend-admin/src/services/api.ts`
- `frontend-user/src/services/api.ts`
- `backend/.env.example`

---

## 3. Các file đã sửa đổi & Tạo mới

| Đường dẫn file | Thay đổi chính |
|---|---|
| `backend/src/main.ts` | 1) Trích xuất và parse an toàn `CORS_ORIGINS` / `ALLOWED_ORIGINS` từ env. <br> 2) Cập nhật app.enableCors giới hạn danh sách Allowed Origins, chỉ định rõ methods `GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS` và headers `Content-Type, Accept, Authorization, X-Requested-With, Cookie`. |
| `backend/.env.example` | Cập nhật cấu hình placeholder origins an toàn cho production (thay thế domain thật bằng `https://admin.example.com`, `https://www.example.com`). |
| `mock-api/server.js` | 1) Trích xuất allowed origins từ env và trim/bỏ phần rỗng. <br> 2) Cập nhật middleware cors để trả về `callback(null, false)` thay vì ném lỗi `Error("Not allowed by CORS")` khi chặn origin lạ (tránh rò rỉ stack trace và lỗi 500 trên server). <br> 3) Cho phép preflight OPTIONS preflight và thêm an toàn các header/method cụ thể. |
| `mock-api/.env.example` | [MỚI] Tài liệu hóa các biến cấu hình CORS dành riêng cho Mock API Server. |

---

## 4. Rà soát & Cấu hình CORS sau khi sửa

### 4.1. CORS trước khi sửa
- **Mock API**: Chỉ định cứng mảng origin `http://localhost:5173` và `http://localhost:5174`. Nếu origin lạ gửi yêu cầu, server ném lỗi `Error("Not allowed by CORS")` trực tiếp, làm lộ stack trace và phản hồi lỗi 500.
- **Backend NestJS**: Kiểm tra `process.env.CORS_ORIGINS` cơ bản, fallback mặc định là `['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000']`. Chưa giới hạn chi tiết Header và Method được phép.

### 4.2. CORS sau khi sửa
- Loại bỏ hoàn toàn khả năng sử dụng wildcard `*` khi `credentials: true`.
- Hỗ trợ đầy đủ việc đọc và cấu hình từ hai biến env `CORS_ORIGINS` và `ALLOWED_ORIGINS` (với dấu phẩy ngăn cách).
- **Cách parse an toàn**:
  ```typescript
  // Split, trim khoảng trắng và bỏ các phần tử trống
  const origins = envValue.split(',').map(o => o.trim()).filter(o => o.length > 0);
  ```
- **Allowed Origins Local Dev (Fallback mặc định)**:
  - `http://localhost:5174` (Frontend Admin)
  - `http://localhost:5173` (Frontend User)
  - `http://127.0.0.1:5174`
  - `http://127.0.0.1:5173`
- **Placeholder Origins Production**:
  - `https://admin.example.com` (Frontend Admin)
  - `https://www.example.com` (Frontend User)

---

## 5. Kết quả Test CORS bảo mật (test_plan9_cors.js)

Chúng tôi đã viết script kiểm thử tự động `brain/scratch/test_plan9_cors.js` (không commit vào repo) để giả lập các request preflight và actual với các Origin khác nhau.

| Nhóm test | Origin mô phỏng | Endpoint | Kết quả mong đợi | Kết quả thực tế |
|---|---|---|---|---|
| **Test 1: Allowed Origin (OPTIONS)** | `http://localhost:5174` <br> `http://localhost:5173` <br> `http://127.0.0.1:5174` <br> `http://127.0.0.1:5173` | `/admin/auth/login` | Trả về 204. <br> Header `Access-Control-Allow-Origin` khớp với origin gửi lên. <br> `Access-Control-Allow-Credentials: true`. | **✅ PASS** (12/12) |
| **Test 2: Disallowed OPTIONS** | `https://evil.example.com` <br> `http://localhost:8080` <br> `https://www.google.com` | `/admin/auth/login` | Không trả về headers CORS cho phép. Không làm crash server. | **✅ PASS** (3/3) |
| **Test 3: Allowed Origin (Actual)** | `http://localhost:5174` | `/health` | Trả về 200. Có đủ headers CORS khớp với origin. | **✅ PASS** (3/3) |
| **Test 4: Disallowed Origin (Actual)** | `https://evil.example.com` | `/health` | Trả về 200 (vì là endpoint public). Không trả về headers CORS cho phép truy xuất credentials. | **✅ PASS** (2/2) |
| **Test 5: No-Origin (curl)** | Không có | `/health` | Trả về 200. Không chứa headers CORS. Hoạt động bình thường. | **✅ PASS** (2/2) |

**🎉 22/22 CASES PASSED SUCCESSFULLY**

---

## 6. Kiểm tra An toàn & Bảo mật liên đới

1. **Cookie Session**: Trình duyệt lưu trữ cookie HttpOnly `accessToken` thành công khi đăng nhập từ origin hợp lệ. Trình duyệt tự động gửi kèm cookie khi gọi API `/me` và `/dashboard`.
2. **Ngăn chặn XSS/CSRF**: Khi có yêu cầu từ origin lạ (như `https://evil.example.com`), mặc dù cookie vẫn được gửi theo cơ chế trình duyệt, nhưng do CORS từ chối phản hồi Header chứa `Access-Control-Allow-Origin` và `Access-Control-Allow-Credentials: true`, JavaScript ở trang web lạ hoàn toàn **không thể đọc được dữ liệu phản hồi**.
3. **localStorage**: Tuyệt đối không chứa bất kỳ khóa bảo mật, mật khẩu hay token đăng nhập nào.
4. **Public API & User Frontend**: Cả hai API `/health` và danh sách sản phẩm public `/products` vẫn hoạt động bình thường cho khách hàng vãng lai.
5. **RBAC**: Phân quyền SUPERADMIN, ADMIN, STAFF hoạt động chuẩn xác và không bị vỡ do cấu hình CORS mới.

---

## 7. Kết quả các lệnh kiểm thử & Build tự động

| Lệnh | Trạng thái |
|---|---|
| `npm run check:all` | **✅ PASS** |
| `npm run test:mock` | **✅ PASS** |
| `npm --prefix backend run build` | **✅ PASS** |
| `npm --prefix frontend-admin run build` | **✅ PASS** |
| `npm --prefix frontend-user run build` | **✅ PASS** |

---

## 8. Rủi ro còn lại
- Cần đảm bảo khi deploy lên môi trường staging/production thật, các biến `CORS_ORIGINS` và `ALLOWED_ORIGINS` được cấu hình chính xác khớp với domain thật. Nếu cấu hình sai (ví dụ thiếu ký tự hoặc sai giao thức http vs https), frontend sẽ không gọi được API do bị CORS block.

---

## 9. Đề xuất Plan 10 tiếp theo: DEV ENDPOINT PROTECTION
Mục tiêu: Vô hiệu hóa hoặc bảo vệ chặt chẽ các endpoint phục vụ phát triển/test (`/api/v1/dev/*` như endpoint reset database `/dev/reset-db`) trong môi trường production, tránh rủi ro phá hoại dữ liệu.
