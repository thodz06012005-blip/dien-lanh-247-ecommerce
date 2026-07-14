# Lệnh xác minh Giai đoạn 2

Tài liệu này cung cấp các lệnh tái hiện nghiệm thu trên máy mới và trong CI.

## 1. Clean install

```bash
npm ci
npm --prefix frontend-user ci
npm --prefix frontend-admin ci
npm --prefix backend ci
npm --prefix mock-api ci
```

Hoặc:

```bash
npm ci
npm run bootstrap
```

Kết quả mong đợi:

- Không thay đổi lockfile.
- Không cần cài Nest CLI toàn cục.
- Không cần dùng `--legacy-peer-deps`.

## 2. Repository validation

```bash
npm run validate:repo
node --test tests/architecture
```

Kết quả mong đợi:

```text
Repository validation passed.
```

## 3. Frontend customer

```bash
npm --prefix frontend-user run lint
npm --prefix frontend-user run typecheck
npm --prefix frontend-user run test:architecture
npm --prefix frontend-user run build
```

## 4. Frontend admin

```bash
npm --prefix frontend-admin run lint
npm --prefix frontend-admin run typecheck
npm --prefix frontend-admin run test:architecture
npm --prefix frontend-admin run build
```

## 5. Backend compile validation

Cấu hình environment tối thiểu:

```bash
export NODE_ENV=test
export DATABASE_URL='mysql://root:ci_password@127.0.0.1:3306/ecommerce_ci'
export JWT_ACCESS_SECRET='test_access_secret_with_more_than_32_characters'
export JWT_REFRESH_SECRET='test_refresh_secret_with_more_than_32_characters'
```

Windows PowerShell:

```powershell
$env:NODE_ENV = 'test'
$env:DATABASE_URL = 'mysql://root:ci_password@127.0.0.1:3306/ecommerce_ci'
$env:JWT_ACCESS_SECRET = 'test_access_secret_with_more_than_32_characters'
$env:JWT_REFRESH_SECRET = 'test_refresh_secret_with_more_than_32_characters'
```

Sau đó:

```bash
npm --prefix backend run prisma:validate
npm --prefix backend run prisma:generate
npm --prefix backend run lint
npm --prefix backend run typecheck
npm --prefix backend run test:architecture
npm --prefix backend run build
```

Prisma validate/generate và Nest build không yêu cầu MySQL đang chạy; migration, seed và runtime API thì cần kết nối database thật.

## 6. Mock business tests

```bash
npm run test:mock
```

Bao gồm:

- order pricing;
- service request lifecycle;
- technician rules;
- enum contract.

## 7. Full quality gate

```bash
npm run ci
```

## 8. Full-stack smoke test

Sau khi MySQL đã chạy và migration/seed hoàn tất:

```bash
npm run dev:platform
```

Kiểm tra:

```text
Customer: http://localhost:5173
Admin:    http://localhost:5174
API:      http://localhost:3000/api/v1
```

Các smoke test tối thiểu:

1. Customer tải trang chủ và danh sách sản phẩm.
2. Customer đăng nhập/refresh session.
3. Customer tạo yêu cầu dịch vụ.
4. Admin đăng nhập.
5. Admin mở dashboard.
6. Admin xem và phân công yêu cầu dịch vụ.
7. Response thành công/lỗi có request ID.
8. Validation lỗi có `error.code` và `details`.
9. Upload multipart không nhận `415`.
10. CORS từ origin lạ bị từ chối.

## 9. Kiểm tra không có secret

```bash
git ls-files | grep -E '(^|/)\.env($|\.)'
npm run validate:repo
```

Kết quả chỉ được chứa `.env.example` hoặc `.env.<name>.example`.

## 10. Kiểm tra diff trước merge

```bash
git diff --check origin/main...HEAD
git diff --stat origin/main...HEAD
git status --short
```

Không được có:

- `.env` thật;
- `node_modules`;
- `dist`;
- database dump;
- file backup;
- thay đổi nghiệp vụ ngoài phạm vi Giai đoạn 2.
