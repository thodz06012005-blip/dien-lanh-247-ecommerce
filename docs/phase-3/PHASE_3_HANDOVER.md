# Bàn giao Giai đoạn 3 — Design System và Component Library

## 1. Branch

`agent/phase-3-design-system`

Branch được tạo trực tiếp từ commit nghiệm thu cuối của Giai đoạn 2:

`5f12162477bfc789e0a5e75a88f8dfd5ce59dae9`

Giai đoạn 3 sử dụng stacked branch để:

- Không lặp toàn bộ diff Giai đoạn 2.
- Không phụ thuộc vào việc Giai đoạn 2 đã merge vào `main` hay chưa.
- Review riêng thay đổi UI.
- Giảm nguy cơ conflict khi phát triển song song.

## 2. Nội dung hoàn thành

### Foundation

- Màu thương hiệu.
- Typography.
- Spacing scale.
- Radius và shadow.
- Breakpoint.
- Motion token.
- Touch target.
- Container và grid guideline.

### Customer component library

- Button.
- Input.
- Select.
- Textarea.
- Modal.
- Drawer.
- Tabs.
- Badge.
- Alert.
- Toast.
- Breadcrumb.
- Pagination.
- Card.
- Skeleton.
- Loading/empty/error/permission denied states.

### Admin component library

- Button.
- Input.
- Select.
- Textarea.
- Modal.
- Drawer.
- Tabs.
- Badge.
- Alert.
- Toast.
- Skeleton.
- State panel.
- Data Table responsive.
- Filter Bar.
- Confirm Dialog.
- Form Layout.
- Admin Sidebar.
- Admin Header.

### Layout

- Customer layout có skip link và main landmark.
- Admin layout có skip link, aria labels, mobile menu backdrop dạng button và focus-visible.
- Admin navigation bổ sung đường dẫn tới component demo.
- Ant Design theme được đồng bộ với token thương hiệu.

### Demo

- `frontend-user/#/design-system`.
- `frontend-admin/#/design-system`.

### Tests

- Customer design system architecture tests.
- Admin design system architecture tests.
- Root Phase 3 repository contract.

## 3. Không thay đổi

Giai đoạn 3 không thay đổi:

- Prisma schema.
- Migration.
- Seed.
- Backend module.
- API contract.
- Axios API client.
- Auth store.
- Cart store.
- Service request state machine.
- Mock API business logic.
- Route nghiệp vụ hiện hữu.

## 4. Lệnh cài đặt

```bash
npm ci
npm run bootstrap
```

## 5. Lệnh chạy

```bash
npm run dev:all
```

Hoặc chạy backend thật:

```bash
npm run dev:platform
```

## 6. Lệnh nghiệm thu

```bash
npm run validate:repo
npm run lint
npm run typecheck
npm run test:architecture
npm run build:all
npm run test:mock
```

Lệnh tổng hợp:

```bash
npm run ci
```

## 7. Kiểm tra demo

### Customer

1. Mở `http://localhost:5173/#/design-system`.
2. Tab qua Button, form, Tabs, Modal và Drawer.
3. Kiểm tra Escape đóng overlay.
4. Kiểm tra focus trở về nút mở.
5. Thu viewport về 320px.
6. Kiểm tra card, pagination, toast và state panels.

### Admin

1. Đăng nhập tài khoản admin hợp lệ.
2. Mở `http://localhost:5174/#/design-system`.
3. Kiểm tra Filter Bar và Data Table.
4. Thu viewport dưới 768px và xác nhận table chuyển thành cards.
5. Mở Modal, Drawer và Confirm Dialog.
6. Kiểm tra Form Layout ở 320px, 768px và 1280px.
7. Kiểm tra menu sidebar mở/đóng ở mobile và desktop.

## 8. Tiêu chí hoàn thành

- [x] UI guideline.
- [x] Component library customer.
- [x] Component library admin.
- [x] Trang demo customer.
- [x] Trang demo admin.
- [x] Customer layout.
- [x] Admin layout.
- [x] Loading state.
- [x] Empty state.
- [x] Error state.
- [x] Disabled state.
- [x] Permission denied state.
- [x] Keyboard semantics.
- [x] Focus-visible.
- [x] Reduced motion.
- [x] Touch target rule.
- [x] Mobile Data Table cards.
- [x] Overflow safeguards.

## 9. Review notes

Review cần tập trung:

1. Component mới không trùng tên import với component cũ trong cùng file.
2. Overlay không gây scroll lock sau khi đóng.
3. Toast provider chỉ được khai báo một lần ở app provider.
4. Demo page không gọi API production.
5. Data Table generic không ép model nghiệp vụ cụ thể.
6. Admin layout vẫn giữ auth/logout behavior.
7. Customer layout vẫn giữ legacy ToastContainer để không phá luồng toast cũ.

## 10. Thứ tự merge

Do đây là stacked PR:

1. Review và merge Giai đoạn 2 trước.
2. Sau khi Giai đoạn 2 vào `main`, rebase hoặc retarget Giai đoạn 3 về `main`.
3. Chạy lại toàn bộ CI.
4. Merge Giai đoạn 3 sau khi diff chỉ còn thay đổi UI Phase 3.

## 11. Nguồn nghiệm thu

GitHub Actions trên Pull Request là nguồn xác nhận cuối cùng cho clean install, lint, type-check, architecture tests, build ba ứng dụng và Mock API business tests. Không đánh dấu Giai đoạn 3 hoàn tất nếu bất kỳ quality gate nào chưa đạt.
