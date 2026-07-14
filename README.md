# Điện Lạnh 247 Platform

Nền tảng thương mại điện tử và quản lý dịch vụ điện lạnh gồm ba ứng dụng chính:

- `frontend-user`: website dành cho khách hàng.
- `frontend-admin`: cổng quản trị và điều phối vận hành.
- `backend`: REST API NestJS kết nối MySQL bằng Prisma.

Repository vẫn giữ `mock-api` để phát triển giao diện hoặc kiểm thử nghiệp vụ khi backend/MySQL chưa sẵn sàng.

## 1. Kiến trúc tổng quan

```text
Browser khách hàng ──► frontend-user :5173 ─┐
                                             ├──► backend :3000 ──► MySQL :3306
Browser quản trị ────► frontend-admin :5174 ┘

Chế độ mock:
frontend-user/admin ──► mock-api :3001
```

### Công nghệ chính

| Thành phần | Công nghệ |
| --- | --- |
| Customer Web | React, TypeScript, Vite, Tailwind CSS, React Router, React Query, Zustand |
| Admin Web | React, TypeScript, Vite, Tailwind CSS, Ant Design, React Query, Zustand |
| Backend | NestJS, TypeScript, Prisma ORM, MySQL |
| Kiểm tra mã | ESLint, Prettier, TypeScript, Node Test Runner, Jest |
| CI | GitHub Actions |

## 2. Yêu cầu môi trường

- Node.js `22.x`.
- npm `10.x` trở lên.
- MySQL `8.x` nếu chạy backend thật.
- Git.

Kiểm tra nhanh:

```bash
node --version
npm --version
git --version
```

Nếu dùng `nvm`:

```bash
nvm install
nvm use
```

## 3. Cài đặt sạch trên máy mới

Clone repository và cài dependency theo lockfile:

```bash
git clone <repository-url>
cd dien-lanh-247-ecommerce
npm ci
npm run bootstrap
```

`npm run bootstrap` cài độc lập dependency cho:

1. `frontend-user`.
2. `frontend-admin`.
3. `backend`.
4. `mock-api`.

Không thay `npm ci` bằng `npm install` trong CI hoặc khi cần tái tạo chính xác môi trường từ `package-lock.json`.

## 4. Cấu hình biến môi trường

Tạo file môi trường thật từ từng file mẫu. Không commit các file vừa tạo.

### Windows PowerShell

```powershell
Copy-Item frontend-user/.env.example frontend-user/.env
Copy-Item frontend-admin/.env.example frontend-admin/.env
Copy-Item backend/.env.example backend/.env
```

### macOS/Linux

```bash
cp frontend-user/.env.example frontend-user/.env
cp frontend-admin/.env.example frontend-admin/.env
cp backend/.env.example backend/.env
```

### Chế độ mock

Trong hai frontend:

```dotenv
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_USE_MOCK_API=true
```

### Chế độ backend thật

Trong hai frontend:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_USE_MOCK_API=false
```

Trong `backend/.env`, tối thiểu phải cấu hình:

```dotenv
NODE_ENV=development
DATABASE_URL=mysql://root:your_password@127.0.0.1:3306/ecommerce
JWT_ACCESS_SECRET=replace_with_a_random_secret_of_at_least_32_characters
JWT_REFRESH_SECRET=replace_with_another_random_secret_of_at_least_32_characters
ADMIN_SEED_EMAIL=admin@dienlanh247.vn
ADMIN_SEED_PASSWORD=replace_with_a_password_of_at_least_12_characters
```

## 5. Chuẩn bị cơ sở dữ liệu

Tạo database MySQL:

```sql
CREATE DATABASE ecommerce
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Sinh Prisma Client và tạo migration phát triển:

```bash
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:migrate:dev -- --name init
npm --prefix backend run prisma:seed
```

Khi triển khai staging/production, chỉ dùng migration đã được commit:

```bash
npm --prefix backend run prisma:migrate:deploy
```

Không dùng `prisma db push` cho production vì thao tác đó không tạo lịch sử migration có thể kiểm soát và review.

## 6. Khởi chạy ứng dụng

### Chạy với Mock API

```bash
npm run dev:all
```

- Customer Web: `http://localhost:5173`
- Admin Web: `http://localhost:5174`
- Mock API: `http://localhost:3001/api/v1`

### Chạy với NestJS Backend

```bash
npm run dev:platform
```

- Customer Web: `http://localhost:5173`
- Admin Web: `http://localhost:5174`
- NestJS API: `http://localhost:3000/api/v1`

### Chạy từng ứng dụng độc lập

```bash
npm run dev:user
npm run dev:admin
npm run dev:backend
npm run dev:mock
```

