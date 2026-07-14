# Prisma workflow

Thư mục này là nguồn sự thật của cấu trúc dữ liệu backend.

## Thành phần

- `schema.prisma`: schema và quan hệ dữ liệu.
- `seed.ts`: dữ liệu khởi tạo có thể chạy lặp lại.
- `migrations/`: lịch sử thay đổi database do Prisma Migrate tạo.

## Thiết lập lần đầu

```bash
cp .env.example .env
npm ci
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate:dev -- --name init
npm run prisma:seed
```

Trên Windows PowerShell:

```powershell
Copy-Item .env.example .env
npm ci
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate:dev -- --name init
npm run prisma:seed
```

## Thay đổi schema trong development

1. Chỉnh `schema.prisma`.
2. Chạy `npm run prisma:format`.
3. Chạy `npm run prisma:validate`.
4. Tạo migration bằng `npm run prisma:migrate:dev -- --name <descriptive-name>`.
5. Review SQL trong thư mục migration mới.
6. Cập nhật `seed.ts` nếu dữ liệu mẫu cần thay đổi.
7. Chạy test và build backend.
8. Commit schema, migration và seed trong cùng Pull Request.

## Staging và production

Chỉ triển khai migration đã được commit:

```bash
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run build
npm run start:prod
```

Không chạy `prisma migrate dev`, `prisma db push` hoặc `prisma migrate reset` trên staging/production.

## Quy tắc migration

- Không chỉnh sửa migration đã được áp dụng trên môi trường dùng chung.
- Không xóa cột/bảng trong cùng lần phát hành khi code cũ vẫn đang đọc dữ liệu đó.
- Migration phá hủy dữ liệu phải có backup, kế hoạch chuyển đổi và rollback.
- Đổi tên cột nên dùng chiến lược expand/migrate/contract thay vì xóa rồi tạo lại.
- Seed phải idempotent; ưu tiên `upsert` hoặc kiểm tra tồn tại.
- Không đặt password production hoặc dữ liệu khách hàng thật trong seed.

## Kiểm tra trạng thái

```bash
npm run prisma:migrate:status
npm run prisma:studio
```
