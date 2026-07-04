# HANDOVER ADMIN SECURITY PLAN 7 — BÁO CÁO BẢO VỆ API ADMIN MIDDLEWARE

## 1. Thông tin nhánh & Commit gốc
- **Branch đang làm việc**: `security/admin-phase-7-admin-api-auth`
- **Commit gốc (Plan 6)**: `703ee99` (protect frontend admin routes)

---

## 2. Các file đã kiểm tra

| File | Nhận xét |
|---|---|
| `mock-api/utils/auth.js` | Middleware `requireAdminAuth` — đọc cookie, kiểm tra session, gắn `req.admin` |
| `mock-api/server.js` | Đăng ký router và khai báo endpoint auth public |
| `mock-api/routes/adminDashboard.js` | Route `/admin/dashboard` |
| `mock-api/routes/adminProducts.js` | Route `/admin/products` |
| `mock-api/routes/adminCustomers.js` | Route `/admin/customers` |
| `mock-api/routes/adminSettings.js` | Route `/admin/settings` |
| `mock-api/routes/serviceRequests.js` | Route `/admin/service-requests` |
| `mock-api/routes/technicians.js` | Route `/admin/technicians` |
| `mock-api/routes/orders.js` | Route `/admin/orders` |
| `backend/src/common/guards/jwt-auth.guard.ts` | Guard NestJS xác thực JWT |
| `backend/src/common/guards/roles.guard.ts` | Guard NestJS kiểm tra quyền RBAC |
| `backend/src/modules/auth/strategies/jwt.strategy.ts` | Passport JWT Strategy (cookie + bearer) |
| `backend/src/modules/auth/admin-auth.controller.ts` | Controller auth admin |
| `backend/src/modules/dashboard/dashboard.controller.ts` | Controller dashboard |
| `backend/src/modules/products/products.controller.ts` | Controller products |
| `backend/src/modules/orders/orders.controller.ts` | Controller orders |
| `backend/src/modules/customers/customers.controller.ts` | Controller customers |
| `backend/src/modules/settings/settings.controller.ts` | Controller settings |
| `backend/src/modules/technicians/technicians.controller.ts` | Controller technicians |
| `backend/src/modules/service-requests/service-requests.controller.ts` | Controller service-requests |
| `backend/src/main.ts` | CORS, cookie-parser, global prefix |
| `frontend-admin/src/services/api.ts` | Axios config + 401 interceptor |

---

## 3. Các file đã sửa đổi

| File | Thay đổi chính |
|---|---|
| `mock-api/utils/auth.js` | 1) Strip trường `password` khỏi `req.admin` (trước đây expose password sang route handler). 2) Chuẩn hóa tất cả 401 responses thành `{ success: false, message: "Unauthorized" }` |
| `backend/src/common/guards/jwt-auth.guard.ts` | Chuẩn hóa 401 body: `{ success: false, message: "Unauthorized" }` |
| `backend/src/common/guards/roles.guard.ts` | Throw `ForbiddenException({ success: false, message: "Forbidden" })` thay vì `return false` |

---

## 4. Danh sách Endpoint Admin đã kiểm tra & Bảo vệ

### Mock API (port 3001)
| Endpoint | Phương thức | Đã bảo vệ | Middleware |
|---|---|---|---|
| `/api/v1/admin/auth/login` | POST | ❌ Public (đúng vậy) | Không cần |
| `/api/v1/admin/auth/me` | GET | ✅ Có | `requireAdminAuth` |
| `/api/v1/admin/auth/logout` | POST | ✅ Có (token từ cookie) | Manual token check |
| `/api/v1/admin/dashboard` | GET | ✅ Có | `requireAdminAuth` |
| `/api/v1/admin/products` | GET | ✅ Có | `requireAdminAuth` |
| `/api/v1/admin/products` | POST | ✅ Có | `requireAdminAuth` |
| `/api/v1/admin/products/:id` | PATCH | ✅ Có | `requireAdminAuth` |
| `/api/v1/admin/products/:id` | DELETE | ✅ Có | `requireAdminAuth` |
| `/api/v1/admin/orders` | GET | ✅ Có | `requireAdminAuth` |
| `/api/v1/admin/orders/:id` | GET | ✅ Có | `requireAdminAuth` |
| `/api/v1/admin/orders/:id/status` | PATCH | ✅ Có | `requireAdminAuth` |
| `/api/v1/admin/customers` | GET | ✅ Có | `requireAdminAuth` |
| `/api/v1/admin/settings` | GET | ✅ Có | `requireAdminAuth` |
| `/api/v1/admin/settings` | PATCH | ✅ Có | `requireAdminAuth` |
| `/api/v1/admin/service-requests` | GET | ✅ Có | `requireAdminAuth` |
| `/api/v1/admin/service-requests/:id` | GET | ✅ Có | `requireAdminAuth` |
| `/api/v1/admin/service-requests/:id/status` | PATCH | ✅ Có | `requireAdminAuth` |
| `/api/v1/admin/service-requests/:id/assign-technician` | PATCH | ✅ Có | `requireAdminAuth` |
| `/api/v1/admin/technicians` | GET | ✅ Có | `requireAdminAuth` |
| `/api/v1/admin/technicians` | POST | ✅ Có | `requireAdminAuth` |
| `/api/v1/admin/technicians/:id` | GET | ✅ Có | `requireAdminAuth` |
| `/api/v1/admin/technicians/:id` | PATCH | ✅ Có | `requireAdminAuth` |
| `/api/v1/admin/technicians/:id/status` | PATCH | ✅ Có | `requireAdminAuth` |
| `/api/v1/admin/technicians/:id` | DELETE | ✅ Có | `requireAdminAuth` |

