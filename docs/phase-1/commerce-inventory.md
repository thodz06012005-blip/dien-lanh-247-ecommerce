# Inventory nghiệp vụ commerce

- Ngày quét: 2026-08-04
- Commit nguồn: `bfe7d09`
- Pattern: `products?|brands?|cart|checkout|orders?|coupons?|shipping|inventory|voucher|stock`

Lệnh tái lập:

```bash
rg -n -i "products?|brands?|cart|checkout|orders?|coupons?|shipping|inventory|voucher|stock" \
  frontend-user/src frontend-admin/src backend/src backend/prisma mock-api tests
```

Kết quả thô có 171 tệp ứng viên: 53 Customer Web, 45 Admin Web, 46 backend source, 2 Prisma, 18 mock API và 7 test. Nhiều kết quả là từ chung như `order` (thứ tự) hoặc CSS `border`, vì vậy bảng dưới đây là inventory đã phân loại theo capability. Reviewer phải chạy lại lệnh trên và xác nhận không còn mục có ý nghĩa commerce bị bỏ sót.

## Quy ước hành động

- `REMOVE`: xóa route/module/UI sau khi đã có redirect/410 và test tương ứng.
- `REPLACE`: thay bằng capability service-only mới.
- `ARCHIVE`: ngừng mount/seed/quyền, giữ dữ liệu lịch sử ngoài runtime trong thời gian retention.
- `KEEP-REDEFINE`: giữ kỹ thuật hoặc tên miền chung nhưng đổi quan hệ/ngữ nghĩa sang dịch vụ.
- `KEEP`: không phải commerce hoặc vẫn dùng đúng nghĩa service-only.

## Customer Web

| ID | Vị trí | Hiện trạng | Hành động | Đích / tiêu chí |
|---|---|---|---|---|
| CU-01 | `frontend-user/src/App.tsx` routes `/products`, `/products/:id` | Danh sách/chi tiết sản phẩm | REMOVE | Route không còn render; redirect có chủ đích sang `/services` hoặc 404 theo route matrix |
| CU-02 | `frontend-user/src/App.tsx` routes `/cart`, `/checkout` | Giỏ và checkout | REMOVE | Không còn entry point, lazy chunk hoặc link chết |
| CU-03 | `frontend-user/src/App.tsx` route `/orders` | Lịch sử đơn bán | REPLACE | Lịch sử/tra cứu booking service-only, không phụ thuộc tài khoản |
| CU-04 | `frontend-user/src/pages/Products.tsx`, `ProductDetail.tsx` | Trang commerce | REMOVE | Xóa cùng imports/routes/test liên quan |
| CU-05 | `frontend-user/src/pages/Cart.tsx`, `Checkout.tsx`, `Orders.tsx` | Luồng mua hàng | REMOVE/REPLACE | Checkout xóa; Orders thay bằng booking lookup/history |
| CU-06 | `frontend-user/src/components/product/**` | Card/grid/filter/gallery sản phẩm | REMOVE | Component dịch vụ mới không tái dùng kiểu dữ liệu `Product` |
| CU-07 | `frontend-user/src/components/cart/**`, `components/checkout/**` | Mini cart và bước checkout | REMOVE | Bundle không còn cart/checkout |
| CU-08 | `frontend-user/src/store/cartStore.ts` | Trạng thái giỏ local | REMOVE | Không lưu cart hoặc token nhạy cảm trong local storage |
| CU-09 | `frontend-user/src/components/layout/Header.tsx` | Tìm sản phẩm, mini cart, link Sản phẩm/Ưu đãi/Lắp đặt, shipping | REPLACE | Tìm theo thiết bị/triệu chứng; CTA đặt lịch; bỏ cart và commerce copy |
| CU-10 | `frontend-user/src/components/layout/MobileMenu.tsx` | Link Sản phẩm/Ưu đãi và tab order | REPLACE | Menu mobile dịch vụ, bảng giá, đặt lịch, tra cứu |
| CU-11 | `frontend-user/src/components/layout/Footer.tsx` | Link danh mục sản phẩm, shipping, đơn mua | REPLACE | Link dịch vụ, khu vực, bảo hành, điều khoản, dữ liệu cá nhân, tra cứu |
| CU-12 | `frontend-user/src/pages/Home.tsx` | Fetch `/products`, `ProductGrid`, SKU/giá sản phẩm | REPLACE | Service discovery + symptom search + giá tham khảo + booking CTA |
| CU-13 | `frontend-user/src/pages/Account.tsx` | Tab `orders`, import Orders | REPLACE | Account không được là điều kiện đặt lịch; hồ sơ tùy chọn nếu PO duyệt sau MVP |
| CU-14 | `frontend-user/src/pages/Login.tsx`, `Register.tsx`, auth route/copy | Luồng tài khoản customer | ARCHIVE/REDEFINE | Không hiển thị như điều kiện booking; quyết định tài khoản sau MVP qua ADR riêng |
| CU-15 | `frontend-user/src/mock/data.ts` | Kiểu/dữ liệu product, category, review gắn product | REPLACE | DTO service, symptom, price range, warranty; review gắn booking/service |
| CU-16 | `frontend-user/public/placeholder-product.png` và references | Asset commerce | REPLACE | Asset dịch vụ/thiết bị; không để tên product trong runtime |
| CU-17 | `frontend-user/src/pages/ServiceBooking.tsx` | Luồng service hiện có nhưng cần đối chiếu | KEEP-REDEFINE | Wizard 4 bước; không login; lưu Customer; consent bắt buộc; idempotency |
| CU-18 | `ServiceBookingSuccess.tsx`, `MyServices.tsx`, `MyServiceDetail.tsx` | Theo dõi service hiện có | KEEP-REDEFINE | Tra cứu an toàn bằng OTP/token; không phân biệt khách vãng lai/quen |

