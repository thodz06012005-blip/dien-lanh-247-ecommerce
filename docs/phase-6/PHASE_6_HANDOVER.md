# Bàn giao Giai đoạn 6

## Branch và quan hệ kế thừa

- Base bắt buộc: `agent/phase-5-managed-content`
- Head: `agent/phase-6-service-request-lifecycle`
- Điểm bắt đầu: commit nghiệm thu Giai đoạn 5 `3f5b6e6fa8ce974553e13d1badfb3bdacb7fec88`

Không merge Giai đoạn 6 trước Giai đoạn 5.

## Đầu ra đã triển khai

### Customer

- Form đặt dịch vụ 4 bước.
- Trường họ tên, điện thoại, email, địa chỉ, khu vực, thiết bị, dịch vụ, mô tả, ưu tiên, lịch, ảnh và ghi chú.
- Preview tối đa 5 ảnh.
- Màn hình thành công với mã yêu cầu.
- Trang tra cứu công khai bằng mã + điện thoại.
- Trang lịch sử đăng nhập không truyền số điện thoại qua URL.
- Trang chi tiết có timeline và album ảnh.

### Backend

- Mã yêu cầu ngẫu nhiên có kiểm tra trùng.
- Email xác nhận.
- Ma trận trạng thái chuẩn hóa.
- Transaction và row lock cho status/assignment.
- Public lookup đã che dữ liệu.
- Admin list filter/pagination/stats.
- Status event bất biến.
- Audit database.
- Upload Cloudinary có cleanup khi transaction lỗi.

### Admin

- Danh sách polling 15 giây.
- Search, status, priority, service và quick filters.
- Quick confirm.
- Chi tiết đầy đủ.
- Chỉ hiển thị `allowedTransitions`.
- Phân công kỹ thuật viên phù hợp.
- Upload ảnh theo stage.
- Timeline, media và audit tabs.

## Migration và seed

```bash
npm --prefix backend run prisma:migrate:deploy
npm --prefix backend run prisma:seed
```

Seed chạy theo thứ tự:

1. Core seed.
2. Managed-content seed Giai đoạn 5.
3. Service-workflow seed Giai đoạn 6.

Tất cả seed phải chạy lặp mà không tạo event/audit trùng.

## Cấu hình production

Bắt buộc cấu hình ngoài repository:

- `DATABASE_URL`
- JWT secrets
- SMTP/Mailer variables
- Cloudinary credentials
- CORS origins
- cookie secure/same-site
- rate limits

Khi chưa có `MAIL_HOST`, email xác nhận chạy ở chế độ mô phỏng và ghi log, phù hợp local nhưng không phải tiêu chuẩn production.

## Quy trình triển khai

1. Backup database.
2. Deploy migration trên staging.
3. Chạy seed đồng bộ.
4. Chạy Phase 6 integration workflow.
5. Smoke test tạo và lookup.
6. Smoke test admin transition và assignment.
7. Kiểm tra Cloudinary upload trước/sau.
8. Deploy backend trước frontend.
9. Theo dõi 4xx/5xx, mail delivery và Cloudinary errors.

## Rollback

Code có thể rollback về Giai đoạn 5 vì các cột/bảng mới không thay cấu trúc cũ. Không tự động drop bảng trong production. Khi rollback code:

- giữ migration đã áp dụng;
- legacy `status` và `statusHistory` vẫn được cập nhật song song;
- ngừng dùng API/route Giai đoạn 6;
- lập kế hoạch xóa dữ liệu riêng nếu thật sự cần.

## Việc chưa thuộc phạm vi

- OTP cho lookup.
- SMS/Zalo notification.
- Calendar dispatch dạng kéo thả.
- Technician mobile app.
- Chữ ký biên bản điện tử.
- Chính sách retention/xóa ảnh tự động.
- WebSocket push; hiện admin polling 15 giây.

## Tiêu chí Done

- CI toàn repository PASS.
- Phase 6 MySQL/API integration PASS.
- Lighthouse customer PASS.
- Diff chỉ chứa Giai đoạn 6 so với Phase 5.
- PR mergeable.
- Tài liệu migration, workflow, API, privacy và handover đầy đủ.
