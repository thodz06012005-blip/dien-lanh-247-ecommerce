# Chuẩn nghiệp vụ dịch vụ Điện Lạnh 247

Tài liệu này mô tả cấu hình dùng chung giữa website khách hàng, trang quản trị và Mock API. Dữ liệu vận hành thực tế được chỉnh tại **Admin → Cài đặt → Nghiệp vụ dịch vụ** và lưu trong `settings.businessConfig`.

## 1. Thiết bị và lỗi phổ biến

Mỗi thiết bị có mã ổn định, tên hiển thị, trạng thái hoạt động, danh sách lỗi phổ biến và khoảng giá tham khảo. Thiết bị bị tắt sẽ không xuất hiện trên trang chủ và form đặt lịch. Giá thấp nhất/cao nhất không phải báo giá chính thức.

## 2. Khu vực phục vụ

Mỗi khu vực có mã, tên, trạng thái và phí di chuyển tham khảo. Khách chỉ có thể đặt lịch tại khu vực đang hoạt động. Phí bằng `0` được hiểu là chưa thu phí di chuyển.

## 3. Khung giờ làm việc

Khung giờ đang hoạt động được hiển thị trong form đặt lịch. Việc cấu hình tại đây là lịch nhận yêu cầu chung; năng lực thực tế của từng thợ sẽ được xử lý trong giai đoạn điều phối.

## 4. Khoảng giá và phụ phí

- `inspectionFee`: phí kiểm tra mặc định.
- `emergencySurcharge`: phụ phí yêu cầu khẩn cấp.
- `showPriceRanges`: bật/tắt khoảng giá trên website.
- `disclaimer`: thông báo bắt buộc đi cùng mọi khoảng giá.

Nguyên tắc: khách nhận khoảng giá để tham khảo; kỹ thuật viên kiểm tra thực tế, thông báo chi phí và chỉ sửa khi khách đồng ý.

## 5. Trạng thái yêu cầu

Danh sách có thứ tự là chuẩn quy trình vận hành. Mã trạng thái đã được sử dụng trong dữ liệu không nên đổi hoặc xóa; có thể đổi nhãn hiển thị hoặc tạm ẩn. Backend vẫn kiểm soát các chuyển trạng thái hợp lệ để bảo đảm toàn vẹn dữ liệu.

## 6. Vai trò

- Chủ cửa hàng: cấu hình, tài chính và nhân sự.
- Điều phối viên: tiếp nhận, xác nhận lịch và phân công thợ.
- Kỹ thuật viên: nhận việc và cập nhật tiến độ việc được giao.

Danh sách trong cấu hình là mô tả nghiệp vụ. Quyền truy cập kỹ thuật vẫn phải được áp dụng bằng RBAC tại API, không dựa riêng vào nội dung form.

## 7. Doanh thu và tiền công

Doanh thu có thể được ghi nhận khi công việc hoàn thành hoặc khi đã thanh toán. Khuyến nghị ghi nhận doanh thu khi hoàn thành và theo dõi “tiền đã thu” riêng. Tiền công thợ được cấu hình theo phần trăm hoặc mức cố định; có tùy chọn tính hoặc không tính linh kiện vào hoa hồng.

## 8. Quy trình thay đổi

1. Chủ cửa hàng chỉnh dữ liệu trong trang Cấu hình vận hành.
2. Kiểm tra lại các mục đang bật, khoảng giá và phí.
3. Bấm **Lưu toàn bộ cấu hình**.
4. API xác thực cấu trúc và ghi audit log.
5. Website khách hàng nhận cấu hình public mới trong lần tải/cập nhật tiếp theo.
6. Thay đổi trạng thái hoặc công thức tài chính cần được thông báo cho đội vận hành trước khi áp dụng.
