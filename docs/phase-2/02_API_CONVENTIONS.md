# Quy ước API và mã lỗi

## 1. Phạm vi

Tài liệu áp dụng cho REST API dưới prefix:

```text
/api/v1
```

Mục tiêu là để customer web, admin web, test và các integration dùng cùng một contract ổn định.

## 2. Nguyên tắc

1. Dùng HTTP status đúng ý nghĩa.
2. Response luôn có `success`.
3. Client dựa vào `error.code`, không dựa vào câu chữ `message`.
4. `message` có thể dịch hoặc thay đổi mà không tạo breaking change.
5. Không trả stack trace, câu SQL, password, token hoặc dữ liệu nội bộ.
6. Mọi response có `requestId`, `timestamp` và `path`.
7. API có pagination phải cung cấp metadata nhất quán.
8. Version breaking được đưa sang prefix mới hoặc có kế hoạch migration rõ ràng.

## 3. Response thành công

### 3.1. Một tài nguyên

```json
{
  "success": true,
  "data": {
    "id": 12,
    "name": "Điều hòa Daikin"
  },
  "message": "Lấy dữ liệu thành công",
  "requestId": "4a37fd19-93ba-42fb-bd50-e44e39466ca5",
  "timestamp": "2026-07-14T01:00:00.000Z",
  "path": "/api/v1/products/12"
}
```

### 3.2. Danh sách phân trang

```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 126,
    "page": 2,
    "limit": 20,
    "totalPages": 7
  },
  "pagination": {
    "total": 126,
    "page": 2,
    "limit": 20,
    "totalPages": 7
  },
  "requestId": "request-id",
  "timestamp": "2026-07-14T01:00:00.000Z",
  "path": "/api/v1/products?page=2&limit=20"
}
```

`pagination` được giữ trong thời gian tương thích với frontend hiện tại. Code mới ưu tiên `meta`.

### 3.3. Không có body nghiệp vụ

Có thể trả:

```json
{
  "success": true,
  "data": null,
  "message": "Đăng xuất thành công",
  "requestId": "request-id",
  "timestamp": "2026-07-14T01:00:00.000Z",
  "path": "/api/v1/auth/logout"
}
```

