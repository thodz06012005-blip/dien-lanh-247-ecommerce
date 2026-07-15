# 05. User Flows

## Flow A — Khách đặt dịch vụ tiêu chuẩn

```mermaid
flowchart TD
  A[Trang chủ hoặc trang dịch vụ] --> B[Nhấn Đặt lịch]
  B --> C[Chọn dịch vụ]
  C --> D[Mô tả sự cố]
  D --> E[Chọn địa chỉ và lịch]
  E --> F[Nhập thông tin liên hệ]
  F --> G{Dữ liệu hợp lệ?}
  G -- Không --> F
  G -- Có --> H[Tạo yêu cầu]
  H --> I[Hiển thị mã yêu cầu]
  I --> J[Gửi thông báo xác nhận]
```

## Flow B — Yêu cầu khẩn cấp

- Khách chọn mức khẩn cấp.
- UI hiển thị cảnh báo an toàn phù hợp.
- API gắn mức ưu tiên `URGENT`.
- Admin nhận badge/cảnh báo.
- Điều phối viên xác nhận và phân công sớm.

## Flow C — Admin tiếp nhận

```mermaid
flowchart TD
  A[Yêu cầu NEW] --> B[Xem chi tiết]
  B --> C[Gọi xác nhận]
  C --> D{Thông tin hợp lệ?}
  D -- Không --> E[Cập nhật hoặc từ chối]
  D -- Có --> F[Đổi CONFIRMED]
  F --> G[Chọn kỹ thuật viên]
  G --> H[Đổi ASSIGNED]
  H --> I[Gửi thông báo cho khách và kỹ thuật viên]
```

## Flow D — Kỹ thuật viên xử lý

```mermaid
flowchart TD
  A[Nhận công việc] --> B[Xác nhận nhận việc]
  B --> C[Di chuyển]
  C --> D[Bắt đầu xử lý]
  D --> E[Khảo sát và báo giá]
  E --> F{Khách đồng ý?}
  F -- Không --> G[Đóng hoặc hẹn lại]
  F -- Có --> H[Thực hiện]
  H --> I[Chụp ảnh trước sau]
  I --> J[Khách nghiệm thu]
  J --> K[COMPLETED]
```

## Flow E — Quản trị nội dung

- Tạo bản nháp.
- Nhập slug, metadata và nội dung.
- Upload ảnh.
- Xem trước.
- Xuất bản hoặc lên lịch.
- Ghi lịch sử người chỉnh sửa.

## Quy tắc lỗi

- Mất mạng: giữ dữ liệu form trong phiên.
- API timeout: cho phép gửi lại, không tạo trùng.
- Upload lỗi: cho phép xóa/tải lại từng ảnh.
- Slot hết chỗ: yêu cầu chọn slot khác trước khi gửi.
- Yêu cầu trùng số điện thoại và thời gian: hiển thị cảnh báo cho admin.
