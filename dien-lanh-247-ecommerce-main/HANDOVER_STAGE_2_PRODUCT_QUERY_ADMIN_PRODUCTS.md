# HANDOVER STAGE 2 — PRODUCT QUERY & ADMIN PRODUCTS

## 1. Mục tiêu

Hoàn thiện Giai đoạn 2 sau Stage 1 API Contract Fix: đồng bộ query/filter/sort sản phẩm giữa frontend-user và backend thật, đồng thời tách hành vi public/admin cho danh sách sản phẩm.

## 2. Branch sửa

`stage2-product-query-admin-products`

## 3. Nền triển khai

Branch này được tạo lại từ `main` sau khi PR #1 đã merge, nên đã chứa Stage 1 API Contract Fix.

## 4. File đã sửa

- `backend/src/modules/products/dto/product-query.dto.ts`
- `backend/src/modules/products/products.controller.ts`
- `backend/src/modules/products/products.service.ts`

## 5. File đã tạo

- `HANDOVER_STAGE_2_PRODUCT_QUERY_ADMIN_PRODUCTS.md`

## 6. Lỗi/trạng thái trước khi sửa

### 6.1. DTO chưa nhận đủ query frontend gửi

Frontend-user đang gửi các query:

- `sort`
- `priceMin`
- `priceMax`
- `inStock`
- `hasPromo`
- `inverter`
- `capacity`

Trong khi backend DTO trước đó chỉ nhận:

- `sortBy`
- `minPrice`
- `maxPrice`
- `categoryId` dạng number
- `brandId` dạng number

Khi backend bật `ValidationPipe({ whitelist: true })`, các field chưa khai báo có thể bị loại bỏ hoặc gây lỗi khi transform/validate.

### 6.2. Admin products dùng chung logic public products

Route `products` và `admin/products` cùng gọi một service method với điều kiện `isActive: true`, nên admin không nhìn thấy sản phẩm inactive.

### 6.3. Product delete đang hard delete

`ProductsService.remove()` trước đó gọi `prisma.product.delete()`. Điều này có rủi ro ảnh hưởng lịch sử đơn hàng nếu sản phẩm/variant đã nằm trong order item.

## 7. Cách sửa

### 7.1. ProductQueryDto

DTO hiện hỗ trợ cả alias backend cũ và frontend hiện tại:

- `sortBy` và `sort`
- `minPrice` và `priceMin`
- `maxPrice` và `priceMax`
- `categoryId` dạng id hoặc slug
- `brandId` dạng id hoặc slug
- `inStock`
- `hasPromo`
- `inverter`
- `capacity`

### 7.2. ProductsController

Đã tách rõ route public và admin:

- `GET /products` → public, chỉ active products.
- `GET /products/:identifier` → public, chỉ active product detail.
- `GET /admin/products` → admin, gồm cả active/inactive.
- `GET /admin/products/:identifier` → admin, gồm cả active/inactive.

Các route create/update/remove vẫn giữ guard admin như trước.

### 7.3. ProductsService.findAll()

Đã bổ sung:

- Chuẩn hóa page/limit.
- Chuẩn hóa sort alias.
- Hỗ trợ `priceMin`/`priceMax` và `minPrice`/`maxPrice`.
- Hỗ trợ category/brand id hoặc slug.
- Hỗ trợ `inStock=true/false` bằng relation `variants.stock`.
- Hỗ trợ `hasPromo` bằng kiểm tra variant price thấp hơn basePrice.
- Hỗ trợ `inverter` bằng tìm text `inverter` trong product data.
- Hỗ trợ `capacity` bằng tìm text như `1 HP`, `1.5 HP`, `2 HP` trong product data.
- Hỗ trợ sort `priceAsc`, `priceDesc`, `price_asc`, `price_desc`, `newest`, `oldest`, `nameAsc`, `nameDesc`, `promoHot`.

### 7.4. ProductsService.findOne()

Đã thêm option `includeInactive`:

- Public detail không trả inactive product.
- Admin detail có thể trả inactive product.

### 7.5. ProductsService.remove()

Đã chuyển từ hard delete sang cập nhật trạng thái:

```ts
await this.prisma.product.update({
  where: { id },
  data: { isActive: false },
});
```

Response mới:

```ts
{
  success: true,
  message: 'Đã ngừng kinh doanh sản phẩm',
}
```

## 8. Không thay đổi trong giai đoạn này

- Không sửa Prisma schema.
- Không tạo migration.
- Không sửa mock-api.
- Không sửa UI.
- Không sửa auth/security.
- Không sửa order integrity.
- Không sửa seed.
- Không merge vào `main`.

## 9. Lưu ý kỹ thuật

### 9.1. hasPromo

Vì schema hiện chưa có field promotion/salePrice riêng ở Product, `hasPromo` được xác định bằng logic:

```txt
variant.price < product.basePrice
```

Đây là cách phù hợp với schema hiện tại và dữ liệu seed hiện có.

### 9.2. inverter và capacity

Schema hiện chưa có bảng/field specs chuẩn hóa. Vì vậy `inverter` và `capacity` đang được xử lý bằng text search trên dữ liệu product hiện có như name, slug, description, category, brand.

Production nên bổ sung specs/schema chuẩn nếu cần filter kỹ hơn.

### 9.3. promoHot

`promoHot` sort dựa trên tỷ lệ giảm giá tốt nhất giữa `basePrice` và variant price thấp nhất.

## 10. Validation cần chạy local/Antigravity

```bash
git checkout stage2-product-query-admin-products
git pull origin stage2-product-query-admin-products
npm run check:all
npm run test:mock
npm --prefix backend run build
npm --prefix frontend-user run build
npm --prefix frontend-admin run build
```

Nếu backend local chạy được, kiểm tra thêm:

```bash
curl "http://localhost:3000/api/v1/products?sort=priceAsc&page=1&limit=12"
curl "http://localhost:3000/api/v1/products?sort=priceDesc&page=1&limit=12"
curl "http://localhost:3000/api/v1/products?priceMin=1000000&priceMax=15000000"
curl "http://localhost:3000/api/v1/products?categoryId=dieu-hoa"
curl "http://localhost:3000/api/v1/products?brandId=daikin"
curl "http://localhost:3000/api/v1/products?inStock=true"
curl "http://localhost:3000/api/v1/products?hasPromo=true"
curl "http://localhost:3000/api/v1/products?inverter=true"
curl "http://localhost:3000/api/v1/products?categoryId=dieu-hoa&capacity=1%20HP"
```

Admin route cần token admin hợp lệ:

```txt
GET /api/v1/admin/products
```

Kỳ vọng admin nhìn thấy cả product inactive sau khi một sản phẩm bị remove.

## 11. Rủi ro còn lại sau Stage 2

- Filter `inverter` và `capacity` vẫn là text-based, chưa chuẩn bằng schema specs riêng.
- `bestSeller` hiện chưa có dữ liệu sales count nên chưa thể sort chính xác theo doanh số.
- Product create/update vẫn nên được rà lại sâu hơn ở giai đoạn sau nếu muốn chuẩn hóa category/brand id/slug toàn diện.
- Guest order integrity vẫn thuộc Stage 3.
- JWT/seed/security vẫn thuộc Stage 4.

## 12. Kết luận

Stage 2 đã xử lý nhóm lỗi Product Query & Admin Products trong phạm vi không đổi schema và không phá mock fallback. Nhánh này cần được Antigravity kiểm tra build/test trước khi merge vào `main`.
