# Điện Lạnh 247 — Service-only refactor

Repository đang được chuyển từ ecommerce sang nền tảng đặt lịch dịch vụ điện lạnh. Bản ecommerce được bảo toàn bằng tag `legacy-ecommerce-final`; mọi thay đổi chuyển đổi phải đi qua nhánh `refactor/service-only-production` và pull request có phạm vi nhỏ.

## Mục tiêu sản phẩm đã thống nhất

- Customer Web ưu tiên mobile: nội dung, danh mục dịch vụ, bảng giá tham khảo, đặt lịch 4 bước và tra cứu lịch.
- Khách hàng không phải đăng ký hoặc đăng nhập để đặt lịch. Hệ thống không phân loại luồng “khách vãng lai/khách quen”; mỗi booking phải liên kết với dữ liệu khách hàng được lưu trong database.
- Bước xác nhận booking phải có checkbox bắt buộc đồng ý điều khoản sử dụng dịch vụ. Backend phải lưu phiên bản điều khoản và thời điểm đồng ý.
- Admin Web: hàng đợi booking, lịch điều phối, hồ sơ công việc, báo giá, thanh toán, bảo hành, CMS và báo cáo.
- Backend service-only: state machine, chống trùng lịch, idempotency, phân quyền theo tài nguyên, audit và reporting API.
- Vận hành production: CI/CD, quan sát hệ thống, backup/restore, UAT, rollback và hypercare.

## Trạng thái Giai đoạn 1

Tài liệu triển khai và bằng chứng nằm tại [`docs/phase-1/`](docs/phase-1/README.md):

- [`commerce-inventory.md`](docs/phase-1/commerce-inventory.md): inventory commerce và hành động đích.
- [`baseline-state.md`](docs/phase-1/baseline-state.md): trạng thái Git và checksum file môi trường mẫu.
- [`quality-baseline.md`](docs/phase-1/quality-baseline.md): baseline build, lint, typecheck và test.
- [`adr/0001-product-decisions.md`](docs/phase-1/adr/0001-product-decisions.md): bảng quyết định D1–D10.
- [`initial-backlog.md`](docs/phase-1/initial-backlog.md): backlog P0/P1/P2 có dependency và bằng chứng.
- [`database-backup-restore.md`](docs/phase-1/database-backup-restore.md): trạng thái và biên bản backup/restore.

## Quy tắc bắt buộc

1. Không commit secret, file `.env` thật, database dump hoặc dữ liệu khách hàng vào Git.
2. Không tự suy đoán quyết định nghiệp vụ đang có trạng thái `BLOCKED` trong D1–D10.
3. Một PR chỉ triển khai một capability hoặc một migration có thể rollback.
4. Nếu API hoặc dữ liệu đổi, OpenAPI, Prisma/migration và test phải đổi trong cùng PR.
5. Chạy các lệnh baseline liên quan trước khi gửi PR và đính kèm kết quả vào PR.

## Kiểm tra nhanh

```bash
npm run check:all
npm run build:all
npm --prefix backend run build
npm --prefix backend run test -- --runInBand
npm --prefix backend run test:e2e -- --runInBand
```

`npm run check:all` hiện chỉ kiểm tra mock API và hai frontend; nó **không** build hoặc test backend. Xem baseline để biết các suite đang lỗi trước khi refactor.
