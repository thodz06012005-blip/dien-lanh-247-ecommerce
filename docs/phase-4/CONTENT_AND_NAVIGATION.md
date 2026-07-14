# Nội dung và điều hướng Giai đoạn 4

## 1. Nguyên tắc nội dung

Nội dung mẫu tuân theo các nguyên tắc:

- Không tạo lời hứa không thể kiểm chứng.
- Mức giá hiển thị dưới dạng tham khảo.
- Thời gian phản hồi được diễn đạt là dự kiến hoặc theo lịch xác nhận.
- Bảo hành được gắn với hạng mục thực hiện.
- Mỗi CTA phải dẫn đến route tồn tại.
- Dự án mẫu có cấu trúc bài toán, giải pháp và kết quả.
- Bài viết có chủ đề, ngày, thời gian đọc và nội dung theo heading.

## 2. Nguồn dữ liệu tĩnh

Tệp trung tâm:

```text
frontend-user/src/data/phase4Content.ts
```

Các nhóm dữ liệu:

- `services`
- `projects`
- `articles`
- `testimonials`
- `reasons`
- `processSteps`

Mỗi dịch vụ, dự án và bài viết có `slug` duy nhất. Contract test kiểm tra trùng slug.

## 3. Luồng điều hướng chính

```text
Trang chủ
├── Dịch vụ
│   └── Đặt lịch dịch vụ
├── Dự án
│   └── Chi tiết dự án
├── Bài viết
│   └── Chi tiết bài viết
├── Sản phẩm
├── Giới thiệu
├── Liên hệ
└── Chính sách
    ├── Bảo hành
    ├── Bảo mật
    ├── Điều khoản
    ├── Giao nhận
    ├── Đổi trả
    └── Thanh toán
```

## 4. CTA trang chủ

| Khu vực | CTA chính | Route |
|---|---|---|
| Hero | Đặt lịch kỹ thuật | `/service-booking` |
| Dịch vụ | Đặt dịch vụ | `/service-booking?service=...` |
| Giới thiệu | Tìm hiểu về chúng tôi | `/about` |
| Dự án | Xem hồ sơ dự án | `/projects/:slug` |
| Bài viết | Đọc bài viết | `/articles/:slug` |
| Liên hệ | Gửi form | API `/contact` |

## 5. Menu desktop và mobile

Menu dùng chung cùng một mảng cấu hình:

```text
Trang chủ
Dịch vụ
Dự án
Bài viết
Sản phẩm
Giới thiệu
Liên hệ
```

Mobile menu:

- Có backdrop đóng menu.
- Escape đóng menu.
- Khóa scroll body khi mở.
- Tự đóng khi route hoặc query thay đổi.
- Có CTA đặt lịch, hotline và tài khoản.

## 6. Footer

Footer chia thành:

- Thông tin doanh nghiệp.
- Dịch vụ.
- Khám phá.
- Chính sách.
- Đơn hàng và lịch sửa chữa.

Không dùng `href="#"` hoặc `to="#"`.

## 7. Trạng thái không có dữ liệu

### Dự án

Khi bộ lọc không có kết quả:

- Hiển thị icon.
- Nêu rõ không có dữ liệu.
- Hướng dẫn chọn nhóm khác.

### Bài viết

Khi tìm kiếm không có kết quả:

- Hiển thị từ khóa không phù hợp.
- Cung cấp nút xóa bộ lọc.
- Đưa danh sách về trạng thái ban đầu.

## 8. Trang 404

Trang 404 có:

- Thông báo rõ ràng.
- Nút về trang chủ.
- Nút xem dịch vụ.
- Không làm mất Header, Footer và các nút liên hệ nhanh.
