# Mô hình dữ liệu Giai đoạn 7

## Nguyên tắc migration

Migration `20260714100000_phase7_customer_account_security` chỉ bổ sung dữ liệu. Các trường `User.refreshToken`, `ServiceRequest.status` và dữ liệu legacy vẫn được giữ để tránh phá Giai đoạn 1–6.

## User mở rộng

| Trường | Ý nghĩa |
|---|---|
| `normalizedPhone` | Số điện thoại đã chuẩn hóa để đối chiếu và chống trùng |
| `emailVerifiedAt` | Thời điểm email được xác minh |
| `phoneVerifiedAt` | Thời điểm số điện thoại được xác minh |
| `tokenVersion` | Phiên bản bảo mật; tăng để vô hiệu hóa access token cũ |
| `passwordChangedAt` | Thời điểm thay đổi mật khẩu gần nhất |
| `lastLoginAt` | Lần đăng nhập thành công gần nhất |
| `lockedAt` | Thời điểm tài khoản bị khóa |

## AuthSession

Mỗi thiết bị hoặc trình duyệt có một session độc lập.

| Trường | Ý nghĩa |
|---|---|
| `id` | Session ID được nhúng trong JWT claim `sid` |
| `userId` | Chủ phiên |
| `familyId` | Họ refresh token, dùng phát hiện reuse |
| `refreshTokenHash` | SHA-256 của refresh token hiện tại |
| `userAgent` | Mô tả thiết bị, giới hạn 500 ký tự |
| `ipHash` | Hash IP, không lưu IP thô |
| `expiresAt` | Thời điểm session hết hiệu lực |
| `rotatedAt` | Lần refresh gần nhất |
| `lastUsedAt` | Lần dùng session gần nhất |
| `revokedAt` | Thời điểm thu hồi |
| `revokeReason` | Lý do thu hồi |

Refresh token thô không được lưu trong database.

## PasswordResetToken

- `tokenHash`: SHA-256, unique.
- `expiresAt`: mặc định nghiệp vụ 30 phút.
- `usedAt`: đảm bảo chỉ dùng một lần.
- `requestedIpHash`: hỗ trợ điều tra mà không lưu IP thô.
- Khi tạo token mới, token chưa dùng trước đó của người dùng được vô hiệu hóa.

## EmailVerificationToken

- Token một lần.
- Hết hạn sau 24 giờ.
- Xác minh thành công cập nhật `User.emailVerifiedAt`.
- Sau xác minh, hệ thống liên kết các `ServiceRequest` có cùng email chưa thuộc tài khoản nào.

## Address mở rộng

| Trường | Ý nghĩa |
|---|---|
| `label` | Nhà riêng, Công ty hoặc tên tùy chọn |
| `note` | Ghi chú giao nhận |
| `createdAt` | Thời điểm tạo |
| `updatedAt` | Thời điểm cập nhật |

Mỗi người dùng có tối đa một địa chỉ mặc định theo logic transaction.

## ServiceRequest.customerUserId

Liên kết yêu cầu dịch vụ với tài khoản.

- Nullable để giữ yêu cầu guest.
- FK `User.id`, `ON DELETE SET NULL`.
- Account API luôn lọc theo `customerUserId`.
- Liên kết tự động chỉ dùng email/số điện thoại đã xác minh.
- Liên kết thủ công yêu cầu mã yêu cầu và số điện thoại trùng khớp.

## CustomerNotification

Lưu thông báo tài khoản, bảo mật và liên kết dịch vụ.

- `userId`
- `type`
- `title`
- `body`
- `data` JSON
- `readAt`
- `createdAt`

## ServiceRequestReview

- Một đánh giá cho mỗi yêu cầu dịch vụ.
- Rating từ 1 đến 5.
- Chỉ chủ yêu cầu được ghi đánh giá.
- Chỉ trạng thái `COMPLETED`, `WARRANTY` hoặc `CLOSED` được đánh giá.
- Gửi lại sẽ cập nhật bản đánh giá hiện hữu.

## Backfill

Migration chuẩn hóa số điện thoại hiện có. Việc tự động liên kết dữ liệu cũ trong migration chỉ xảy ra nếu contact đã được đánh dấu xác minh; dữ liệu chưa xác minh không bị tự nhận quyền sở hữu.
