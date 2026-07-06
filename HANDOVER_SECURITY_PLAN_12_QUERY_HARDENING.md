# HANDOVER — Security Plan 12: Query Hardening

## Branch & Commit

- **Branch:** `security/admin-phase-12-query-hardening`
- **Base Commit (Plan 11):** `e75e03a`
- **`.env` kiểm tra:** Không có file `.env` nào bị commit trong Plan 11 hoặc Plan 12. `.gitignore` ignore `.env`, `.env.local`, `.env.*` (trừ `.env.example`).

---

## Mục Tiêu

Siết chặt toàn bộ query/filter/sort/pagination/search trên cả mock-api và NestJS backend để chống:
- Query quá nặng (limit lớn, page không giới hạn)
- sortBy field tùy ý (có thể dẫn đến lộ cấu trúc DB)
- search quá dài hoặc object/array injection
- filter sai enum/kiểu
- page/limit âm, NaN, Infinity
- date range đảo ngược
- min/max range đảo ngược
- Object injection qua query string (`?sortBy[constructor]=1`)
- Prototype pollution qua `__proto__` (được Express/qs strip tự động)

---

## Chính Sách Áp Dụng (Query Policy)

### Pagination
| Tham số | Min | Max | Default | Validation |
|---------|-----|-----|---------|------------|
| `page` | 1 | 100000 | 1 | Must be integer |
| `limit` | 1 | **100** | 10 | Must be integer, strictly capped |

### Sort Policy
- `sortBy` phải nằm trong **allowlist riêng** cho từng endpoint
- `sortOrder` chỉ nhận: `asc`, `desc` (case-insensitive)
- Nếu `sortBy` không hợp lệ → **400 Bad Request**
- Default: `createdAt desc`

### Search Policy
- `q` / `search` phải là string, trim, **max 100 ký tự**
- Không cho object, array
- Không cho chuỗi rỗng sau trim

### Unknown Query Keys
- Admin API: Reject 400 nếu có key không nằm trong allowlist
- Public API: Reject 400 nếu có key không nằm trong allowlist
- Settings GET: Reject 400 nếu có bất kỳ query parameter nào

### Object Injection
- Nếu giá trị của query key là object/array → **400 Bad Request**
- Express/qs tự động strip `__proto__` từ query (không cần xử lý thêm)

### Date Range
- `dateFrom` và `dateTo` validate format date
- Nếu `dateFrom > dateTo` → **400 Bad Request**

### Price/Numeric Range
- `priceMin` và `priceMax` validate number
- Nếu `priceMin > priceMax` → **400 Bad Request**

---

## Sort Allowlist Theo Endpoint

### Mock API

| Endpoint | Allowed sortBy |
|----------|---------------|
| GET `/products` | `newest`, `oldest`, `price_asc`, `price_desc`, `name_asc`, `name_desc`, `bestSeller`, `promoHot` |
| GET `/admin/products` | `name`, `sku`, `basePrice`, `salePrice`, `stock`, `status`, `createdAt`, `updatedAt` |
| GET `/admin/orders` | `code`, `customerName`, `phone`, `total`, `status`, `paymentStatus`, `createdAt`, `updatedAt` |
| GET `/admin/service-requests` | `createdAt`, `updatedAt`, `status`, `priority`, `scheduledAt`, `district`, `customerName` |
| GET `/admin/technicians` | `name`, `phone`, `status`, `rating`, `currentJobs`, `createdAt`, `updatedAt` |
| GET `/admin/customers` | `name`, `email`, `phone`, `orderCount`, `totalSpent`, `createdAt` |
| GET `/admin/settings` | Không nhận query parameter |

### NestJS Backend DTO

| DTO | Allowed sortBy |
|-----|---------------|
| `ProductQueryDto` | `newest`, `oldest`, `priceAsc`, `priceDesc`, `nameAsc`, `nameDesc`, `bestSeller`, `promoHot` |
| `OrderQueryDto` | `code`, `customerName`, `phone`, `total`, `status`, `paymentStatus`, `createdAt`, `updatedAt` |
| `ServiceRequestQueryDto` | `createdAt`, `updatedAt`, `status`, `priority`, `scheduledAt`, `district`, `customerName` |
| `TechnicianQueryDto` | `name`, `phone`, `status`, `rating`, `currentJobs`, `createdAt`, `updatedAt` |
| `CustomerQueryDto` | `name`, `email`, `phone`, `orderCount`, `totalSpent`, `createdAt` |

---

