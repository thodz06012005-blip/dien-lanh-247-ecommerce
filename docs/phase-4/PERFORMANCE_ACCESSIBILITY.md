# Hiệu năng, ảnh và accessibility Giai đoạn 4

## 1. Mục tiêu Lighthouse cơ bản

Mục tiêu của Giai đoạn 4 là đạt mức chấp nhận được trong môi trường build/preview với các tiêu chí:

- Không có lỗi điều hướng nghiêm trọng.
- Không có ảnh thiếu kích thước gây layout shift rõ rệt.
- Trang phụ được tách bundle bằng `React.lazy`.
- Ảnh ngoài viewport dùng lazy loading.
- Hero dùng tải ưu tiên.
- Metadata, viewport và theme color đầy đủ.
- Không có link `#` giả.
- Các phần tử tương tác có tên truy cập được.

Lighthouse thực tế phụ thuộc máy chạy, kết nối mạng, trạng thái Mock API và tốc độ CDN ảnh. Không sử dụng một con số cứng làm điều kiện CI ở giai đoạn này.

## 2. Component ảnh

Tệp:

```text
frontend-user/src/components/common/OptimizedImage.tsx
```

Hành vi:

- Gắn `width` và `height` mặc định.
- Sinh `srcSet` theo nhiều độ rộng cho ảnh Unsplash.
- Gắn thuộc tính `sizes`.
- `loading="lazy"` cho ảnh thông thường.
- `loading="eager"` và `fetchPriority="high"` cho ảnh ưu tiên.
- `decoding="async"`.
- Có trạng thái fallback khi ảnh lỗi.
- Không tải ảnh nền lớn bằng CSS khi có thể dùng `<img>`.

## 3. Quy tắc sử dụng ảnh

- Hero: `priority` và chỉ một ảnh LCP chính.
- Ảnh card: lazy loading, kích thước 720–960px tùy layout.
- Gallery: lazy loading và `sizes` phù hợp grid.
- Tất cả ảnh có `alt` mô tả nội dung.
- Ảnh trang trí nên có `aria-hidden` hoặc alt rỗng; Giai đoạn 4 chủ yếu dùng ảnh nội dung.
- Không dùng ảnh base64 lớn trong source.

## 4. Code splitting

`AppRouter.tsx` giữ trang chủ import trực tiếp và lazy load các trang phụ:

- Services.
- Projects.
- ProjectDetail.
- Articles.
- ArticleDetail.
- About.
- Contact.
- Policy.
- Các trang thương mại và tài khoản hiện hữu.

`Suspense` có trạng thái tải có `role="status"` và `aria-live="polite"`.

## 5. Metadata và kết nối ngoài

`frontend-user/index.html` có:

- `lang="vi"`.
- `viewport`.
- `theme-color`.
- `robots`.
- SEO description.
- Open Graph cơ bản.
- Preconnect Google Fonts.
- Preconnect và DNS prefetch Unsplash.
- Không chứa `og:url` trỏ localhost.

## 6. Điều hướng bàn phím

- Skip link từ Giai đoạn 3 được giữ nguyên.
- Main content được focus sau khi đổi route.
- Mobile menu đóng bằng Escape.
- Nút mở menu có `aria-expanded` và `aria-controls`.
- Bộ lọc dùng button và `aria-pressed`.
- Link và button có focus-visible.
- Nút liên hệ nổi có accessible label.

## 7. Responsive checklist

Kiểm tra thủ công tại:

- 320px.
- 375px.
- 640px.
- 768px.
- 1024px.
- 1280px.
- 1440px.

Các điểm cần kiểm tra:

- Header không đè nội dung.
- Mobile menu không tràn ngang.
- CTA có chiều cao tối thiểu 44px.
- Hero không che form.
- Grid dịch vụ, dự án và bài viết chuyển cột đúng.
- Chuỗi email và địa chỉ có thể xuống dòng.
- Footer không tạo cột quá hẹp.
- Nút hotline/Zalo không che nút form ở mobile.
- Breadcrumb không gây tràn ngang.

## 8. Lệnh preview và Lighthouse thủ công

```bash
npm --prefix frontend-user run build
npm --prefix frontend-user run preview -- --host 0.0.0.0
```

Mở website preview rồi chạy Lighthouse ở chế độ Mobile và Desktop. Nên đo ít nhất ba lần và lấy kết quả trung vị.

## 9. Rủi ro còn lại

- Ảnh Unsplash phụ thuộc mạng và CDN ngoài.
- Google Fonts là tài nguyên ngoài; `display=swap` giảm nguy cơ chữ không hiển thị.
- HashRouter không phù hợp SEO production bằng SSR, nhưng được giữ để không phá kiến trúc hiện hữu.
- Form liên hệ phụ thuộc Mock API/backend khi chạy thật.
