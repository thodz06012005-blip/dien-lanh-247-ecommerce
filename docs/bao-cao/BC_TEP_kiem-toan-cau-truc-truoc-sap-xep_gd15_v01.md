# Báo cáo kiểm toán cấu trúc tệp trước sắp xếp — Giai đoạn 15

## Phạm vi

- Repository Điện Lạnh 247.
- Base: `agent/phase-15-production-readiness`.
- Branch kiểm toán: `refactor/phase-15-file-image-organization`.
- Không quét nội dung sinh tự động trong `.git`, `node_modules`, `dist`, `build`, `coverage`, `.vite`, `.cache`, `playwright-report`, `test-results`.

## Kết luận ban đầu

1. Tài liệu dự án được tích lũy qua nhiều giai đoạn và còn phân tán giữa thư mục root, `docs/phase-*`, tài liệu bàn giao và tài liệu triển khai.
2. Các giai đoạn 1, 8, 10 và 11 chưa có bộ tài liệu độc lập đồng nhất như nhiều giai đoạn khác.
3. Không nên đổi tên file code sang tiếng Việt vì import, Linux CI, Docker, Vite, NestJS và TypeScript phụ thuộc đường dẫn và phân biệt chữ hoa/chữ thường.
4. Tài liệu và hình ảnh có thể dùng tên tiếng Việt không dấu, có tiền tố và hậu tố.
5. Không được đổi tên hoặc di chuyển migration Prisma.
6. Không được di chuyển hàng loạt tài liệu root khi chưa có bảng `old_path → new_path` và kiểm tra toàn bộ reference.

## Cấu trúc đích đề xuất

```text
docs/
├── 00-muc-luc/
├── huong-dan/
│   ├── local/
│   ├── phat-trien/
│   └── van-hanh/
├── bao-cao/
│   ├── backend/
│   ├── frontend-khach-hang/
│   ├── frontend-quan-tri/
│   ├── kiem-thu/
│   └── he-thong/
├── ban-giao/
│   ├── tong-hop/
│   ├── giai-doan-10/
│   ├── bao-mat/
│   └── phat-hanh/
├── trien-khai/
│   ├── local/
│   ├── staging/
│   └── production/
├── quy-uoc/
├── luu-tru/
│   ├── tai-lieu-cu/
│   └── tai-nguyen-mau/
└── phase-*/
```

## Quy tắc áp dụng

- Root chỉ giữ tài liệu chuẩn như `README.md`, `CONTRIBUTING.md`, API contract và file cấu hình.
- `docs/phase-*` được giữ nguyên trong lần refactor đầu.
- Tài liệu cũ không bị xóa; nếu lỗi thời sẽ chuyển vào `docs/luu-tru/tai-lieu-cu/` và ghi tài liệu thay thế.
- Mọi rename trên máy local phải dùng `git mv`.
- Không dùng `git reset --hard` hoặc `git clean -fd`.

## Nhóm tài liệu cần rà tiếp

| Mẫu tên | Thư mục đề xuất | Điều kiện trước khi di chuyển |
|---|---|---|
| `BACKEND_*.md` | `docs/bao-cao/backend/` | Kiểm tra link, README, test |
| `FRONTEND_USER_*.md` | `docs/bao-cao/frontend-khach-hang/` | Kiểm tra link và tài liệu thay thế |
| `FRONTEND_ADMIN_*.md` | `docs/bao-cao/frontend-quan-tri/` | Kiểm tra link và tài liệu thay thế |
| `FULL_E2E_*.md` | `docs/bao-cao/kiem-thu/` | Kiểm tra workflow/artifact path |
| `HANDOVER_10*.md` | `docs/ban-giao/giai-doan-10/` | Đối chiếu trạng thái Giai đoạn 10 |
| `HANDOVER_SECURITY_*.md` | `docs/ban-giao/bao-mat/` | Không làm mất bằng chứng bảo mật |
| `STAGING_*.md` | `docs/trien-khai/staging/` | Kiểm tra runbook hiện hành |
| `PRODUCTION_*.md` | `docs/trien-khai/production/` | Kiểm tra workflow Phase 15 |
| `DEMO_*.md` | `docs/huong-dan/local/` | Không đưa tài khoản demo vào production |
| `RELEASE_NOTES_*.md` | `docs/ban-giao/phat-hanh/` | Giữ thứ tự phát hành |

## Công cụ được thêm

```bash
node scripts/audit-file-organization.mjs
node scripts/audit-file-organization.mjs --write
```

Script chỉ thống kê theo mặc định; không tự xóa hoặc di chuyển file.

## Điều kiện trước đợt di chuyển hàng loạt

1. Tạo JSON inventory và CSV mapping.
2. Ghi SHA-256 trước khi di chuyển.
3. Tìm mọi reference bằng `rg`.
4. Chia theo nhóm nhỏ, không tạo một commit rename khổng lồ.
5. Chạy `git diff --name-status --find-renames`.
6. Kiểm tra không có deletion thực sự ngoài kế hoạch.
7. Chạy lint, typecheck, architecture test và build.
8. Xác nhận Prisma schema và migration không đổi.

## Trạng thái của đợt GitHub hiện tại

- Đã tạo branch riêng.
- Đã thêm quy ước đặt tên.
- Đã thêm mục lục tài liệu và 15 giai đoạn.
- Đã thêm script kiểm toán.
- Đã tổ chức metadata ảnh và fallback tương thích.
- Chưa di chuyển hàng loạt tài liệu root.
- Chưa xóa file.
- Chưa đổi schema hoặc migration.

## Cách tạo số liệu chính xác trên máy local

```bash
node scripts/audit-file-organization.mjs --write
```

Lệnh trên sẽ tạo/cập nhật báo cáo Markdown và JSON inventory bằng dữ liệu từ `git ls-files` của working tree hiện tại.
