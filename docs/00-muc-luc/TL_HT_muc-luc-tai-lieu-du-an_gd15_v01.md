# Mục lục tài liệu dự án — Điện Lạnh 247

## Mục tiêu

Mục lục này là điểm bắt đầu để tìm tài liệu, quy ước, báo cáo và hướng dẫn. Tài liệu cũ chưa được di chuyển hàng loạt trong commit này nhằm tránh làm hỏng link và workflow.

## Tài liệu quản trị cấu trúc mới

| Tài liệu | Đường dẫn | Trạng thái |
|---|---|---|
| Quy ước đặt tên tệp | `docs/quy-uoc/QY_TEP_quy-tac-dat-ten-tep_gd15_v01.md` | Có hiệu lực cho refactor mới |
| Quy ước đặt tên hình ảnh | `docs/quy-uoc/QY_ANH_quy-tac-dat-ten-hinh-anh_gd15_v01.md` | Có hiệu lực cho thư viện ảnh canonical |
| Mục lục 15 giai đoạn | `docs/00-muc-luc/TL_GD_muc-luc-15-giai-doan_gd15_v01.md` | Bản kiểm toán ban đầu |
| Báo cáo kiểm toán ảnh | `docs/final-review/UI_IMAGE_LAYOUT_AUDIT.md` | Báo cáo hiện trạng từ Phase 15 |
| Manifest ảnh | `assets/images/manifest.json` | Nguồn tra cứu chính |
| Hướng dẫn thư viện ảnh | `assets/images/README.md` | Nguồn vận hành chính |

## Tài liệu Phase 15 bắt buộc

| Nội dung | Đường dẫn |
|---|---|
| Hướng dẫn cài đặt | `docs/phase-15/INSTALLATION_GUIDE.md` |
| Runbook vận hành | `docs/phase-15/OPERATIONS_RUNBOOK.md` |
| Hướng dẫn quản trị | `docs/phase-15/ADMIN_GUIDE.md` |
| Bàn giao source | `docs/phase-15/SOURCE_HANDOVER.md` |
| Nghiệm thu và bàn giao | `docs/phase-15/ACCEPTANCE_AND_HANDOVER.md` |
| Kế hoạch kiểm thử | `docs/phase-15/TEST_PLAN.md` |

Không đổi tên các file trên nếu chưa cập nhật architecture test, workflow và link liên quan.

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

## Quy tắc di chuyển tài liệu root

Trước khi di chuyển một tài liệu:

1. Chạy `rg -n "TEN_FILE_CU" .`.
2. Ghi `old_path`, `new_path`, SHA-256 vào CSV đối chiếu.
3. Dùng `git mv` trên máy local.
4. Cập nhật Markdown link, workflow và test.
5. Chạy `git diff --name-status --find-renames`.
6. Chạy lint, typecheck, architecture test và build.

## Phân nhóm đề xuất

| Mẫu tên hiện tại | Thư mục đích đề xuất |
|---|---|
| `BACKEND_*.md` | `docs/bao-cao/backend/` |
| `FRONTEND_USER_*.md` | `docs/bao-cao/frontend-khach-hang/` |
| `FRONTEND_ADMIN_*.md` | `docs/bao-cao/frontend-quan-tri/` |
| `FULL_E2E_*.md` | `docs/bao-cao/kiem-thu/` |
| `HANDOVER_SECURITY_*.md` | `docs/ban-giao/bao-mat/` |
| `HANDOVER_10*.md` | `docs/ban-giao/giai-doan-10/` |
| `STAGING_*.md` | `docs/trien-khai/staging/` |
| `PRODUCTION_*.md` | `docs/trien-khai/production/` |
| `DEMO_*.md`, `DEV_MODE_GUIDE.md` | `docs/huong-dan/local/` |
| `RELEASE_NOTES_*.md` | `docs/ban-giao/phat-hanh/` |
| `HANDOVER_SUMMARY.md` | `docs/ban-giao/tong-hop/` |

Đây là đề xuất, chưa phải lệnh xóa hoặc rename tự động.

## Script hỗ trợ

```bash
node scripts/audit-file-organization.mjs
node scripts/audit-file-organization.mjs --write
node scripts/audit-image-assets.mjs
node scripts/sync-image-assets.mjs
node scripts/create-handover-archive.mjs
```

## Trạng thái chuyển đổi

- Đã tạo branch riêng.
- Đã thêm quy ước tệp và ảnh.
- Đã nâng cấp manifest ảnh.
- Đã thêm script kiểm toán file.
- Đã thêm script đóng gói chỉ từ file tracked.
- Chưa di chuyển hàng loạt tài liệu root.
- Chưa xóa ảnh hoặc tài liệu nào.
- Chưa đổi Prisma schema hoặc migration.
