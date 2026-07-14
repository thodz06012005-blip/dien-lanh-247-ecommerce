# Hướng dẫn đóng góp

Tài liệu này quy định cách tạo branch, commit, kiểm tra code và mở Pull Request cho dự án Điện Lạnh 247.

## 1. Nguyên tắc chung

1. Không code trực tiếp trên `main`.
2. Mỗi branch chỉ giải quyết một phạm vi rõ ràng.
3. Không trộn refactor lớn với sửa lỗi nghiệp vụ trong cùng Pull Request.
4. Không commit secret, `.env` thật, database dump, file build hoặc `node_modules`.
5. Không tắt lint/type-check chỉ để làm pipeline xanh.
6. Mọi thay đổi API hoặc Prisma schema phải có tài liệu ảnh hưởng và kế hoạch migration.

## 2. Quy ước branch

| Loại | Mẫu | Ví dụ |
| --- | --- | --- |
| Tính năng | `feature/<description>` | `feature/customer-booking-form` |
| Sửa lỗi | `fix/<description>` | `fix/order-total-rounding` |
| Bảo mật | `security/<description>` | `security/login-rate-limit` |
| Refactor | `refactor/<description>` | `refactor/admin-api-client` |
| Tài liệu | `docs/<description>` | `docs/deployment-runbook` |
| Công cụ | `chore/<description>` | `chore/upgrade-eslint` |
| Agent thực hiện | `agent/<description>` | `agent/phase-2-project-architecture` |

Tên branch dùng chữ thường, dấu gạch ngang và không chứa khoảng trắng.

## 3. Conventional Commits

Cấu trúc:

```text
<type>(<scope>): <description>
```

Các `type` được chấp nhận:

- `feat`: thêm khả năng mới.
- `fix`: sửa lỗi.
- `docs`: chỉ thay đổi tài liệu.
- `style`: thay đổi định dạng, không thay đổi hành vi.
- `refactor`: thay đổi cấu trúc nhưng không thêm tính năng hoặc sửa lỗi trực tiếp.
- `perf`: tối ưu hiệu năng.
- `test`: thêm hoặc sửa test.
- `build`: thay đổi hệ thống build/dependency.
- `ci`: thay đổi pipeline.
- `chore`: bảo trì khác.
- `revert`: hoàn tác commit.

Ví dụ:

```text
feat(service-request): add technician assignment
fix(auth): prevent duplicate refresh requests
refactor(api): standardize response envelope
test(pricing): cover coupon upper limit
ci: use npm ci for all applications
```

Quy tắc phần mô tả:

- Viết ở thì mệnh lệnh.
- Không viết hoa chữ đầu nếu không phải tên riêng.
- Không kết thúc bằng dấu chấm.
- Nên ngắn hơn 72 ký tự.

Breaking change:

```text
feat(api)!: replace legacy order response

BREAKING CHANGE: clients must read order data from the data field.
```

## 4. Quy trình phát triển

```bash
git checkout main
git pull origin main
git checkout -b feature/example
```

Cài dependency:

```bash
npm ci
npm run bootstrap
```

Tạo các file môi trường từ `.env.example`, sau đó triển khai thay đổi.

Trước khi commit:

```bash
npm run validate:repo
npm run lint
npm run typecheck
npm run test
npm run build
```

Hoặc chạy quality gate đầy đủ:

```bash
npm run ci
```

## 5. Quy tắc thay đổi dependency

Khi thêm hoặc nâng phiên bản dependency:

1. Chạy lệnh trong đúng thư mục ứng dụng.
2. Commit đồng thời `package.json` và `package-lock.json`.
3. Không chỉnh `package-lock.json` bằng tay.
4. Giải thích lý do thêm dependency trong Pull Request.
5. Kiểm tra license và nguy cơ bảo mật.
6. Không thêm thư viện nếu chức năng có thể giải quyết rõ ràng bằng nền tảng hiện có.

Ví dụ:

```bash
npm --prefix frontend-user install <package>
npm --prefix backend install -D <package>
```

## 6. Quy tắc Prisma

Khi thay đổi `backend/prisma/schema.prisma`:

```bash
npm --prefix backend run prisma:format
npm --prefix backend run prisma:validate
npm --prefix backend run prisma:migrate:dev -- --name <migration-name>
npm --prefix backend run prisma:generate
```

Bắt buộc commit:

- `schema.prisma`.
- thư mục migration mới.
- thay đổi seed nếu cần.
- tài liệu ảnh hưởng dữ liệu nếu migration có khả năng mất dữ liệu.

Không sửa migration đã chạy trên môi trường dùng chung. Hãy tạo migration mới.

## 7. Quy tắc API

- Endpoint mới nằm dưới prefix `/api/v1`.
- Thành công dùng envelope `{ success, data, message?, meta? }`.
- Lỗi dùng mã lỗi nghiệp vụ ổn định, không để frontend phụ thuộc vào câu chữ.
- Không trả stack trace hoặc thông tin database ra client.
- Thêm DTO và validation cho mọi body/query phức tạp.
- Thay đổi breaking phải được ghi rõ trong PR.

## 8. Pull Request

Pull Request phải có:

1. Mục tiêu thay đổi.
2. Phạm vi file/module.
3. Ảnh hưởng đến user/admin/backend/database.
4. Cách kiểm thử.
5. Kết quả lint, type-check, test và build.
6. Ảnh hoặc video nếu thay đổi UI.
7. Migration và rollback nếu thay đổi database.
8. Checklist không chứa secret.

Mặc định mở Draft PR khi công việc chưa sẵn sàng review hoặc chưa có đầy đủ kiểm tra.

## 9. Review code

Reviewer tập trung vào:

- Tính đúng của nghiệp vụ.
- Tính tương thích API.
- Validation và xử lý lỗi.
- Bảo mật xác thực/phân quyền.
- Race condition và transaction.
- Hiệu năng truy vấn.
- Accessibility và responsive của UI.
- Test cho nhánh quan trọng.
- Khả năng rollback.

Không approve nếu CI chưa pass, trừ khi lỗi CI được chứng minh là ngoài phạm vi và đã có issue theo dõi.

## 10. Definition of Done

Một công việc chỉ hoàn thành khi:

- Code đáp ứng acceptance criteria.
- Không còn lỗi lint hoặc type-check.
- Test liên quan pass.
- Build cả ứng dụng bị ảnh hưởng pass.
- `.env.example` và README được cập nhật khi có config mới.
- Migration/seed được kiểm tra nếu có thay đổi database.
- PR mô tả đầy đủ và không chứa file ngoài phạm vi.
