# 11. Implementation Backlog

## Epic 1 — Foundation

1. Chuẩn hóa route và layout website khách hàng.
2. Chuẩn hóa route và layout admin.
3. Tạo design token dùng chung.
4. Tạo utility cho class name, API client, error mapping.
5. Tạo loading, empty, error, unauthorized và not-found state.

## Epic 2 — Website khách hàng

1. Header, navigation, footer.
2. Trang chủ.
3. Danh sách/chi tiết dịch vụ.
4. Danh sách/chi tiết dự án.
5. Tin tức.
6. Liên hệ.
7. Form đặt dịch vụ.
8. Success và tra cứu.
9. Trang theo dõi trạng thái.

## Epic 3 — Admin vận hành

1. Dashboard.
2. Quick Filter Cards.
3. Bảng yêu cầu.
4. Drawer/trang chi tiết.
5. Phân công kỹ thuật viên.
6. State transition.
7. SLA indicator.
8. Audit timeline.
9. Export/report cơ bản.

## Epic 4 — CMS

1. Service CRUD.
2. Project CRUD.
3. Post CRUD.
4. Banner CRUD.
5. Preview và publish workflow.

## Epic 5 — Backend contract

1. DTO và validation.
2. Service request state machine.
3. Technician availability.
4. Public lookup token.
5. Rate limit và idempotency.
6. Audit log.

## Thứ tự ưu tiên

### P0

- Đặt dịch vụ.
- Tiếp nhận admin.
- Phân công.
- Cập nhật trạng thái.
- Dịch vụ và nội dung trang chủ.

### P1

- Tra cứu yêu cầu.
- Dự án và bài viết.
- Dashboard chỉ số.
- Email/Zalo thông báo cơ bản.

### P2

- Báo giá điện tử.
- Bảo hành điện tử.
- Kỹ thuật viên mobile view.
- Báo cáo nâng cao.

## Quy tắc chia task cho Antigravity

Mỗi task phải chỉ rõ:

- File được phép sửa.
- API hoặc type liên quan.
- Acceptance criteria.
- Lệnh test/build bắt buộc.
- Không refactor ngoài phạm vi nếu chưa được yêu cầu.
