# 04. Sitemap và Navigation

## 1. Sitemap website khách hàng

```text
/
├── /gioi-thieu
├── /dich-vu
│   └── /dich-vu/:slug
├── /du-an
│   └── /du-an/:slug
├── /tin-tuc
│   └── /tin-tuc/:slug
├── /bao-gia
├── /dat-lich
├── /tra-cuu
├── /yeu-cau/:code
├── /lien-he
├── /tai-khoan
│   ├── /tai-khoan/ho-so
│   ├── /tai-khoan/dia-chi
│   └── /tai-khoan/yeu-cau
└── /chinh-sach/:slug
```

## 2. Header website khách hàng

### Desktop

- Logo.
- Dịch vụ.
- Dự án.
- Quy trình.
- Tin tức.
- Liên hệ.
- Tra cứu.
- CTA “Đặt lịch ngay”.

### Mobile

- Logo.
- Nút menu.
- Menu dạng drawer/dropdown.
- Thanh CTA dưới màn hình: Gọi điện + Đặt lịch.

## 3. Sitemap admin

```text
/admin
├── /dashboard
├── /service-requests
│   └── /service-requests/:id
├── /dispatch-calendar
├── /customers
│   └── /customers/:id
├── /technicians
│   └── /technicians/:id
├── /quotes
├── /payments
├── /services
├── /projects
├── /posts
├── /banners
├── /reviews
├── /users
├── /roles
├── /audit-logs
└── /settings
```

## 4. Quy tắc điều hướng

- Breadcrumb bắt buộc cho admin và trang nội dung cấp sâu.
- Route chi tiết phải có loading, empty, error và not-found state.
- Khi người dùng gửi form thành công, không tự động xóa mã yêu cầu khỏi màn hình.
- Back button phải quay lại đúng bộ lọc trước đó ở admin.
- Query string lưu trạng thái tìm kiếm và bộ lọc quan trọng.

## 5. URL và SEO

- Slug viết thường, không dấu, dùng dấu gạch ngang.
- Dịch vụ, dự án và bài viết có canonical URL.
- Trang tra cứu và tài khoản đặt `noindex`.
- Trang dự án có breadcrumb và metadata riêng.