## Admin Web

| ID | Vị trí | Hiện trạng | Hành động | Đích / tiêu chí |
|---|---|---|---|---|
| AD-01 | `frontend-admin/src/App.tsx` route `/products` | Quản lý sản phẩm | REMOVE | Route/permission/import không còn |
| AD-02 | `frontend-admin/src/App.tsx` route `/orders` | Quản lý đơn bán | REMOVE/REPLACE | Hàng đợi booking và hồ sơ công việc |
| AD-03 | `frontend-admin/src/pages/Products.tsx`, `features/products/**` | CRUD sản phẩm/tồn kho | REMOVE | Không còn API call `/admin/products` |
| AD-04 | `frontend-admin/src/pages/Orders.tsx`, `features/orders/**` | Đơn hàng/trạng thái bán | REMOVE | Không dùng `Order` để mô phỏng booking |
| AD-05 | `frontend-admin/src/layouts/AdminLayout.tsx` | Menu/title Sản phẩm, Đơn hàng | REPLACE | Booking, điều phối, dịch vụ, báo giá, thanh toán, bảo hành, CMS, báo cáo |
| AD-06 | `frontend-admin/src/pages/Dashboard.tsx`, `components/admin/DashboardCharts.tsx` | KPI có doanh thu/order/product | REPLACE | KPI service-only có filter, drilldown và cùng nguồn dữ liệu reporting API |
| AD-07 | `frontend-admin/src/pages/Customers.tsx` | Hồ sơ có order history | KEEP-REDEFINE | Customer + booking/service history; masking và permission theo resource |
| AD-08 | `frontend-admin/src/pages/ServiceRequests.tsx`, `ServiceRequestDetail.tsx`, `features/service-requests/**` | Capability dịch vụ hiện có | KEEP-REDEFINE | Hàng đợi, state machine, timeline, quote/payment/warranty/audit |
| AD-09 | `frontend-admin/src/pages/Technicians.tsx`, `features/technicians/**` | Kỹ thuật viên | KEEP | Thêm skill/area/schedule/conflict ở giai đoạn sau |
| AD-10 | `frontend-admin/src/services/api.ts` và auth/RBAC | API client/admin auth | KEEP-REDEFINE | Xóa endpoint/quyền commerce; giữ cookie an toàn và resource authorization |

## Backend NestJS

