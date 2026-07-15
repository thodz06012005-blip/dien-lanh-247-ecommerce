# Giai đoạn 13 — SEO kỹ thuật, hiệu năng và trải nghiệm mobile

## 1. Mục tiêu

Giai đoạn 13 tăng khả năng được tìm thấy, tốc độ hiển thị và trải nghiệm trên thiết bị di động mà không thay đổi business logic của đặt dịch vụ, tài khoản, giỏ hàng, đơn hàng, CMS hoặc notification outbox.

Nhánh triển khai:

```text
Base: agent/phase-12-communications-integrations
Head: agent/phase-13-seo-performance
Draft PR: #14
```

PR phải giữ trạng thái Draft và không được merge trước Phase 12. Do Phase 11 chưa tồn tại trên GitHub tại thời điểm triển khai, Phase 13 phải được rebase/retarget lên chuỗi Phase 11 → Phase 12 chính thức trước nghiệm thu merge cuối.

## 2. URL và redirect

Customer app sử dụng `BrowserRouter` với URL crawlable:

```text
/services
/services/:slug
/products
/products/:id
/projects
/projects/:slug
/articles
/articles/:slug
/service-booking
```

`frontend-user/public/_redirects` cung cấp history fallback và chuyển URL hash cũ sang URL mới. Hosting không hỗ trợ `_redirects` phải cấu hình rewrite tương đương về `index.html`.

## 3. Metadata theo route

`frontend-user/src/seo/SeoManager.tsx` quản lý:

- title;
- meta description;
- canonical;
- robots;
- Open Graph;
- Twitter Card;
- social image;
- loại nội dung website/article/product.

Các trang Service, Project, Article và Product lấy metadata thật từ API và dùng chung cache React Query với màn hình chi tiết. Trang riêng tư, auth, cart, checkout, lookup và 404 dùng `noindex,nofollow`.

## 4. Structured data

JSON-LD đã được bổ sung cho:

- `LocalBusiness` và `HomeAndConstructionBusiness`;
- `Service`;
- `Product` và `Offer`;
- `Article`;
- `CreativeWork` cho dự án;
- `BreadcrumbList`.

Dữ liệu doanh nghiệp cấu hình bằng biến môi trường public:

```env
VITE_SITE_URL=
VITE_BUSINESS_PHONE=
VITE_SERVICE_AREA=
VITE_BUSINESS_CITY=
```

## 5. Sitemap và robots

Build chạy tự động:

```bash
npm --prefix frontend-user run sitemap:generate
npm --prefix frontend-user run robots:generate
```

Sitemap lấy slug đã public từ các endpoint phân trang:

- `/services`;
- `/projects`;
- `/posts`;
- `/products`.

Khi API build-time tạm thời không khả dụng, script vẫn tạo sitemap tĩnh an toàn và không làm hỏng build. `robots.txt` lấy domain từ `VITE_SITE_URL`, cho phép crawl nội dung public và chặn account/auth/cart/checkout cùng các URL có dữ liệu riêng tư.

Biến build-only:

```env
SITEMAP_API_URL=
```

## 6. Ảnh và mobile rendering

`OptimizedImage` và `ImageWithFallback` hỗ trợ:

- `<picture>`;
- AVIF;
- WebP;
- responsive `srcset` và `sizes`;
- width/height cố định;
- lazy loading;
- async decoding;
- fetch priority cho ảnh LCP;
- fallback có kích thước ổn định.

Ảnh hero ngoài mobile viewport không được phép thay thế text LCP. Các section sâu của Home sử dụng `content-visibility: auto` để trì hoãn layout/paint ngoài màn hình.

Ngân sách:

| Hạng mục | Ngưỡng CI |
|---|---:|
| Initial JavaScript gzip | ≤ 250 KB |
| Initial CSS gzip | ≤ 80 KB |
| Mỗi JavaScript chunk minified | ≤ 350 KB |
| Mỗi ảnh local trong build | ≤ 250 KB |

Quality gate thực thi bằng:

```bash
node scripts/verify-customer-build-budget.mjs frontend-user/dist
```

## 7. Code splitting và cache

