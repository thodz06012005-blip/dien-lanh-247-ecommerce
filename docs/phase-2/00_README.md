# Giai đoạn 2 — Khởi tạo và chuẩn hóa kiến trúc dự án

## 1. Mục tiêu

Giai đoạn 2 tạo một nền tảng kỹ thuật có thể cài đặt sạch, phát triển đồng thời và kiểm tra tự động cho ba ứng dụng:

- Website khách hàng `frontend-user`.
- Website quản trị `frontend-admin`.
- Backend NestJS `backend`.

Repository đã có code nghiệp vụ trước khi thực hiện giai đoạn này. Vì vậy, phương án triển khai là **chuẩn hóa không phá vỡ** thay vì tạo lại dự án trắng.

## 2. Phạm vi đã thực hiện

### Công cụ dùng chung

- Chuẩn Node.js qua `.nvmrc` và `engines`.
- `.editorconfig`, `.gitattributes`, Prettier và ignore rules.
- Alias import thống nhất.
- Script cài đặt, chạy, lint, type-check, test và build ở root.
- Repository validator kiểm tra cấu trúc và nguy cơ commit secret.
- Quy ước branch, Conventional Commits và Pull Request template.
- GitHub Actions quality gate.

### Frontend

- Tách `AppProviders`, `AppRouter` và `AppErrorBoundary`.
- Chuẩn hóa React Query client.
- Cấu hình alias `@/` cho TypeScript và Vite.
- Xác thực biến môi trường build-time.
- Chuẩn hóa Axios API client, timeout, cookie và request ID.
- Định nghĩa type response/lỗi API.
- Architecture tests riêng cho từng frontend.

### Backend

- Xác thực biến môi trường khi khởi động.
- Chuẩn hóa global prefix, CORS, body limits và shutdown hooks.
- Request correlation bằng `X-Request-Id`.
- Middleware security headers và Content-Type guard.
- Response interceptor và exception filter thống nhất.
- Bộ mã lỗi kỹ thuật/nghiệp vụ ổn định.
- `BusinessException` để module nghiệp vụ phát sinh lỗi có mã.
- Prisma workflow, migration policy và seed policy.
- Architecture test backend.

## 3. Danh sách tài liệu

| File | Nội dung |
| --- | --- |
| `01_ARCHITECTURE.md` | Kiến trúc tổng thể và trách nhiệm từng lớp |
| `02_API_CONVENTIONS.md` | Response envelope, lỗi, mã lỗi và versioning |
| `03_ENVIRONMENT_AND_SECURITY.md` | Biến môi trường, secret và security baseline |
| `04_DEVELOPMENT_WORKFLOW.md` | Cài đặt, branch, commit, Prisma và PR workflow |
| `05_ACCEPTANCE_CHECKLIST.md` | Checklist nghiệm thu Giai đoạn 2 |
| `06_HANDOVER.md` | Bàn giao, cách chạy và công việc tiếp theo |

## 4. Các đường dẫn quan trọng

```text
README.md
CONTRIBUTING.md
.github/workflows/ci.yml
.github/pull_request_template.md
scripts/validate-repository.mjs
tests/architecture/repository.test.mjs
```

## 5. Quality gate chuẩn

```bash
npm ci
npm run bootstrap
npm run ci
```

`npm run ci` phải hoàn tất các nhóm kiểm tra:

1. Repository architecture và secret rules.
2. ESLint.
3. TypeScript.
4. Architecture tests.
5. Build customer/admin/backend.
6. Mock API business tests.

## 6. Đầu ra bắt buộc

| Đầu ra | Trạng thái |
| --- | --- |
| Ba ứng dụng có script chạy độc lập | Đã thiết lập |
| `.env.example` cho từng ứng dụng | Đã chuẩn hóa |
| README cài đặt và khởi chạy | Đã tạo |
| Pipeline kiểm tra code | Đã chuẩn hóa |
| Alias import | Đã cấu hình |
| Error boundary | Đã bổ sung cho hai frontend |
| API client | Đã chuẩn hóa |
| NestJS response/error contract | Đã bổ sung |
| Prisma workflow | Đã tài liệu hóa |
| Git/PR convention | Đã bổ sung |

## 7. Giới hạn có chủ đích

- Giai đoạn này không thiết kế lại giao diện.
- Không thay đổi luồng nghiệp vụ đơn hàng hoặc yêu cầu sửa chữa.
- Không tạo migration baseline giả bằng tay vì migration SQL phải được Prisma sinh từ database development được cấu hình đúng.
- Không đưa secret hoặc credential thật vào repository.
- Không thay package dependency nếu chức năng có thể dùng dependency hiện hữu.
