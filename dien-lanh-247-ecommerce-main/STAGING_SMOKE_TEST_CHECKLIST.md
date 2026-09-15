# Staging Smoke Test Checklist

Tài liệu này cung cấp danh sách các kịch bản kiểm thử nhanh (Smoke Test) dạng bảng để nghiệm thu tính năng và bảo mật của hệ thống Điện Lạnh 247 sau khi deploy lên môi trường Staging.

---

| Nhóm Test | Test Case | URL / API Endpoint | Kết Quả Mong Đợi | Kết Quả Thực Tế | Trạng Thái (PASS/FAIL) | Ghi Chú |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Healthcheck** | Kiểm tra sức khoẻ server | `GET /api/v1/health` | Trả về `200 OK` kèm trạng thái "healthy". | | | Xác minh backend đã chạy. |
| **Auth/Session** | Đăng nhập Admin thành công | `POST /api/v1/admin/auth/login` | Trả về `200 OK` và lưu `accessToken` vào HttpOnly cookie. | | | |
| **Auth/Session** | Đăng nhập sai nhiều lần | `POST /api/v1/admin/auth/login` | Nhập sai liên tục > 5 lần bị chặn `429 Too Many Requests`. | | | Bảo vệ brute-force. |
| **CORS/Cookie** | Kiểm tra cờ bảo mật Cookie | F12 DevTools Network | Cookie `accessToken` có thuộc tính `HttpOnly`, `Secure` và `SameSite=Strict`. | | | |
| **CORS/Cookie** | Chặn origin lạ | `GET /api/v1/products` từ origin lạ | Trả về lỗi CORS hoặc từ chối kết nối, API không trả dữ liệu. | | | CORS Whitelist. |
| **Admin Dashboard**| Truy cập dashboard admin | `GET /api/v1/admin/dashboard` | Trả về `200 OK` kèm số liệu doanh thu, đơn hàng Staging. | | | Yêu cầu cookie hợp lệ. |
| **Products** | Xem danh sách sản phẩm | `GET /api/v1/products` | Trả về `200 OK` chứa các sản phẩm Staging đang active. | | | |
| **Products** | Xóa mềm sản phẩm | `DELETE /api/v1/admin/products/:id` | Trả về `200 OK`, chuyển trạng thái sản phẩm sang `inactive` và lưu `deletedAt`. | | | Yêu cầu confirm và log. |
| **Products** | Kiểm tra lọc sản phẩm đã xóa | `GET /api/v1/products` | Sản phẩm vừa bị xóa mềm không còn xuất hiện ở danh sách User. | | | |
| **Orders** | Đặt đơn hàng Staging | `POST /api/v1/orders` | Khách hàng đặt hàng thành công, tạo đơn trạng thái `pending`. | | | |
| **Service Requests**| Tạo yêu cầu sửa chữa | `POST /api/v1/service-requests` | Khách hàng tạo yêu cầu thành công, hiển thị trên admin portal. | | | |
| **Technicians** | Phân phối thợ sửa chữa | `PATCH /api/v1/admin/service-requests/:id` | Phân công thợ hợp lệ thành công, thợ chuyển sang trạng thái bận. | | | |
| **Technicians** | Chặn xóa thợ đang bận | `DELETE /api/v1/admin/technicians/:id` | Trả về lỗi `400` do thợ đang có lịch sửa chữa active. | | | Chốt chặn an toàn dữ liệu. |
| **RBAC** | STAFF truy cập Audit Logs | `GET /api/v1/admin/audit-logs` | Trả về `403 Forbidden` khi đăng nhập với tài khoản Staff. | | | Phân quyền an toàn. |
| **RBAC** | SUPERADMIN xem Audit Logs | `GET /api/v1/admin/audit-logs` | Trả về `200 OK` chứa danh sách log lịch sử của Staging. | | | |
| **Audit Logs** | Lọc dữ liệu nhạy cảm | `GET /api/v1/admin/audit-logs` | Kiểm tra metadata log đăng nhập, đảm bảo không lưu `password` hoặc `cookie`. | | | |
| **Security Headers**| Kiểm tra HTTP headers | Response headers trên mọi API | Chứa đủ: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy`. | | | |
| **Database** | Kiểm tra Migration | DB console | Toàn bộ bảng đã được ánh xạ cấu trúc đúng schema phiên bản mới nhất. | | | Kiểm tra qua Prisma. |