| ID | Vị trí | Hiện trạng | Hành động | Đích / tiêu chí |
|---|---|---|---|---|
| BE-01 | `backend/src/modules/products/**` | Public/admin product CRUD/search | ARCHIVE → REMOVE | Unmount; endpoint trả 410 trong cửa sổ chuyển đổi hoặc 404 theo ADR |
| BE-02 | `backend/src/modules/brands/**` | Brand API | ARCHIVE → REMOVE | Không còn brand route/provider |
| BE-03 | `backend/src/modules/cart/**` | Cart API | ARCHIVE → REMOVE | Không còn cart route/provider/data write |
| BE-04 | `backend/src/modules/orders/**` | Order/checkout/admin order | ARCHIVE → REMOVE | Booking độc lập `Order`; không tái dùng state machine bán hàng |
| BE-05 | `backend/src/modules/categories/**` | Category gắn Product | REMOVE/RENAME | Dùng `service-categories`; không để `/categories` mơ hồ |
| BE-06 | `backend/src/app.module.ts` | Mount Products/Brands/Categories/Cart/Orders | REPLACE | Gỡ module commerce theo migration plan; thêm compatibility 410 nếu được duyệt |
| BE-07 | `backend/src/modules/dashboard/dashboard.service.ts` | KPI dựa order/product | REPLACE | Reporting API service-only, định nghĩa công thức và timezone |
| BE-08 | `backend/src/modules/customers/**` | Customer dựa User/order | KEEP-REDEFINE | Customer không bắt buộc User; booking luôn liên kết Customer; dedupe có rule |
| BE-09 | `backend/src/modules/service-requests/**` | Service request hiện có | KEEP-REDEFINE | `Booking` aggregate/state machine, idempotency, slot conflict, consent transaction |
| BE-10 | `backend/src/modules/service-categories/**` | Danh mục dịch vụ | KEEP-REDEFINE | Service catalog CMS, symptom/device search, price type/range |
| BE-11 | `backend/src/integrations/payment/vnpay/**` | Payment gateway gắn order | KEEP-REDEFINE | Chỉ giữ nếu D7 duyệt; payment gắn booking/invoice/quotation |
| BE-12 | `backend/src/integrations/cloudinary/**` | Upload product/media | KEEP-REDEFINE | Booking evidence/service CMS; kiểm MIME/size/content và quyền xóa |
| BE-13 | `backend/src/integrations/mail/**` | Template order email | KEEP-REDEFINE | Booking/OTP/quote/warranty notification, không log PII/token |
| BE-14 | `backend/src/modules/auth/**` | Customer/admin auth có order context | KEEP-REDEFINE | Admin auth giữ; customer account không là điều kiện booking/lookup |
| BE-15 | `backend/src/common/**` | Filter/guard có resource/order references | KEEP-REDEFINE | Mã lỗi service-only; resource authorization và audit |

## Prisma và dữ liệu

| ID | Vị trí/model | Hiện trạng | Hành động | Đích / tiêu chí |
|---|---|---|---|---|
| DB-01 | `Category`, `Brand`, `Product`, `ProductImage`, `Variant` | Catalog sản phẩm | DEPRECATE/ARCHIVE | Không drop ở migration đầu; export + checksum trước khi drop sau ổn định |
| DB-02 | `Cart`, `CartItem` | Giỏ hàng | DEPRECATE/ARCHIVE | Ngừng write; drop sau retention/restore evidence |
| DB-03 | `OrderStatus`, `Order`, `OrderItem` | Đơn bán | DEPRECATE/ARCHIVE | Không dùng cho booking; dữ liệu cũ read-only/archive |
| DB-04 | `ShippingStatus`, `Shipping` | Vận chuyển | DEPRECATE/ARCHIVE | Không dùng cho kỹ thuật viên di chuyển |
| DB-05 | `DiscountType`, `Coupon` | Coupon thương mại | DEPRECATE/ARCHIVE | Không tái dùng làm giảm giá báo giá nếu chưa có quyết định |
| DB-06 | `Payment` | Bắt buộc liên kết `Order` | KEEP-REDEFINE | Thiết kế payment/invoice service-only sau D7; migration tách Order |
| DB-07 | `Address` | Địa chỉ thuộc User và Order | KEEP-REDEFINE | `CustomerAddress`; không bắt buộc account/User |
| DB-08 | `Review` | Review gắn User/Product | KEEP-REDEFINE | Review gắn booking đã hoàn thành, chống review giả |
| DB-09 | `ServiceCategory`, `ServiceRequest`, technician types | Mô hình service sơ khởi | KEEP-REDEFINE | Chuẩn hóa thành aggregate service-only và status history |
| DB-10 | `backend/prisma/seed.ts` | Seed cả commerce/service | REPLACE | Seed sạch không tạo product/order/cart; fixture service không chứa PII thật |

