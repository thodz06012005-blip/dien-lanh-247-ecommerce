# Bàn giao Giai đoạn 5

## Phạm vi đã thực hiện

- Migration additive cho nội dung quản trị.
- Seed content idempotent chạy sau core seed.
- NestJS module dùng PrismaService và câu lệnh tham số hóa.
- Public API và admin API có RBAC.
- Customer lists/details lấy dữ liệu backend.
- Admin CRUD, preview, filter, pagination và soft archive.
- Contract tests cho migration, route, visibility, slug và việc loại bỏ dữ liệu tĩnh ở các trang chính.

## File trọng tâm

```text
backend/prisma/migrations/20260714050000_phase5_managed_content/migration.sql
backend/prisma/seed-content.ts
backend/src/modules/content/
frontend-user/src/services/contentApi.ts
frontend-user/src/pages/ServiceDetail.tsx
frontend-admin/src/services/contentApi.ts
frontend-admin/src/pages/Content.tsx
tests/architecture/phase5-managed-content.test.mjs
```

## Không thay đổi

- Schema và nghiệp vụ đơn hàng.
- Luồng giỏ hàng, thanh toán và sản phẩm.
- Service Request và Technician state machine.
- Mock API nghiệp vụ.
- Authentication contract hiện hữu.
- Design System Giai đoạn 3.

## Nghiệm thu bắt buộc

```bash
npm ci
npm run bootstrap
npm run validate:repo
npm run lint
npm run typecheck
npm run test:architecture
npm run build:all
npm run test:mock
```

Kiểm tra database thực tế:

```bash
npm --prefix backend run prisma:migrate:deploy
npm --prefix backend run prisma:seed
```

## Kiểm tra thủ công

1. Mở admin `/#/content`.
2. Tạo một service ở trạng thái DRAFT.
3. Xác nhận service không xuất hiện trên customer.
4. Mở preview trong admin.
5. Chuyển PUBLISHED và đặt thời gian hiện tại.
6. Xác nhận xuất hiện trên `/services` và mở được `/services/:slug`.
7. Thử tạo slug trùng và xác nhận API trả 409.
8. Thử lọc, phân trang và archive.
9. Lặp lại với Project và Post.
10. Kiểm tra album Project, tag Post và alt text Media.

## Rủi ro và giới hạn đã biết

- Migration dùng raw SQL vì schema Prisma hiện hữu đang có bảng Category và ServiceCategory phục vụ nghiệp vụ cũ. API nội dung dùng PrismaService raw query có tham số để giữ thay đổi additive và tránh refactor các module cũ trong cùng giai đoạn.
- Trường `content` nhận HTML từ admin. Khi mở quyền biên tập cho nhiều vai trò hơn, giai đoạn bảo mật tiếp theo cần bổ sung HTML sanitizer phía server.
- Upload file nhị phân chưa thuộc phạm vi này; Media CRUD quản trị metadata/URL và sẵn sàng kết nối Cloudinary module ở giai đoạn tích hợp upload.

## Thứ tự merge

1. Merge Giai đoạn 2.
2. Merge Giai đoạn 3.
3. Merge Giai đoạn 4.
4. Retarget PR Giai đoạn 5 về `main`.
5. Chạy lại CI và migration trên môi trường staging.
6. Merge Giai đoạn 5.
