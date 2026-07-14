# Bảo mật Giai đoạn 7

## Mô hình token

### Access token

- JWT ngắn hạn.
- Claim gồm `sub`, `sid`, `fid`, `tv`, email và role.
- Được lưu trong cookie HttpOnly.
- Mỗi request được kiểm tra:
  - chữ ký và thời hạn;
  - tài khoản còn hoạt động;
  - tài khoản không bị khóa;
  - `tokenVersion` còn khớp;
  - AuthSession chưa bị thu hồi và chưa hết hạn.

### Refresh token

- JWT dài hạn hơn access token.
- Chỉ gửi đến `/auth/refresh` nhờ cookie path.
- Database chỉ lưu SHA-256.
- Rotation sau mỗi lần refresh.
- Token cũ bị dùng lại sẽ thu hồi toàn bộ `familyId`.

## Thu hồi phiên

Các sự kiện sau thu hồi session:

- Đăng xuất thiết bị hiện tại.
- Đăng xuất tất cả thiết bị.
- Đổi mật khẩu.
- Reset mật khẩu.
- Khóa/vô hiệu hóa tài khoản.
- Phát hiện refresh token reuse.
- Người dùng chủ động thu hồi thiết bị.

`tokenVersion` cho phép vô hiệu hóa access token đã phát hành mà không cần chờ hết hạn.

## Mật khẩu

- Bcrypt với salt rounds từ cấu hình, giới hạn 8–15.
- Đăng ký và mật khẩu mới yêu cầu ít nhất 10 ký tự.
- Bắt buộc có chữ hoa, chữ thường và chữ số.
- So sánh mật khẩu giả khi email không tồn tại để giảm khác biệt timing.
- Không trả password hash trong API.
- Không ghi mật khẩu vào audit hoặc log.

## Brute-force protection

Áp dụng cho cả khách hàng và admin:

- Theo email.
- Theo IP.
- Theo cặp IP + email.
- Window và thời gian khóa từ biến môi trường.
- Thành công xóa bộ đếm liên quan.
- Sai email và sai mật khẩu có cùng thông báo.

## Quên mật khẩu

- Endpoint luôn trả cùng phản hồi dù email không tồn tại.
- Giới hạn phát token lặp trong 60 giây.
- Token entropy 256 bit.
- Lưu SHA-256, không lưu token thô.
- Token hết hạn sau 30 phút.
- Token một lần; token cũ được vô hiệu hóa khi phát token mới.
- Reset thành công thu hồi mọi phiên.

## Xác minh contact và liên kết dữ liệu cũ

- Email chỉ được dùng để auto-link sau `emailVerifiedAt`.
- Số điện thoại chỉ được dùng để auto-link sau `phoneVerifiedAt`.
- Claim thủ công yêu cầu mã yêu cầu và số điện thoại trùng khớp.
- Yêu cầu đã thuộc tài khoản khác không thể bị claim.
- API trả thông báo không tìm thấy chung để giảm dò dữ liệu.

## Ownership authorization

Account API không tin cậy:

- `userId` trong body;
- email trong query;
- số điện thoại trong query;
- localStorage của frontend.

Mọi truy vấn nhạy cảm dùng user ID từ JWT:

```text
Order:          id + userId
ServiceRequest: id + customerUserId
Address:        id + userId
Notification:   id + userId
AuthSession:    id + userId
Review:         requestId + userId
```

## Log và audit

- Mail simulated log chỉ ghi subject và recipient, không ghi link/token.
- IP được hash trong AuthSession/password reset.
- Integration test grep JWT pattern trong backend log.
- Integration test đối chiếu token thật và xác nhận không xuất hiện trong log.
- Refresh/reset/verification token không được trả về production response.

## Frontend

- Không lưu token vào localStorage/sessionStorage.
- `withCredentials: true` cho cookie.
- Một refresh promise dùng chung để tránh refresh storm.
- Chỉ retry request một lần.
- Refresh thất bại xóa state và chuyển route bảo vệ về login.
- Route account/orders/my-services được bọc `ProtectedRoute`.

## Cấu hình production bắt buộc

```text
NODE_ENV=production
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict hoặc lax theo kiến trúc domain
JWT_ACCESS_SECRET=<secret mạnh, riêng biệt>
JWT_REFRESH_SECRET=<secret mạnh, riêng biệt>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10 hoặc cao hơn theo benchmark
SMTP_HOST=<server thật>
SMTP_PORT=<port thật>
SMTP_USER=<credential riêng>
SMTP_PASSWORD=<secret manager>
```

Không dùng secret mẫu của CI cho production.
