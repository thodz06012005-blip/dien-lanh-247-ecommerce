# Giai đoạn 7 — Tài khoản khách hàng và bảo mật phiên

## Mục tiêu

Cho phép khách hàng quản lý hồ sơ, sổ địa chỉ, lịch sử dịch vụ, đơn hàng, thông báo và thiết bị đăng nhập mà không dựa vào dữ liệu nhận dạng do trình duyệt tự khai báo.

## Kiến trúc kế thừa

- Base branch: `agent/phase-6-service-request-lifecycle`
- Head branch: `agent/phase-7-customer-account-security`
- Merge base: `da4128f05fe07d09b1c5c36a38119ffe98e81a7f`
- PR: #9

Giai đoạn 7 là migration additive. Không xóa bảng, cột, route hoặc trạng thái của Giai đoạn 1–6.

## Chức năng hoàn thành

### Auth

- Đăng ký bằng email, số điện thoại và mật khẩu mạnh.
- Đăng nhập khách hàng có brute-force protection.
- Access token ngắn hạn trong cookie HttpOnly.
- Refresh token rotation theo session và token family.
- Phát hiện tái sử dụng refresh token.
- Đăng xuất thiết bị hiện tại hoặc toàn bộ thiết bị.
- Quên mật khẩu với phản hồi chống dò email.
- Token đặt lại mật khẩu dùng một lần, hết hạn sau 30 phút.
- Xác minh email dùng token một lần, hết hạn sau 24 giờ.
- Thu hồi toàn bộ phiên sau reset hoặc đổi mật khẩu.
- Tài khoản bị khóa hoặc vô hiệu hóa không thể tiếp tục dùng token cũ.

### Customer Account Hub

- Tổng quan tài khoản.
- Hồ sơ cá nhân.
- Sổ địa chỉ nhiều mục và địa chỉ mặc định.
- Lịch sử yêu cầu dịch vụ.
- Liên kết yêu cầu được tạo trước tài khoản.
- Chi tiết yêu cầu, timeline, ảnh và đánh giá.
- Lịch sử đơn hàng và chi tiết đơn hàng.
- Thông báo đã đọc/chưa đọc.
- Danh sách thiết bị đăng nhập và thu hồi từng phiên.

## Quy tắc sở hữu dữ liệu

- `userId` được lấy từ access token đã kiểm tra session.
- API account không nhận `userId` từ request body hoặc query.
- Đơn hàng dùng điều kiện `id + userId`.
- Yêu cầu dịch vụ dùng điều kiện `id + customerUserId`.
- Địa chỉ dùng điều kiện `id + userId`.
- Thông báo và session dùng điều kiện `id + userId`.
- Tài khoản thứ hai nhận 404 khi truy cập dữ liệu tài khoản thứ nhất.

## Giao diện

- Thiết kế responsive theo phong cách customer portal hiện đại.
- Dark hero, gradient nhẹ, card bo tròn và trạng thái rõ ràng.
- Animation ngắn, hỗ trợ `prefers-reduced-motion` qua Tailwind motion utilities.
- Không hiển thị token trong UI.
- Không lưu access/refresh token vào localStorage hoặc sessionStorage.

## Chạy local

```bash
npm ci
npm run bootstrap
npm --prefix backend run prisma:migrate:deploy
npm --prefix backend run prisma:seed
npm run dev:platform
```

Các trang chính:

```text
/#/login
/#/register
/#/forgot-password
/#/reset-password?token=...
/#/verify-email?token=...
/#/account
/#/orders
/#/my-services
```

## Tài liệu liên quan

- `DATA_MODEL.md`
- `API_CONTRACT.md`
- `SECURITY.md`
- `CI_ACCEPTANCE.md`
- `PHASE_7_HANDOVER.md`
