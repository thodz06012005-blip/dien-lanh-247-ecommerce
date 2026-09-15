# HANDOVER TO NEW ANTIGRAVITY — ĐIỆN LẠNH 247 ECOMMERCE

## 1. Thông tin tổng quan dự án

- **Tên dự án**: Điện Lạnh 247 Ecommerce Platform
- **Repo GitHub**: https://github.com/thodz06012005-blip/dien-lanh-247-ecommerce
- **Local path**: `C:\Users\Admin\.gemini\antigravity\scratch\ecommerce-platform`
- **Mục tiêu**: Xây dựng hệ thống web bán hàng và dịch vụ điện lạnh gồm frontend-user, frontend-admin, mock-api và backend NestJS/Prisma.
- **Trạng thái hiện tại**: Đang ở giai đoạn production preparation / audit fix theo từng PR nhỏ, không làm redesign lớn.

---

## 2. Cấu trúc chính

| Thư mục | Mô tả |
|---|---|
| `frontend-user` | Giao diện khách hàng — React + Vite + Tailwind |
| `frontend-admin` | Giao diện quản trị — React + Vite + Tailwind |
| `mock-api` | Express mock API — dùng cho demo/local fallback (port 3001) |
| `backend` | NestJS + Prisma + MySQL (port 3000) |
| `tests` | Các test tích hợp mock/service/order/technician |

---

## 3. Các nhánh quan trọng

| Branch | Mô tả | Trạng thái |
|---|---|---|
| `main` | Nhánh chính | Đã có Stage 1 merged (`79fe7ff`) |
| `backup/snapshot-before-ai-fixes-20260629` | Backup an toàn trước khi fix | Không được xóa |
| `stage1-api-contract-fix` | Nhánh Stage 1 | Đã merge vào main qua PR #1 |
| `stage2-product-query-admin-products` | Nhánh Stage 2 | PR #2 đang open, chưa merge |

---

## 4. Các PR quan trọng

### PR #1 — Stage 1 API Contract Fix

- **Link**: https://github.com/thodz06012005-blip/dien-lanh-247-ecommerce/pull/1
- **Trạng thái**: ✅ ĐÃ MERGE vào main
- **Commit merge**: `79fe7ff` — "Merge pull request #1 from thodz06012005-blip/stage1-api-contract-fix"

**Nội dung đã sửa:**
- `/categories` trả `{ success, data }`
- `/brands` trả `{ success, data }`
- `/admin/orders` trả `{ success, data }`
- `/admin/orders/:id` trả `{ success, data }`
- `/admin/orders/:id/status` trả `{ success, message, data }`
- `/products` trả cả `meta` và `pagination`
- Thêm file `HANDOVER_STAGE_1_API_CONTRACT_FIX.md`

**File đã sửa Stage 1:**
- `backend/src/modules/categories/categories.service.ts`
- `backend/src/modules/brands/brands.service.ts`
- `backend/src/modules/orders/orders.controller.ts`
- `backend/src/modules/products/products.service.ts`
- `HANDOVER_STAGE_1_API_CONTRACT_FIX.md`

---

### PR #2 — Stage 2 Product Query & Admin Products

- **Link**: https://github.com/thodz06012005-blip/dien-lanh-247-ecommerce/pull/2
- **Branch**: `stage2-product-query-admin-products`
- **Trạng thái**: 🔄 OPEN — chưa merge — cần Antigravity kiểm tra bằng `ANTI-CHECK-STAGE-2`

**Nội dung đã sửa Stage 2:**

1. `ProductQueryDto` nhận đủ query frontend gửi:
   - `sort` (alias frontend — ví dụ: `priceAsc`, `priceDesc`)
   - `sortBy` (alias backend — ví dụ: `price_asc`, `newest`)
   - `priceMin` / `priceMax` (alias frontend)
   - `minPrice` / `maxPrice` (alias backend)
   - `categoryId` (hỗ trợ cả id số hoặc slug string)
   - `brandId` (hỗ trợ cả id số hoặc slug string)
   - `inStock` (string `'true'`/`'false'`)
   - `hasPromo` (string `'true'`/`'false'`)
   - `inverter` (string `'true'`/`'false'`)
   - `capacity` (string — ví dụ: `'1 HP'`, `'1.5 HP'`, `'2 HP'`)

2. Controller tách public/admin rõ ràng:
   - `GET /products` → chỉ active products
   - `GET /products/:identifier` → chỉ active product detail
   - `GET /admin/products` → gồm active + inactive (admin only)
   - `GET /admin/products/:identifier` → gồm active + inactive (admin only)

3. Admin routes vẫn có guards:
   - `JwtAuthGuard` + `RolesGuard`
   - `@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)`