- Các route customer được tải bằng `React.lazy` và `Suspense`.
- React, React Query, icons và Zustand được tách thành vendor chunk ổn định.
- Contact form nặng chỉ tải khi người dùng mở form hoặc form gần viewport.
- Public content và product API có `Cache-Control`, `s-maxage` và `stale-while-revalidate`.
- React Query có `staleTime`, `gcTime`, retry có điều kiện và không refetch vô ích khi focus.
- Product/content list sử dụng pagination server-side; filter/sort nằm trong URL để có thể chia sẻ và quay lại đúng trạng thái.
- Truy vấn sản phẩm dùng `skip/take`, `count` song song và các index hiện hữu theo trạng thái, danh mục, hãng và thời gian tạo.

Không cache response admin, mutation, auth hoặc dữ liệu riêng tư.

## 8. Critical shell và 404

`index.html` chứa critical shell nhẹ, có nội dung thay đổi theo URL trước khi React tải. Mục đích:

- không hiển thị màn hình trắng trên mobile;
- có nội dung hữu ích trong lần paint đầu;
- giữ bố cục ổn định khi route chunk đang tải.

Trang 404 hiện đại được giữ trong router và SEO Manager đặt `noindex,nofollow`.

## 9. Lighthouse và Core Web Vitals

Workflow:

```text
.github/workflows/customer-lighthouse.yml
```

Ma trận bắt buộc:

- `/` mobile;
- `/services` mobile;
- `/products` mobile;
- `/articles` mobile;
- `/service-booking` mobile;
- `/` desktop.

### 9.1. Synthetic CI targets

| Chỉ số | Mobile | Desktop |
|---|---:|---:|
| Performance | ≥ 85 | ≥ 90 |
| Accessibility | ≥ 90 | ≥ 90 |
| Best Practices | ≥ 90 | ≥ 90 |
| SEO | ≥ 95 | ≥ 95 |
| Lab LCP | ≤ 3.0 s | ≤ 2.5 s |
| TBT | ≤ 300 ms | ≤ 200 ms |
| CLS | ≤ 0.1 | ≤ 0.1 |

Mobile lab LCP dùng ngưỡng 3,0 giây vì workflow chạy Lighthouse throttling trên preview local không có CDN production. Ngưỡng này không thay thế Core Web Vitals field target.

### 9.2. Production field targets

RUM tại `frontend-user/src/performance/webVitals.ts` phát sự kiện `dl247:web-vital` và có thể gửi tới:

```env
VITE_WEB_VITALS_ENDPOINT=
```

Mục tiêu p75 production:

- LCP ≤ 2,5 giây;
- INP ≤ 200 ms;
- CLS ≤ 0,1.

Telemetry không chứa email, điện thoại, token, nội dung form hoặc định danh khách hàng.

## 10. Báo cáo và artifacts

Customer Lighthouse tạo artifact:

```text
customer-lighthouse-phase13-report
```

Bao gồm:

- JSON cho từng route/profile;
- `phase13-performance-report.md`;
- `phase13-performance-report.json`;
- sitemap đã build;
- build/preview/API log.

Quality workflow tạo artifact:

```text
phase13-quality-report
```

Bao gồm:

- lint/typecheck/contracts/build log;
- bundle budget report;
- Vite manifest;
- sitemap.

## 11. Quality gate

Workflow:

```text
.github/workflows/phase13-quality.yml
```

Bắt buộc PASS:

1. Customer và backend lint.
2. Customer và backend typecheck.
3. Toàn bộ customer architecture contracts kế thừa.
4. Phase 13 SEO/performance contracts.
5. Backend architecture contracts kế thừa.
6. Customer và backend production build.
7. Bundle/image budgets.
8. Lighthouse route matrix.

## 12. Compatibility

Giai đoạn 13 không thay đổi:

- Service Request transition matrix;
- Operations/dispatch/SLA/quotation/payment/warranty;
- Notification outbox, idempotency hoặc retry;
- Auth session và HttpOnly cookie;
- Cart/checkout/order pricing;
- CMS draft/publish/revision workflow;
- migration hoặc seed của Phase 1–12.

Thay đổi backend chỉ thêm cache header cho GET public; lỗi cache/CDN không làm hỏng giao dịch chính.

## 13. Điều kiện merge

PR #14 chỉ được chuyển Ready khi:

1. Phase 11 và Phase 12 có base chính thức.
2. Phase 13 được rebase/retarget đúng stacked chain.
3. Quality và Lighthouse PASS trên cùng final commit.
4. Domain production và history fallback được xác nhận.
5. Staging smoke test URL sâu, sitemap, robots, canonical và structured data PASS.
6. RUM endpoint production được cấu hình hoặc chủ động để trống nếu chưa có hệ thống thu thập.
