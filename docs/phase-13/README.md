# Giai đoạn 13 — SEO, hiệu năng và mobile experience

## Mục tiêu

Tăng khả năng crawl/index, tốc độ tải và trải nghiệm trên thiết bị di động mà không thay đổi business logic của Giai đoạn 1–12.

## Kiến trúc SEO

- Customer router chuyển từ hash URL sang BrowserRouter.
- `SeoManager` cập nhật title, description, canonical, robots, Open Graph và Twitter Card theo route.
- JSON-LD: LocalBusiness, Service, Product, Article và BreadcrumbList.
- Trang không công khai hoặc không tìm thấy dùng `noindex`.
- `robots.txt` chặn account, checkout, authentication và lookup riêng tư.
- `sitemap.xml` chỉ chứa route public quan trọng.
- `_redirects` giữ tương thích URL hash cũ và cấu hình SPA fallback.

## Hình ảnh

`OptimizedImage` hỗ trợ:

- AVIF và WebP qua picture/source với nguồn ảnh có image CDN.
- Responsive `srcset` 320–1440 px.
- `sizes` theo viewport.
- Lazy loading mặc định.
- Hero/ảnh LCP dùng eager + high fetch priority.
- Width/height bắt buộc để giảm CLS.
- Chất lượng mặc định 72 để cân bằng dung lượng và độ nét.

## Code splitting và cache

- Các route phụ tiếp tục dùng `React.lazy` và Suspense.
- Home giữ trong initial bundle để tránh waterfall cho route chính.
- API list hiện có dùng server-side pagination; Phase 13 không chuyển pagination về client.
- Public API/CDN cần cấu hình `Cache-Control: public, max-age=60, stale-while-revalidate=300` cho danh sách và `ETag` cho detail.
- Auth/account/cart/checkout luôn `private, no-store`.

## Chỉ tiêu nghiệm thu

Đo trên production-like build, mobile Lighthouse và kết nối mô phỏng:

| Chỉ số | Mục tiêu route chính |
|---|---:|
| Lighthouse Performance | >= 85 mobile, >= 90 desktop |
| Accessibility | >= 90 |
| Best Practices | >= 90 |
| SEO | >= 95 |
| LCP | <= 2.5 s |
| INP | <= 200 ms |
| CLS | <= 0.1 |
| JS initial compressed | <= 250 KB |
| Ảnh hero transfer | <= 250 KB |
| Ảnh card transfer | <= 120 KB |

Routes bắt buộc đo: `/`, `/services`, `/products`, `/articles`, `/service-booking`.

## Kiểm tra tự động

- `frontend-user/tests/phase13-seo-performance.test.mjs` kiểm tra BrowserRouter, metadata, schema, sitemap, robots và ảnh responsive.
- Customer Lighthouse workflow hiện hữu phải được chạy trên head Phase 13.
- Báo cáo Lighthouse JSON/HTML phải lưu artifact trước nghiệm thu.

## An toàn stacked branch

- Base: `agent/phase-12-communications-integrations`.
- Head: `agent/phase-13-seo-performance`.
- Không sửa Prisma schema, notification outbox, operations workflow, order pricing, authentication hoặc CMS publishing.
- PR giữ Draft đến khi Phase 12 có base chính thức từ Phase 11 và toàn bộ regression Phase 1–13 PASS.

## Việc cần xác nhận trên môi trường triển khai

- Domain production thực tế; mặc định tài liệu đang dùng `https://dienlanh247.vn`.
- Hosting phải hỗ trợ history fallback hoặc rewrite về `index.html`.
- Sitemap động cần được mở rộng bằng slug thật từ CMS/Product API khi backend production chạy.
- Dynamic detail metadata nên lấy title/description/image thực tế từ API thay vì fallback route-level.
- Chạy Lighthouse và ghi số liệu thực tế; không tuyên bố đạt chỉ tiêu chỉ dựa trên code contract.
