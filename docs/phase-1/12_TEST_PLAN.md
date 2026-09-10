# 12. Test Plan

## 1. Kiểm thử prototype khách hàng

### Functional

- Mở và đóng form từ mọi CTA.
- Chọn dịch vụ từ card ngoài trang và prefill vào form.
- Validation từng bước.
- Back/next giữ dữ liệu.
- Chọn slot.
- Submit tạo mã.
- Reset và tạo yêu cầu mới.

### Responsive

- 360×800.
- 390×844.
- 768×1024.
- 1366×768.
- 1440×900.

### Keyboard

- Tab qua header, CTA và form.
- Focus không thoát modal.
- Escape đóng modal.
- Radio và checkbox dùng bằng bàn phím.

## 2. Kiểm thử admin

- Thu gọn sidebar desktop.
- Mở sidebar mobile.
- Search theo mã, tên, số điện thoại.
- Quick filter khẩn cấp/chưa phân công/SLA.
- Mở chi tiết từ mã và nút cuối dòng.
- Chọn kỹ thuật viên.
- Đổi trạng thái.
- Lưu và kiểm tra bảng cập nhật.
- Filter drawer.
- Escape đóng drawer.

## 3. UX testing với 3–5 người

### Nhiệm vụ khách hàng

1. Tìm dịch vụ sửa điều hòa.
2. Đặt lịch ngày mai.
3. Chọn mức khẩn cấp.
4. Tìm mã yêu cầu sau khi gửi.

### Nhiệm vụ admin

1. Tìm yêu cầu khẩn cấp.
2. Phân công kỹ thuật viên.
3. Đổi trạng thái sang đã phân công.
4. Tìm các yêu cầu gần quá SLA.

### Chỉ số ghi lại

- Thời gian hoàn thành.
- Tỷ lệ hoàn thành.
- Số lần bấm sai.
- Điểm dễ sử dụng 1–5.
- Nhận xét về animation.

## 4. Quality gates cho code production

- TypeScript typecheck.
- ESLint.
- Build frontend-user.
- Build frontend-admin.
- Unit test validation.
- Integration test create request.
- Test state transition.
- Lighthouse mobile.
- Accessibility scan.
