# HANDOVER STAGE 1 — API CONTRACT FIX

## 1. Mục tiêu

Chuẩn hóa response contract giữa backend NestJS và frontend-user/frontend-admin để các màn hình đang đọc `success`, `data`, `meta` hoặc `pagination` không bị lệch khi chuyển từ mock-api sang backend thật.

## 2. Branch sửa

`stage1-api-contract-fix`

## 3. Branch backup giữ nguyên

`backup/snapshot-before-ai-fixes-20260629`

## 4. File đã sửa

- `backend/src/modules/categories/categories.service.ts`
- `backend/src/modules/brands/brands.service.ts`
- `backend/src/modules/orders/orders.controller.ts`
- `backend/src/modules/products/products.service.ts`

## 5. File đã tạo

- `HANDOVER_STAGE_1_API_CONTRACT_FIX.md`

## 6. Lỗi trước khi sửa

### 6.1. Categories contract

`GET /api/v1/categories` trả raw array từ Prisma, trong khi frontend-user và frontend-admin đang đọc `categoriesData?.data`.

### 6.2. Brands contract

`GET /api/v1/brands` trả raw array từ Prisma, trong khi frontend-user và frontend-admin đang đọc `brandsData?.data`.

### 6.3. Admin orders contract

`GET /api/v1/admin/orders` trả raw array, trong khi frontend-admin Orders kiểm tra `data?.success` và đọc `data?.data`.

### 6.4. Products pagination contract

`GET /api/v1/products` chỉ trả `meta`, trong khi frontend-user Products đang đọc `data.pagination` để render phân trang.

## 7. Cách sửa

### 7.1. Categories

`CategoriesService.findAll()` hiện trả:

```ts
{
  success: true,
  data: categories,
}
```

Kết quả kỳ vọng:

```json
{
  "success": true,
  "data": []
}
```

### 7.2. Brands

`BrandsService.findAll()` hiện trả:

```ts
{
  success: true,
  data: brands,
}
```

Kết quả kỳ vọng:

```json
{
  "success": true,
  "data": []
}
```

### 7.3. Admin orders

Các endpoint admin orders hiện được bọc ở controller:

- `GET /api/v1/admin/orders` → `{ success, data }`
- `GET /api/v1/admin/orders/:id` → `{ success, data }`
- `PATCH /api/v1/admin/orders/:id/status` → `{ success, message, data }`

### 7.4. Products pagination

`ProductsService.findAll()` hiện trả đồng thời:

```ts
{
  success: true,
  data,
  meta: pagination,
  pagination,
}
```

Việc giữ cả `meta` và `pagination` giúp tương thích cả frontend hiện tại và các đoạn code backend/admin có thể đã đọc `meta` trước đó.

## 8. Không thay đổi trong giai đoạn này

- Không sửa schema Prisma.
- Không tạo migration.
- Không sửa mock-api.
- Không sửa UI.
- Không sửa security/auth.
- Không sửa route path.
- Không đổi query contract/filter sản phẩm.
- Không sửa branch backup.
- Không merge vào `main`.

## 9. Validation cần chạy ở máy local/Antigravity

Do thay đổi được thực hiện trực tiếp qua GitHub connector nên cần chạy lại các lệnh sau ở môi trường local để xác nhận build/test đầy đủ:

```bash
git checkout stage1-api-contract-fix
git pull origin stage1-api-contract-fix
npm run check:all
npm run test:mock
cd backend
npx prisma generate
npm run build
cd ../frontend-user
npm run build
cd ../frontend-admin
npm run build
```

Kiểm tra file nhạy cảm:

```bash
git ls-files | findstr /i ".env"
git ls-files | findstr /i "node_modules"
git ls-files | findstr /i "dist"
git ls-files | findstr /i "build"
```

Chỉ `.env.example` được phép xuất hiện.

## 10. API contract kỳ vọng sau sửa

### 10.1. Categories

```http
GET /api/v1/categories
```

```json
{
  "success": true,
  "data": []
}
```

### 10.2. Brands

```http
GET /api/v1/brands
```

```json
{
  "success": true,
  "data": []
}
```

### 10.3. Admin orders

```http
GET /api/v1/admin/orders
```

```json
{
  "success": true,
  "data": []
}
```

### 10.4. Products

```http
GET /api/v1/products?page=1&limit=12
```

```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 12,
    "totalPages": 0
  },
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 12,
    "totalPages": 0
  }
}
```

## 11. Rủi ro còn lại sau Stage 1

Stage 1 chỉ xử lý response shape cơ bản. Các vấn đề dưới đây vẫn cần xử lý ở các giai đoạn tiếp theo:

- Product query còn lệch alias `sort`/`sortBy`, `priceMin`/`minPrice`, `priceMax`/`maxPrice`.
- `ProductQueryDto` vẫn chưa tối ưu cho category/brand slug trong mọi trường hợp.
- Admin products vẫn cần tách logic public/admin để admin thấy cả inactive.
- Guest order vẫn cần sửa data integrity.
- JWT/seed/security hardening vẫn thuộc giai đoạn sau.

## 12. Kết luận

Giai đoạn 1 đã chuẩn hóa contract API cơ bản giữa backend NestJS và frontend hiện tại. Nhánh `stage1-api-contract-fix` đủ điều kiện tạo Pull Request để review trước khi merge vào `main`, sau khi local build/test được xác nhận PASS.
