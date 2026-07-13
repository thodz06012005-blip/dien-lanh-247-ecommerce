# Giai đoạn 1 — Phân tích, UX/UI và Prototype

Tài liệu này là điểm bắt đầu cho toàn bộ Giai đoạn 1 của dự án **Điện Lạnh 247 Ecommerce & Service Platform**.

## Mục tiêu

Giai đoạn 1 không triển khai backend production. Mục tiêu là chốt đúng sản phẩm trước khi mở rộng code:

1. Xác định phạm vi MVP và phần chưa làm.
2. Xác định người dùng, vai trò và quyền hạn.
3. Thiết kế sitemap, hành trình người dùng và form đặt dịch vụ.
4. Xây dựng Design System và Motion System.
5. Tạo prototype khách hàng và prototype admin có thể tương tác.
6. Chuẩn bị API draft, acceptance criteria, backlog và kế hoạch kiểm thử.

## Cấu trúc tài liệu

| File | Nội dung |
|---|---|
| `01_REFERENCE_AUDIT.md` | Đánh giá trang mẫu và định hướng cải tiến |
| `02_PRODUCT_VISION_AND_MVP.md` | Tầm nhìn sản phẩm, mục tiêu và phạm vi MVP |
| `03_PERSONAS_ROLES_AND_PERMISSIONS.md` | Persona, vai trò và ma trận phân quyền |
| `04_SITEMAP_AND_NAVIGATION.md` | Sitemap website khách hàng và admin |
| `05_USER_FLOWS.md` | Luồng khách hàng, điều phối viên, kỹ thuật viên và quản trị nội dung |
| `06_BOOKING_FORM_SPEC.md` | Đặc tả form đặt dịch vụ nhiều bước |
| `07_DESIGN_SYSTEM.md` | Màu sắc, typography, spacing và component |
| `08_MOTION_AND_ACCESSIBILITY.md` | Animation, hiệu năng và accessibility |
| `09_API_AND_DATA_CONTRACT.md` | API draft, entity và enum chính |
| `10_ACCEPTANCE_CRITERIA.md` | Điều kiện nghiệm thu Giai đoạn 1 |
| `11_IMPLEMENTATION_BACKLOG.md` | Backlog triển khai theo thứ tự ưu tiên |
| `12_TEST_PLAN.md` | Kế hoạch kiểm thử UX, responsive và prototype |
| `13_PHASE_1_HANDOVER.md` | Hướng dẫn bàn giao sang Giai đoạn 2 |
| `14_SOURCE_REFERENCES.md` | Nguồn tham khảo thiết kế và kỹ thuật |

## Prototype

- `prototypes/phase-1/customer/`: Landing page khách hàng và form đặt dịch vụ 4 bước.
- `prototypes/phase-1/admin/`: Dashboard admin, bảng yêu cầu, bộ lọc và drawer chi tiết.

Hai prototype là HTML/CSS/JavaScript thuần, không yêu cầu cài package:

```bash
python -m http.server 8080 -d prototypes/phase-1
```

Sau đó truy cập:

- `http://localhost:8080/customer/`
- `http://localhost:8080/admin/`

## Definition of Done

Giai đoạn 1 hoàn thành khi:

- MVP và out-of-scope đã được chốt.
- Sitemap và các luồng chính không còn điểm mơ hồ.
- Form đặt dịch vụ có validation, trạng thái lỗi, success và responsive.
- Admin prototype mô phỏng được tìm kiếm, lọc, xem chi tiết, phân công và đổi trạng thái.
- Motion có giới hạn rõ ràng và hỗ trợ `prefers-reduced-motion`.
- Acceptance criteria và backlog đủ rõ để Antigravity triển khai từng file trong codebase chính.
