# 01. Reference Audit — Điện Lạnh 247

## 1. Mục tiêu khảo sát

Đánh giá website mẫu `dienlanh247.vn` để giữ lại những phần phù hợp với ngành điện lạnh, đồng thời loại bỏ các hạn chế về trải nghiệm, nội dung và khả năng chuyển đổi.

## 2. Điểm tốt cần giữ

1. **Hotline được đặt ở vị trí dễ thấy.** Đây là hành vi quan trọng với ngành dịch vụ khẩn cấp.
2. **Danh mục dịch vụ rõ ràng.** Người dùng có thể nhận biết nhanh các nhóm như sửa chữa, vệ sinh, lắp đặt và bảo trì.
3. **Có dự án thực tế.** Dự án giúp tăng độ tin cậy cho khách hàng doanh nghiệp.
4. **Có phần lý do lựa chọn.** Các cam kết như trung thực, uy tín, chất lượng, giá hợp lý và bảo hành phù hợp với tâm lý khách hàng.
5. **Có quy trình sáu bước.** Quy trình giúp khách hiểu cách doanh nghiệp tiếp nhận và hoàn thành dịch vụ.

## 3. Hạn chế cần cải thiện

### 3.1. Kiến trúc thông tin

- Điều hướng chưa ưu tiên hành động đặt lịch.
- Dự án, tư vấn, tin tức và dịch vụ chưa được phân cấp rõ.
- Người dùng chưa có luồng tra cứu trạng thái yêu cầu.
- Chưa có khu vực tài khoản và lịch sử bảo hành.

### 3.2. Form liên hệ

Form hiện tại thiên về liên hệ chung. Phiên bản mới cần thu thập dữ liệu có cấu trúc:

- Loại dịch vụ.
- Thiết bị.
- Mô tả sự cố.
- Mức độ ưu tiên.
- Địa chỉ.
- Ngày và khung giờ.
- Ảnh tình trạng.
- Thông tin liên hệ.

### 3.3. Trải nghiệm mobile

- CTA gọi điện, Zalo và đặt lịch cần được giữ cố định nhưng không che nội dung.
- Menu cần chuyển thành drawer hoặc dropdown ngắn.
- Form phải chia bước, không để một trang dài.
- Target tương tác cần đủ lớn để thao tác bằng ngón tay.

### 3.4. Niềm tin và minh bạch

Phiên bản mới cần bổ sung:

- Trạng thái kỹ thuật viên.
- Thời gian phản hồi dự kiến.
- Báo giá trước khi làm.
- Ảnh trước và sau sửa chữa.
- Mã yêu cầu.
- Bảo hành điện tử.
- Nhật ký thay đổi trạng thái.

## 4. Hướng tham khảo hiện đại

Không sao chép giao diện của bất kỳ website nào. Chỉ tham khảo nguyên tắc:

- **Linear:** mật độ thông tin cao nhưng gọn; phù hợp admin.
- **Stripe:** cách sử dụng typography, khoảng trắng và gradient có kiểm soát.
- **Framer templates:** bố cục landing page, sticky header và card reveal.
- **Motion for React:** interaction, layout animation và reduced motion.
- **Material Design 3:** motion có mục đích, phân cấp trạng thái và component state.

## 5. Scorecard đánh giá

| Tiêu chí | Website mẫu | Mục tiêu phiên bản mới |
|---|---:|---:|
| Hiểu doanh nghiệp làm gì trong 5 giây | 7/10 | 9/10 |
| CTA đặt lịch | 5/10 | 10/10 |
| Trải nghiệm mobile | 5/10 | 9/10 |
| Form có cấu trúc | 3/10 | 9/10 |
| Theo dõi yêu cầu | 0/10 | 9/10 |
| Dự án tạo niềm tin | 6/10 | 9/10 |
| Accessibility | 4/10 | 8/10 |
| Animation | 4/10 | 8/10 |
| Hiệu năng dự kiến | 6/10 | 9/10 |
| Khả năng quản trị nội dung | 5/10 | 9/10 |

## 6. Kết luận

Phiên bản mới cần giữ bản chất **dịch vụ địa phương, liên hệ nhanh, có dự án và bảo hành**, nhưng chuyển từ website giới thiệu đơn thuần thành **nền tảng tiếp nhận và quản lý dịch vụ**.
