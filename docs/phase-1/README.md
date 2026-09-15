# Giai đoạn 1 — Baseline, phạm vi và cách làm

- Ngày lập: 2026-08-04
- Baseline commit: `bfe7d09`
- Tag rollback: `legacy-ecommerce-final`
- Nhánh triển khai: `refactor/service-only-production`

## Trạng thái cổng nghiệm thu

| Cổng | Trạng thái | Bằng chứng / việc còn thiếu |
|---|---|---|
| Tag bản ecommerce | DONE (local) | Annotated tag `legacy-ecommerce-final` trỏ tới `bfe7d09` |
| Nhánh service-only duy nhất | DONE (local) | `refactor/service-only-production` |
| Git/env sample baseline | DONE | `baseline-state.md` |
| Backup + restore drill | BLOCKED | Chưa có `backend/.env`, `mysql` và `mysqldump`; xem `database-backup-restore.md` |
| Inventory commerce | READY FOR REVIEW | `commerce-inventory.md`; FE, BE và PO chưa ký review |
| Baseline chất lượng | DONE | `quality-baseline.md` |
| D1–D10 | BLOCKED BY PO | Khung quyết định đã tạo; các giá trị nghiệp vụ chưa được phê duyệt |
| Definition of Done | DRAFT | Cần FE, BE, QA, Security và PO phê duyệt |
| Backlog P0/P1/P2 | DRAFT | `initial-backlog.md`; owner cá nhân chưa được gán |
| Quy tắc PR | DONE | `.github/pull_request_template.md` |

Không được tuyên bố Giai đoạn 1 hoàn tất cho tới khi các dòng `BLOCKED` đã có bằng chứng và chữ ký/phê duyệt được ghi nhận.

## Definition of Done

Một issue/PR chỉ được coi là hoàn tất khi đáp ứng toàn bộ điều kiện áp dụng:

- Acceptance criteria của issue đã đạt và có bằng chứng tái lập được.
- Không thêm route, text, quyền, model, seed hoặc báo cáo commerce mới.
- Build, lint, typecheck và test liên quan không phát sinh regression so với baseline.
- Test mới bao phủ happy path, validation, permission và lỗi nghiệp vụ chính.
- Thay đổi API có OpenAPI, mã lỗi và migration/data impact đi kèm.
- Migration có kế hoạch rollback hoặc forward-fix và đã chạy trên database sạch.
- Dữ liệu khách hàng được tối thiểu hóa, che log, phân quyền theo tài nguyên và audit khi truy cập/thay đổi quan trọng.
- Booking không cần tài khoản vẫn tạo/liên kết `Customer`; checkbox điều khoản được backend xác thực và lưu bằng chứng đồng ý.
- Không có secret, dump database hoặc PII trong Git, log CI và fixture công khai.
- README/runbook được cập nhật; reviewer FE/BE/QA/PO phù hợp đã chấp thuận.

## Người phê duyệt

| Vai trò | Người phụ trách | Ngày | Trạng thái |
|---|---|---|---|
| Product Owner | TBD | — | Chưa ký |
| Frontend owner | TBD | — | Chưa ký |
| Backend owner | TBD | — | Chưa ký |
| QA owner | TBD | — | Chưa ký |
| Security/Operations | TBD | — | Chưa ký |
