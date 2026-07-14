# Giai đoạn 9 — Editorial CMS

## Mục tiêu

Giai đoạn 9 cho phép nhân sự nội bộ cập nhật nội dung website mà không cần sửa mã nguồn. Hệ thống mở rộng module managed content của Giai đoạn 5 và dùng trực tiếp nền admin authentication, permission guard, Data Table và form framework của Giai đoạn 8.

## Phạm vi quản trị

- Dịch vụ và danh mục dịch vụ.
- Bảng giá, quy trình, bảo hành, FAQ và dịch vụ liên quan.
- Dự án, khách hàng, địa điểm, nhiệm vụ, kết quả và album ảnh.
- Bài viết, danh mục, thẻ, tác giả, SEO và lịch xuất bản.
- Banner theo vị trí và khoảng thời gian hiển thị.
- Đối tác, đánh giá khách hàng và nội dung nổi bật.
- Khu vực website như `HOME_*`, `CONTACT`, `FOOTER`.
- Thư viện media với alt text và nguồn lưu trữ.

## Workflow nội dung

```text
DRAFT
  ├── Preview
  ├── Update → DRAFT
  └── Publish ngay / Publish theo lịch
           ↓
       PUBLISHED
          ├── Update
          ├── Unpublish → DRAFT
          └── Archive → ARCHIVED + deletedAt

ARCHIVED
  └── Restore → DRAFT
```

Không có thao tác xóa cứng trong CMS. Mọi nội dung đã lưu trữ vẫn còn trong database để bảo toàn quan hệ tham chiếu và lịch sử.

## Kiến trúc

### Backend

- `EditorialCmsController`: API công khai và API quản trị.
- `EditorialCmsService`: workflow create/update/publish/unpublish/archive/restore.
- `ContentRevisionService`: revision bất biến theo actor/version.
- `ContentMediaService`: upload local hoặc Cloudinary.
- `ContentService`: tiếp tục là nguồn dữ liệu Service/Project/Post hiện có.

### Admin

- `/content`: Editorial CMS Hub.
- `AdminDataTable`: tìm kiếm, sort, filter, phân trang, chọn nhiều dòng và export.
- `CmsEditorDrawer`: editor nhiều tab.
- `RichContentEditor`: soạn HTML và preview sandbox.
- `MediaLibrary`: upload, tìm kiếm và chọn media.
- `CmsPreviewModal`: preview draft không cần publish.
- `CmsHistoryDrawer`: timeline revision.

### Website khách hàng

- `GET /api/v1/site-content/home`.
- `GET /api/v1/site-content/footer`.
- `GET /api/v1/site-content/section/:key`.
- Trang chủ và Footer có fallback tĩnh an toàn nếu CMS chưa được cấu hình hoặc API tạm thời không khả dụng.

## Chạy local

```bash
git checkout agent/phase-9-editorial-cms
npm ci
npm run bootstrap
npm --prefix backend run prisma:migrate:deploy
npm --prefix backend run prisma:seed
npm run dev:platform
```

Địa chỉ:

- Customer: `http://localhost:5173`
- Admin CMS: `http://localhost:5174/#/content`
- Backend: `http://localhost:3000/api/v1`

## Cấu hình media

Development/CI:

```env
MEDIA_STORAGE_DRIVER=local
MEDIA_STORAGE_PATH=./storage
MEDIA_MAX_BYTES=10485760
```

Production:

```env
MEDIA_STORAGE_DRIVER=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
MEDIA_MAX_BYTES=10485760
```

## Tài liệu liên quan

- [DATA_MODEL.md](./DATA_MODEL.md)
- [API_CONTRACT.md](./API_CONTRACT.md)
- [EDITORIAL_WORKFLOW.md](./EDITORIAL_WORKFLOW.md)
- [MEDIA_AND_SECURITY.md](./MEDIA_AND_SECURITY.md)
- [CI_ACCEPTANCE.md](./CI_ACCEPTANCE.md)
- [PHASE_9_HANDOVER.md](./PHASE_9_HANDOVER.md)