4. Service hỗ trợ đầy đủ:
   - Sort aliases (priceAsc, priceDesc, newest, oldest, nameAsc, nameDesc, promoHot)
   - Price aliases (priceMin/priceMax và minPrice/maxPrice)
   - inStock filter (via `variants.stock > 0`)
   - hasPromo filter (variant.price < basePrice)
   - inverter filter (text search trong product data)
   - capacity filter (text search trong product data)
   - meta + pagination response
   - Admin: `includeInactive: true`
   - Public: `includeInactive: false`

5. `remove()` chuyển từ hard delete sang **soft delete**:
   - Không dùng `prisma.product.delete`
   - Dùng `prisma.product.update` với `isActive: false`
   - Response: `{ success: true, message: 'Đã ngừng kinh doanh sản phẩm' }`

**File đã sửa Stage 2:**
- `backend/src/modules/products/dto/product-query.dto.ts`
- `backend/src/modules/products/products.controller.ts`
- `backend/src/modules/products/products.service.ts`
- `HANDOVER_STAGE_2_PRODUCT_QUERY_ADMIN_PRODUCTS.md`

---

## 5. Việc Antigravity mới cần làm ngay

> ⚠️ Không được sửa code ngay. Đầu tiên phải kiểm tra PR #2.

Bước 1 — Checkout branch Stage 2:

```bash
git checkout stage2-product-query-admin-products
git pull origin stage2-product-query-admin-products
git status
git diff --stat origin/main...HEAD
git diff --name-only origin/main...HEAD
```

Bước 2 — Chạy toàn bộ checks:

```bash
npm run check:all
npm run test:mock
npm --prefix backend run build
npm --prefix frontend-user run build
npm --prefix frontend-admin run build
```

Bước 3 — Báo cáo kết quả:

- Nếu tất cả PASS → báo: `PR #2 PASS — Đủ điều kiện merge vào main.`
- Nếu FAIL → báo rõ: file lỗi / dòng lỗi / nguyên nhân / cách sửa đề xuất

> ⛔ Tuyệt đối không tự merge PR #2 nếu chưa được người dùng yêu cầu.

---

## 6. Checklist kiểm tra PR #2 chi tiết

### 6.1. Diff phải chỉ gồm đúng 4 file

```
HANDOVER_STAGE_2_PRODUCT_QUERY_ADMIN_PRODUCTS.md
backend/src/modules/products/dto/product-query.dto.ts
backend/src/modules/products/products.controller.ts
backend/src/modules/products/products.service.ts
```

> Nếu có file khác ngoài 4 file này → phải báo lỗi.

### 6.2. Kiểm tra file nhạy cảm

```powershell
git ls-files | Select-String -Pattern '\.env', 'node_modules', 'dist', 'build', '\.zip', '\.rar'
```

Yêu cầu:
- Chỉ `.env.example` được phép xuất hiện
- Không có `.env` thật / `.env.local` / `.env.production`
- Không có `node_modules` / `dist` / `build`
- Không có `.zip` / `.rar`

### 6.3. Kiểm tra DTO — `product-query.dto.ts`

File phải có đầy đủ các field:
- `q` (string, optional)
- `categoryId` (string, optional — id hoặc slug)
- `brandId` (string, optional — id hoặc slug)
- `minPrice` (number, optional)
- `maxPrice` (number, optional)
- `priceMin` (number, optional)
- `priceMax` (number, optional)
- `sortBy` (string, optional)
- `sort` (string, optional)
- `inStock` (string, optional)
- `hasPromo` (string, optional)
- `inverter` (string, optional)
- `capacity` (string, optional)

### 6.4. Kiểm tra controller — `products.controller.ts`

Route phải đúng thứ tự (tránh bắt nhầm `:identifier`):
1. `GET products/search`
2. `GET products/featured`
3. `GET admin/products`
4. `GET admin/products/:identifier`
5. `GET products`
6. `GET products/:identifier`
7. `POST ['products', 'admin/products']` (guard admin)
8. `PATCH ['products/:id', 'admin/products/:id']` (guard admin)
9. `DELETE ['products/:id', 'admin/products/:id']` (guard admin)

Admin routes phải có:
```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
```

### 6.5. Kiểm tra service — `products.service.ts`

Phải có các private helpers:
- `buildListResponse`
- `normalizeBoolean`
- `normalizeSort`
- `resolveOrderBy`
- `isNumericId`
- `resolveCategoryId`
- `resolveBrandId`
- `getProductText`
- `hasPromotionalVariant`
- `getBestDiscountRatio`
- `requiresInMemoryProcessing`
- `applyInMemoryFilters`
- `applyInMemorySort`

Phải bảo đảm:
- Public `findAll` không trả inactive product
- Admin `findAll` trả cả inactive product
- `remove()` dùng `prisma.product.update` (không phải `delete`)
- `remove()` set `isActive: false`

