# Báo cáo baseline chất lượng

- Thời điểm chạy: 2026-08-04 (Asia/Bangkok)
- Commit: `bfe7d09` (`chore: remove temporary phase 2 placeholder`)
- Node target của CI: 20

## Kết quả

| Lệnh | Kết quả | Chi tiết |
|---|---|---|
| `npm run check:all` | PASS | Mock syntax, typecheck user/admin, lint user/admin đều đạt |
| `npm run build:all` | PASS WITH WARNING | User và Admin build đạt; cả hai có chunk > 500 kB |
| `npm --prefix backend run build` | PASS | NestJS build đạt |
| `npm --prefix backend run test -- --runInBand` | FAIL — BASELINE DEBT | 3/15 suite pass, 12/15 fail; 3/15 test pass, 12/15 fail |
| `npm --prefix backend run test:e2e -- --runInBand` | FAIL — CONFIG + TEST DEBT | 0/1 suite pass, 0/1 test pass |

## Nợ baseline đã xác nhận

### Unit test backend

12 suite lỗi không phải do thay đổi service-only. Nguyên nhân chung là test module chỉ đăng ký controller/service đang test nhưng không cung cấp dependency bắt buộc:

- `CategoriesController` thiếu `CategoriesService`.
- `BrandsController` thiếu `BrandsService`.
- `CartController` thiếu `CartService`.
- `AuthController` thiếu `AuthService`.
- `CategoriesService`, `BrandsService`, `CartService`, `ProductsService`, `OrdersService` và `AuthService` thiếu `PrismaService` hoặc dependency liên quan.
- `ProductsController` và `OrdersController` không cung cấp `AuditLogService` cho `RolesGuard`.

Owner đề xuất: Backend owner. Trạng thái: `KNOWN_FAILING`; không được dùng các lỗi này để che regression mới.

### E2E backend

- App không khởi tạo do thiếu `JWT_ACCESS_SECRET` trong môi trường test.
- `afterEach` vẫn gọi `app.close()` khi `app` chưa được tạo, gây lỗi thứ hai.

Owner đề xuất: Backend + QA. Trạng thái: `KNOWN_FAILING`. Secret test phải lấy từ CI secret hoặc fixture test cô lập, không commit secret thật.

### Build frontend

- `frontend-user`: JavaScript bundle khoảng 1,485.79 kB (gzip khoảng 400.54 kB).
- `frontend-admin`: JavaScript bundle khoảng 562.04 kB (gzip khoảng 172.27 kB).
- Vite cảnh báo chunk sau minify lớn hơn 500 kB.

Owner đề xuất: Frontend owner. Trạng thái: `WARNING`; theo dõi trong backlog hiệu năng, không chặn baseline.

## Lỗ hổng của lệnh root

`npm run check:all` hiện chỉ chạy:

1. `node --check mock-api/server.js`;
2. typecheck hai frontend;
3. lint hai frontend.

Lệnh này không chạy backend build, backend lint, backend unit test, backend E2E hoặc các test Node trong `tests/`. PR không được ghi “all checks passed” chỉ dựa trên `check:all`.

## Quy tắc so sánh regression

- PR không được làm giảm số suite/test pass so với baseline nếu không có quyết định loại bỏ suite commerce tương ứng.
- Khi xóa module commerce, test commerce phải được xóa/thay thế cùng PR và lý do phải liên kết tới dòng inventory.
- Test service-only mới phải pass; không thêm vào danh sách `KNOWN_FAILING`.
- Khi sửa một suite baseline, cập nhật tài liệu này hoặc tạo baseline kế tiếp trong cùng PR.
