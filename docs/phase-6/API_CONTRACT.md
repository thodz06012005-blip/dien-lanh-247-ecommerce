# API contract Giai đoạn 6

Prefix mặc định: `/api/v1`.

## Public API

### Tạo yêu cầu

```http
POST /service-requests
Content-Type: application/json
```

Payload:

```json
{
  "customerName": "Nguyễn Văn A",
  "customerPhone": "0912345678",
  "customerEmail": "a@example.com",
  "customerAddress": "Số nhà, đường, phường",
  "district": "Quận Cầu Giấy",
  "applianceType": "Điều hòa Daikin 12000 BTU",
  "serviceCategoryId": "sua-dieu-hoa",
  "issueDescription": "Điều hòa không làm lạnh...",
  "priority": "high",
  "preferredDate": "2027-01-15",
  "preferredTimeSlot": "08:00 - 10:00",
  "note": "Gọi trước 30 phút"
}
```

Kết quả chính:

```json
{
  "success": true,
  "data": {
    "code": "DL247-270115-A1B2C3",
    "status": "NEW",
    "confirmationSent": true
  }
}
```

### Tra cứu bảo mật

```http
POST /service-requests/lookup
Content-Type: application/json
```

```json
{
  "code": "DL247-270115-A1B2C3",
  "phone": "0912345678"
}
```

Chỉ trả dữ liệu đã che. Không trả `customerAddress`, số điện thoại đầy đủ hoặc email đầy đủ.

### Upload ảnh khách hàng

```http
POST /service-requests/:id/media
Content-Type: multipart/form-data
```

Fields:

- `files`: tối đa 5 ảnh, mỗi ảnh 5 MB.
- `phone`: số điện thoại đã đăng ký.
- `stage`: phía server luôn ép thành `CUSTOMER_BEFORE`.
- `caption`: tùy chọn.

Khách hàng chỉ được bổ sung ảnh ở `NEW`, `CONFIRMED` hoặc `RESCHEDULED`.

### Lịch sử theo tài khoản

```http
GET /my-service-requests
```

Yêu cầu JWT cookie. Backend lấy số điện thoại từ user trong database, không nhận số điện thoại từ query string.

## Admin API

### Danh sách

```http
GET /admin/service-requests
```

Query:

- `page`, `limit`
- `q`
- `status`
- `priority`
- `serviceCategoryId`
- `technicianId`
- `dateFrom`, `dateTo`
- `quickFilter`: `new`, `unassigned`, `active`, `waiting-parts`, `overdue`, `warranty`
- `sortBy`, `sortOrder`

Response có `data`, `meta` và `stats` cho quick filter cards.

### Chi tiết

```http
GET /admin/service-requests/:id
```

Trả:

- thông tin đầy đủ;
- `allowedTransitions`;
- timeline;
- media;
- audit database;
- kỹ thuật viên;
- timestamps nghiệp vụ.

### Cập nhật trạng thái

```http
PATCH /admin/service-requests/:id/status
```

```json
{
  "status": "IN_PROGRESS",
  "note": "Đã kiểm tra nguồn và bắt đầu sửa chữa"
}
```

`COMPLETED` nhận thêm `finalPrice`. `RESCHEDULED` nhận thêm `preferredDate` và `preferredTimeSlot`.

### Phân công kỹ thuật viên

```http
PATCH /admin/service-requests/:id/assign-technician
```

```json
{ "technicianId": "TECH-001" }
```

### Upload ảnh nội bộ

```http
POST /admin/service-requests/:id/media
Content-Type: multipart/form-data
```

Stage hợp lệ: `BEFORE`, `DIAGNOSTIC`, `AFTER`, `WARRANTY`.

## Lỗi chuẩn

- `400`: dữ liệu hoặc bước chuyển không hợp lệ.
- `401`: chưa đăng nhập.
- `403`: không đủ quyền hoặc ảnh khách hàng tải sai giai đoạn.
- `404`: mã và điện thoại không khớp; thông báo không phân biệt mã sai hay điện thoại sai.
- `409`: xung đột dữ liệu nếu được bổ sung optimistic locking sau này.
