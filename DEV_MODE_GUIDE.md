# Hướng dẫn chạy Mock và Nest tách biệt

## Quy tắc release

- Release mặc định: `SERVICE_ONLY=true`.
- Mock chạy cổng `3001`; Nest chạy cổng `3000`.
- User chạy cổng `5173`; Admin chạy cổng `5174`.
- Không dùng một script `dev:all` mơ hồ.
- Không commit `.env.local` hoặc secret.
- Không xóa dữ liệu commerce; feature flag chỉ đóng bề mặt runtime.

## Cài đặt

```bash
npm install
npm --prefix frontend-user install
npm --prefix frontend-admin install
npm --prefix mock-api install
npm --prefix backend install
```

Nest cần database và Prisma được cấu hình theo `backend/.env.example`. Mock chỉ cần file JSON có sẵn.

## Mode A — Mock API

Một lệnh duy nhất:

```bash
npm run dev:mock:all
```

Kết quả mong đợi:

| Process | URL |
| --- | --- |
| Mock API | `http://localhost:3001/api/v1` |
| User | `http://localhost:5173` |
| Admin | `http://localhost:5174` |

Banner development phải hiện `MOCK · SERVICE ONLY · http://localhost:3001/api/v1`. Header API trả `X-DL247-Backend: MOCK` và `X-DL247-Service-Only: true`.

Kiểm tra:

```bash
curl -i http://localhost:3001/api/v1/health
curl -i http://localhost:3001/api/v1/service-categories
curl -i http://localhost:3001/api/v1/products
```

Hai lệnh đầu trả `200`; endpoint commerce cuối trả `404 FEATURE_DISABLED`.

## Mode B — NestJS thật

Chuẩn bị `backend/.env`, database và Prisma, sau đó:

```bash
npm run dev:real:all
```

Kết quả mong đợi:

| Process | URL |
| --- | --- |
| Nest API | `http://localhost:3000/api/v1` |
| User | `http://localhost:5173` |
| Admin | `http://localhost:5174` |

Banner development phải hiện `REAL · SERVICE ONLY · http://localhost:3000/api/v1`. Header API trả `X-DL247-Backend: REAL` và `X-DL247-Service-Only: true`. Không frontend nào được gửi request tới cổng `3001` trong mode này.

## Chạy từng process

```bash
# API
npm run dev:mock
npm run dev:real

# Chỉ kiểm tra rollback commerce, không dùng cho release mặc định
npm run dev:mock:rollback

# Frontend trỏ Mock
VITE_BACKEND_MODE=MOCK VITE_SERVICE_ONLY=true VITE_API_BASE_URL=http://localhost:3001/api/v1 npm run dev:user
VITE_BACKEND_MODE=MOCK VITE_SERVICE_ONLY=true VITE_API_BASE_URL=http://localhost:3001/api/v1 npm run dev:admin

# Frontend trỏ Nest
VITE_BACKEND_MODE=REAL VITE_SERVICE_ONLY=true VITE_API_BASE_URL=http://localhost:3000/api/v1 npm run dev:user
VITE_BACKEND_MODE=REAL VITE_SERVICE_ONLY=true VITE_API_BASE_URL=http://localhost:3000/api/v1 npm run dev:admin
```

## Production build

`VITE_API_BASE_URL` là bắt buộc; Vite chủ động fail nếu thiếu. Production không có localhost fallback.

```bash
VITE_API_BASE_URL=https://api.example.com/api/v1 VITE_BACKEND_MODE=REAL VITE_SERVICE_ONLY=true npm run build:user
VITE_API_BASE_URL=https://api.example.com/api/v1 VITE_BACKEND_MODE=REAL VITE_SERVICE_ONLY=true npm run build:admin
npm --prefix backend run build
```

## Tài khoản local

Không có credential mặc định trong source runtime. Sao chép `mock-api/.env.example` thành `mock-api/.env`, sau đó dùng đúng `DEMO_ADMIN_EMAIL`/`DEMO_ADMIN_PASSWORD` trong file này. Demo account chỉ tồn tại khi `ENABLE_DEMO_ACCOUNTS=true` và không bao giờ tồn tại trong production.

Nest local demo seed dùng cùng tên biến. Khi demo bị tắt, seed bắt buộc dùng `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD` do người vận hành tự cấp.

## Quality gate

```bash
npm run check:all
npm run test:service-only
# Regression commerce: chạy dev:mock:rollback ở terminal khác trước khi chạy test:mock
npm run test:mock
VITE_API_BASE_URL=https://api.example.com/api/v1 VITE_BACKEND_MODE=REAL VITE_SERVICE_ONLY=true npm run build:all
npm --prefix backend run build
```

Nếu backend baseline fail vì dependency/database chưa sẵn sàng, phải ghi rõ là lỗi baseline/môi trường; không quy lỗi đó cho thay đổi feature flag.

