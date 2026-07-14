# Bảo mật và quyền riêng tư Giai đoạn 6

## Tra cứu công khai

Tra cứu yêu cầu bắt buộc đồng thời:

- mã yêu cầu;
- số điện thoại đã đăng ký.

Backend truy vấn hai điều kiện trong cùng câu lệnh. Khi không khớp, response dùng một thông báo chung để không tiết lộ mã nào tồn tại.

## Dữ liệu được che

Response công khai:

- che tên khách hàng;
- che số điện thoại;
- che phần local của email;
- chỉ trả quận/huyện;
- không trả địa chỉ chi tiết;
- không trả ID kỹ thuật viên, số điện thoại hoặc email kỹ thuật viên;
- không trả audit log nội bộ.

## Lịch sử theo tài khoản

`GET /my-service-requests` yêu cầu JWT. Backend đọc user ID từ token và số điện thoại từ database. Số điện thoại không còn xuất hiện trong URL/query string, tránh rò rỉ qua browser history, proxy log hoặc analytics.

## Mã yêu cầu

Mã có dạng:

```text
DL247-YYMMDD-XXXXXX
```

Phần cuối dùng ba byte ngẫu nhiên sinh bằng `crypto.randomBytes`, sau đó kiểm tra trùng trong database trước khi tạo. Primary key của `ServiceRequest` là lớp bảo vệ cuối cùng chống mã trùng.

## Upload ảnh

- Chỉ chấp nhận MIME bắt đầu bằng `image/`.
- Tối đa 5 ảnh mỗi lần.
- Tối đa 5 MB mỗi ảnh.
- Khách hàng phải chứng minh sở hữu bằng mã + điện thoại.
- Khách hàng chỉ tải ảnh trước sửa chữa.
- Admin/Staff cần JWT và RBAC.
- Khi upload Cloudinary thành công nhưng transaction database thất bại, hệ thống xóa lại các remote object đã tạo.

## Audit

- IP được băm SHA-256 kèm namespace, không lưu IP thô trong bảng nghiệp vụ.
- User agent giới hạn 500 ký tự.
- Audit metadata không chứa mật khẩu, token hoặc cookie.
- Audit database và AuditLogService hiện có cùng hoạt động để giữ tương thích với lớp bảo mật cũ.

## RBAC

| Thao tác | Quyền |
|---|---|
| Xem danh sách/chi tiết | STAFF, ADMIN, SUPERADMIN |
| Cập nhật trạng thái | STAFF, ADMIN, SUPERADMIN |
| Upload ảnh nội bộ | STAFF, ADMIN, SUPERADMIN |
| Phân công kỹ thuật viên | ADMIN, SUPERADMIN |

## Rủi ro còn lại

- Public lookup hiện dùng mã + số điện thoại, chưa có OTP hoặc rate limit riêng theo mã. Global throttling vẫn áp dụng.
- Cloudinary cần cấu hình production secrets ngoài repository.
- Email local có thể chạy chế độ mô phỏng; production phải cấu hình SMTP và theo dõi delivery.
- Ảnh cần chính sách retention và xóa theo yêu cầu dữ liệu cá nhân ở giai đoạn vận hành production.
