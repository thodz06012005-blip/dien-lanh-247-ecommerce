# Hướng dẫn review code Giai đoạn 2

## 1. Mục tiêu review

Reviewer xác nhận thay đổi kiến trúc:

- không làm mất route hoặc nghiệp vụ hiện có;
- không làm thay đổi contract ngoài phạm vi tài liệu;
- không thêm secret;
- có thể cài đặt và build tái lập;
- có cấu trúc đủ rõ để phát triển các giai đoạn tiếp theo.

## 2. Review root tooling

Kiểm tra:

- Node 22 thống nhất giữa `.nvmrc`, `engines` và CI.
- `npm ci` dùng lockfile hiện có.
- root scripts không tự sửa file trong `lint`/`check`.
- `.gitignore` không chặn `.env.example`.
- Prettier không chạy trên generated/backup/database file.
- repository validator không in nội dung secret.

## 3. Review customer frontend

- So sánh route cũ với `AppRouter` mới.
- Xác nhận `MainLayout`, login/register và các dynamic route giữ nguyên.
- Kiểm tra QueryClient retry không retry lỗi 4xx thông thường.
- Kiểm tra refresh request không loop ở login/refresh endpoint.
- Kiểm tra Error Boundary không lộ error chi tiết ở production.
- Kiểm tra API base URL và timeout đến từ `env`.
- Kiểm tra `withCredentials` vẫn bật.

## 4. Review admin frontend

- So sánh route cũ với `AppRouter` mới.
- Xác nhận `AdminProtectedRoute` và required role giữ nguyên.
- Kiểm tra ConfigProvider vẫn dùng locale Việt Nam.
- Kiểm tra API client không tạo import vòng tĩnh với auth store.
- Kiểm tra DELETE vẫn có confirmation header.
- Kiểm tra `401` login không bị redirect loop.

## 5. Review backend bootstrap

- Config validation không yêu cầu biến không có trong `.env.example`.
- CORS chỉ cho allowlist và vẫn hỗ trợ cookie.
- Content-Type guard cho phép multipart upload.
- Body parser chạy sau content guard.
- Request ID được gắn trước filter/interceptor.
- ValidationPipe giữ whitelist/forbid/transform.
- Shutdown hooks được bật.

## 6. Review response contract

Kiểm tra ba trường hợp:

### Existing envelope

Input từ service:

```json
{ "success": true, "data": [] }
```

Output phải giữ `data` ở đúng cấp và chỉ bổ sung metadata.

### Raw value

Input:

```json
{ "status": "ok" }
```

Output:

```json
{ "success": true, "data": { "status": "ok" } }
```

### Exception

Output phải có:

- `success: false`;
- HTTP status;
- stable error code;
- safe message;
- request ID;
- method/path/timestamp.

## 7. Review security

- Không có `.env` thật trong diff.
- Frontend env chỉ có public variables.
- Backend production từ chối placeholder secret.
- Error filter không trả stack.
- Request log không in token/password.
- CORS wildcard bị chặn ở staging/production.
- Secure cookie bắt buộc ở staging/production.

## 8. Review Prisma

- Schema/seed hiện hữu không bị sửa ngoài phạm vi.
- Không có migration SQL viết tay giả định.
- Workflow phân biệt `migrate dev` và `migrate deploy`.
- Seed vẫn yêu cầu password qua environment.
- Baseline migration được ghi rõ là công việc cần thực hiện với MySQL development thật.

## 9. Lệnh review

```bash
npm ci
npm run bootstrap
npm run ci
```

Kiểm tra riêng:

```bash
npm --prefix frontend-user run check
npm --prefix frontend-admin run check
npm --prefix backend run check
```

## 10. Điều kiện yêu cầu sửa

Reviewer nên yêu cầu sửa nếu:

- CI fail;
- route bị mất;
- response bị bọc lồng;
- upload multipart bị chặn;
- config production cho phép secret placeholder;
- `.env` thật xuất hiện;
- package/lockfile không đồng bộ;
- code nghiệp vụ ngoài scope bị thay đổi;
- tài liệu nói khác code.