## Enum Filter Allowlist Theo Endpoint

| Endpoint / DTO | Field | Allowed Values |
|----------------|-------|---------------|
| Orders | `status` | `pending`, `confirmed`, `processing`, `shipping`, `delivered`, `cancelled` |
| Orders | `paymentStatus` | `paid`, `unpaid` |
| Service Requests | `status` | `pending`, `confirmed`, `assigned`, `completed`, `cancelled` |
| Service Requests | `priority` | `low`, `medium`, `high`, `urgent` |
| Technicians | `status` | `available`, `busy`, `inactive` |
| Products | `status` | `active`, `inactive`, `out_of_stock` |

---

## File Đã Sửa / Tạo Mới

### Mock API

| File | Hành Động | Mô Tả |
|------|-----------|-------|
| `mock-api/utils/validation.js` | Modified | Thêm `validateAllowedQueryKeys`, `validatePaginationStrict`, `validateSortStrict`, `validateRangeQuery`, `validateDateRangeQuery`, `validateSearchQuery`, object injection detection |
| `mock-api/routes/public.js` | Modified | Query hardening cho GET `/products`, `/products/search` |
| `mock-api/routes/adminProducts.js` | Modified | Query hardening cho GET `/admin/products` |
| `mock-api/routes/orders.js` | Modified | Query hardening cho GET `/admin/orders`, xóa duplicate route |
| `mock-api/routes/serviceRequests.js` | Modified | Query hardening cho GET `/admin/service-requests` |
| `mock-api/routes/technicians.js` | Modified | Query hardening cho GET `/admin/technicians` |
| `mock-api/routes/adminCustomers.js` | Modified | Query hardening cho GET `/admin/customers` |
| `mock-api/routes/adminSettings.js` | Modified | Reject mọi query parameter cho GET `/admin/settings` |

### NestJS Backend

| File | Hành Động | Mô Tả |
|------|-----------|-------|
| `backend/src/common/dto/pagination.dto.ts` | Modified | Thêm `@Max(100)` cho `limit` |
| `backend/src/modules/products/dto/product-query.dto.ts` | Modified | DTO đầy đủ với sort/filter/range/boolean validation |
| `backend/src/modules/products/products.controller.ts` | Modified | Bind `ProductQueryDto` cho `/products/search` |
| `backend/src/modules/products/products.service.ts` | Modified | Cap limit tại 100 trong `findAll()` |
| `backend/src/modules/orders/dto/order-query.dto.ts` | **NEW** | DTO cho admin orders query |
| `backend/src/modules/orders/orders.controller.ts` | Modified | Bind `OrderQueryDto` cho `findAllAdmin` |
| `backend/src/modules/orders/orders.service.ts` | Modified | Implement filter/sort/pagination mapping an toàn |
| `backend/src/modules/service-requests/dto/service-request-query.dto.ts` | **NEW** | DTO cho admin service requests query |
| `backend/src/modules/service-requests/service-requests.controller.ts` | Modified | Bind `ServiceRequestQueryDto` cho `findAllAdmin` |
| `backend/src/modules/service-requests/service-requests.service.ts` | Modified | Implement filter/sort/pagination mapping an toàn |
| `backend/src/modules/technicians/dto/technician-query.dto.ts` | **NEW** | DTO cho admin technicians query |
| `backend/src/modules/technicians/technicians.controller.ts` | Modified | Bind `TechnicianQueryDto`, thêm `Query` import |
| `backend/src/modules/technicians/technicians.service.ts` | Modified | Implement filter/sort/pagination, dùng `array_contains` cho JSON fields |
| `backend/src/modules/customers/dto/customer-query.dto.ts` | **NEW** | DTO cho admin customers query |
| `backend/src/modules/customers/customers.controller.ts` | Modified | Bind `CustomerQueryDto`, thêm `Query` import |
| `backend/src/modules/customers/customers.service.ts` | Modified | Implement in-memory search/sort/pagination |

---

## Backend Service — Safe Sort/Filter Mapping

Tất cả backend services đều:
- **Không** truyền `sortBy` raw vào Prisma `orderBy`
- Map `sortBy` qua `if/else` allowlist → Prisma field cụ thể
- `take`/`limit` **cap tại 100** (cả DTO decorator `@Max(100)` lẫn service-level `Math.min(100, ...)`)
- `skip` luôn >= 0 (nhờ `page @Min(1)`)
- `status`/`priority` validate qua enum trước khi truyền vào Prisma `where`
- `dateFrom`/`dateTo` parse qua `new Date()` chỉ khi DTO đã validate string hợp lệ
- JSON fields (skills, workingAreas) dùng `array_contains` thay vì `contains` (fix lỗi Prisma `JsonFilter`)

