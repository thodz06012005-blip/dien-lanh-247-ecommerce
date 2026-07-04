# HANDOVER ADMIN SECURITY PLAN 2 — BÁO CÁO LOẠI BỎ SECRETS & MẬT KHẨU MẶC ĐỊNH

## 1. Thông tin nhánh & Commit gốc
- **Branch đang làm việc**: `security/admin-phase-2-remove-default-secrets`
- **Commit gốc (Plan 1)**: `063676c243af9fa95eb1381335cbccdb123b32c6` (báo cáo baseline audit)

---

## 2. Các file đã kiểm tra & sửa đổi

| Đường dẫn file | Trạng thái | Nội dung thay đổi |
|---|---|---|
| `backend/src/modules/auth/strategies/jwt.strategy.ts` | 🛠️ Đã sửa | Xóa fallback `'access_secret'`. Thêm kiểm tra và ném lỗi bắt buộc `JWT_ACCESS_SECRET`. |
| `backend/src/modules/auth/strategies/jwt-refresh.strategy.ts` | 🛠️ Đã sửa | Xóa fallback `'refresh_secret'`. Thêm kiểm tra và ném lỗi bắt buộc `JWT_REFRESH_SECRET`. |
| `backend/src/modules/auth/auth.service.ts` | 🛠️ Đã sửa | Xóa fallback secret trong hàm `generateTokens()`. Kiểm tra ném lỗi nếu thiếu biến môi trường lúc ký token. |
| `backend/prisma/seed.ts` | 🛠️ Đã sửa | Loại bỏ mật khẩu admin mặc định `'admin123'`. Chuyển sang đọc `ADMIN_SEED_PASSWORD` từ env. Bổ sung validate độ dài >= 12 ký tự. |
| `backend/.env.example` | 🛠️ Đã sửa | Cập nhật các biến môi trường cấu hình và thêm các lưu ý bảo mật mới. |

---

## 3. Chi tiết xử lý rủi ro Critical

### 3.1. Loại bỏ Fallback JWT Secrets
Toàn bộ các chuỗi fallback tĩnh (`'access_secret'` và `'refresh_secret'`) dùng để ký hoặc giải mã token JWT đã bị xóa bỏ hoàn toàn.
* **Cơ chế Fail-Fast**: Khi ứng dụng khởi động (bootstrap), `ConfigService` sẽ được gọi trong constructor của các Strategy. Nếu thiếu `JWT_ACCESS_SECRET` hoặc `JWT_REFRESH_SECRET`, ứng dụng sẽ crash lập tức và đưa ra thông báo rõ ràng:
  * `Error: Missing required environment variable: JWT_ACCESS_SECRET`
  * `Error: Missing required environment variable: JWT_REFRESH_SECRET`
* **Vị trí ký token**: Trong hàm `generateTokens()` của `AuthService`, hệ thống cũng kiểm tra trước khi ký. Nếu thiếu, sẽ dừng luồng xử lý và báo lỗi.

### 3.2. Loại bỏ Mật khẩu Admin Seed mặc định (`admin123`)
* **Cơ chế seed mới**: Mật khẩu admin không còn được lưu trữ dưới dạng bản rõ trong code. Seed script sẽ đọc trực tiếp từ `process.env.ADMIN_SEED_PASSWORD`.
* **Validate bảo mật**:
  * Kiểm tra nếu thiếu `ADMIN_SEED_PASSWORD` → ném lỗi: `Error: Missing required environment variable: ADMIN_SEED_PASSWORD`.
  * Kiểm tra độ dài mật khẩu → nếu ngắn hơn 12 ký tự, ném lỗi: `Error: ADMIN_SEED_PASSWORD must be at least 12 characters long`.
* **Bảo vệ mật khẩu**: Mật khẩu được mã hóa an toàn qua `bcrypt.hash()` trước khi lưu xuống DB. Không log mật khẩu hay in mật khẩu ra console trong quá trình seed.

---

## 4. Kết quả tìm kiếm chuỗi nhạy cảm toàn Repo
Đã chạy tìm kiếm bằng `findstr` cho các từ khóa nhạy cảm trong mã nguồn:
- **`admin123`**: 🚫 Không tìm thấy (đã xóa sạch khỏi seed và example).
- **`access_secret`** / **`refresh_secret`**: 🚫 Không tìm thấy dạng chuỗi gán fallback, chỉ còn các dòng kiểm tra biến môi trường hợp lệ.
- **Mật khẩu bản rõ**: Không còn bất kỳ mật khẩu admin nào lưu cứng trong code.

---

## 5. Kết quả kiểm thử & Build

Tất cả các bài kiểm tra đều đã được xác thực thành công trên môi trường local:

| Câu lệnh kiểm thử | Kết quả | Chi tiết |
|---|---|---|
| `npm run check:all` | **✅ PASS** | Không có lỗi TypeScript hay linter lọt lưới. |
| `npm run test:mock` | **✅ PASS** | 100% các bộ test tích hợp mock API đều thành công. |
| `npm --prefix backend run build` | **✅ PASS** | Backend NestJS build thành công. |
| `npm --prefix frontend-admin run build` | **✅ PASS** | Frontend Admin Panel build thành công. |
| `npm --prefix frontend-user run build` | **✅ PASS** | Frontend User Client build thành công. |

---

## 6. Rủi ro còn lại & Đề xuất tiếp theo (Plan 3)
* **Rủi ro còn lại**: Token JWT của admin vẫn đang được lưu trữ ở `localStorage` của trình duyệt. Điều này mở ra nguy cơ bị tấn công XSS (Cross-Site Scripting) đánh cắp token.
* **Đề xuất Plan 3**: Triển khai cơ chế lưu trữ **Cookie HttpOnly** cho access token và refresh token để loại bỏ triệt để rủi ro XSS ở client.
