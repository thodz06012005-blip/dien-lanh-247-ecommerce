# Bàn giao Giai đoạn 7

## Branch và PR

```text
Repository: thodz06012005-blip/dien-lanh-247-ecommerce
Base:       agent/phase-6-service-request-lifecycle
Head:       agent/phase-7-customer-account-security
PR:         #9
```

Không merge PR #9 trước PR Giai đoạn 6 (#8).

## Thay đổi backend

### Migration

```text
backend/prisma/migrations/
  20260714100000_phase7_customer_account_security/migration.sql
```

Bổ sung:

- Session theo thiết bị.
- Password reset token.
- Email verification token.
- Customer notification.
- Service request review.
- Contact verification metadata.
- ServiceRequest ownership.
- Address metadata.

### Auth

Các file trọng tâm:

```text
backend/src/modules/auth/auth.service.ts
backend/src/modules/auth/auth.controller.ts
backend/src/modules/auth/strategies/jwt.strategy.ts
backend/src/modules/auth/strategies/jwt-refresh.strategy.ts
backend/src/modules/auth/dto/forgot-password.dto.ts
backend/src/modules/auth/dto/register.dto.ts
```

### Customer account

```text
backend/src/modules/users/users.controller.ts
backend/src/modules/users/users.service.ts
backend/src/modules/users/dto/account.dto.ts
```

### Email

```text
backend/src/integrations/mail/mail.service.ts
```

Mail service không log link reset/xác minh ở simulated mode.

## Thay đổi frontend

### Auth/session

```text
frontend-user/src/store/authStore.ts
frontend-user/src/services/api.ts
frontend-user/src/router/AppRouter.tsx
```

- Không localStorage token.
- Bootstrap session từ `/auth/me`.
- Refresh tự động đúng một lần.
- ProtectedRoute cho account/orders/my-services.

### Trang auth

```text
frontend-user/src/pages/Login.tsx
frontend-user/src/pages/Register.tsx
frontend-user/src/pages/ForgotPassword.tsx
frontend-user/src/pages/ResetPassword.tsx
frontend-user/src/pages/VerifyEmail.tsx
```

### Customer Hub

```text
frontend-user/src/pages/Account.tsx
frontend-user/src/services/accountApi.ts
frontend-user/src/pages/Orders.tsx
frontend-user/src/pages/MyServices.tsx
frontend-user/src/pages/MyServiceDetail.tsx
```

## Compatibility notes

- Các route public Giai đoạn 6 vẫn tồn tại.
- `User.refreshToken` vẫn còn trong schema legacy nhưng phiên Giai đoạn 7 để trường này null.
- Các trường `city`, `district`, `addressDetail` vẫn là optional trong frontend User type để Checkout/Booking cũ build được; nguồn dữ liệu mới là Address API.
- ServiceRequest trạng thái, timeline, media và audit Giai đoạn 6 không thay đổi.
- Product/cart/checkout/order calculation không thay đổi.
- Admin auth response contract được giữ tương thích.

## Kiểm thử

```text
.github/workflows/phase7-quality-diagnostics.yml
.github/workflows/phase7-customer-account-integration.yml
tests/architecture/phase7-customer-account-security.test.mjs
backend/test/phase7-customer-account.integration.mjs
backend/test/smtp-capture.mjs
```

## Deployment

1. Backup database.
2. Deploy application code hỗ trợ cả schema cũ và mới.
3. Chạy `npm --prefix backend run prisma:migrate:deploy`.
4. Khởi động backend với SMTP/JWT/cookie config production.
5. Smoke test register/login/refresh/logout.
6. Smoke test forgot/reset password qua mailbox thật.
7. Smoke test account ownership với hai tài khoản.
8. Kiểm tra log không chứa JWT hoặc reset URL.
9. Bật alert cho 401/403/429 tăng bất thường.

## Rollback

Migration additive nên rollback ứng dụng về Giai đoạn 6 không làm mất bảng cũ. Không xóa ngay các bảng Giai đoạn 7 khi rollback khẩn cấp; dữ liệu session/token có thể được giữ để điều tra. Trước khi quay lại Giai đoạn 7, thu hồi session tồn tại nếu JWT secret đã thay đổi.

## Thứ tự merge

```text
PR #8 (Phase 6) → main
retarget PR #9 → main
run all final workflows
merge PR #9
```

Nếu PR #8 thay đổi head trước khi merge, rebase/retarget Phase 7 và chạy lại migration + integration trước khi merge.
