# 10. Acceptance Criteria — Giai đoạn 1

## A. Phạm vi và tài liệu

- [ ] Có Product Vision và mục tiêu kinh doanh.
- [ ] Có danh sách MVP và out-of-scope.
- [ ] Có persona và ma trận quyền.
- [ ] Có sitemap khách hàng và admin.
- [ ] Có user flow quan trọng.
- [ ] Có API draft và enum thống nhất.

## B. Prototype khách hàng

- [ ] Responsive từ 360px đến desktop lớn.
- [ ] Header sticky và menu mobile hoạt động.
- [ ] Hero có CTA rõ ràng.
- [ ] Có danh sách dịch vụ, quy trình, dự án, đánh giá và CTA cuối trang.
- [ ] Form mở/đóng bằng chuột và bàn phím.
- [ ] Form có 4 bước và progress.
- [ ] Có validation cho các trường bắt buộc.
- [ ] Có thể quay lại bước trước mà không mất dữ liệu.
- [ ] Có success state và mã yêu cầu mẫu.
- [ ] Có reduced motion.

## C. Prototype admin

- [ ] Sidebar thu gọn trên desktop và mở dạng drawer trên mobile.
- [ ] Dashboard hiển thị metric, chart và trạng thái.
- [ ] Bảng yêu cầu có dữ liệu mẫu.
- [ ] Tìm kiếm hoạt động.
- [ ] Quick filter hoạt động.
- [ ] Drawer chi tiết hoạt động.
- [ ] Chọn kỹ thuật viên và trạng thái hoạt động.
- [ ] Lưu thay đổi cập nhật bảng và activity log.
- [ ] Filter drawer mở/đóng được.
- [ ] Có toast phản hồi.

## D. Accessibility

- [ ] Có skip link.
- [ ] Focus-visible rõ.
- [ ] Icon button có accessible name.
- [ ] Modal dùng `role=dialog` và `aria-modal`.
- [ ] Escape đóng modal/drawer.
- [ ] Target chính đạt khoảng 44px.
- [ ] Không chỉ dùng màu để biểu đạt trạng thái.

## E. Chất lượng code prototype

- [ ] JavaScript qua `node --check`.
- [ ] Không phụ thuộc framework hoặc build tool.
- [ ] Không dùng dữ liệu thật hoặc secret.
- [ ] Không sao chép tài sản có bản quyền từ website tham khảo.
- [ ] File có cấu trúc và comment/đặt tên dễ chuyển sang React.
