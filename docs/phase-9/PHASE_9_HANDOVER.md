# Bàn giao Giai đoạn 9 — Editorial CMS

## 1. Git references

```text
Repository: thodz06012005-blip/dien-lanh-247-ecommerce
Base branch: agent/phase-8-admin-platform-foundation
Head branch: agent/phase-9-editorial-cms
Base commit: cc0e9caae7fb189fd036553fe3f24b24a605d473
Pull request: #11
```

PR #11 là stacked PR và không được merge trước PR #10.

## 2. Phạm vi đã hoàn thành

### Backend

- Migration additive Giai đoạn 9.
- Seed editorial idempotent.
- API CRUD chung cho 12 loại nội dung.
- Preview draft.
- Publish ngay và publish theo lịch.
- Unpublish.
- Soft archive và restore.
- Revision bất biến theo actor/version.
- Upload media local/Cloudinary.
- Sanitization rich HTML.
- Public site bundles cho Home/Footer.
- Permission guards `content.view` và `content.manage`.

### Admin

- Content Hub hiện đại tại `/#/content`.
- Module switcher theo nhóm.
- Data Table: search, sort, filter, pagination, select, export và bulk archive.
- Editor bốn tab: Content, Media, SEO, Settings.
- Rich content toolbar.
- Media library và upload.
- Draft preview sandbox.
- Revision timeline và snapshot.
- Publish schedule dialog.
- UI chỉ đọc khi thiếu `content.manage`.

### Customer website

- Trang chủ đọc banner/campaign, SiteSection, testimonial và partner đã publish.
- Footer đọc CONTACT/FOOTER config.
- Fallback tĩnh bảo đảm website vẫn có nội dung khi CMS chưa cấu hình hoặc API lỗi.
- Service/Project/Post public APIs Giai đoạn 5 vẫn là nguồn dữ liệu chính.

## 3. File quan trọng

### Database

```text
backend/prisma/migrations/20260714210000_phase9_editorial_cms/migration.sql
backend/prisma/seed-editorial-cms.ts
```

### Backend

```text
backend/src/modules/content/editorial-cms.types.ts
backend/src/modules/content/dto/editorial-cms.dto.ts
backend/src/modules/content/editorial-cms.controller.ts
backend/src/modules/content/editorial-cms.service.ts
backend/src/modules/content/content-revision.service.ts
backend/src/modules/content/content-media.service.ts
```

### Admin

```text
frontend-admin/src/pages/EditorialCms.tsx
frontend-admin/src/services/cmsApi.ts
frontend-admin/src/config/cmsContentTypes.ts
frontend-admin/src/components/cms/CmsEditorDrawer.tsx
frontend-admin/src/components/cms/RichContentEditor.tsx
frontend-admin/src/components/cms/MediaLibrary.tsx
frontend-admin/src/components/cms/CmsPreviewModal.tsx
frontend-admin/src/components/cms/CmsHistoryDrawer.tsx
```

### Customer

```text
frontend-user/src/services/contentApi.ts
frontend-user/src/components/cms/CmsManagedHomepage.tsx
frontend-user/src/pages/Home.tsx
frontend-user/src/components/layout/Footer.tsx
```

### Tests/CI

```text
tests/architecture/phase9-editorial-cms.test.mjs
backend/test/phase9-editorial-cms.integration.mjs
.github/workflows/phase9-quality.yml
.github/workflows/phase9-editorial-cms-integration.yml
```

## 4. Chạy local

```bash
git fetch origin
git checkout agent/phase-9-editorial-cms

npm ci
npm run bootstrap
npm --prefix backend run prisma:migrate:deploy
npm --prefix backend run prisma:seed
npm run dev:platform
```

Địa chỉ:

```text
Customer: http://localhost:5173
Admin: http://localhost:5174/#/content
Backend: http://localhost:3000/api/v1
```

## 5. Admin seed

Cần cấu hình:

```env
ADMIN_SEED_EMAIL=admin@dienlanh247.vn
ADMIN_SEED_PASSWORD=<mật-khẩu-tối-thiểu-12-ký-tự>
```

Seed sẽ:

- Tạo/cập nhật admin.
- Tạo nội dung Giai đoạn 5.
- Đồng bộ workflow dịch vụ.
- Tạo dữ liệu CMS mẫu Giai đoạn 9.

Seed chạy hai lần không tạo SiteSection/Author trùng.

## 6. Production environment

```env
NODE_ENV=production
COOKIE_SECURE=true
JWT_ACCESS_SECRET=<secret-riêng>
JWT_REFRESH_SECRET=<secret-riêng>
CORS_ORIGINS=https://customer-domain,https://admin-domain
FRONTEND_USER_URL=https://customer-domain
FRONTEND_ADMIN_URL=https://admin-domain

MEDIA_STORAGE_DRIVER=cloudinary
MEDIA_MAX_BYTES=10485760
CLOUDINARY_CLOUD_NAME=<name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
```

Không dùng local media driver cho nhiều backend instance nếu không có shared volume/object storage.

## 7. Kết quả nghiệm thu chuyên biệt

### Phase 9 Editorial CMS Quality

```text
Run: 29352542411
Result: PASS
```

Bao phủ lint, typecheck, architecture contracts và build toàn bộ ứng dụng.

### Phase 9 Editorial CMS Integration

```text
Run: 29352542414
Result: PASS
```

Bao phủ clean MySQL, migration/seed hai lần, backend runtime, auth, draft, preview, publish, website reflection, unpublish, revision actor, upload media, soft archive và restore.

## 8. Tương thích ngược

Không thay đổi business logic của:

- Pricing/cart/checkout.
- Orders.
- Product administration.
- Service request lifecycle Giai đoạn 6.
- Customer account/security Giai đoạn 7.
- Admin session/permission/dashboard Giai đoạn 8.
- Existing public Service/Project/Post list/detail APIs.

Các thay đổi database đều additive.

## 9. Hạn chế có chủ đích

- Rich editor là editor HTML có toolbar, chưa phải block editor kéo-thả.
- Sanitizer dùng allow-deny logic nội bộ; khi mở embed phức tạp cần thư viện sanitizer chuyên dụng.
- Archive media chưa xóa object vật lý để bảo vệ nội dung tham chiếu.
- Preview mô phỏng nội dung, không thay thế smoke test staging trong layout cuối.
- AuthorProfile gắn với User; quản lý tài khoản nhân sự nâng cao thuộc giai đoạn quyền/tổ chức tiếp theo.

## 10. Thứ tự merge an toàn

```text
1. Merge PR #10 — Phase 8.
2. Retarget PR #11 về main.
3. Cập nhật branch nếu main đã thay đổi.
4. Chạy lại toàn bộ required checks.
5. Deploy migration lên staging có backup.
6. Chạy smoke test CMS và public website.
7. Chuyển PR #11 từ Draft sang Ready.
8. Merge PR #11.
```

Không merge PR #11 khi base vẫn là branch Phase 8 chưa merge.

## 11. Checklist bàn giao

- [x] CMS CRUD.
- [x] Rich content editor.
- [x] Media upload.
- [x] Draft preview.
- [x] Publish/unpublish/schedule.
- [x] Soft delete/restore.
- [x] SEO/social image.
- [x] Revision actor history.
- [x] Website reflection.
- [x] Permission guard.
- [x] Migration và seed.
- [x] Quality workflow.
- [x] HTTP integration workflow.
- [x] Tài liệu vận hành.
