# API nội dung Giai đoạn 5

Base URL mặc định:

```text
http://localhost:3000/api/v1
```

## API công khai

| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `/services` | Danh sách dịch vụ đã xuất bản |
| GET | `/services/featured` | Dịch vụ nổi bật |
| GET | `/services/:slug` | Chi tiết dịch vụ |
| GET | `/projects` | Danh sách dự án |
| GET | `/projects/featured` | Dự án nổi bật |
| GET | `/projects/:slug` | Chi tiết và album dự án |
| GET | `/posts` | Danh sách bài viết |
| GET | `/posts/featured` | Bài viết nổi bật |
| GET | `/posts/:slug` | Chi tiết bài viết và thẻ |
| GET | `/content/categories` | Danh mục bài viết hoạt động |
| GET | `/content/tags` | Thẻ hoạt động |

Query dùng chung:

```text
page=1
limit=12
q=tu-khoa
category=slug-hoac-id
tag=slug
featured=true|false
```

Public API luôn áp dụng:

```sql
status = 'PUBLISHED'
AND (publishedAt IS NULL OR publishedAt <= NOW())
```

## API quản trị

`type` nhận một trong:

```text
services
service-categories
projects
posts
categories
tags
media
```

| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `/admin/content/:type` | Danh sách, tìm kiếm, lọc, phân trang |
| GET | `/admin/content/:type/:id` | Chi tiết quản trị |
| GET | `/admin/content/:type/:id/preview` | Preview kể cả bản nháp |
| POST | `/admin/content/:type` | Tạo nội dung |
| PATCH | `/admin/content/:type/:id` | Cập nhật |
| DELETE | `/admin/content/:type/:id` | Archive/disable, không xóa vật lý |

Quyền đọc admin: STAFF, ADMIN, SUPERADMIN. Quyền ghi: ADMIN, SUPERADMIN.

## Response danh sách

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 0,
    "totalPages": 0
  }
}
```

## Quy tắc slug

- Nếu không truyền slug, backend tự tạo từ title/name.
- Slug được chuẩn hóa chữ thường, bỏ dấu và thay khoảng trắng bằng `-`.
- Khi trùng slug, API trả HTTP 409.

## Ẩn/hiện và lịch xuất bản

- Nội dung chính: `DRAFT`, `PUBLISHED`, `ARCHIVED`.
- Taxonomy/media: `isActive`.
- DELETE chỉ chuyển sang `ARCHIVED` hoặc `isActive = false`.
- Preview sử dụng endpoint admin và không phụ thuộc trạng thái public.
