# HANDOVER — Security Plan 14: Anti-DoS / Request & Body Limit

## Branch & Commit

- **Branch:** `security/admin-phase-14-anti-dos-body-limit`
- **Base Commit (Plan 13):** `3890ba0`
- **`.env` kiểm tra:** Không có file `.env` nào bị commit trong Plan 13 hoặc Plan 14. `.gitignore` hoạt động chuẩn.

---

## Mục Tiêu

Giảm thiểu rủi ro bị tấn công từ chối dịch vụ (DoS/DDoS) ở mức độ cơ bản bằng cách giới hạn kích thước payload truyền lên (Request Body limits), kiểm soát định dạng nội dung (Content-Type Guard) và ngăn ngừa rò rỉ stack trace khi xảy ra lỗi parser.

---

## Hiện Trạng Trước Khi Sửa
- **Mock API:** Sử dụng `app.use(express.json())` mặc định không giới hạn dung lượng cụ thể (mặc định 100kb của express), không có Content-Type validation, và khi gửi JSON lỗi hoặc body quá lớn sẽ log ra console hoặc trả stack trace lỗi.
- **NestJS Backend:** Sử dụng parser mặc định của NestJS/Express, không thiết lập biến môi trường cấu hình kích thước body, và không có ExceptionFilter chuyên biệt để định dạng sạch lỗi body parser (lỗi 413, 415, malformed JSON).

---

## Cấu Hình Policy Mới

- **Global JSON body limit:** **1mb** (mặc định cho tất cả các API).
- **Global URL-encoded limit:** **100kb** (mặc định).
- **Content-Type Policy:** Tất cả request dạng `POST`, `PUT`, `PATCH` nếu có truyền body bắt buộc phải gửi header `Content-Type` khớp với `application/json` (ví dụ `application/json; charset=utf-8`). Nếu sai định dạng → trả về **415 Unsupported Media Type**.
- **Không chặn:** Các request `GET`, `HEAD`, `OPTIONS`, `DELETE` không truyền body, hoặc request `POST/PUT/PATCH` có `Content-Length: 0`.

---

## Response Lỗi Standardized

### 1. Payload Too Large (HTTP 413)
```json
{
  "success": false,
  "message": "Payload too large"
}
```

### 2. Unsupported Content-Type (HTTP 415)
```json
{
  "success": false,
  "message": "Unsupported content type"
}
```

### 3. Invalid JSON Payload (HTTP 400)
```json
{
  "success": false,
  "message": "Invalid JSON payload"
}
```

---

## File Đã Sửa / Tạo Mới

### 1. Mock API Server

| File | Hành Động | Mô Tả |
|------|-----------|-------|
| `mock-api/server.js` | Modified | Tích hợp Content-Type Guard trước parser, áp dụng `express.json({ limit })` và `express.urlencoded({ limit })` cấu hình qua env. Đăng ký Express error handler bắt lỗi `entity.too.large` (413) và `SyntaxError` (400) trả về JSON sạch. |
| `mock-api/.env.example` | Modified | Thêm biến cấu hình `MOCK_JSON_BODY_LIMIT=1mb` và `MOCK_URLENCODED_BODY_LIMIT=100kb`. |

### 2. NestJS Backend

| File | Hành Động | Mô Tả |
|------|-----------|-------|
| `backend/src/common/filters/http-exception.filter.ts` | **NEW** | ExceptionFilter bắt lỗi `HttpStatus.PAYLOAD_TOO_LARGE` (413), `HttpStatus.UNSUPPORTED_MEDIA_TYPE` (415), và `SyntaxError` (400) từ parser để trả về JSON chuẩn, đồng thời bảo toàn các lỗi validation và HTTP exception khác của NestJS. |
| `backend/src/main.ts` | Modified | Tắt body-parser mặc định (`bodyParser: false`), thêm Content-Type Guard middleware, kích hoạt `express.json({ limit })` cấu hình qua env, và đăng ký `HttpErrorFilter` toàn cục. |
| `backend/.env.example` | Modified | Thêm biến cấu hình `JSON_BODY_LIMIT=1mb` và `URLENCODED_BODY_LIMIT=100kb`. |

---

## Kết Quả Test

### Plan 14 Automated Test Script (23/23 PASS)
Chạy script kiểm thử [test_plan14_anti_dos_body_limit.js](file:///C:/Users/Admin/.gemini/antigravity/brain/1ec938c5-52e2-4bd6-87ad-22231bc04644/scratch/test_plan14_anti_dos_body_limit.js) kết quả **100% thành công**:
- **Public endpoints:** GET `/api/v1/health` và GET `/api/v1/products` hoạt động tốt.
- **Login body hợp lệ:** Nhập đúng/sai password từ body JSON hợp lệ đều hoạt động bình thường.
- **Content-Type Guard:** Gửi `text/plain` hoặc thiếu Content-Type → trả về `415 Unsupported Media Type`.
- **Payload Size Limit:** Gửi payload lớn hơn cấu hình (được giả lập cấu hình 2KB để test an toàn nhanh chóng) → trả về `413 Payload too large`.
- **JSON malformed:** Gửi chuỗi JSON lỗi cấu trúc → trả về `400 Bad Request` sạch cấu trúc `{ success: false, message: "Invalid JSON payload" }`, không lộ stack trace hay cấu trúc file.
- **Bảo toàn các chức năng cũ:**
  - Login & Session Cookie (Plan 5) -> OK
  - Phân quyền RBAC (Plan 8) -> OK
  - CORS (Plan 9) -> OK
  - Dev Endpoints Protection (Plan 10) -> OK
  - Input Validation & Query Hardening (Plan 11, 12) -> OK
  - Login Rate Limit (Plan 13) -> OK

### Full Build & Test Verification Suite

| Command | Kết quả |
|---------|---------|
| `npm run check:all` (lint + typecheck) | ✅ PASS |
| `npm run test:mock` (mock logic tests) | ✅ PASS |
| `npm --prefix backend run build` | ✅ PASS |
| `npm --prefix frontend-admin run build` | ✅ PASS |
| `npm --prefix frontend-user run build` | ✅ PASS |

---

## Rủi Ro Còn Lại
1. **Re-allocation Attacks:** Body size limit ngăn chặn các request chứa dung lượng byte quá lớn, nhưng chưa bảo vệ khỏi các cuộc tấn công parsing phức tạp như JSON Nesting Depth (Object lồng nhau sâu vô hạn làm treo bộ biên dịch JSON). 
2. **Slowloris Attacks:** Kẻ tấn công mở kết nối rất chậm để giữ Socket hoạt động. DoS ở tầng mạng/socket cần được cấu hình chặn ở Proxy biên (Nginx, Cloudflare) chứ không thể triệt tiêu hoàn toàn ở tầng ứng dụng Node.js.

---

## Đề Xuất Plan 15 Tiếp Theo
**Audit Logging & Security Event Monitoring**
- Thiết lập ghi logs tự động các sự kiện an ninh trọng yếu (Đăng nhập thất bại/thành công, thay đổi cấu hình, đổi mật khẩu, phân công kỹ thuật viên, lock IP).
- Đảm bảo log ghi vào file hoặc DB có rotation và format an toàn tránh log injection.
