# Nghiệm thu CI — Giai đoạn 9

## 1. Quality workflow

Workflow:

```text
Phase 9 Editorial CMS Quality
```

File:

```text
.github/workflows/phase9-quality.yml
```

Các bước bắt buộc:

- Clean install toàn bộ workspace.
- Prisma Client generation.
- ESLint toàn repository.
- TypeScript customer/admin/backend.
- Architecture contracts Giai đoạn 2–9.
- Customer build.
- Admin build.
- Backend build.

Run nghiệm thu chuyên biệt trên commit code:

```text
0409d3130c156688b6760f8c5237598d72a5cc72
```

Kết quả:

```text
Run 29352542411 — PASS
```

## 2. Editorial CMS integration

Workflow:

```text
Phase 9 Editorial CMS Integration
```

File:

```text
.github/workflows/phase9-editorial-cms-integration.yml
```

Môi trường:

- Ubuntu runner.
- Node theo `.nvmrc`.
- MySQL 8 sạch.
- Local media driver.
- Backend production build/runtime.
- Admin cookie authentication thật.

Run nghiệm thu chuyên biệt:

```text
Run 29352542414 — PASS
```

Các bước đã kiểm tra:

- Toàn bộ migration Giai đoạn 1–9.
- Seed platform hai lần.
- Không có SiteSection key trùng.
- Bảng Banner, SiteSection và ContentRevision tồn tại.
- Admin chưa đăng nhập nhận 401.
- Tạo SiteSection DRAFT.
- HTML nguy hiểm được loại bỏ.
- Draft preview thành công.
- Draft không xuất hiện công khai.
- Publish phản ánh đúng trong `site-content/home`.
- Cập nhật tăng version.
- Lịch sử chứa CREATE, PUBLISH và UPDATE.
- Actor email đúng tài khoản admin.
- Unpublish loại nội dung khỏi public bundle.
- Upload media local tạo file và metadata.
- Partner publish xuất hiện công khai.
- Archive là soft delete.
- Bản ghi archive vẫn truy vấn được khi `includeDeleted=true`.
- Restore đưa nội dung về DRAFT.
- ContentRevision, Media và Partner được hậu kiểm trực tiếp trong MySQL.
- Backend log không chứa chuỗi giống JWT.

## 3. Architecture contracts

File:

```text
tests/architecture/phase9-editorial-cms.test.mjs
```

Contract khóa:

- Migration additive.
- Có đầy đủ bảng editorial.
- Workflow không sử dụng `DELETE FROM`.
- Có revision actor/snapshot.
- CMS client không đọc token storage.
- Đủ publish/unpublish/archive/restore/history/upload APIs.
- Editor có content/media/SEO/settings.
- Preview dùng sandbox.
- Website có CMS bundle và fallback.
- Upload không cho SVG.
- Local uploads được serve từ backend.

## 4. Tiêu chí nghiệm thu chức năng

### Nội dung cập nhật phản ánh đúng lên website

PASS khi:

1. Tạo draft.
2. Public API chưa trả draft.
3. Publish.
4. Public API trả đúng title/content.
5. Unpublish.
6. Public API không còn trả bản ghi.

### Không xóa cứng dữ liệu đang tham chiếu

PASS khi:

- DELETE CMS chỉ đặt `deletedAt`.
- Bản ghi vẫn tồn tại và truy vấn được.
- Restore thành công.
- Service không chứa SQL `DELETE FROM`.

### Có lịch sử người cập nhật

PASS khi:

- CREATE/UPDATE/PUBLISH/UNPUBLISH/ARCHIVE/RESTORE tạo revision.
- Revision lưu actorId/name/email.
- Version tăng sau thao tác.
- Snapshot đã sanitize trường nhạy cảm.

## 5. Regression cần chạy trước merge

Sau khi retarget PR về `main`, cần PASS trên cùng head SHA:

- Continuous Integration.
- Customer Lighthouse.
- Phase 5 Content Integration.
- Phase 6 Quality Diagnostics.
- Phase 6 Service Request Integration.
- Phase 7 Quality Diagnostics.
- Phase 7 Customer Account Integration.
- Phase 8 Admin Quality.
- Phase 8 Admin Integration.
- Phase 9 Editorial CMS Quality.
- Phase 9 Editorial CMS Integration.

Sau regression, PR phải trả lại base:

```text
agent/phase-8-admin-platform-foundation
```

## 6. Smoke test staging

- [ ] Admin login và refresh session.
- [ ] STAFF chỉ xem, không sửa.
- [ ] ADMIN tạo/sửa/publish nội dung.
- [ ] Banner đúng lịch hiển thị.
- [ ] Trang chủ hiển thị campaign/testimonial/partner.
- [ ] Footer đọc CONTACT/FOOTER config.
- [ ] Service/Project/Post cũ vẫn hoạt động.
- [ ] Upload Cloudinary thành công.
- [ ] Preview draft không chạy script.
- [ ] Archive không tạo link/ảnh hỏng.
- [ ] Revision hiển thị đúng actor.

## 7. Điều kiện chuyển PR sang Ready

Chỉ chuyển Ready khi:

- PR #10 đã merge.
- PR #11 được retarget về main.
- Mọi required check PASS trên head mới.
- Migration đã test trên staging backup.
- Smoke test đã hoàn tất.
- PR #11 không behind main.
