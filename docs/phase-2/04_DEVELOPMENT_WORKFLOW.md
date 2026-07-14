# Quy trình phát triển và bàn giao code

## 1. Thiết lập máy mới

```bash
git clone <repository-url>
cd dien-lanh-247-ecommerce
nvm use
npm ci
npm run bootstrap
```

Tạo các file `.env` từ file mẫu và điều chỉnh URL/credential local.

Kiểm tra nền tảng:

```bash
npm run validate:repo
npm run prisma:validate
npm run prisma:generate
```

## 2. Chọn chế độ phát triển

### Mock-first

Phù hợp khi làm UI và không cần database thật:

```bash
npm run dev:all
```

### Full-stack

Phù hợp khi kiểm thử NestJS/Prisma:

```bash
npm run dev:platform
```

Trước đó cần MySQL, migration và seed:

```bash
npm run prisma:migrate:dev -- --name init
npm run prisma:seed
```

## 3. Tạo branch

```bash
git checkout main
git pull --ff-only origin main
git checkout -b feature/short-description
```

Không dùng một branch cho nhiều giai đoạn không liên quan.

## 4. Phân chia commit

Một commit nên là một thay đổi logic có thể review:

```text
feat(customer): add booking step validation
feat(api): add service request endpoint
test(api): cover booking validation
```

Không gom code, ảnh, migration, refactor toàn repo và tài liệu không liên quan vào một commit.

## 5. Vòng lặp code

1. Đọc contract và acceptance criteria.
2. Viết/chỉnh test kiến trúc hoặc test nghiệp vụ.
3. Triển khai thay đổi nhỏ.
4. Chạy kiểm tra ứng dụng bị ảnh hưởng.
5. Kiểm tra diff.
6. Commit theo Conventional Commits.
7. Lặp lại đến khi scope hoàn tất.

### Customer

```bash
npm --prefix frontend-user run lint
npm --prefix frontend-user run typecheck
npm --prefix frontend-user run test:architecture
npm --prefix frontend-user run build
```

### Admin

```bash
npm --prefix frontend-admin run lint
npm --prefix frontend-admin run typecheck
npm --prefix frontend-admin run test:architecture
npm --prefix frontend-admin run build
```

### Backend

```bash
npm --prefix backend run prisma:validate
npm --prefix backend run lint
npm --prefix backend run typecheck
npm --prefix backend run test:architecture
npm --prefix backend run test
npm --prefix backend run build
```

## 6. Thay đổi Prisma schema

```bash
npm --prefix backend run prisma:format
npm --prefix backend run prisma:validate
npm --prefix backend run prisma:migrate:dev -- --name descriptive_name
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:seed
```

Sau đó:

- review SQL;
- kiểm tra dữ liệu cũ;
- chạy test;
- ghi rollback plan;
- commit schema + migration + seed cùng PR.

## 7. Thay dependency

```bash
npm --prefix frontend-user install <package>
npm --prefix frontend-admin install <package>
npm --prefix backend install <package>
```

Bắt buộc review:

- lý do;
- kích thước/bundle impact;
- license;
- vulnerability;
- package lock diff;
- khả năng dùng dependency hiện có.

## 8. Định dạng code

Kiểm tra:

```bash
npm run format:check
```

Tự động sửa:

```bash
npm run format
```

Lint trong quality gate không dùng `--fix`; CI không được tự sửa repository.

## 9. Quality gate trước push

```bash
npm run ci
```

Hoặc tối thiểu khi chỉ chỉnh tài liệu/tooling:

```bash
npm run validate:repo
npm run test:architecture
```

Tuy nhiên PR cuối cùng vẫn phải để GitHub Actions chạy đầy đủ.

## 10. Pull Request

Mở Draft PR sớm khi:

- cần chốt kiến trúc;
- thay API contract;
- thay schema;
- thay authentication/security;
- thay nhiều ứng dụng.

PR phải dùng template và ghi:

- mục tiêu;
- scope;
- trước/sau;
- API/database impact;
- test commands;
- kết quả;
- ảnh UI;
- risk/rollback;
- secret checklist.

## 11. Review và xử lý phản hồi

- Trả lời từng review thread bằng thay đổi cụ thể.
- Không resolve comment nếu chưa xử lý hoặc chưa thống nhất.
- Sau khi rebase/update, chạy lại quality gate.
- Không force push branch dùng chung nếu chưa thông báo.
- Không merge khi CI fail.

## 12. Merge strategy

Khuyến nghị:

- Squash merge cho PR nhiều commit nhỏ.
- Giữ title PR theo Conventional Commit để squash commit rõ ràng.
- Rebase merge khi lịch sử commit đã sạch và có giá trị độc lập.
- Merge commit chỉ khi cần giữ cấu trúc branch.

## 13. Sau merge

```bash
git checkout main
git pull --ff-only origin main
git branch -d feature/short-description
```

Nếu thay database:

1. deploy code theo chiến lược tương thích;
2. chạy `prisma migrate deploy`;
3. smoke test;
4. theo dõi log/error rate;
5. thực hiện rollback nếu acceptance không đạt.

## 14. Definition of Ready

Task sẵn sàng code khi có:

- mục tiêu và phạm vi;
- user flow hoặc API contract;
- acceptance criteria;
- dữ liệu đầu vào/đầu ra;
- quyền truy cập;
- edge cases;
- dependency;
- thiết kế/mẫu UI nếu liên quan.

## 15. Definition of Done

- Code đúng scope.
- Không có secret.
- Lint/type-check pass.
- Architecture/business tests pass.
- Build pass.
- Env/README cập nhật.
- API/schema docs cập nhật.
- Migration review nếu có.
- PR template hoàn chỉnh.
- CI pass.
- Handover nêu rõ phần chưa làm.