### NestJS Backend (port 3000)
| Controller | Bảo vệ tầng | Guard dùng |
|---|---|---|
| `AdminAuthController` | Phương thức `/me`, `/logout` | `JwtAuthGuard + RolesGuard` |
| `DashboardController` | Class-level | `JwtAuthGuard + RolesGuard` |
| `ProductsController` | Phương thức (admin routes) | `JwtAuthGuard + RolesGuard` |
| `OrdersController` | Phương thức (admin routes) | `JwtAuthGuard + RolesGuard` |
| `CustomersController` | Class-level | `JwtAuthGuard + RolesGuard` |
| `SettingsController` | Phương thức (admin routes) | `JwtAuthGuard + RolesGuard` |
| `TechniciansController` | Class-level | `JwtAuthGuard + RolesGuard` |
| `ServiceRequestsController` | Phương thức (admin routes) | `JwtAuthGuard + RolesGuard` |

---

## 5. Cơ chế Middleware & Guard

### 5.1. Mock API — `requireAdminAuth`
1. Đọc token theo thứ tự ưu tiên: **Cookie HttpOnly `accessToken`** → Bearer Token header (dự phòng cho testing).
2. Tìm session trong danh sách `adminSessions` (in-memory).
3. Kiểm tra thời gian hết hạn session (`session.expiresAt`).
4. Nếu hợp lệ → gắn `req.admin` (đã loại bỏ trường `password`).
5. Nếu không hợp lệ → trả `401 { success: false, message: "Unauthorized" }`.

### 5.2. NestJS Backend — `JwtAuthGuard + RolesGuard`
1. `JwtStrategy` trích xuất token từ cookie `accessToken` hoặc `Authorization: Bearer <token>`.
2. Giải mã JWT bằng `JWT_ACCESS_SECRET` (fail-fast nếu thiếu env).
3. Gắn `req.user = { userId, email, role }`.
4. `RolesGuard` kiểm tra `user.role` so với danh sách yêu cầu (`ADMIN`, `SUPERADMIN`).
5. Không đủ quyền → throw `ForbiddenException({ success: false, message: "Forbidden" })`.

### 5.3. Frontend API Client
- Axios cấu hình `withCredentials: true` — trình duyệt tự gửi cookie `accessToken` HttpOnly.
- Response interceptor bắt lỗi `401` → gọi `clearAuth()` → redirect về `/login`.
- Không gửi token từ localStorage, không đọc `accessToken` bằng JavaScript.

---

## 6. Kết quả Test Bảo mật API (Mock API port 3001)

Script test: `brain/scratch/test_plan7_admin_api_auth.js` (không commit vào repo)

| Phase | Nội dung | Kết quả |
|---|---|---|
| Phase 1 | 14 endpoints admin gọi không có credentials → 401 | ✅ ALL PASS |
| Phase 2 | `GET /api/v1/health` (public) → 200 | ✅ PASS |
| Phase 3 | `GET /api/v1/products` (public) → 200 | ✅ PASS |
| Phase 4 | Login đúng credentials → 200 + cookie `accessToken` | ✅ PASS |
| Phase 5 | 8 endpoints admin gọi với cookie hợp lệ → 200 | ✅ ALL PASS |
| Phase 6 | Gọi API với cookie sai (`invalid_token_xyz_badcookie`) → 401 | ✅ PASS |
| Phase 7 | Logout xong gọi `/admin/dashboard` → 401 | ✅ PASS |

**🎉 ALL PLAN 7 TESTS PASSED**

---

## 7. Kết quả localStorage Audit Frontend Admin

- **accessToken**: 🚫 Không có trong localStorage.
- **refreshToken**: 🚫 Không có trong localStorage.
- **password / passwordHash**: 🚫 Tuyệt đối không có.
- **Khi 401**: `clearAuth()` xóa sạch `dl247_admin_user` và `dl247_admin_expires_at`.

---

## 8. Kết quả các lệnh kiểm thử & Build tự động

| Lệnh | Kết quả |
|---|---|
| `npm run check:all` | ✅ PASS |
| `npm run test:mock` | ✅ PASS |
| `npm --prefix backend run build` | ✅ PASS |
| `npm --prefix frontend-admin run build` | ✅ PASS |
| `npm --prefix frontend-user run build` | ✅ PASS |

---

## 9. Rủi ro còn lại & Lưu ý

> [!WARNING]
> **Plan 7 bảo vệ ở tầng API server. Plan 6 bảo vệ ở tầng frontend route.** Cả hai layer đều cần thiết và bổ trợ nhau.

- **Mock API dùng in-memory session**: Khi restart server, toàn bộ session mất. Đây là hạn chế của mock-api (không phải production backend).
- **Backend NestJS chưa kết nối Prisma/database thật**: Guard và strategy đã kiểm tra JWT đúng cách, nhưng các tính năng phụ thuộc database (invalidate token, revoke session) chưa hoạt động trong môi trường mock.
- **RBAC chi tiết chưa hoàn thiện**: Hiện tại chỉ kiểm tra `ADMIN | SUPERADMIN`. Phân quyền theo hành động cụ thể (read/write/delete theo module) sẽ làm ở Plan 8.

---

## 10. Đề xuất Plan 8: RBAC / Permission Map

**Plan 8** cần triển khai:
- Phân quyền chi tiết theo từng hành động và module (Permission Matrix).
- Ví dụ: Một role `manager` chỉ xem được orders nhưng không delete products.
- Cập nhật `RolesGuard` hoặc tạo `PermissionsGuard` riêng.
- Cập nhật mock-api để hỗ trợ các role phụ (nếu cần test RBAC mà không cần backend thật).
