# 06. Đặc tả Form đặt dịch vụ

## 1. Mục tiêu UX

- Hoàn thành trong 60–90 giây.
- Không bắt buộc đăng nhập.
- Mỗi bước chỉ tập trung một quyết định.
- Có thể quay lại mà không mất dữ liệu.
- Validation hiển thị ngay cạnh trường lỗi.

## 2. Bước 1 — Chọn dịch vụ

### Trường

- `serviceCategoryId` — bắt buộc.
- `deviceType` — tùy dịch vụ có thể bắt buộc.

### Giao diện

- Card lựa chọn có icon, tên và mô tả ngắn.
- Toàn bộ card là target tương tác.
- Card được chọn có border, background và dấu check.

## 3. Bước 2 — Mô tả tình trạng

### Trường

- `issueDescription` — bắt buộc, 10–1000 ký tự.
- `priority` — `NORMAL | HIGH | URGENT`.
- `deviceOperationalStatus` — `YES | PARTIAL | NO`.
- `attachments[]` — ảnh JPG/PNG/WebP.

### Conditional logic

- Mùi khét/tia lửa/rò điện → cảnh báo ngắt nguồn.
- Rò nước → gợi ý upload ảnh.
- Khẩn cấp → hiển thị kỳ vọng thời gian phản hồi, không cam kết sai thực tế.

## 4. Bước 3 — Địa chỉ và lịch

### Trường

- `provinceCode`.
- `districtCode`.
- `wardCode`.
- `addressLine`.
- `appointmentDate`.
- `appointmentSlotId`.
- `callBeforeArrival`.
- `locationNote`.

### Quy tắc

- Không cho chọn ngày trong quá khứ.
- Slot do backend trả về.
- Slot phải được xác minh lại tại thời điểm submit.

## 5. Bước 4 — Liên hệ và xác nhận

### Trường

- `customerName` — bắt buộc.
- `phone` — bắt buộc.
- `email` — tùy chọn.
- `preferredContactMethod`.
- `consent` — bắt buộc.

### Màn hình review

Hiển thị dịch vụ, ưu tiên, địa chỉ, ngày, giờ và thông tin liên hệ trước khi submit.

## 6. Success state

- Dấu check.
- Mã yêu cầu.
- Thời gian dự kiến xác nhận.
- Nút tra cứu yêu cầu.
- Nút gọi hotline.
- Nút tạo yêu cầu khác.

## 7. Error states

| Trường hợp | Cách xử lý |
|---|---|
| Validation lỗi | Focus trường đầu tiên lỗi, giữ dữ liệu |
| Mất mạng | Hiển thị retry, không reset form |
| Slot vừa hết | Quay lại bước lịch, giữ các trường khác |
| Upload quá lớn | Nêu rõ file nào lỗi |
| Server 5xx | Hiển thị mã tham chiếu hỗ trợ |
| Submit trùng | Backend dùng idempotency key |

## 8. Analytics events

- `booking_opened`
- `booking_step_viewed`
- `booking_service_selected`
- `booking_validation_failed`
- `booking_attachment_added`
- `booking_submitted`
- `booking_success`
- `booking_abandoned`

Không gửi mô tả sự cố hoặc dữ liệu cá nhân vào analytics.