## 4. Response lỗi

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Dữ liệu không hợp lệ.",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ.",
    "details": [
      "phone must be a valid phone number"
    ]
  },
  "requestId": "request-id",
  "timestamp": "2026-07-14T01:00:00.000Z",
  "method": "POST",
  "path": "/api/v1/service-requests"
}
```

## 5. HTTP status

| Status | Sử dụng |
| ---: | --- |
| `200` | GET/PATCH/DELETE thành công có response |
| `201` | Tạo tài nguyên thành công |
| `204` | Thành công không cần body, chỉ dùng khi client hỗ trợ rõ |
| `400` | DTO hoặc quy tắc request không hợp lệ |
| `401` | Chưa xác thực, session/token không hợp lệ |
| `403` | Đã xác thực nhưng không đủ quyền |
| `404` | Không tìm thấy tài nguyên |
| `409` | Xung đột unique/state/idempotency |
| `413` | Payload vượt giới hạn |
| `415` | Content-Type không được hỗ trợ |
| `422` | Có thể dùng cho nghiệp vụ hợp lệ về cú pháp nhưng không thực hiện được |
| `429` | Vượt rate limit hoặc login attempts |
| `500` | Lỗi ngoài dự kiến; không lộ chi tiết nội bộ |
| `503` | Dependency quan trọng tạm thời không sẵn sàng |

## 6. Bộ mã lỗi

Mã lỗi được định nghĩa trong:

```text
backend/src/common/constants/error-codes.ts
```

### 6.1. Mã kỹ thuật chung

- `INTERNAL_ERROR`
- `VALIDATION_ERROR`
- `BAD_REQUEST`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `PAYLOAD_TOO_LARGE`
- `UNSUPPORTED_MEDIA_TYPE`
- `DATABASE_ERROR`
- `RESOURCE_ALREADY_EXISTS`
- `RESOURCE_NOT_FOUND`

### 6.2. Xác thực và phân quyền

- `AUTH_INVALID_CREDENTIALS`
- `AUTH_SESSION_EXPIRED`
- `AUTH_ACCOUNT_DISABLED`
- `AUTH_TOO_MANY_ATTEMPTS`
- `PERMISSION_DENIED`

### 6.3. Nghiệp vụ

- `BUSINESS_RULE_VIOLATION`
- `DANGEROUS_ACTION_CONFIRMATION_REQUIRED`
- `PRODUCT_NOT_FOUND`
- `PRODUCT_OUT_OF_STOCK`
- `ORDER_NOT_FOUND`
- `ORDER_INVALID_STATUS_TRANSITION`
- `SERVICE_REQUEST_NOT_FOUND`
- `SERVICE_REQUEST_INVALID_STATUS_TRANSITION`
- `TECHNICIAN_NOT_AVAILABLE`
- `TECHNICIAN_HAS_ACTIVE_ASSIGNMENTS`

Mã mới phải có tên ổn định, viết hoa và phân cách bằng `_`.

## 7. Tạo lỗi nghiệp vụ

```ts
throw new BusinessException('Kỹ thuật viên không sẵn sàng.', {
  code: ErrorCode.TECHNICIAN_NOT_AVAILABLE,
  status: HttpStatus.CONFLICT,
  details: {
    technicianId,
    currentStatus,
  },
});
```

Không nên tạo message bằng cách ghép trực tiếp dữ liệu nhạy cảm.

## 8. Validation error

`ValidationPipe` được cấu hình:

- `whitelist: true` — loại trường không có decorator.
- `forbidNonWhitelisted: true` — từ chối trường không cho phép.
- `transform: true` — chuyển đổi DTO.
- `enableImplicitConversion: true` — hỗ trợ query primitive.
- `stopAtFirstError: false` — trả đủ nhóm lỗi validation.

Client phải hiển thị `error.details` khi đó là mảng; nếu không có, hiển thị `error.message`.

## 9. Request ID

Client gửi:

```http
X-Request-Id: uuid-or-safe-client-id
```

Backend:

- chấp nhận ID hợp lệ tối đa 128 ký tự;
- sinh UUID nếu thiếu hoặc không hợp lệ;
- trả lại header `X-Request-Id`;
- đưa ID vào success/error body;
- dùng ID khi ghi log.

Khi báo lỗi hỗ trợ, người dùng hoặc admin nên cung cấp request ID.

## 10. Content-Type

Backend chấp nhận body cho POST/PUT/PATCH dưới các dạng:

- `application/json`;
- `application/x-www-form-urlencoded`;
- `multipart/form-data`.

Request không có body (`Content-Length: 0`) không bắt buộc Content-Type. Dạng khác nhận `415`.

## 11. Pagination, filter và sort

Query chuẩn:

```text
?page=1&limit=20&sort=createdAt:desc&q=daikin
```

Quy tắc:

- `page` bắt đầu từ 1.
- `limit` có max do DTO quy định.
- sort field phải nằm trong allowlist.
- filter enum phải validate.
- search text được trim và giới hạn chiều dài.
- không truyền thẳng field/order từ query vào Prisma mà không allowlist.

## 12. Date, money và enum

- Date/time truyền ISO 8601 UTC.
- Frontend chịu trách nhiệm hiển thị múi giờ Việt Nam.
- Tiền không dùng floating-point cho tính toán backend; Prisma Decimal hoặc integer minor unit.
- Enum API dùng string ổn định.
- Không đổi tên enum đang public mà không có migration contract.

## 13. Idempotency

Endpoint có nguy cơ tạo trùng do retry như thanh toán, đặt đơn hoặc webhook nên bổ sung `Idempotency-Key` ở giai đoạn nghiệp vụ tương ứng.

## 14. Backward compatibility

Interceptor hiện tại:

- nếu controller/service trả `{ success: true|false, ... }`, giữ nguyên dữ liệu và chỉ thêm metadata;
- nếu trả object/raw value, bọc thành `{ success: true, data, ... }`.

Nhờ đó các màn hình hiện tại vẫn đọc `response.data.data` và có thể chuyển đổi dần.

## 15. Thay đổi breaking

Breaking change gồm:

- đổi kiểu hoặc tên field;
- xóa field;
- đổi ý nghĩa status/error code;
- thay URL hoặc method;
- thay authentication mechanism;
- đổi pagination contract.

PR breaking phải ghi:

1. client bị ảnh hưởng;
2. thời gian deprecation;
3. migration guide;
4. test tương thích;
5. rollback plan.
