# Bàn giao Giai đoạn 4 — Website khách hàng tĩnh

## 1. Branch và phụ thuộc

Branch:

```text
agent/phase-4-customer-static-pages
```

Base trực tiếp:

```text
agent/phase-3-design-system
```

Commit base:

```text
1993e15c70995f94d271493b37b2ad069d3990cc
```

Giai đoạn 4 sử dụng stacked branch để giữ diff riêng, tránh lặp thay đổi Giai đoạn 2–3 và giảm nguy cơ conflict.

## 2. File chính

### Dữ liệu

```text
frontend-user/src/data/phase4Content.ts
```

### Component mới

```text
frontend-user/src/components/common/OptimizedImage.tsx
frontend-user/src/components/contact/QuickContactForm.tsx
frontend-user/src/components/layout/FloatingContactActions.tsx
```

### Trang mới

```text
frontend-user/src/pages/Projects.tsx
frontend-user/src/pages/ProjectDetail.tsx
frontend-user/src/pages/Articles.tsx
frontend-user/src/pages/ArticleDetail.tsx
frontend-user/src/pages/NotFound.tsx
```

### Trang được nâng cấp

```text
frontend-user/src/pages/Home.tsx
frontend-user/src/pages/Services.tsx
frontend-user/src/pages/About.tsx
frontend-user/src/pages/Contact.tsx
frontend-user/src/pages/Policy.tsx
```

### Điều hướng và layout

```text
frontend-user/src/router/AppRouter.tsx
frontend-user/src/layouts/MainLayout.tsx
frontend-user/src/components/layout/Header.tsx
frontend-user/src/components/layout/Footer.tsx
```

## 3. Nội dung đã hoàn thành

- [x] Hero hiện đại có ảnh ưu tiên, CTA và form gọi lại.
- [x] Dịch vụ nổi bật.
- [x] Phần giới thiệu.
- [x] Dự án tiêu biểu.
- [x] Lý do lựa chọn.
- [x] Quy trình sáu bước.
- [x] Đánh giá khách hàng.
- [x] Bài viết.
- [x] Form liên hệ cuối trang.
- [x] Trang giới thiệu.
- [x] Trang liên hệ.
- [x] Chính sách bảo hành.
- [x] Chính sách bảo mật.
- [x] Điều khoản sử dụng.
- [x] Chính sách giao nhận, đổi trả và thanh toán.
- [x] Danh sách dịch vụ.
- [x] Danh sách và chi tiết dự án.
- [x] Danh sách và chi tiết bài viết.
- [x] Menu desktop.
- [x] Menu mobile.
- [x] Hotline và Zalo nổi.
- [x] Breadcrumb.
- [x] Trang 404.
- [x] Trạng thái không có dữ liệu.
- [x] Ảnh responsive và lazy loading.
- [x] Lazy route.
- [x] Contract tests.

## 4. Không thay đổi

Giai đoạn 4 không thay đổi:

- `frontend-admin`.
- `backend`.
- Prisma schema.
- Migration.
- Seed.
- Mock API business routes.
- Auth store.
- Cart store.
- API client.
- Response contract.
- Admin permissions.

## 5. Kiểm tra thủ công bắt buộc

### Desktop

1. Mở từng menu chính.
2. Kiểm tra Header cố định không đè hero.
3. Kiểm tra card dự án và bài viết mở đúng chi tiết.
4. Kiểm tra mọi link chính sách.
5. Kiểm tra form liên hệ.
6. Kiểm tra ảnh không làm nhảy bố cục.

### Mobile

1. Mở menu và đóng bằng backdrop.
2. Mở menu và đóng bằng Escape nếu có bàn phím.
3. Kiểm tra nút hotline/Zalo không che CTA.
4. Kiểm tra hero và form xếp một cột.
5. Kiểm tra bộ lọc bài viết/dự án tự xuống dòng.
6. Kiểm tra Footer không tràn ngang.

### Empty state

1. Vào `/articles`.
2. Nhập từ khóa không tồn tại.
3. Xác nhận trạng thái rỗng và nút xóa bộ lọc.

## 6. Lệnh nghiệm thu

```bash
npm ci
npm run bootstrap
npm run validate:repo
npm run lint
npm run typecheck
npm run test:architecture
npm run build:all
npm run test:mock
```

## 7. Tiêu chí nghiệm thu

- Không có link `#` giả trong Header/Footer.
- Route danh sách và chi tiết tồn tại.
- Slug nội dung tĩnh không trùng.
- Lint, type-check, tests và build pass.
- Không thay đổi nghiệp vụ của Giai đoạn 1–3.
- Trang hiển thị từ 320px đến desktop rộng.
- Ảnh ngoài viewport lazy load.
- Hero image tải ưu tiên.

## 8. Thứ tự merge

1. Merge PR Giai đoạn 2.
2. Retarget và merge PR Giai đoạn 3.
3. Retarget PR Giai đoạn 4 sang `main`.
4. Chạy lại CI sau khi retarget.
5. Kiểm tra diff chỉ còn file Giai đoạn 4.
6. Merge sau khi review giao diện thủ công.
