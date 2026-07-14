# Giai đoạn 5 — Nội dung quản trị qua Backend và Admin

## Mục tiêu

Chuyển dịch vụ, dự án và bài viết từ dữ liệu TypeScript tĩnh sang dữ liệu có migration, seed, API công khai và CRUD quản trị. Giai đoạn này kế thừa toàn bộ kiến trúc, Design System và website tĩnh của Giai đoạn 2–4.

## Phạm vi

- Database: `Media`, `Service`, `Project`, `ProjectMedia`, `Tag`, `Post`, `PostTag`.
- Mở rộng bảng có sẵn: `ServiceCategory`, `Category`.
- API public: danh sách, chi tiết slug, lọc, phân trang, nổi bật, category và tag.
- API admin: list/detail/create/update/archive/preview cho 7 nhóm nội dung.
- Customer: dịch vụ, dự án và bài viết lấy dữ liệu từ NestJS.
- Admin: một content workspace responsive, có tìm kiếm, trạng thái, form động, preview và soft archive.

## Branch và quan hệ kế thừa

```text
main
└── agent/phase-2-project-architecture
    └── agent/phase-3-design-system
        └── agent/phase-4-customer-static-pages
            └── agent/phase-5-managed-content
```

PR Giai đoạn 5 phải có base `agent/phase-4-customer-static-pages` để diff không lặp các giai đoạn trước.

## Chạy local

```bash
npm ci
npm run bootstrap

# Backend
cp backend/.env.example backend/.env
npm --prefix backend run prisma:migrate:deploy
npm --prefix backend run prisma:seed
npm run dev:backend

# Customer và Admin
npm run dev:user
npm run dev:admin
```

Customer và Admin cần:

```env
VITE_CONTENT_API_BASE_URL=http://localhost:3000/api/v1
```

## URL chính

```text
Customer
http://localhost:5173/#/services
http://localhost:5173/#/projects
http://localhost:5173/#/articles

Admin
http://localhost:5174/#/content
```

## Tài liệu liên quan

- `DATA_MODEL.md`
- `API_CONTRACT.md`
- `ADMIN_WORKFLOW.md`
- `PHASE_5_HANDOVER.md`
