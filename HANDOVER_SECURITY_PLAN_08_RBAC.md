# HANDOVER ADMIN SECURITY PLAN 8 — BÁO CÁO PHÂN QUYỀN RBAC & PERMISSION MAP

## 1. Thông tin nhánh & Commit gốc
- **Branch đang làm việc**: `security/admin-phase-8-rbac`
- **Commit gốc (Plan 7)**: `2c01ceb` (protect all admin api routes)

---

## 2. Các file đã kiểm tra
- `mock-api/utils/auth.js`
- `mock-api/server.js`
- `mock-api/routes/adminDashboard.js`
- `mock-api/routes/adminProducts.js`
- `mock-api/routes/adminCustomers.js`
- `mock-api/routes/adminSettings.js`
- `mock-api/routes/orders.js`
- `mock-api/routes/serviceRequests.js`
- `mock-api/routes/technicians.js`
- `backend/src/common/guards/roles.guard.ts`
- `backend/src/common/decorators/roles.decorator.ts`
- `backend/src/modules/auth/admin-auth.controller.ts`
- `backend/src/modules/dashboard/dashboard.controller.ts`
- `backend/src/modules/orders/orders.controller.ts`
- `backend/src/modules/products/products.controller.ts`
- `backend/src/modules/service-requests/service-requests.controller.ts`
- `backend/src/modules/settings/settings.controller.ts`
- `backend/src/modules/technicians/technicians.controller.ts`
- `backend/prisma/schema.prisma`

---

## 3. Các file đã sửa đổi

| Đường dẫn file | Thay đổi chính |
|---|---|
| `backend/prisma/schema.prisma` | Thêm `STAFF` vào enum `UserRole`. |
| `backend/src/common/decorators/roles.decorator.ts` | Cập nhật tham số nhận vào từ `UserRole[]` thành `string[]` để linh hoạt và tương thích rộng rãi, không bị phụ thuộc cứng. |
| `backend/src/common/guards/roles.guard.ts` | Loại bỏ import `UserRole` từ `@prisma/client`, cập nhật kiểu generic của Reflector thành `string[]` để thống nhất. |
| `backend/src/modules/auth/admin-auth.controller.ts` | Cập nhật `@Roles` decorator trên endpoint `/me` và `/logout` để cho phép `STAFF` truy cập (Staff cũng cần logout và xem thông tin tài khoản của mình). |
| `backend/src/modules/dashboard/dashboard.controller.ts` | Thêm `UserRole.STAFF` vào decorator `@Roles` để cho phép nhân viên vận hành xem dashboard cơ bản. |
| `backend/src/modules/orders/orders.controller.ts` | Thêm `UserRole.STAFF` vào các API lấy danh sách đơn hàng (`admin/orders`), chi tiết đơn hàng (`admin/orders/:id`), và cập nhật trạng thái đơn hàng (`admin/orders/:id/status`). |
| `backend/src/modules/products/products.controller.ts` | Thêm `UserRole.STAFF` vào các API lấy danh sách sản phẩm (`admin/products`) và xem chi tiết sản phẩm (`admin/products/:identifier`). Cập nhật endpoint delete sản phẩm (`admin/products/:id`) thành chỉ cho phép `UserRole.SUPERADMIN`. |
| `backend/src/modules/service-requests/service-requests.controller.ts` | Thêm `UserRole.STAFF` vào các API xem danh sách (`admin/service-requests`), chi tiết (`admin/service-requests/:id`), và cập nhật trạng thái (`admin/service-requests/:id/status`). Giữ nguyên phân công kỹ thuật viên cho `ADMIN` và `SUPERADMIN`. |
| `backend/src/modules/settings/settings.controller.ts` | Giới hạn endpoint chỉnh sửa cấu hình hệ thống (`PATCH admin/settings`) thành chỉ cho phép `UserRole.SUPERADMIN` (Admin thường không được đổi cấu hình bảo mật/hệ thống). |
| `backend/src/modules/technicians/technicians.controller.ts` | Thêm `UserRole.STAFF` vào endpoint xem danh sách/chi tiết kỹ thuật viên. Giới hạn các endpoint POST/PATCH kỹ thuật viên cho `ADMIN`/`SUPERADMIN` và DELETE kỹ thuật viên chỉ cho phép `SUPERADMIN`. |
| `mock-api/utils/auth.js` | 1) Khai báo danh sách tài khoản mock đa vai trò (`superadmin`, `admin`, `staff`). <br> 2) Định nghĩa bản đồ quyền hạn (`ROLE_PERMISSIONS`). <br> 3) Triển khai middleware factory `requirePermission(permission)` để kiểm tra quyền hạn chi tiết và loại bỏ trường `password` khỏi `req.admin`. |
| `mock-api/routes/*.js` | Chuyển toàn bộ các endpoint admin sang dùng `requirePermission` thay cho middleware chung chung `requireAdminAuth`. |

---

## 4. Rà soát & Chuẩn hóa Vai trò (Role Mapping)

