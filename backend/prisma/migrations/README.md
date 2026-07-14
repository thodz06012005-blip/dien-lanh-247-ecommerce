# Prisma migrations

Các migration do `prisma migrate dev` tạo sẽ được lưu trong thư mục này theo cấu trúc:

```text
migrations/
└── YYYYMMDDHHMMSS_descriptive_name/
    └── migration.sql
```

## Quy định

1. Tên migration mô tả thay đổi nghiệp vụ, ví dụ `add_service_request_priority`.
2. Review `migration.sql` trước khi commit.
3. Không chứa câu lệnh tạo/xóa database; migration chỉ thay đổi schema trong database đã chọn.
4. Không sửa migration đã áp dụng trên staging hoặc production.
5. Migration có thao tác xóa dữ liệu phải kèm backup và rollback plan trong Pull Request.
6. CI dùng `prisma validate` và `prisma generate`; deployment dùng `prisma migrate deploy`.

Nếu repository chưa có baseline migration, người duy trì database chạy:

```bash
npm run prisma:migrate:dev -- --name init
```

sau khi cấu hình `DATABASE_URL` trỏ đến database development trống, rồi commit migration được sinh ra.
