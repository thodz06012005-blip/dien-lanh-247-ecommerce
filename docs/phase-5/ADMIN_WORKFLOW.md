# Quy trình quản trị nội dung

## Truy cập

```text
http://localhost:5174/#/content
```

Trang quản trị gồm bảy tab:

1. Dịch vụ.
2. Danh mục dịch vụ.
3. Dự án.
4. Bài viết.
5. Danh mục bài viết.
6. Thẻ.
7. Media.

## Tạo nội dung

1. Chọn tab nội dung.
2. Nhấn **Tạo**.
3. Điền title/name. Slug có thể để trống để backend tự sinh.
4. Chọn trạng thái và lịch xuất bản.
5. Điền quan hệ bằng ID hoặc slug đúng theo nhãn form.
6. Với trường JSON, dùng cú pháp JSON hợp lệ.
7. Lưu và kiểm tra preview.

## Trường JSON mẫu

Bảng giá:

```json
[
  { "label": "Vệ sinh máy treo tường", "price": "150.000đ", "note": "Giá tham khảo" }
]
```

Quy trình:

```json
["Tiếp nhận", "Khảo sát", "Báo giá", "Thực hiện", "Bàn giao"]
```

FAQ:

```json
[
  { "question": "Có báo giá trước không?", "answer": "Có, khách hàng xác nhận trước khi thực hiện." }
]
```

Nhiệm vụ dự án:

```json
["Khảo sát tải lạnh", "Vệ sinh dàn lạnh", "Đo thông số", "Nghiệm thu"]
```

## Preview

Preview lấy bản ghi trực tiếp từ admin API nên hiển thị được cả `DRAFT` và nội dung chưa đến lịch xuất bản. Preview không thay đổi trạng thái.

## Ẩn và lưu trữ

- Service, Project, Post: chuyển sang `ARCHIVED`.
- Category, Tag, Media, ServiceCategory: chuyển `isActive = false`.
- Không xóa vật lý qua UI để bảo toàn quan hệ và audit.

## Quy trình xuất bản đề xuất

```text
DRAFT
→ Preview
→ Kiểm tra slug và SEO
→ Đặt publishedAt
→ PUBLISHED
→ Kiểm tra website customer
```

## Kiểm tra trước khi xuất bản

- Title và slug đúng.
- Ảnh có alt text.
- Link trong HTML không chết.
- Nội dung không chứa script.
- Category/tag đúng.
- SEO title và description đủ rõ.
- Lịch xuất bản đúng múi giờ vận hành.