### 4.1. Vai trò trước khi sửa
- **Mock API**: Chỉ có duy nhất một role `owner` gán cứng cho tài khoản `owner@dienlanh247.vn`.
- **Backend NestJS**: Sử dụng enum `UserRole` với 3 giá trị `CUSTOMER`, `ADMIN`, `SUPERADMIN`.

### 4.2. Vai trò sau khi chuẩn hóa
- Thêm vai trò **`STAFF`** vào cả backend (`UserRole` trong schema.prisma) lẫn mock-api.
- Đồng bộ vai trò `superadmin` của mock-api với `SUPERADMIN` của backend, `admin` với `ADMIN`, và `staff` with `STAFF`.
- Danh sách tài khoản mock trong `mock-api/utils/auth.js`:
  1. `owner@dienlanh247.vn` (password: `Admin@123`) — Role: `superadmin`
  2. `admin@dienlanh247.vn` (password: `Admin@456`) — Role: `admin`
  3. `staff@dienlanh247.vn` (password: `Staff@789`) — Role: `staff`

---

## 5. Bản đồ Quyền hạn (Permission Map)

Chúng tôi đã thiết lập bản đồ quyền hạn chi tiết dạng `"resource:action"` trong `mock-api/utils/auth.js`:

```javascript
const ROLE_PERMISSIONS = {
  superadmin: [
    'dashboard:read',
    'products:read', 'products:create', 'products:update', 'products:delete',
    'orders:read', 'orders:update',
    'customers:read', 'customers:update',
    'settings:read', 'settings:update',
    'serviceRequests:read', 'serviceRequests:update',
    'technicians:read', 'technicians:create', 'technicians:update', 'technicians:delete', 'technicians:assign',
    'adminUsers:manage'
  ],
  admin: [
    'dashboard:read',
    'products:read', 'products:create', 'products:update',
    'orders:read', 'orders:update',
    'customers:read',
    'settings:read',
    'serviceRequests:read', 'serviceRequests:update',
    'technicians:read', 'technicians:create', 'technicians:update', 'technicians:assign'
  ],
  staff: [
    'dashboard:read',
    'products:read',
    'orders:read', 'orders:update',
    'serviceRequests:read', 'serviceRequests:update',
    'technicians:read'
  ]
};
```

---

## 6. Danh sách endpoint admin đã áp dụng RBAC

### 6.1. Mock API (Cổng 3001)

| Endpoint | Method | Permission yêu cầu | SUPERADMIN | ADMIN | STAFF |
|---|---|---|---|---|---|
| `/api/v1/admin/dashboard` | GET | `dashboard:read` | ✅ | ✅ | ✅ |
| `/api/v1/admin/products` | GET | `products:read` | ✅ | ✅ | ✅ |
| `/api/v1/admin/products` | POST | `products:create` | ✅ | ✅ | ❌ (403) |
| `/api/v1/admin/products/:id` | PATCH | `products:update` | ✅ | ✅ | ❌ (403) |
| `/api/v1/admin/products/:id` | DELETE | `products:delete` | ✅ | ❌ (403) | ❌ (403) |
| `/api/v1/admin/orders` | GET | `orders:read` | ✅ | ✅ | ✅ |
| `/api/v1/admin/orders/:id` | GET | `orders:read` | ✅ | ✅ | ✅ |
| `/api/v1/admin/orders/:id/status` | PATCH | `orders:update` | ✅ | ✅ | ✅ |
| `/api/v1/admin/customers` | GET | `customers:read` | ✅ | ✅ | ❌ (403) |
| `/api/v1/admin/settings` | GET | `settings:read` | ✅ | ✅ | ❌ (403) |
| `/api/v1/admin/settings` | PATCH | `settings:update` | ✅ | ❌ (403) | ❌ (403) |
| `/api/v1/admin/service-requests` | GET | `serviceRequests:read` | ✅ | ✅ | ✅ |
| `/api/v1/admin/service-requests/:id` | GET | `serviceRequests:read` | ✅ | ✅ | ✅ |
| `/api/v1/admin/service-requests/:id/status` | PATCH | `serviceRequests:update` | ✅ | ✅ | ✅ |
| `/api/v1/admin/service-requests/:id/assign-technician` | PATCH | `technicians:assign` | ✅ | ✅ | ❌ (403) |
| `/api/v1/admin/technicians` | GET | `technicians:read` | ✅ | ✅ | ✅ |
| `/api/v1/admin/technicians` | POST | `technicians:create` | ✅ | ✅ | ❌ (403) |
| `/api/v1/admin/technicians/:id` | PATCH | `technicians:update` | ✅ | ✅ | ❌ (403) |
| `/api/v1/admin/technicians/:id/status` | PATCH | `technicians:update` | ✅ | ✅ | ❌ (403) |
| `/api/v1/admin/technicians/:id` | DELETE | `technicians:delete` | ✅ | ❌ (403) | ❌ (403) |

---

## 7. Cơ chế kiểm tra bảo mật ở Server-Side

