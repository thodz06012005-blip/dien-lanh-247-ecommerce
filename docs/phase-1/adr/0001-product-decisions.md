# ADR-0001 — Quyết định chủ quản D1–D10

- Trạng thái: `PROPOSED / BLOCKED BY PO`
- Ngày tạo: 2026-08-04
- Phạm vi: service-only MVP

## Nguyên tắc đã được yêu cầu

- Không phân luồng khách vãng lai và khách quen.
- Không bắt buộc đăng ký/đăng nhập để đặt lịch.
- Mỗi booking phải lưu/liên kết dữ liệu `Customer` trong database.
- Đặt lịch gồm 4 bước, mobile-first.
- Checkbox đồng ý điều khoản sử dụng dịch vụ là bắt buộc và mặc định chưa chọn.
- Backend phải xác thực consent và lưu `termsVersion`, `privacyVersion`, `acceptedAt` cùng bằng chứng kỹ thuật cần thiết theo chính sách dữ liệu.
- Dữ liệu khách hàng phải được bảo vệ nhiều lớp; không dùng cam kết “an toàn tuyệt đối” hoặc rủi ro bằng 0.

## Bảng quyết định

| ID | Quyết định cần chốt | Trạng thái | Người phê duyệt | Ngày hiệu lực | Ảnh hưởng API/database |
|---|---|---|---|---|---|
| D1 | Khu vực phục vụ, ngày/giờ hoạt động, ngày nghỉ và timezone | BLOCKED | TBD — PO/Ops | TBD | slot API, `ServiceArea`, lịch kỹ thuật viên, validation |
| D2 | Danh sách dịch vụ P0 và triệu chứng/thiết bị được hỗ trợ | BLOCKED | TBD — PO | TBD | `ServiceCategory`, `Service`, seed, search/filter API |
| D3 | Phí khảo sát, khoảng giá, thuế và cách hiển thị “tham khảo/cố định” | BLOCKED | TBD — PO/Finance | TBD | price fields, quotation, UI bảng giá |
| D4 | SLA xác nhận, đến nơi, hoàn thành và định nghĩa trễ hẹn | BLOCKED | TBD — PO/Ops | TBD | state timestamps, SLA fields, dashboard KPI |
| D5 | Chính sách đổi lịch, hủy, no-show và hoàn phí | BLOCKED | TBD — PO/Ops | TBD | state machine, reason codes, permission/API |
| D6 | Kênh OTP/tra cứu, thời hạn token, retry và fallback | BLOCKED | TBD — PO/Security | TBD | OTP/token tables, rate limit, notification provider |
| D7 | Phương thức và thời điểm thanh toán; có online payment trong MVP hay không | BLOCKED | TBD — PO/Finance | TBD | `Payment`, `Invoice`, gateway, webhook |
| D8 | Thời hạn/điều kiện bảo hành và quy trình sửa lại | BLOCKED | TBD — PO/Ops | TBD | `Warranty`, claim status, service history |
| D9 | Vai trò được export, loại dữ liệu, masking và audit | BLOCKED | TBD — PO/Security | TBD | RBAC, reporting API, `AuditLog`, export job |
| D10 | RPO/RTO, tần suất backup, retention và quy trình disaster recovery | BLOCKED | TBD — PO/Ops | TBD | backup schedule, monitoring, runbook |

## Quy tắc chặn

- Code không được tự đặt giá trị mặc định nghiệp vụ cho dòng `BLOCKED`.
- Có thể tạo interface/schema nháp nhưng không merge hành vi production phụ thuộc quyết định chưa chốt.
- Khi một dòng được phê duyệt, phải ghi rõ giá trị, người phê duyệt, ngày hiệu lực và issue/PR triển khai.
