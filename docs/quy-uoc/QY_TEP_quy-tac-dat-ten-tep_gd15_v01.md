# Quy ước đặt tên và tổ chức tệp — Giai đoạn 15

## Mục tiêu

Quy ước này giúp nhận biết nhanh loại tệp, phạm vi sử dụng và phiên bản mà không làm hỏng import, migration, workflow hoặc đường dẫn triển khai.

## Nguyên tắc bắt buộc

1. Không đổi tên file code chỉ để chuyển sang tiếng Việt.
2. Không đổi tên hoặc di chuyển migration Prisma.
3. Không đổi tên các file cấu hình chuẩn như `package.json`, `Dockerfile`, `schema.prisma`, `.env.example`.
4. Tài liệu và hình ảnh có thể dùng tên tiếng Việt **không dấu**, không khoảng trắng.
5. Mọi thao tác di chuyển trên máy local phải dùng `git mv`.
6. Trước khi đổi tên phải tìm toàn bộ tham chiếu bằng `rg -n "TEN_FILE_CU" .`.
7. Không xóa file cũ khi chưa có bằng chứng rằng dữ liệu đã được bảo toàn và tất cả kiểm thử đã PASS.

## Tệp code

Giữ convention theo framework:

- React component: `PascalCase.tsx`.
- Hook: `useSomething.ts`.
- NestJS: `kebab-case.controller.ts`, `kebab-case.service.ts`, `kebab-case.module.ts`.
- DTO: `create-product.dto.ts`, `update-product.dto.ts`.
- Script: `kebab-case.mjs`.
- Test: giữ tên phản ánh đúng đơn vị được kiểm thử.

Không dùng kiểu tên như `TheSanPham.tsx`, `dich-vu-san-pham.service.ts` nếu việc đổi tên chỉ mang tính dịch thuật.

## Tài liệu

Cấu trúc:

```text
<TIEN_TO>_<PHAM_VI>_<ten-khong-dau>_gd<SO>_v<PHIEN_BAN>.md
```

### Tiền tố

| Tiền tố | Ý nghĩa |
|---|---|
| `HD` | Hướng dẫn |
| `BC` | Báo cáo |
| `BG` | Bàn giao |
| `KH` | Kế hoạch |
| `DS` | Danh sách kiểm tra |
| `QY` | Quy ước |
| `TL` | Tài liệu tổng hợp |
| `MT` | Mô tả |
| `PL` | Phụ lục |
| `BB` | Biên bản |

### Phạm vi

| Mã | Phạm vi |
|---|---|
| `BE` | Backend |
| `FEU` | Frontend khách hàng |
| `FEA` | Frontend quản trị |
| `API` | API contract |
| `DB` | Database |
| `BM` | Bảo mật |
| `KT` | Kiểm thử |
| `STG` | Staging |
| `PROD` | Production |
| `ANH` | Hình ảnh |
| `TEP` | Cấu trúc tệp |
| `HT` | Hệ thống |
| `PH` | Phát hành |
| `GD` | Giai đoạn |

### Ví dụ

```text
BC_BE_trang-thai-kiem-thu-api_gd10_v01.md
BG_BM_gioi-han-dang-nhap-admin_gd14_v01.md
HD_STG_quy-trinh-trien-khai_gd15_v01.md
QY_ANH_quy-tac-dat-ten-hinh-anh_gd15_v01.md
```

## Thư mục tài liệu đề xuất

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

Các thư mục `docs/phase-*` hiện hữu được giữ nguyên trong lần sắp xếp đầu tiên vì architecture test và workflow có thể tham chiếu đường dẫn chính xác.

## Quy trình đổi tên an toàn

1. Ghi `old_path`, `new_path` và SHA-256 vào bảng đối chiếu.
2. Tìm mọi tham chiếu trong source, Markdown, workflow, Docker và test.
3. Dùng `git mv` trên máy local.
4. Cập nhật tham chiếu.
5. Chạy `git diff --summary` và `git diff --name-status --find-renames`.
6. Chạy lint, typecheck, architecture test và build.
7. Chỉ commit khi không có deletion thực sự ngoài kế hoạch.

## Các file không đổi tên

- `README.md`
- `CONTRIBUTING.md`
- `package.json`
- `package-lock.json`
- `Dockerfile`
- `docker-compose.production.yml`
- `tsconfig.json`
- `schema.prisma`
- `migration.sql`
- `.env.example`
- `.gitignore`
- `.gitattributes`

## Tiêu chí nghiệm thu

- Không có import hỏng.
- Không có Markdown link hỏng.
- Không có workflow hoặc test tham chiếu tên cũ.
- Không mất file hoặc thay đổi SHA-256 ngoài nhóm được chỉnh nội dung có chủ đích.
- Prisma schema và migration không đổi.
- Repository vẫn build và test được trên hệ thống phân biệt chữ hoa/chữ thường.