### 7.1. Mock API
Middleware factory `requirePermission(permission)`:
1. Xác thực đăng nhập qua token cookie (trả về 401 nếu chưa đăng nhập hoặc session hết hạn).
2. Kiểm tra vai trò của admin (`req.admin.role`) có nằm trong danh sách quyền hạn hợp lệ đối với permission được khai báo hay không.
3. Nếu không có quyền -> trả về lỗi chuẩn:
   ```json
   { "success": false, "message": "Forbidden" }
   ```

### 7.2. Backend NestJS
Sử dụng bộ đôi `JwtAuthGuard` và `RolesGuard` cùng decorator `@Roles(...)`:
1. `JwtAuthGuard` xác thực token và trích xuất payload vào `req.user`.
2. `RolesGuard` so khớp metadata `roles` được thiết lập tại Controller / Handler với thuộc tính `user.role`.
3. Nếu thiếu quyền -> ném lỗi `ForbiddenException` trả về client định dạng:
   ```json
   { "success": false, "message": "Forbidden" }
   ```

---

## 8. Trạng thái Prisma Generate & DB Migration

- **Trạng thái `prisma generate`**: **Thành công**. Prisma Client đã được tạo lại tại thư mục `node_modules` và ghi nhận đầy đủ vai trò `STAFF` trong enum `UserRole`.
- **Đồng bộ hóa Database thật**: Plan 8 tập trung phát triển và kiểm tra bảo mật trên mock-api và build thử backend, do đó chưa có kết nối database thật. Khi triển khai production, cần chạy:
  ```bash
  npx prisma migrate dev --name add_staff_role
  ```
  để cập nhật kiểu dữ liệu cột `role` trong bảng `User` của MySQL thật.

---

## 9. Kết quả Test Bảo mật RBAC (test_plan8_rbac.js)

Chúng tôi đã viết kịch bản test tự động bao quát **47 trường hợp kiểm thử** độc lập:

1. **Chưa đăng nhập**:
   - Gọi toàn bộ 12 endpoints admin mẫu -> trả về **401 Unauthorized** (Thành công).
2. **Vai trò STAFF**:
   - Truy cập dashboard, danh sách sản phẩm, danh sách đơn hàng, danh sách yêu cầu dịch vụ -> **200 OK** (Thành công).
   - Thêm sản phẩm mới, xóa sản phẩm, truy cập cấu hình cài đặt hệ thống, danh sách khách hàng, quản lý kỹ thuật viên -> chặn đứng trả về **403 Forbidden** (Thành công).
3. **Vai trò ADMIN**:
   - Truy cập dashboard, sản phẩm, đơn hàng, khách hàng, cấu hình -> **200 OK** (Thành công).
   - Sửa cài đặt hệ thống, xóa sản phẩm, xóa kỹ thuật viên -> chặn đứng trả về **403 Forbidden** (Thành công).
4. **Vai trò SUPERADMIN**:
   - Toàn quyền thực thi tất cả hành động nguy hiểm (sửa cấu hình hệ thống, xóa sản phẩm, xóa kỹ thuật viên,...) -> **200 OK** (Thành công).
5. **Session/Token sai**:
   - Sử dụng token rác -> trả về **401 Unauthorized** (Thành công).
6. **Vai trò không hợp lệ**:
   - Gọi API admin bằng tài khoản không có quyền hợp lệ -> chặn đứng với mã lỗi **403** (Thành công).

---

## 10. Kết quả các lệnh kiểm thử & Build tự động

Tất cả các khâu kiểm thử tĩnh, linting và build bundle đều vượt qua thành công:

| Lệnh | Trạng thái |
|---|---|
| `npm run check:all` | **✅ PASS** |
| `npm run test:mock` | **✅ PASS** |
| `npm --prefix backend run build` | **✅ PASS** |
| `npm --prefix frontend-admin run build` | **✅ PASS** |
| `npm --prefix frontend-user run build` | **✅ PASS** |

- **Không ảnh hưởng tới Public API**: Các API `/api/v1/health` and `/api/v1/products` của người dùng thông thường vẫn mở hoàn toàn cho khách hàng vãng lai.
- **Frontend User Build**: Đạt kết quả build sạch không lỗi.

---

## 11. Rủi ro còn lại
- **Revocation**: Hiện tại khi phân quyền bị thay đổi trực tiếp, token cookie cũ đã cấp phát cho phiên đăng nhập trước đó vẫn tồn tại đến khi hết hạn (30 phút). Để hardening triệt để, ở các pha sau cần lưu token blacklist hoặc kiểm tra trạng thái quyền trực tiếp từ database ở mỗi request quan trọng.

---

## 12. Đề xuất Plan 9 tiếp theo: CORS HARDENING
Mục tiêu: Làm cứng cấu hình CORS của cả Backend và Mock API để ngăn chặn tấn công giả mạo yêu cầu từ trang web lạ (Cross-Origin Resource Sharing Protection), giới hạn chặt chẽ origin được phép truy xuất cookie HttpOnly.
