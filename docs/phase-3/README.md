# Giai đoạn 3 — Design System và Component Library

## Mục tiêu

Giai đoạn 3 chuẩn hóa ngôn ngữ giao diện cho hai ứng dụng React của Điện Lạnh 247 mà không thay đổi API, Prisma schema, trạng thái nghiệp vụ hoặc cơ chế xác thực đã hoàn thành ở Giai đoạn 2.

## Phạm vi triển khai

### Website khách hàng

- Design tokens: màu, font, spacing, radius, shadow, motion và container.
- Primitive: Button, Input, Select, Textarea.
- Overlay: Modal và Drawer có focus trap, Escape và khôi phục focus.
- Navigation: Tabs, Breadcrumb và Pagination.
- Feedback: Badge, Alert, Toast, Skeleton.
- System states: loading, empty, error và permission denied.
- Card responsive và trang demo component.
- Skip link và vùng `main` có landmark rõ ràng.

### Website quản trị

- Primitive và feedback đồng bộ với customer app.
- Data Table hiển thị table trên tablet/desktop và card trên mobile.
- Filter Bar, Confirm Dialog và Form Layout.
- Admin Sidebar và Admin Header dạng component tái sử dụng.
- System states và trang demo quản trị.
- Token Ant Design được đồng bộ với màu thương hiệu.
- Menu, profile dropdown và layout hiện hữu được tăng cường accessibility.

## Đường dẫn demo

Sau khi chạy ứng dụng:

- Customer component demo: `http://localhost:5173/#/design-system`
- Admin component demo: `http://localhost:5174/#/design-system`

Trang admin yêu cầu tài khoản có quyền truy cập giống các trang quản trị hiện hữu.

## Cấu trúc chính

```text
frontend-user/src/
├── design-system/index.tsx
├── styles/design-system.css
└── pages/DesignSystem.tsx

frontend-admin/src/
├── design-system/index.tsx
├── styles/design-system.css
└── pages/DesignSystem.tsx
```

## Quy tắc không xung đột

1. Không thêm package mới.
2. Không thay đổi API client hoặc response contract.
3. Không thay đổi Zustand store, React Query policy hoặc auth flow.
4. Không xóa component cũ đang được màn hình nghiệp vụ sử dụng.
5. Component mới nằm trong namespace `design-system`.
6. Demo route được bổ sung nhưng không thay đổi route hiện hữu.
7. Component overlay dùng portal và không can thiệp DOM ngoài việc khóa scroll khi mở.
8. Mọi thay đổi phải qua lint, type-check, architecture tests, build và Mock API business tests.

## Tài liệu

- `UI_GUIDELINE.md`: token và nguyên tắc bố cục.
- `COMPONENT_LIBRARY.md`: API và quy tắc sử dụng component.
- `ACCESSIBILITY_RESPONSIVE.md`: checklist accessibility và responsive.
- `PHASE_3_HANDOVER.md`: phạm vi bàn giao và lệnh nghiệm thu.