## Mock API

| ID | Vị trí | Hiện trạng | Hành động | Đích / tiêu chí |
|---|---|---|---|---|
| MK-01 | `mock-api/routes/public.js` | `/products`, `/brands`, `/categories` | REMOVE/410 | Public mock khớp contract backend service-only |
| MK-02 | `mock-api/routes/adminProducts.js` | Admin product CRUD | REMOVE | Gỡ mount và quyền products:* |
| MK-03 | `mock-api/routes/orders.js` | Public/admin order | REMOVE | Gỡ mount và constants order/payment commerce |
| MK-04 | `mock-api/server.js` | Mount route commerce, product adapter, root links | REPLACE | Chỉ mount service-only; health không quảng bá commerce |
| MK-05 | `mock-api/constants.js`, `utils/auth.js` | Enum/quyền order/product | REPLACE | Booking/service/dispatch/report permissions |
| MK-06 | `mock-api/mock-db.json`, `seed/initialData.js`, `scripts/reset-db.js` | Product/order/cart seed/runtime data | ARCHIVE/REPLACE | Snapshot archive ngoài Git nếu là dữ liệu thật; seed service-only |
| MK-07 | `mock-api/routes/adminDashboard.js`, `adminCustomers.js` | KPI/history dựa order | REPLACE | Dùng booking/reporting definitions |
| MK-08 | `mock-api/routes/serviceRequests.js`, `routes/technicians.js` | Service mock | KEEP-REDEFINE | Đồng bộ state machine, idempotency, conflict, consent và audit |

## Tests

| ID | Vị trí | Hiện trạng | Hành động | Đích / tiêu chí |
|---|---|---|---|---|
| TS-01 | `tests/test_order_pricing.js` | Pricing order | REMOVE/REPLACE | Quotation/price calculation service-only |
| TS-02 | `tests/test_task7_8.js`, `test_task9.js`, `test_task11.js` | Có assertion product/order/admin | REVIEW/REPLACE | Tách assertion service còn giá trị; bỏ commerce có evidence |
| TS-03 | `tests/test_db_seed.js`, `test_enum_contract.js`, `test_nestjs_api.js` | Contract/seed chứa commerce | REPLACE | Contract không còn route/model/quyền commerce |
| TS-04 | `backend/src/modules/{products,brands,cart,orders}/**/*.spec.ts` | Unit test commerce đang fail baseline | REMOVE WITH MODULE | Không tính là “fix” bằng skip; thay test service tương ứng |
| TS-05 | `tests/test_service_request_lifecycle.js`, `test_technician_rules.js` | Service flow hiện có | KEEP-REDEFINE | Mở rộng 4-step booking, state machine, consent, conflict/idempotency |

## Các điểm dễ bỏ sót khi review

- Text/SEO/asset như “sản phẩm”, “giỏ hàng”, “giao hàng”, SKU và placeholder product.
- Permission names `products:*`, `orders:*` trong mock auth và admin navigation.
- Dashboard/customer history vẫn có thể truy vấn order dù route đã bị ẩn.
- Payment, Review và Address là tên chung nhưng schema hiện bị ràng buộc vào `Order`, `Product` hoặc `User`; phải `KEEP-REDEFINE`, không giữ nguyên.
- `/categories` hiện là category sản phẩm; `/service-categories` mới là danh mục dịch vụ.
- Không xóa bảng commerce ở migration đầu. Phải ngừng write, export, checksum, restore drill và qua retention trước.

## Sign-off inventory

| Reviewer | Tên | Ngày | Kết quả |
|---|---|---|---|
| Frontend | TBD | — | Chưa review |
| Backend | TBD | — | Chưa review |
| Product Owner | TBD | — | Chưa review |
| QA/Security | TBD | — | Chưa review |
