# Checklist nghiệm thu Giai đoạn 2

## A. Repository và công cụ dùng chung

- [x] Có `.editorconfig`.
- [x] Có `.gitattributes` để chuẩn hóa line ending.
- [x] Có `.prettierrc.json` và `.prettierignore`.
- [x] Có `.nvmrc` và `engines` thống nhất Node 22.
- [x] Có `.npmrc` yêu cầu lockfile và engine đúng.
- [x] `.gitignore` chặn environment thật, build, dump, backup và cache.
- [x] Có README gốc hướng dẫn cài đặt sạch.
- [x] Có `CONTRIBUTING.md`.
- [x] Có Pull Request template.
- [x] Có repository architecture validator.
- [x] Có root architecture test.

## B. Frontend customer

- [x] Có TypeScript project và build bằng Vite.
- [x] Alias `@/*` được khai báo trong TypeScript.
- [x] Alias `@` được khai báo trong Vite.
- [x] Port development cố định `5173`.
- [x] Có `.env.example` public-only.
- [x] Có module validate environment.
- [x] Có `AppProviders`.
- [x] Có React Query configuration dùng chung.
- [x] Có `AppRouter`.
- [x] Có layout gốc và route hiện hữu được bảo toàn.
- [x] Có Error Boundary.
- [x] API client có base URL, timeout, credentials và request ID.
- [x] Refresh request không chạy trùng song song.
- [x] Có type API response/error.
- [x] Có architecture tests.
- [x] Có script lint, type-check, test, build và check.

## C. Frontend admin

- [x] Có TypeScript project và build bằng Vite.
- [x] Alias `@/*` được khai báo trong TypeScript.
- [x] Alias `@` được khai báo trong Vite.
- [x] Port development cố định `5174`.
- [x] Có `.env.example` public-only.
- [x] Có module validate environment.
- [x] Có `AppProviders`.
- [x] React Query và Ant Design ConfigProvider được đặt tập trung.
- [x] Có `AppRouter` và protected route hiện hữu.
- [x] Có Error Boundary.
- [x] API client có request ID và dangerous-action confirmation.
- [x] `401` clear admin session ngoài endpoint login.
- [x] Có type API response/error.
- [x] Có architecture tests.
- [x] Có script lint, type-check, test, build và check.

## D. Backend NestJS

- [x] Có NestJS application và module composition root.
- [x] Có ConfigModule global.
- [x] Có validation biến môi trường.
- [x] Có global API prefix cấu hình được.
- [x] Có CORS allowlist.
- [x] Có request body limits.
- [x] Có Content-Type guard hỗ trợ JSON, urlencoded và multipart.
- [x] Có security headers middleware.
- [x] Có `X-Request-Id` middleware.
- [x] Có ValidationPipe global.
- [x] Có ThrottlerGuard global.
- [x] Có response interceptor global.
- [x] Có exception filter global.
- [x] Có bộ mã lỗi kỹ thuật và nghiệp vụ.
- [x] Có `BusinessException`.
- [x] Có response interfaces.
- [x] Có shutdown hooks.
- [x] Alias backend được khai báo.
- [x] Có architecture test backend.
- [x] Có script lint, type-check, test và build.

## E. Prisma

- [x] Có `schema.prisma`.
- [x] Có MySQL datasource.
- [x] Có Prisma Client generator.
- [x] Có seed script.
- [x] Seed yêu cầu password từ environment, không hardcode credential thật.
- [x] Có script format/validate/generate/migrate/seed/studio.
- [x] Có tài liệu Prisma workflow.
- [x] Có migration directory policy.
- [ ] Baseline migration được sinh từ database development trống và commit.

### Ghi chú baseline migration

Không viết `migration.sql` thủ công trong Giai đoạn 2 vì repository cần database MySQL development thật để Prisma tính migration đúng từ toàn bộ schema hiện có. Người vận hành thực hiện:

```bash
npm --prefix backend run prisma:migrate:dev -- --name init
```

Sau đó review và commit thư mục migration được Prisma sinh ra.

## F. API contract

- [x] Success response có `success`, `data` và metadata request.
- [x] Error response có status, message, error code, details và request metadata.
- [x] Existing response envelope được giữ tương thích.
- [x] Validation errors có details.
- [x] Prisma unique/not-found errors có mapping cơ bản.
- [x] Business modules có thể dùng mã lỗi ổn định.
- [x] API convention được tài liệu hóa.

## G. Script gốc

- [x] `bootstrap`.
- [x] `dev:user`.
- [x] `dev:admin`.
- [x] `dev:backend`.
- [x] `dev:mock`.
- [x] `dev:all`.
- [x] `dev:platform`.
- [x] `lint`.
- [x] `typecheck`.
- [x] `test`.
- [x] `build`.
- [x] `validate:repo`.
- [x] `check:all`.
- [x] `ci`.
- [x] Prisma helper scripts.

## H. CI pipeline

- [x] Trigger trên `main`, feature/fix/security/agent branch và PR.
- [x] Có manual dispatch.
- [x] `permissions: contents: read`.
- [x] Có concurrency cancel-in-progress.
- [x] Dùng Node từ `.nvmrc`.
- [x] Cache theo toàn bộ lockfile.
- [x] Dùng `npm ci` cho root và bốn package.
- [x] Không cài Nest CLI toàn cục.
- [x] Validate/generate Prisma.
- [x] Validate repository.
- [x] Lint.
- [x] Type-check.
- [x] Architecture tests.
- [x] Build ba ứng dụng.
- [x] Mock business tests.

## I. Secret và environment

- [x] Không tạo `.env` thật trong branch.
- [x] `.env.example` chỉ chứa placeholder.
- [x] Frontend `.env.example` không chứa server secret.
- [x] Backend production/staging từ chối secret quá ngắn hoặc placeholder.
- [x] CI dùng credential giả chỉ cho compile/validation.
- [x] Repository validator phát hiện `.env` thật đang track.
- [x] Repository validator quét một số token/private-key pattern.

## J. Kiểm tra bắt buộc trước merge

Các ô dưới đây chỉ đánh dấu sau khi GitHub Actions chạy trên Pull Request:

- [ ] Clean install pass.
- [ ] Prisma validate pass.
- [ ] Prisma generate pass.
- [ ] Repository validation pass.
- [ ] Customer lint/type-check/build pass.
- [ ] Admin lint/type-check/build pass.
- [ ] Backend lint/type-check/build pass.
- [ ] Architecture tests pass.
- [ ] Mock business tests pass.
- [ ] Không có file ngoài phạm vi.
- [ ] Reviewer xác nhận API backward compatibility.

## K. Tiêu chí chấp nhận cuối

Giai đoạn 2 được nghiệm thu khi:

1. GitHub Actions xanh.
2. Ba ứng dụng khởi chạy độc lập theo README.
3. Một máy mới có thể dùng lockfile để cài dependency.
4. Không có environment thật hoặc secret trong diff.
5. PR chỉ chứa kiến trúc, công cụ, tài liệu và refactor bootstrap tương thích.
6. Baseline migration được tạo ở task database kế tiếp hoặc được ghi nhận là action bắt buộc trước staging.
