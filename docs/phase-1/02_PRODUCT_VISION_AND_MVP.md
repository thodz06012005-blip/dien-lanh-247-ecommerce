# 02. Product Vision và phạm vi MVP

## 1. Product Vision

Điện Lạnh 247 trở thành nền tảng số giúp khách hàng đặt, theo dõi và đánh giá dịch vụ điện lạnh; đồng thời giúp doanh nghiệp tiếp nhận, điều phối, giám sát SLA và quản lý nội dung từ một hệ thống thống nhất.

## 2. Vấn đề cần giải quyết

### Khách hàng

- Không biết nên chọn đúng dịch vụ nào.
- Khó mô tả sự cố qua điện thoại.
- Không biết kỹ thuật viên đã được phân công hay chưa.
- Không có lịch sử sửa chữa và bảo hành tập trung.
- Lo ngại phát sinh chi phí không minh bạch.

### Doanh nghiệp

- Yêu cầu đến từ nhiều kênh rời rạc.
- Điều phối thủ công, khó theo dõi SLA.
- Không có lịch sử trạng thái và audit log đầy đủ.
- Dữ liệu dự án, dịch vụ và bài viết khó cập nhật đồng bộ.
- Báo cáo vận hành chưa theo thời gian thực.

## 3. Mục tiêu kinh doanh

- Tăng tỷ lệ khách gửi yêu cầu từ website.
- Giảm thời gian nhập lại dữ liệu từ điện thoại/Zalo.
- Rút ngắn thời gian xác nhận và phân công.
- Tăng tỷ lệ đúng hẹn và hoàn thành trong SLA.
- Tăng số khách quay lại nhờ lịch sử và bảo hành điện tử.

## 4. Chỉ số sản phẩm đề xuất

| Chỉ số | Mục tiêu sau MVP |
|---|---:|
| Tỷ lệ hoàn thành form | ≥ 55% |
| Thời gian điền form trung vị | ≤ 90 giây |
| Thời gian admin xác nhận | ≤ 15 phút làm việc |
| Tỷ lệ phân công trong SLA | ≥ 90% |
| Tỷ lệ hoàn thành đúng hẹn | ≥ 95% |
| Điểm hài lòng | ≥ 4.7/5 |

## 5. Phạm vi MVP — Website khách hàng

- Trang chủ.
- Giới thiệu.
- Danh sách và chi tiết dịch vụ.
- Danh sách và chi tiết dự án.
- Tin tức và chi tiết bài viết.
- Liên hệ.
- Form đặt dịch vụ 4 bước.
- Màn hình đặt lịch thành công.
- Tra cứu yêu cầu bằng mã + số điện thoại.
- Trang theo dõi trạng thái cơ bản.
- Responsive desktop, tablet và mobile.
- SEO metadata, sitemap và structured data cơ bản.

## 6. Phạm vi MVP — Admin

- Đăng nhập admin.
- Dashboard chỉ số vận hành.
- Danh sách yêu cầu dịch vụ.
- Bộ lọc theo trạng thái, ưu tiên, SLA, khu vực và kỹ thuật viên.
- Xem chi tiết yêu cầu.
- Phân công kỹ thuật viên.
- Cập nhật trạng thái.
- Quản lý khách hàng cơ bản.
- Quản lý kỹ thuật viên cơ bản.
- CRUD dịch vụ, dự án, bài viết và banner.
- Tài khoản và phân quyền cơ bản.
- Audit log cho thay đổi quan trọng.

## 7. Out of Scope trong MVP

- Thanh toán trực tuyến.
- Quản lý tồn kho nâng cao.
- Định vị kỹ thuật viên thời gian thực.
- Ứng dụng mobile native.
- Chương trình thành viên và tích điểm.
- AI chẩn đoán sự cố.
- Chat trực tiếp tích hợp nhiều nền tảng.
- Báo cáo tài chính đầy đủ.
- Quản lý nhà cung cấp.

## 8. Nguyên tắc sản phẩm

1. **Đặt dịch vụ nhanh hơn gọi điện nhưng vẫn luôn có hotline.**
2. **Không yêu cầu đăng ký tài khoản để gửi yêu cầu.**
3. **Không che giấu giá hoặc trạng thái.**
4. **Mobile first cho website khách hàng.**
5. **Desktop first cho admin, nhưng vẫn dùng được trên tablet.**
6. **Animation hỗ trợ hiểu trạng thái, không dùng để trình diễn.**
