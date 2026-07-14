# Giai đoạn 4 — Website khách hàng và nội dung tĩnh

## Mục tiêu

Hoàn thiện lớp nội dung công khai của website Điện Lạnh 247 trên nền kiến trúc Giai đoạn 2 và Design System Giai đoạn 3, không thay đổi backend, Prisma, Mock API business logic, auth hoặc admin.

## Branch

`agent/phase-4-customer-static-pages`

Branch được tạo từ commit nghiệm thu Giai đoạn 3:

`1993e15c70995f94d271493b37b2ad069d3990cc`

## Phạm vi hoàn thành

- Trang chủ đầy đủ hero, dịch vụ, giới thiệu, dự án, lý do lựa chọn, quy trình, đánh giá, bài viết và form liên hệ.
- Trang giới thiệu.
- Trang liên hệ.
- Trang danh sách dịch vụ bằng dữ liệu tạm có kiểu TypeScript.
- Trang danh sách và chi tiết dự án.
- Trang danh sách và chi tiết bài viết.
- Chính sách bảo hành, bảo mật, điều khoản, giao nhận, đổi trả và thanh toán.
- Header desktop và mobile.
- Footer mới đồng bộ route.
- Hotline và Zalo nổi.
- Breadcrumb.
- Trang 404.
- Trạng thái không có dữ liệu cho bộ lọc dự án và bài viết.
- Ảnh responsive, giữ kích thước, lazy loading và fallback.
- Route lazy loading cho các trang phụ.
- Metadata và preconnect cơ bản.
- Contract tests cho route, link, slug và ảnh.

## Route công khai

| Route | Nội dung |
|---|---|
| `/` | Trang chủ |
| `/services` | Danh sách dịch vụ |
| `/projects` | Danh sách dự án |
| `/projects/:slug` | Chi tiết dự án |
| `/articles` | Danh sách bài viết |
| `/articles/:slug` | Chi tiết bài viết |
| `/about` | Giới thiệu |
| `/contact` | Liên hệ |
| `/policy/warranty` | Bảo hành |
| `/policy/privacy` | Bảo mật |
| `/policy/terms` | Điều khoản |
| `/policy/shipping` | Giao nhận |
| `/policy/return` | Đổi trả |
| `/policy/payment` | Thanh toán |
| `*` | Trang 404 |

## Chạy dự án

```bash
npm ci
npm run bootstrap
npm run dev:all
```

Website khách hàng:

```text
http://localhost:5173/
```

## Nghiệm thu

```bash
npm run validate:repo
npm run lint
npm run typecheck
npm run test:architecture
npm run build:all
npm run test:mock
```

Lệnh tổng hợp:

```bash
npm run ci
```

## Thứ tự merge

1. Merge Giai đoạn 2.
2. Retarget và merge Giai đoạn 3.
3. Retarget Giai đoạn 4 về `main`.
4. Chạy lại CI và kiểm tra diff.
5. Merge Giai đoạn 4 sau khi các quality gate đạt.