---

## 7. API check nếu backend local chạy được

Bật backend:
```bash
npm --prefix backend run start
```

Kiểm tra public endpoints:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/products?sort=priceAsc&page=1&limit=12" | ConvertTo-Json -Depth 8
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/products?sort=priceDesc&page=1&limit=12" | ConvertTo-Json -Depth 8
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/products?priceMin=1000000&priceMax=15000000" | ConvertTo-Json -Depth 8
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/products?categoryId=dieu-hoa" | ConvertTo-Json -Depth 8
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/products?brandId=daikin" | ConvertTo-Json -Depth 8
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/products?inStock=true" | ConvertTo-Json -Depth 8
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/products?hasPromo=true" | ConvertTo-Json -Depth 8
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/products?inverter=true" | ConvertTo-Json -Depth 8
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/products?categoryId=dieu-hoa&capacity=1%20HP" | ConvertTo-Json -Depth 8
```

Kỳ vọng mỗi endpoint public trả:
```json
{
  "success": true,
  "data": [],
  "meta": {},
  "pagination": {}
}
```

Admin endpoint cần token admin:
```
GET /api/v1/admin/products
```

---

## 8. Các giai đoạn tiếp theo sau khi PR #2 merge

### Stage 3 — Order Integrity

Mục tiêu:
- Rà lại guest order — không gán guest order vào customer đầu tiên
- Kiểm tra order number uniqueness
- Kiểm tra stock/variant khi tạo order
- Chuẩn hóa trạng thái order
- Không phá mock-api

### Stage 4 — Security Hardening

Mục tiêu:
- Không dùng JWT fallback secrets dạng hard-code
- Seed admin không hard-code `admin123`
- Login/logout frontend gọi backend đúng hơn
- Rà token localStorage/cookie
- Rate limit/auth guard cơ bản
- Tài liệu production security

### Stage 5 — CI/Production Hygiene

Mục tiêu:
- Root build/check scripts đầy đủ hơn
- GitHub Actions nếu cần
- Deploy checklist
- Staging checklist
- Không commit file nhạy cảm
- Chuẩn hóa tài liệu bàn giao

---

## 9. Những điều tuyệt đối không được làm khi chưa hỏi người dùng

| Hành động cấm | Lý do |
|---|---|
| Merge PR #2 vào main | Chưa có báo cáo PASS |
| Xóa branch backup | Branch backup là điểm khôi phục an toàn |
| Chạy `prisma migrate reset` | Mất dữ liệu local |
| Chạy `prisma db push` thay migration | Không an toàn cho production |
| Redesign UI lớn | Nằm ngoài phạm vi các stage hiện tại |
| Đổi schema Prisma | Cần kế hoạch migration riêng |
| Sửa mock-api ngoài phạm vi | Có thể phá test hiện tại |
| Push `.env` thật / node_modules / dist / build / zip | Vi phạm quy tắc Git |

---

## 10. Câu trả lời mẫu cho Antigravity mới sau khi đọc file này

Sau khi đọc file này, Antigravity mới nên trả lời:

```
Tôi đã đọc HANDOVER_TO_NEW_ANTIGRAVITY.md và hiểu trạng thái hiện tại:

- PR #1 Stage 1 đã merge vào main (commit: 79fe7ff).
- PR #2 Stage 2 đang open, branch: stage2-product-query-admin-products.
- Nhiệm vụ trước mắt là kiểm tra PR #2, không merge.
- Tôi sẽ checkout branch Stage 2, chạy check/build/test,
  kiểm tra diff 4 file, kiểm tra DTO/controller/service và báo cáo PASS/FAIL.
```

---

## 11. Thông tin môi trường local quan trọng

- **MySQL**: chạy tại `localhost:3006`
- **Mock API**: chạy tại `localhost:3001`
- **Backend NestJS**: chạy tại `localhost:3000` (khi bật)
- **Frontend User**: chạy tại `localhost:5173` (khi `npm run dev`)
- **Frontend Admin**: chạy tại `localhost:5174` (khi `npm run dev`)

Database URL local (`backend/.env`, không được commit):
```
DATABASE_URL="mysql://root:@127.0.0.1:3006/ecommerce"
```

---

## 12. Kết luận bàn giao

Phiên Antigravity mới phải tiếp tục từ:

```
PR #2 — Stage 2 Product Query & Admin Products
Branch: stage2-product-query-admin-products
Trạng thái: đã sửa code, chưa merge, cần kiểm tra
```

> ⚠️ Không được quay lại sửa Stage 1 vì Stage 1 đã merge và PASS.
> ⚠️ Chỉ merge PR #2 sau khi người dùng xác nhận PASS.
