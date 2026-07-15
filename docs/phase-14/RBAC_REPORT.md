# Báo cáo kiểm tra phân quyền backend

## Kết luận

Phân quyền được thực thi tại NestJS bằng `JwtAuthGuard`, `RolesGuard` và `PermissionsGuard`. Thay đổi role, permission, URL hoặc payload ở frontend không cấp thêm quyền vì backend đọc role từ access token đã xác minh và kiểm tra session còn hiệu lực trong database.

## Role matrix

| Chức năng | CUSTOMER | STAFF | ADMIN | SUPERADMIN |
|---|:---:|:---:|:---:|:---:|
| Public catalog/content | Có | Có | Có | Có |
| Hồ sơ và dữ liệu của chính mình | Có | Có | Có | Có |
| Dashboard quản trị | Không | Xem | Có | Có |
| Xem đơn hàng | Không | Có | Có | Có |
| Quản lý đơn hàng | Không | Có | Có | Có |
| Xem sản phẩm quản trị | Không | Có | Có | Có |
| Tạo/sửa sản phẩm | Không | Không | Có | Có |
| Soft-delete sản phẩm | Không | Không | Không | Có |
| Xem khách hàng | Không | Có | Có | Có |
| Quản lý khách hàng | Không | Không | Có | Có |
| Xem dịch vụ/yêu cầu | Chỉ dữ liệu của mình | Có | Có | Có |
| Cập nhật workflow dịch vụ | Không | Có | Có | Có |
| Phân công kỹ thuật viên | Không | Không | Có | Có |
| Quản lý settings | Không | Không | Không | Có |
| Xem audit log | Không | Không | Không | Có |
| Kiểm tra audit integrity | Không | Không | Không | Có |

## Permission matrix hiện hành

- `SUPERADMIN`: toàn bộ permission.
- `ADMIN`: toàn bộ permission trừ `settings.manage`.
- `STAFF`: dashboard view; order view/manage; product view; customer view; service view/manage; technician view; operations view/manage; content view; profile view/manage.
- `CUSTOMER`: không có admin permission.

## Route trọng yếu đã kiểm tra

| Route | Guard/permission backend | Kết quả mong đợi khi sửa request |
|---|---|---|
| `POST /admin/auth/login` | Login throttle + admin role sau xác thực | Customer credential bị từ chối |
| `GET /admin/products` | JWT + role + `products.view` | CUSTOMER nhận 403 |
| `POST/PATCH /admin/products` | JWT + ADMIN/SUPERADMIN + `products.manage` | STAFF nhận 403 |
| `DELETE /admin/products/:id` | JWT + SUPERADMIN + permission + confirmation | ADMIN/STAFF nhận 403; thiếu confirmation nhận 400 |
| `GET /admin/service-requests` | JWT + STAFF/ADMIN/SUPERADMIN | CUSTOMER nhận 403 |
| `PATCH /admin/service-requests/:id/status` | JWT + STAFF/ADMIN/SUPERADMIN | CUSTOMER nhận 403 |
| `PATCH /admin/service-requests/:id/assign-technician` | JWT + ADMIN/SUPERADMIN | STAFF nhận 403 |
| `GET /admin/audit-logs` | JWT + SUPERADMIN | ADMIN/STAFF nhận 403 |
| `GET /admin/audit-logs/integrity` | JWT + SUPERADMIN | ADMIN/STAFF nhận 403 |
| `GET /my-service-requests` | JWT + userId từ token/session | Không thể truyền userId khác trong query |

## Cơ chế chống vượt quyền

1. JWT strategy xác minh signature.
2. Access claim chứa `sid` và `tokenVersion`.
3. Backend kiểm tra `AuthSession` chưa revoke/hết hạn.
4. Backend kiểm tra tài khoản active, không locked và token version hiện hành.
5. `RolesGuard` kiểm tra role tại controller/handler.
6. `PermissionsGuard` kiểm tra permission matrix backend.
7. Service tiếp tục kiểm tra ownership và trạng thái nghiệp vụ.
8. Mọi 401/403 được ghi audit mà không lưu request body.

## Kiểm thử bắt buộc

- Dùng access token CUSTOMER gọi toàn bộ `/admin/*`: phải nhận 403 hoặc 401.
- Dùng STAFF tạo/sửa/xóa sản phẩm: phải nhận 403.
- Dùng ADMIN xóa sản phẩm: phải nhận 403 do chỉ SUPERADMIN.
- Dùng SUPERADMIN xóa nhưng thiếu confirmation: phải nhận 400.
- Sửa `role`, `userId`, `permissions` trong JSON body: bị DTO whitelist loại bỏ hoặc service bỏ qua.
- Thu hồi session rồi tái sử dụng access/refresh token: phải nhận 401/403.

Contract tự động: `tests/architecture/phase14-security-hardening.test.mjs`.