## 7. Lệnh kiểm tra chất lượng

```bash
npm run validate:repo
npm run lint
npm run typecheck
npm run test
npm run build
npm run check:all
npm run ci
```

Ý nghĩa:

| Script | Mục đích |
| --- | --- |
| `validate:repo` | Kiểm tra cấu trúc, file môi trường, script bắt buộc và nguy cơ commit secret |
| `lint` | Chạy ESLint cho ba ứng dụng và kiểm tra cú pháp Mock API |
| `typecheck` | Kiểm tra TypeScript không phát sinh output |
| `test` | Chạy architecture tests và các test nghiệp vụ Mock API |
| `build` | Build customer, admin và backend |
| `check:all` | Chạy toàn bộ quality gate không làm thay đổi file |
| `ci` | Quality gate đầy đủ dành cho GitHub Actions |
| `format` | Định dạng repository bằng Prettier |
| `format:check` | Kiểm tra định dạng mà không ghi file |

## 8. Cấu trúc thư mục

```text
.
├── .github/
│   ├── workflows/ci.yml
│   └── pull_request_template.md
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── common/
│   │   ├── config/
│   │   ├── core/
│   │   ├── integrations/
│   │   └── modules/
│   └── test/
├── frontend-admin/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── config/
│       ├── layouts/
│       ├── pages/
│       ├── router/
│       ├── services/
│       ├── store/
│       └── types/
├── frontend-user/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── config/
│       ├── layouts/
│       ├── pages/
│       ├── router/
│       ├── services/
│       ├── store/
│       └── types/
├── mock-api/
├── scripts/
├── tests/
└── docs/
```

## 9. Quy ước API

Response thành công:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message",
  "meta": {},
  "requestId": "request-id",
  "timestamp": "2026-07-14T00:00:00.000Z",
  "path": "/api/v1/example"
}
```

Response lỗi:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Dữ liệu không hợp lệ",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": []
  },
  "requestId": "request-id",
  "timestamp": "2026-07-14T00:00:00.000Z",
  "method": "POST",
  "path": "/api/v1/example"
}
```

Chi tiết nằm trong `docs/phase-2/02_API_CONVENTIONS.md`.

## 10. Git workflow

Branch:

```text
feature/<short-description>
fix/<short-description>
security/<short-description>
docs/<short-description>
chore/<short-description>
```

Commit theo Conventional Commits:

```text
feat(scope): add a capability
fix(scope): correct a defect
docs(scope): update documentation
refactor(scope): restructure without behavior change
test(scope): add or update tests
chore(scope): update tooling or maintenance files
```

Đọc `CONTRIBUTING.md` trước khi mở Pull Request.

## 11. Nguyên tắc bảo mật

- Không commit `.env`, khóa API, JWT secret, mật khẩu hoặc database dump.
- Chỉ commit `.env.example` chứa placeholder.
- Cookie xác thực phải dùng `HttpOnly`; production phải dùng `Secure`.
- Không ghi password, cookie hoặc token vào log/audit log.
- Mọi thao tác nguy hiểm phải có xác nhận và audit trail.
- CI sẽ chạy `validate:repo` để phát hiện file môi trường thật và một số mẫu secret phổ biến.

## 12. Xử lý lỗi thường gặp

### `npm ci` báo lockfile không đồng bộ

Không sửa lockfile thủ công. Chạy `npm install` đúng tại ứng dụng đã thay dependency, review thay đổi `package-lock.json`, sau đó commit cả `package.json` và lockfile.

### Frontend không gọi được API

Kiểm tra:

1. `VITE_API_BASE_URL`.
2. Backend hoặc Mock API đã chạy chưa.
3. Port có bị ứng dụng khác sử dụng không.
4. CORS trong `backend/.env` có chứa origin `5173` và `5174` không.

### Prisma không kết nối MySQL

Kiểm tra `DATABASE_URL`, database đã tồn tại, MySQL đang chạy và user có quyền tạo/đọc/ghi bảng.

### Build Vite không nhận alias `@/`

Kiểm tra đồng thời `tsconfig.app.json` và `vite.config.ts`; cả hai phải ánh xạ `@` đến thư mục `src`.

## 13. Tài liệu Giai đoạn 2

- `docs/phase-2/00_README.md`
- `docs/phase-2/01_ARCHITECTURE.md`
- `docs/phase-2/02_API_CONVENTIONS.md`
- `docs/phase-2/03_ENVIRONMENT_AND_SECURITY.md`
- `docs/phase-2/04_DEVELOPMENT_WORKFLOW.md`
- `docs/phase-2/05_ACCEPTANCE_CHECKLIST.md`
- `docs/phase-2/06_HANDOVER.md`
