# Bàn giao Giai đoạn 2 — Kiến trúc dự án

## 1. Tóm tắt

Giai đoạn 2 chuẩn hóa repository hiện hữu thành nền tảng phát triển có cấu trúc cho customer web, admin web và NestJS backend. Code nghiệp vụ hiện có được giữ lại; thay đổi tập trung vào bootstrap, cấu hình, API contract, Prisma workflow, quality gate và tài liệu.

## 2. Branch bàn giao

```text
agent/phase-2-project-architecture
```

Không merge trực tiếp trước khi CI và review hoàn tất.

## 3. Thành phần mới ở root

```text
.editorconfig
.gitattributes
.npmrc
.nvmrc
.prettierignore
.prettierrc.json
README.md
CONTRIBUTING.md
.github/pull_request_template.md
scripts/validate-repository.mjs
tests/architecture/repository.test.mjs
docs/phase-2/
```

## 4. Customer web

### File kiến trúc mới

```text
frontend-user/src/app/AppProviders.tsx
frontend-user/src/components/errors/AppErrorBoundary.tsx
frontend-user/src/config/env.ts
frontend-user/src/router/AppRouter.tsx
frontend-user/src/types/api.ts
frontend-user/src/vite-env.d.ts
frontend-user/tests/architecture.test.mjs
```

### File được chuẩn hóa

```text
frontend-user/.env.example
frontend-user/package.json
frontend-user/tsconfig.app.json
frontend-user/vite.config.ts
frontend-user/src/App.tsx
frontend-user/src/main.tsx
frontend-user/src/services/api.ts
```

### Hành vi cần kiểm tra

- Tất cả route cũ vẫn truy cập được.
- Login/refresh flow vẫn dùng cookie.
- API client không phát nhiều refresh request đồng thời.
- Error boundary xuất hiện khi render exception.
- `VITE_API_BASE_URL` sai định dạng làm ứng dụng fail fast.

## 5. Admin web

### File kiến trúc mới

```text
frontend-admin/src/app/AppProviders.tsx
frontend-admin/src/components/errors/AppErrorBoundary.tsx
frontend-admin/src/config/env.ts
frontend-admin/src/router/AppRouter.tsx
frontend-admin/src/types/api.ts
frontend-admin/src/vite-env.d.ts
frontend-admin/tests/architecture.test.mjs
```

### File được chuẩn hóa

```text
frontend-admin/.env.example
frontend-admin/package.json
frontend-admin/tsconfig.app.json
frontend-admin/vite.config.ts
frontend-admin/src/App.tsx
frontend-admin/src/main.tsx
frontend-admin/src/services/api.ts
```

### Hành vi cần kiểm tra

- Protected routes và role hiện tại vẫn hoạt động.
- Login không bị redirect loop khi nhận `401`.
- Session admin được clear khi endpoint protected trả `401`.
- DELETE request vẫn có confirmation header.
- Ant Design locale/theme vẫn hoạt động.

## 6. Backend

### File mới

```text
backend/src/config/environment.ts
backend/src/common/constants/error-codes.ts
backend/src/common/exceptions/business.exception.ts
backend/src/common/interfaces/api-response.interface.ts
backend/src/common/interceptors/api-response.interceptor.ts
backend/src/common/middleware/request-context.middleware.ts
backend/src/common/middleware/security.middleware.ts
backend/prisma/README.md
backend/prisma/migrations/README.md
backend/test/architecture.test.mjs
```

### File được chuẩn hóa

```text
backend/.env.example
backend/package.json
backend/tsconfig.json
backend/src/app.module.ts
backend/src/main.ts
backend/src/common/filters/http-exception.filter.ts
```

### Hành vi cần kiểm tra

- Existing service response có `success` không bị bọc lồng.
- Raw controller response được bọc vào `data`.
- Mọi response có request ID.
- DTO validation lỗi trả `VALIDATION_ERROR` và details.
- Upload multipart không bị Content-Type guard chặn.
- `413`, `415`, `429`, Prisma unique/not-found có error code đúng.
- Production config từ chối placeholder secret và insecure cookie.

## 7. Cách cài đặt và chạy

```bash
npm ci
npm run bootstrap
```

Mock platform:

```bash
npm run dev:all
```

Full platform:

```bash
npm run prisma:validate
npm run prisma:generate
npm run dev:platform
```

Quality gate:

```bash
npm run ci
```

## 8. Cấu hình local tối thiểu

### Customer/Admin

```dotenv
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_USE_MOCK_API=true
```

### Backend

```dotenv
NODE_ENV=development
DATABASE_URL=mysql://root:password@127.0.0.1:3306/ecommerce
JWT_ACCESS_SECRET=a_local_secret_with_at_least_32_characters
JWT_REFRESH_SECRET=another_local_secret_with_at_least_32_characters
ADMIN_SEED_PASSWORD=a_local_password_with_at_least_12_characters
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

## 9. Pipeline

GitHub Actions thực hiện:

1. Checkout.
2. Setup Node từ `.nvmrc`.
3. `npm ci` cho root, customer, admin, backend, mock-api.
4. Prisma validate/generate.
5. Repository validation.
6. Lint.
7. Type-check.
8. Architecture tests.
9. Build ba ứng dụng.
10. Mock business tests.

## 10. Điểm cần reviewer chú ý

### API compatibility

Global interceptor thêm metadata cho envelope hiện hữu và chỉ bọc raw value. Reviewer cần kiểm tra các endpoint có response đặc biệt như file download, redirect hoặc streaming trước khi mở rộng interceptor sang các module đó.

### Environment validation

Backend yêu cầu `DATABASE_URL`, access secret và refresh secret khi khởi động. Đây là fail-fast có chủ đích. Môi trường chạy test/dev phải cung cấp biến tương ứng.

### Node version

Repository chuẩn hóa Node 22. Máy dùng Node khác có thể bị npm chặn do `engine-strict=true`.

### Baseline migration

Chưa tạo migration SQL giả. Cần cấu hình MySQL development trống và chạy:

```bash
npm --prefix backend run prisma:migrate:dev -- --name init
```

Sau đó review/commit output trước khi staging dùng `prisma migrate deploy`.

## 11. Công việc chưa thuộc Giai đoạn 2

- Chuyển toàn bộ relative import sang alias.
- Lazy loading route.
- OpenAPI code generation.
- Unit test toàn bộ service/controller.
- E2E browser test.
- Docker Compose local.
- Logging/metrics/tracing production.
- Baseline database migration được sinh từ MySQL thật.
- Triển khai staging.

## 12. Đề xuất bước tiếp theo

1. Chạy CI và sửa mọi lỗi tương thích.
2. Smoke test hai frontend với Mock API.
3. Smoke test backend với MySQL development.
4. Sinh baseline migration.
5. Merge sau review.
6. Chuyển sang Giai đoạn 3 — Design System và component nền tảng, hoặc giai đoạn nghiệp vụ ưu tiên đã được chốt.

## 13. Tiêu chí merge

- Diff chỉ thuộc kiến trúc/tooling/docs.
- Không có `.env` thật hoặc secret.
- CI xanh.
- Reviewer xác nhận route và auth không regression.
- Reviewer xác nhận API envelope tương thích.
- Handover và checklist được cập nhật theo kết quả CI thực tế.
