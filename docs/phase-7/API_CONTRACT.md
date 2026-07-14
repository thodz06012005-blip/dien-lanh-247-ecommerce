# API Contract Giai đoạn 7

Prefix mặc định: `/api/v1`

## Auth công khai

### `POST /auth/register`

Tạo tài khoản, session và cookie HttpOnly. Payload:

```json
{
  "email": "customer@example.com",
  "password": "SecurePassword123",
  "firstName": "An",
  "lastName": "Nguyễn",
  "phone": "0912345678"
}
```

Mật khẩu tối thiểu 10 ký tự, có chữ hoa, chữ thường và chữ số.

### `POST /auth/login`

- Có brute-force protection theo IP, email và cặp IP/email.
- Phản hồi sai email và sai mật khẩu giống nhau.
- Access/refresh token chỉ được đặt trong cookie HttpOnly.

### `POST /auth/refresh`

- Đọc refresh token từ cookie.
- Xác minh `sessionId`, `familyId`, `tokenVersion` và hash hiện tại.
- Rotation refresh token sau mỗi lần dùng.
- Reuse token cũ thu hồi toàn bộ token family.

### `POST /auth/forgot-password`

Phản hồi luôn giống nhau:

```json
{
  "success": true,
  "message": "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi."
}
```

Không tiết lộ email có tài khoản hay không.

### `POST /auth/reset-password`

```json
{
  "token": "single-use-token",
  "newPassword": "ChangedPassword123"
}
```

Sau thành công:

- Token reset được đánh dấu đã dùng.
- `tokenVersion` tăng.
- Toàn bộ AuthSession bị thu hồi.
- Cookie auth được xóa.

### `POST /auth/verify-email`

```json
{ "token": "single-use-token" }
```

Sau thành công, yêu cầu guest cùng email chưa có chủ được liên kết với tài khoản.

## Auth có bảo vệ

### `GET /auth/me`

Trả hồ sơ an toàn, không có password, refresh token hoặc token hash.

### `POST /auth/logout`

Thu hồi session hiện tại.

### `POST /auth/logout-all`

Thu hồi tất cả session và tăng `tokenVersion`.

### `POST /auth/verify-email/resend`

Gửi lại email xác minh; yêu cầu access token hợp lệ.

## Account API

Tất cả route dưới đây yêu cầu `JwtAuthGuard`. `userId` được lấy từ token, không lấy từ request.

### `GET /account`

Trả:

- Hồ sơ.
- Địa chỉ mặc định.
- Số lượng dịch vụ.
- Số lượng đơn hàng.
- Thông báo chưa đọc.
- Phiên hoạt động.

### `PATCH /account/profile`

Cập nhật họ, tên và số điện thoại. Nếu đổi số, `phoneVerifiedAt` được xóa.

### Sổ địa chỉ

```text
GET    /account/addresses
POST   /account/addresses
PATCH  /account/addresses/:id
DELETE /account/addresses/:id
```

Mọi thao tác đều kiểm tra `address.id + userId`.

### `POST /account/change-password`

Yêu cầu mật khẩu hiện tại và mật khẩu mới. Thành công sẽ thu hồi mọi session.

### Đơn hàng

```text
GET /account/orders
GET /account/orders/:id
```

Chi tiết dùng điều kiện `id + userId`; tài khoản khác nhận 404.

### Yêu cầu dịch vụ

```text
GET  /account/service-requests
GET  /account/service-requests/:id
POST /account/service-requests/claim
POST /account/service-requests/:id/review
```

Claim yêu cầu:

```json
{
  "code": "DL247-260714-A1B2C3",
  "phone": "0912345678"
}
```

Sai mã hoặc số điện thoại trả thông báo không tìm thấy chung.

### Thông báo

```text
GET   /account/notifications
PATCH /account/notifications/read-all
PATCH /account/notifications/:id/read
```

### Phiên đăng nhập

```text
GET    /account/sessions
DELETE /account/sessions/:id
```

Chỉ trả session của tài khoản hiện tại. IP hash và refresh token hash không được trả về frontend.

## Cookie

| Cookie | Thuộc tính |
|---|---|
| `accessToken` | HttpOnly, Secure theo môi trường, SameSite cấu hình, path `/` |
| `refreshToken` | HttpOnly, Secure theo môi trường, SameSite cấu hình, path `/api/v1/auth/refresh` |

Frontend dùng `withCredentials: true`, không đọc hoặc lưu token.
