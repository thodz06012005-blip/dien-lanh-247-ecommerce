# Backlog ban đầu — service-only

Mỗi dòng có thể chuyển thành một GitHub issue. Owner cá nhân chưa được cung cấp nên để `TBD`; không được tự gán người.

## P0 — bắt buộc trước MVP

| ID | Công việc | Dependency | Owner | Acceptance criteria | Evidence |
|---|---|---|---|---|---|
| P0-01 | PO phê duyệt D1–D10 và Definition of Done | Không | TBD — PO | Không còn dòng D1–D10 BLOCKED | ADR có người/ngày/giá trị |
| P0-02 | Backup ecommerce DB + checksum + restore drill | Quyền DB, MySQL client, D10 | TBD — Ops | Restore DB tạm và reconcile row count thành công | Biên bản + checksum + smoke log |
| P0-03 | FE/BE/PO sign-off commerce inventory | Inventory draft | TBD | Mọi capability commerce có action/owner/target | Bảng sign-off |
| P0-04 | Vô hiệu hóa route/API/quyền commerce | P0-03, route matrix | TBD — FE/BE | UI không truy cập; API 404/410; không dead link | Route/API/E2E test |
| P0-05 | Ngừng write commerce và archive dữ liệu | P0-02, P0-04 | TBD — BE/Ops | Commerce read-only/archive, chưa drop table | Migration/runbook + audit |
| P0-06 | Mô hình Customer thống nhất không bắt buộc User | Data ADR | TBD — BE | Mọi booking liên kết Customer; không phân biệt guest/returning | Prisma migration + integration test |
| P0-07 | Service catalog theo thiết bị + triệu chứng | D1–D3 | TBD — PO/FE/BE | Tìm dịch vụ ≤3 thao tác; giá có loại rõ | UAT + API test |
| P0-08 | Booking mobile 4 bước + consent bắt buộc | P0-06, D1/D5/D6 | TBD — FE/BE | Không login; checkbox off mặc định; backend lưu version/time | E2E + DB evidence |
| P0-09 | Idempotency và chống xung đột lịch | P0-08, D1/D4 | TBD — BE | Retry không tạo booking đôi; slot conflict bị chặn transactionally | Concurrency/integration test |
| P0-10 | Booking state machine + status history/audit | D4/D5 | TBD — BE | Chỉ transition hợp lệ; mọi thay đổi quan trọng có actor/time | Unit + permission test |
| P0-11 | Admin queue, detail và technician assignment | P0-09/P0-10 | TBD — FE/BE | Xử lý booking từ một màn hình; không phân công trùng | E2E/UAT |
| P0-12 | Tra cứu booking bằng OTP/token có hạn | D6, P0-08 | TBD — Security/BE | Không tra cứu bằng phone hoặc mã đoán được | IDOR/rate-limit test |
| P0-13 | RBAC/resource authorization + PII protection | Role matrix, D9 | TBD — Security/BE | Technician chỉ thấy việc được giao; export/masking đúng quyền | Permission/security test |
| P0-14 | Chuẩn hóa CI đầy đủ backend + frontend | Baseline debt | TBD — DevEx/QA | Build/lint/unit/E2E P0 chạy CI; không secret trong log | Green CI + artifact |
| P0-15 | Fix baseline unit/E2E debt | quality baseline | TBD — BE/QA | Không còn 12/15 unit suite fail; E2E bootstrap/teardown đạt | Test report |

## P1 — nên có trong bản đầu

| ID | Công việc | Dependency | Owner | Acceptance criteria | Evidence |
|---|---|---|---|---|---|
| P1-01 | Báo giá, payment và invoice service-only | D3/D7, booking | TBD | Không phụ thuộc Order; transaction/audit đầy đủ | API/E2E test |
| P1-02 | Bảo hành và yêu cầu sửa lại | D8, completed booking | TBD | Eligibility và lịch sử rõ ràng | UAT + test |
| P1-03 | CMS dịch vụ/FAQ/bài viết/chính sách | Catalog, RBAC | TBD | Admin chỉnh nội dung không sửa code | UAT |
| P1-04 | Dashboard vận hành/kinh doanh/chất lượng | D4, reporting API | TBD | Công thức thống nhất DB, filter + drilldown | Reconciliation test |
| P1-05 | Notification OTP/booking/quote/warranty | D6, providers | TBD | Retry, audit, template và masking đúng | Integration test |
| P1-06 | Export report có masking/audit | D9, dashboard | TBD | Chỉ role được phép export; file có retention | Permission test |
| P1-07 | Tối ưu bundle/Lighthouse | Customer/Admin stable | TBD — FE | P≥80, A11y/SEO/BP≥90 mục tiêu | Lighthouse artifact |

## P2 — sau MVP

| ID | Công việc | Dependency | Owner | Acceptance criteria | Evidence |
|---|---|---|---|---|---|
| P2-01 | Theo dõi vị trí kỹ thuật viên | Privacy/location ADR | TBD | Consent, retention và quyền truy cập rõ | Security/UAT |
| P2-02 | Gợi ý/phân công kỹ thuật viên tự động | Dữ liệu lịch sử đủ | TBD | Không tạo conflict; giải thích được rule | Offline evaluation |
| P2-03 | Chat hỗ trợ | Security/retention ADR | TBD | Không lộ PII; có escalation | UAT/security test |
| P2-04 | Bảo trì định kỳ/nhiều chi nhánh | MVP stable | TBD | Lịch lặp không conflict | E2E |
| P2-05 | Ứng dụng kỹ thuật viên | API/RBAC stable | TBD | Offline/online sync và resource access đúng | Field UAT |

## Quy tắc dependency

- Không bắt đầu UI commerce removal trước khi inventory được sign-off, nhưng có thể chuẩn bị test/route matrix.
- Không merge hành vi phụ thuộc D1–D10 khi quyết định tương ứng còn `BLOCKED`.
- Không drop dữ liệu commerce trước backup/restore drill và thời gian retention đã phê duyệt.
- Không gọi MVP production-ready khi P0-14/P0-15, security test và restore drill chưa đạt.
