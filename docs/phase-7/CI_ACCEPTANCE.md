# CI và nghiệm thu Giai đoạn 7

## Workflow chuyên biệt

### Phase 7 Quality Diagnostics

Kiểm tra:

- Clean install root/customer/admin/backend/mock-api.
- Prisma Client generation.
- ESLint toàn repository.
- TypeScript customer, admin và backend.
- Architecture contracts Giai đoạn 2–7.
- Build customer, admin và backend.
- Luôn upload log lint/typecheck/architecture/build.

### Phase 7 Customer Account Integration

Môi trường:

- Ubuntu GitHub Runner.
- Node theo `.nvmrc`.
- MySQL 8 sạch.
- SMTP capture cục bộ.
- NestJS production build.
- Access token 2 giây để kiểm tra expiration.

## Kịch bản integration bắt buộc

### Database

- Apply toàn bộ migration Giai đoạn 1–7.
- Seed toàn platform hai lần.
- Không lỗi idempotency.
- AuthSession lưu hash SHA-256 dài 64 ký tự.
- `User.refreshToken` legacy được để null đối với phiên mới.

### Đăng ký và xác minh

- Tạo yêu cầu dịch vụ trước khi có tài khoản.
- Đăng ký tài khoản bằng cùng email/số điện thoại.
- Nhận email xác minh qua SMTP thật.
- Token xác minh dùng được một lần.
- Sau xác minh, yêu cầu cũ xuất hiện trong account.
- API không trả password hoặc refresh token.

### Ownership

- Tài khoản A xem được yêu cầu và đơn hàng của A.
- Tài khoản B nhận 404 khi đọc yêu cầu của A.
- Tài khoản B nhận 404 khi đọc đơn hàng của A.
- Sổ địa chỉ được truy vấn theo userId.

### Token lifecycle

- Access token hết hạn trả 401.
- Refresh token hợp lệ tạo access/refresh mới.
- Refresh token mới khác token cũ.
- Dùng lại refresh token cũ trả 403.
- Reuse thu hồi token family.
- Token mới trong family đã bị thu hồi cũng không dùng được.

### Brute force

- Ba lần đăng nhập sai trả 401.
- Lần tiếp theo trong window trả 429.
- Không tiết lộ tài khoản có tồn tại hay không.

### Password reset

- Forgot password trả phản hồi chung.
- Email reset được gửi qua SMTP capture.
- Reset token một lần và có thời hạn.
- Reset thành công vô hiệu hóa session cũ.
- Mật khẩu cũ không đăng nhập được.
- Mật khẩu mới đăng nhập được.

### Logout/session

- Account API trả danh sách phiên đang hoạt động.
- Phiên hiện tại được đánh dấu `current`.
- Logout thu hồi session.
- Sau logout account API trả 401.

### Log safety

- Backend log không chứa token xác minh.
- Backend log không chứa token reset.
- Backend log không chứa refresh token đã dùng trong test.
- Workflow grep JWT-shaped string và thất bại nếu phát hiện.

## Regression trước merge

PR Giai đoạn 7 phải được retarget tạm về `main` để chạy:

- Continuous Integration.
- Customer Lighthouse.
- Phase 5 Content Integration.
- Phase 6 Service Request Integration.
- Phase 6 Quality Diagnostics nếu path phù hợp.
- Phase 7 Quality Diagnostics.
- Phase 7 Customer Account Integration.

Sau khi tất cả PASS trên cùng commit, trả PR về base `agent/phase-6-service-request-lifecycle`.

## Tiêu chí Done

- [x] Auth API đầy đủ.
- [x] Cookie HttpOnly và rotation.
- [x] Rate limit khách hàng.
- [x] Quên/reset mật khẩu.
- [x] Hồ sơ và sổ địa chỉ.
- [x] Liên kết yêu cầu cũ.
- [x] Dịch vụ, đơn hàng, thông báo, đánh giá.
- [x] Session revoke.
- [x] Route guard và không lưu token phía client.
- [x] Ownership isolation test.
- [x] Token/log safety test.
- [ ] CI chung và Lighthouse trên commit cuối — được ghi kết quả trong PR trước khi chuyển Ready.
