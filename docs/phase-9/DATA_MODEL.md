# Mô hình dữ liệu Editorial CMS

## 1. Nguyên tắc thiết kế

Giai đoạn 9 mở rộng dữ liệu Giai đoạn 5 theo hướng additive:

- Không xóa hoặc đổi tên bảng đang được website sử dụng.
- `Service`, `Project`, `Post`, taxonomy và `Media` tiếp tục là nguồn dữ liệu chính.
- Nội dung website toàn cục được tách thành các bảng chuyên biệt.
- Mọi nội dung quản trị có `version`, người cập nhật và soft delete.
- Quan hệ media dùng `ON DELETE SET NULL`; dữ liệu nghiệp vụ dùng `RESTRICT` hoặc soft delete để tránh mất tham chiếu.

## 2. Các bảng hiện có được mở rộng

### Service

Bổ sung:

- `socialImageMediaId`: ảnh Open Graph/social sharing.
- `updatedById`: người cập nhật gần nhất.
- `publishedById`: người xuất bản gần nhất.
- `deletedAt`: thời điểm lưu trữ mềm.
- `version`: số phiên bản hiện tại.

Các trường Giai đoạn 5 vẫn giữ nguyên:

- Nội dung HTML.
- Bảng giá JSON.
- Quy trình JSON.
- Chính sách bảo hành.
- FAQ.
- Dịch vụ liên quan.
- SEO title/description.

### Project

Bổ sung cùng nhóm metadata biên tập như Service. Album ảnh tiếp tục dùng:

```text
Project
  1 ─── n ProjectMedia n ─── 1 Media
```

Khi project bị archive, `ProjectMedia` không bị xóa.

### Post

Bổ sung metadata biên tập và social image. Quan hệ danh mục/thẻ vẫn giữ:

```text
Post n ─── 1 Category
Post 1 ─── n PostTag n ─── 1 Tag
```

### ServiceCategory, Category, Tag và Media

Bổ sung:

- `updatedById`.
- `deletedAt`.
- `version`.
- `socialImageMediaId` cho các taxonomy có trang SEO.

## 3. Bảng mới

### AuthorProfile

Hồ sơ tác giả gắn với một tài khoản nội bộ.

| Trường | Ý nghĩa |
|---|---|
| `userId` | Tài khoản User duy nhất |
| `displayName` | Tên hiển thị trên bài viết |
| `title` | Chức danh |
| `bio` | Tiểu sử |
| `avatarMediaId` | Ảnh đại diện |
| `socialLinks` | JSON các liên kết mạng xã hội |
| `isActive` | Có được chọn làm tác giả hay không |
| `updatedById` | Người chỉnh sửa hồ sơ |
| `deletedAt` | Soft delete |
| `version` | Phiên bản |

Không xóa cứng AuthorProfile khi bài viết còn tham chiếu tới User tác giả.

### Banner

Dùng cho hero, campaign và CTA.

| Nhóm | Trường chính |
|---|---|
| Nội dung | `eyebrow`, `title`, `subtitle` |
| CTA | `ctaLabel`, `ctaUrl`, `secondaryCtaLabel`, `secondaryCtaUrl` |
| Vị trí | `placement`, `theme`, `sortOrder` |
| Media | `desktopMediaId`, `mobileMediaId` |
| Workflow | `status`, `publishedAt`, `startsAt`, `endsAt` |
| Audit | `updatedById`, `publishedById`, `version`, `deletedAt` |

Một banner chỉ được trả về website khi:

```text
status = PUBLISHED
isActive = true
deletedAt IS NULL
publishedAt <= thời điểm hiện tại
startsAt IS NULL hoặc startsAt <= hiện tại
endsAt IS NULL hoặc endsAt >= hiện tại
```

### Partner

Quản lý đối tác và logo.

- `name`.
- `description`.
- `websiteUrl`.
- `logoMediaId`.
- `isFeatured`.
- `sortOrder`.
- Workflow và audit metadata.

### Testimonial

Quản lý đánh giá khách hàng.

- `customerName`.
- `customerTitle`.
- `company`.
- `quote`.
- `rating` từ 1 đến 5.
- `avatarMediaId`.
- `serviceId` tùy chọn.
- `isFeatured`, `sortOrder`.
- Workflow và audit metadata.

### SiteSection

Quản lý nội dung website theo khóa ổn định.

Ví dụ:

```text
HOME_EDITORIAL
HOME_ABOUT
CONTACT
FOOTER
FOOTER_CONTACT
```

Các trường:

- `sectionKey`: khóa duy nhất, không phụ thuộc tiêu đề.
- `name`: tên quản trị.
- `eyebrow`, `title`, `content`.
- `config`: JSON cấu hình liên kết, hotline, màu sắc hoặc bố cục.
- `seoTitle`, `seoDescription`, `canonicalUrl`.
- `socialImageMediaId`.
- Workflow và audit metadata.

### ContentRevision

Lịch sử bất biến của mọi nội dung CMS.

| Trường | Ý nghĩa |
|---|---|
| `entityType` | Loại nội dung, ví dụ `services`, `banners` |
| `entityId` | ID/identifier của bản ghi |
| `action` | CREATE, UPDATE, PUBLISH, UNPUBLISH, ARCHIVE, RESTORE, UPLOAD |
| `version` | Phiên bản sau thao tác |
| `summary` | Ghi chú thao tác |
| `snapshot` | JSON snapshot sau thao tác |
| `actorId` | User thực hiện |
| `actorName` | Tên hiển thị tại thời điểm thao tác |
| `actorEmail` | Email tại thời điểm thao tác |
| `createdAt` | Thời điểm |

`ContentRevision` không được update hoặc delete qua CMS API.

## 4. Quy tắc soft delete

CMS không sử dụng `DELETE FROM` cho nội dung.

Khi archive:

```text
status = ARCHIVED       nếu nội dung có workflow publish
isActive = false        nếu là taxonomy/media/author
deletedAt = NOW()
version = version + 1
```

Khi restore:

```text
status = DRAFT          với nội dung publishable
isActive = true         với taxonomy/media/author
deletedAt = NULL
version = version + 1
```

## 5. Index quan trọng

- Trạng thái xuất bản + thời điểm publish + soft delete.
- `sectionKey` duy nhất.
- `AuthorProfile.userId` duy nhất.
- `ContentRevision(entityType, entityId, createdAt)`.
- `ContentRevision(actorId, createdAt)`.
- `Banner(placement, status, startsAt, endsAt)`.

## 6. Migration và rollback

Migration:

```text
backend/prisma/migrations/20260714210000_phase9_editorial_cms/migration.sql
```

Triển khai:

```bash
npm --prefix backend run prisma:validate
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:migrate:deploy
npm --prefix backend run prisma:seed
```

Rollback production không nên drop trực tiếp bảng vì dữ liệu đã có thể được tham chiếu. Quy trình an toàn:

1. Tắt route CMS mới bằng deployment rollback.
2. Giữ nguyên các cột/bảng additive.
3. Khôi phục phiên bản ứng dụng trước.
4. Chỉ xóa schema bằng migration riêng sau khi đã export và xác nhận không có dữ liệu cần giữ.
