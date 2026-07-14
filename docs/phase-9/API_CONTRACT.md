# API Contract — Editorial CMS

Base URL:

```text
/api/v1
```

## 1. Quyền truy cập

### Public

Không yêu cầu đăng nhập:

```http
GET /site-content/home
GET /site-content/footer
GET /site-content/all
GET /site-content/section/:key
```

### Admin đọc nội dung

Yêu cầu:

- Admin access cookie hợp lệ.
- Role: `ADMIN`, `SUPERADMIN` hoặc `STAFF`.
- Permission: `content.view`.

### Admin chỉnh sửa

Yêu cầu:

- Admin access cookie hợp lệ.
- Role: `ADMIN` hoặc `SUPERADMIN`.
- Permission: `content.manage`.

Ẩn menu ở frontend không thay thế kiểm tra backend. Gọi URL trực tiếp khi thiếu quyền trả 403.

## 2. Loại nội dung hỗ trợ

```text
services
service-categories
projects
posts
categories
tags
media
banners
partners
testimonials
site-sections
authors
```

## 3. Danh sách nội dung

```http
GET /admin/cms/:type
```

Query:

| Tên | Kiểu | Ý nghĩa |
|---|---|---|
| `page` | number | Mặc định 1 |
| `limit` | number | 1–100 |
| `q` | string | Tìm theo tên/tiêu đề/slug |
| `status` | DRAFT/PUBLISHED/ARCHIVED | Với nội dung publishable |
| `active` | boolean | Trạng thái hoạt động |
| `featured` | boolean | Nội dung nổi bật |
| `includeDeleted` | boolean | Bao gồm soft-deleted records |
| `placement` | string | Lọc banner theo vị trí |

Response:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

## 4. Chi tiết và preview

```http
GET /admin/cms/:type/:identifier
GET /admin/cms/:type/:identifier/preview
```

`identifier` có thể là ID hoặc slug/sectionKey đối với loại hỗ trợ.

Preview trả cả bản nháp và bản đã archive vì route chỉ dành cho admin có quyền đọc.

## 5. Tạo nội dung

```http
POST /admin/cms/:type
Content-Type: application/json
```

Ví dụ SiteSection:

```json
{
  "sectionKey": "HOME_ABOUT",
  "name": "Giới thiệu trang chủ",
  "eyebrow": "Về chúng tôi",
  "title": "Dịch vụ có thể theo dõi",
  "content": "<p>Nội dung...</p>",
  "config": {
    "tone": "light"
  },
  "seoTitle": "Giới thiệu Điện Lạnh 247",
  "seoDescription": "Thông tin đội ngũ và quy trình.",
  "isActive": true
}
```

Nội dung mới mặc định là DRAFT nếu không chỉ định trạng thái.

## 6. Cập nhật nội dung

```http
PATCH /admin/cms/:type/:identifier
Content-Type: application/json
```

Cập nhật:

- Tăng `version`.
- Cập nhật `updatedById`.
- Tạo `ContentRevision` với action `UPDATE`.
- Không tự động publish.

## 7. Publish và unpublish

### Publish

```http
POST /admin/cms/:type/:identifier/publish
```

Payload:

```json
{
  "publishedAt": "2026-07-20T02:00:00.000Z",
  "summary": "Xuất bản chiến dịch tháng 7"
}
```

Bỏ `publishedAt` để publish ngay.

Trạng thái sau thao tác:

```text
status = PUBLISHED
publishedById = admin hiện tại
updatedById = admin hiện tại
deletedAt = NULL
version tăng 1
```

Nội dung có lịch tương lai chưa được public API trả về cho đến đúng thời điểm.

### Unpublish

```http
POST /admin/cms/:type/:identifier/unpublish
```

Kết quả:

```text
status = DRAFT
publishedAt = NULL
version tăng 1
```

## 8. Soft archive và restore

### Archive

```http
DELETE /admin/cms/:type/:identifier
```

Đây không phải hard delete.

### Restore

```http
POST /admin/cms/:type/:identifier/restore
```

Nội dung publishable được khôi phục về DRAFT, không tự động xuất bản lại.

## 9. Lịch sử nội dung

```http
GET /admin/cms/:type/:identifier/history?page=1&limit=20
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "entityType": "site-sections",
      "entityId": "15",
      "action": "PUBLISH",
      "version": 3,
      "summary": "Xuất bản nội dung",
      "snapshot": {},
      "actorId": 1,
      "actorName": "Trưởng Kênh Kỹ Thuật",
      "actorEmail": "admin@dienlanh247.vn",
      "createdAt": "2026-07-14T12:00:00.000Z"
    }
  ],
  "meta": {}
}
```

## 10. Upload media

```http
POST /admin/cms/media/upload
Content-Type: multipart/form-data
```

Fields:

| Tên | Bắt buộc | Ý nghĩa |
|---|---|---|
| `file` | Có | JPEG, PNG, WebP, GIF hoặc PDF |
| `name` | Không | Tên quản trị |
| `altText` | Không | Mô tả SEO/trợ năng |
| `folder` | Không | Thư mục logic |

Giới hạn mặc định: 10 MB.

Response trả bản ghi Media đã lưu, gồm `id`, `url`, `provider`, MIME type, kích thước và version.

## 11. Public site bundle

### Home

```http
GET /site-content/home
```

Trả:

- Banner đang có hiệu lực.
- Đối tác đã publish.
- Đánh giá đã publish.
- SiteSection có key `HOME_*` và `CONTACT`.
- Dịch vụ/dự án/bài viết nổi bật từ module Giai đoạn 5.

### Footer

```http
GET /site-content/footer
```

Trả SiteSection:

- `FOOTER`.
- `FOOTER_*`.
- `CONTACT`.

### Section riêng

```http
GET /site-content/section/FOOTER
```

Chỉ trả nội dung đã publish, đang active, chưa soft delete và đã đến lịch xuất bản.

## 12. Quy ước lỗi

| HTTP | Trường hợp |
|---:|---|
| 400 | Payload, loại nội dung hoặc workflow không hợp lệ |
| 401 | Chưa đăng nhập hoặc phiên hết hạn |
| 403 | Thiếu role/permission |
| 404 | Không tìm thấy nội dung |
| 409 | Slug/sectionKey/userId taxonomy bị trùng |
| 413/400 | Media vượt dung lượng hoặc sai định dạng |

Không trả password, token, cookie hoặc authorization data trong response/revision snapshot.