## Stage 1 service-only Admin verification

The Admin navigation and production bundle no longer include Products or Orders. Commerce data remains in the database solely for rollback/migration and is not queried by the active Dashboard or Customers services.

After building Admin, verify old URLs (`#/products`, `#/products/new`, `#/orders`, `#/orders/<id>`) redirect to `#/` and show the retirement notice. Verify `frontend-admin/dist/assets` contains no Products/Orders chunks.

### Service-only surface gate

Run `npm run test:service-surface` before merging. The Mock check exercises active service endpoints and retired ecommerce URLs (including mutations). The Nest scope check verifies commerce modules are lazy and absent from the service-only module graph while legacy Prisma tables remain intact.

## Stage 2 authentication source of truth

### Mock Admin

1. Copy `mock-api/.env.example` to `mock-api/.env`.
2. Start with `npm --prefix mock-api run dev`; the script loads only that `.env` via Node `--env-file-if-exists`.
3. Demo credentials use `DEMO_ADMIN_EMAIL` and `DEMO_ADMIN_PASSWORD`. They exist only when `NODE_ENV` is not `production` and `ENABLE_DEMO_ACCOUNTS=true`.
4. Admin UI shows the autofill box only in a Vite development build with `VITE_ENABLE_DEMO_ACCOUNTS=true`, and obtains the values from `GET /dev/demo-credentials`. It does not embed passwords in its source or production bundle.

When the demo flag is false, the endpoint returns 404 and the Mock demo user registry is empty.

### Nest Admin seed

For an explicitly enabled local demo seed, Nest uses the same `DEMO_ADMIN_EMAIL`/`DEMO_ADMIN_PASSWORD` names. Non-demo environments require `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD`; no production password has a source-code default.

### Isolated sessions and refresh

Customer cookies are `customer_access` and `customer_refresh`; Admin cookies are `admin_access` and `admin_refresh`. JWTs carry `aud=customer` or `aud=admin`, and the strategy rejects a token whose audience does not match the requested surface. Admin 401 recovery uses one shared in-flight request to `POST /admin/auth/refresh`, retries each original request at most once, and clears the Admin session without touching Customer cookies if refresh fails.

### Session bootstrap và phân quyền Admin

Khi khởi động, cả hai frontend giữ trạng thái xác thực ở `unknown/loading` và gọi `GET /auth/me` hoặc `GET /admin/auth/me` trước khi render router. Profile trong `localStorage` chỉ là cache hiển thị; cookie server mới quyết định phiên hợp lệ. Khi bootstrap/refresh nhận 401, frontend xóa profile cache và query cache nhạy cảm rồi chuyển sang `anonymous`.

Ma trận quyền của cổng Admin:

| Role | Quyền chính |
| --- | --- |
| `STAFF` | Xem dashboard, hàng đợi/yêu cầu và kỹ thuật viên; cập nhật các bước xử lý được controller cho phép |
| `ADMIN` | Toàn bộ quyền STAFF, xem khách hàng/tài chính, phân công yêu cầu và quản lý kỹ thuật viên |
| `SUPERADMIN` | Toàn bộ quyền ADMIN, cấu hình, điều chỉnh/quyết toán tài chính, audit, xóa kỹ thuật viên và quản trị đặc quyền |

Frontend dùng permission literals để ẩn route/menu/action, nhưng backend luôn là lớp quyết định cuối. `RolesGuard` đọc lại role và trạng thái active từ database cho mỗi request được bảo vệ, vì vậy thay đổi role hoặc vô hiệu hóa tài khoản không chờ access token cũ hết hạn.

## Stage 3 ownership và OTP local

Chạy `npm run test:service-contract` để kiểm tra cách ly ownership giữa hai customer, guest booking không tự liên kết theo số điện thoại, lookup token chỉ dùng được cho một request và DTO guest không lộ PII. Test tự đặt `LOOKUP_TEST_OTP`; endpoint không bao giờ trả OTP trong response. Production phải cấu hình `OTP_DELIVERY_WEBHOOK_URL`, `OTP_DELIVERY_WEBHOOK_SECRET` và `LOOKUP_TOKEN_PEPPER` riêng; `LOOKUP_TEST_OTP` bị bỏ qua khi `NODE_ENV=production`.

Chạy `npm run test:list-contract` để kiểm tra trang cuối với 35 yêu cầu/15 kỹ thuật viên, tìm kiếm server-side, `meta.total/totalPages`, và ranh giới ngày tạo 23:30/00:30 theo múi giờ Việt Nam. UI Admin không được tính KPI hoặc tổng kết bằng `data.length` của một trang.

Chạy `npm run test:quote-contract` để kiểm tra inspection không thể giả mạo xác nhận khách, ownership khi duyệt, version supersede, completion bắt buộc đúng approval mới nhất và thu tiền qua payment entry riêng. Không gửi `paymentStatus` trong payload hoàn thành.