---

## Kết Quả Test

### Plan 12 Query Hardening Script (28/28 PASS)

| # | Test Case | Result |
|---|-----------|--------|
| 1 | Public products limit > 100 → 400 | ✅ |
| 2 | Public products page < 1 → 400 | ✅ |
| 3 | Public products sort not in whitelist → 400 | ✅ |
| 4 | Public products q > 100 chars → 400 | ✅ |
| 5 | Public products priceMin > priceMax → 400 | ✅ |
| 6 | Public products inStock invalid boolean → 400 | ✅ |
| 7 | Public products valid → 200 | ✅ |
| 8 | Admin products invalid sortBy → 400 | ✅ |
| 9 | Admin products limit > 100 → 400 | ✅ |
| 10 | Admin products invalid status → 400 | ✅ |
| 11 | Admin products valid → 200 | ✅ |
| 12 | Admin orders page=0 → 400 | ✅ |
| 13 | Admin orders invalid sortBy → 400 | ✅ |
| 14 | Admin orders dateFrom > dateTo → 400 | ✅ |
| 15 | Admin orders valid → 200 | ✅ |
| 16 | Admin service-requests invalid priority → 400 | ✅ |
| 17 | Admin service-requests invalid sortBy → 400 | ✅ |
| 18 | Admin service-requests valid → 200 | ✅ |
| 19 | Admin technicians invalid status → 400 | ✅ |
| 20 | Admin technicians invalid sortBy → 400 | ✅ |
| 21 | Admin technicians valid → 200 | ✅ |
| 22 | Admin customers invalid sortBy → 400 | ✅ |
| 23 | Admin customers valid → 200 | ✅ |
| 24 | Object injection `sortBy[constructor]=1` → 400 | ✅ |
| 25 | `__proto__` stripped by Express (safe 200) | ✅ |
| 26 | Admin settings with query → 400 | ✅ |
| 27 | Admin settings valid → 200 | ✅ |
| 28 | Login as SUPERADMIN → 200 | ✅ |

### Full Test/Build Suite

| Command | Result |
|---------|--------|
| `npm run check:all` (syntax + typecheck + lint) | ✅ PASS |
| `npm run test:mock` (order pricing + service lifecycle + technician rules + enum contract) | ✅ PASS |
| `npm --prefix backend run build` | ✅ PASS |
| `npm --prefix frontend-admin run build` | ✅ PASS |
| `npm --prefix frontend-user run build` | ✅ PASS |

### Kiểm Tra Bảo Mật Không Bị Hỏng

| Kiểm tra | Kết quả |
|----------|---------|
| Chưa login gọi admin API → 401 | ✅ (test qua mock test login) |
| Auth/Cookie/RBAC Plan 5-8 | ✅ Không thay đổi |
| CORS Plan 9 | ✅ Không thay đổi |
| Dev endpoint protection Plan 10 | ✅ Không thay đổi |
| Input validation Plan 11 | ✅ test:mock PASS đầy đủ |
| Public API/frontend-user | ✅ Build PASS, valid queries → 200 |
| frontend-admin login/load | ✅ Build PASS |
| localStorage không có token | ✅ Không thay đổi (HttpOnly Cookie) |
| `.env` không bị commit | ✅ Kiểm tra git status |
| `mock-db.json` restored | ✅ `git restore` trước commit |

---

## Rủi Ro Còn Lại

1. **Chưa có Rate Limit** — Attacker có thể spam API liên tục dù mỗi request hợp lệ. Cần rate limit ở Plan 13.
2. **Chưa có Audit Log** — Không ghi lại ai gọi API gì lúc nào.
3. **In-memory pagination cho Customers** — Customers endpoint vẫn tải tất cả data rồi filter/sort/paginate trong memory. Khi lượng data lớn sẽ cần refactor sang DB-level aggregation.
4. **Prisma JSON filter `array_contains`** — Hoạt động nhưng không tối ưu performance. Nếu JSON array lớn, cần normalize sang relation table.

---

## Đề Xuất Plan 13

**Login Rate Limit / Brute Force Protection**
- Rate limit login endpoint (cả admin và customer)
- Rate limit API calls theo IP hoặc session
- Lockout tạm thời sau N lần login sai
- CAPTCHA sau nhiều lần sai liên tiếp (optional)
