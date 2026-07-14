# Accessibility và Responsive Checklist

## 1. Contrast

### Bắt buộc

- Text thường phải có độ tương phản đủ rõ trên nền.
- Text màu xám không dùng cho nội dung quan trọng nếu nền quá sáng.
- Primary button dùng chữ trắng trên Blue 600 hoặc Blue 700.
- Orange chỉ dùng cho CTA hoặc cảnh báo, không dùng làm body text trên nền trắng ở cỡ nhỏ.
- Disabled state không được dùng opacity quá thấp đến mức không nhận biết được control.
- Focus ring phải nhìn thấy trên cả nền trắng và nền tối.

### Kiểm tra thủ công

- Header customer nền glass khi đi qua section sáng và tối.
- Sidebar admin và active menu.
- Badge warning/danger.
- Error text dưới Input.
- Link trong paragraph.
- Button outline và ghost.

## 2. Keyboard

### Điều hướng chung

- Tab order theo thứ tự đọc.
- Không có phần tử ẩn nhận focus.
- Không dùng `div` làm nút nếu không có semantics đầy đủ.
- Mọi icon button có `aria-label`.
- Skip link xuất hiện khi nhận focus.

### Modal và Drawer

- Focus chuyển vào overlay khi mở.
- Tab/Shift+Tab không thoát khỏi overlay.
- Escape đóng overlay.
- Sau khi đóng, focus quay về trigger.
- Backdrop có label hoặc được ẩn đúng semantics.

### Tabs

- Arrow Right/Left chuyển tab.
- Tab hiện tại có `aria-selected=true` và `tabIndex=0`.
- Tab khác có `tabIndex=-1`.
- Disabled tab không kích hoạt.

### Data Table

- Row clickable nhận focus.
- Enter và Space mở chi tiết.
- Action button trong row không kích hoạt row click.

## 3. Screen reader

- Trang có landmark `header`, `main`, `nav`, `footer` phù hợp.
- Breadcrumb có `aria-label`.
- Pagination có `aria-current=page`.
- Alert lỗi dùng `role=alert`.
- Toast thông thường dùng live region polite.
- Skeleton có `aria-hidden=true`.
- Loading container có mô tả trạng thái.
- Permission denied không chỉ biểu diễn bằng icon.

## 4. Form

- Label liên kết đúng `htmlFor`/`id`.
- Trường required có cả dấu hiệu trực quan và thuộc tính tương ứng.
- Error dùng `aria-invalid` và `aria-describedby`.
- Hint không bị đọc đồng thời với error khi error đã xuất hiện.
- Submit button có loading state và bị disabled khi đang gửi.
- Không tự động xóa dữ liệu khi validation lỗi.

## 5. Touch target

- Control tương tác chính tối thiểu `44px` trên thiết bị pointer coarse.
- Icon button không nhỏ hơn 40px trên desktop và 44px trên touch.
- Không đặt nhiều icon sát nhau mà không có khoảng cách.
- Link footer dài phải xuống dòng được.
- Mobile CTA không bị che bởi browser toolbar hoặc safe area.

## 6. Responsive matrix

### Mobile nhỏ — 320px đến 374px

- Không có horizontal scroll ở cấp trang.
- Heading không vượt viewport.
- Form một cột.
- Modal dùng full width và bám đáy khi cần.
- Drawer không rộng hơn 94vw.
- Admin Data Table chuyển sang card.
- Button group chuyển cột hoặc wrap.

### Mobile — 375px đến 639px

- Header không che nội dung.
- Search hoặc secondary navigation có thể thu gọn.
- CTA dễ chạm bằng một tay.
- Toast nằm trong gutter 12px.

### Tablet — 640px đến 1023px

- Form có thể hai cột nếu nội dung ngắn.
- Admin table bắt đầu hiển thị dạng table từ `768px`.
- Admin sidebar vẫn dùng drawer trước `1024px`.
- Card grid không ép card nhỏ hơn 280px.

### Desktop — 1024px đến 1279px

- Sidebar admin cố định.
- Content không bị sidebar che.
- Header action không đẩy page title ra ngoài.
- Customer container có gutter tối thiểu 32px.

### Desktop rộng — 1280px trở lên

- Content customer giới hạn khoảng 1280px.
- Admin table có thể mở rộng fluid.
- Không kéo dài paragraph quá 70–80 ký tự mỗi dòng.

## 7. Overflow

- Chuỗi dài dùng `overflow-wrap: anywhere`.
- Table desktop nằm trong `overflow-x-auto`.
- Mobile table không dùng scroll ngang nếu có thể chuyển thành card.
- Badge và button label dùng nội dung ngắn.
- Dropdown menu có max-width và truncate cho email/tên dài.
- Hình ảnh luôn có max-width 100%.

## 8. Loading và layout shift

- Skeleton gần với kích thước content thật.
- Không thay đổi chiều cao header khi dữ liệu tải xong.
- Button loading giữ nguyên kích thước.
- Không chèn toast vào document flow.
- Modal/Drawer dùng portal.

## 9. Motion

- Hỗ trợ `prefers-reduced-motion`.
- Animation không lặp vô hạn ngoại trừ spinner loading.
- Không parallax mạnh trên mobile.
- Không dùng shake kéo dài cho validation.
- Không animate width/height liên tục nếu có thể dùng transform/opacity.

## 10. Trạng thái cần test

Mỗi component hoặc màn hình dữ liệu phải kiểm tra:

- Default.
- Hover.
- Focus-visible.
- Active.
- Disabled.
- Loading.
- Empty.
- Error.
- Permission denied.
- Text rất dài.
- Không có dữ liệu tùy chọn.
- Màn hình 320px.

## 11. Lệnh kiểm tra

```bash
npm run lint
npm run typecheck
npm run test:architecture
npm run build:all
npm run test:mock
```

## 12. Checklist nghiệm thu thủ công

- [ ] Tab qua toàn bộ trang customer demo mà không mắc kẹt.
- [ ] Tab qua toàn bộ trang admin demo mà không mắc kẹt.
- [ ] Escape đóng Modal và Drawer.
- [ ] Focus quay về trigger sau khi đóng.
- [ ] Admin table không tràn ở 320px.
- [ ] Customer card không tràn với chuỗi dài.
- [ ] Nút dễ bấm ở mobile.
- [ ] Không có text bị cắt ngoài chủ đích.
- [ ] Toast không che CTA chính ở mobile.
- [ ] `prefers-reduced-motion` giảm transition.
- [ ] Contrast được kiểm tra ở trạng thái default, hover, disabled và focus.
