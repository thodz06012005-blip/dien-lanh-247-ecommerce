# 09. API Draft và Data Contract

## 1. Entity chính

### ServiceRequest

```ts
interface ServiceRequest {
  id: string;
  code: string;
  customerId?: string;
  customerName: string;
  phone: string;
  email?: string;
  serviceId: string;
  issueDescription: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  status: ServiceRequestStatus;
  address: AddressSnapshot;
  appointmentDate: string;
  appointmentSlotId: string;
  technicianId?: string;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}
```

### Status enum

```ts
type ServiceRequestStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_PARTS'
  | 'COMPLETED'
  | 'WARRANTY'
  | 'CLOSED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'RESCHEDULED';
```

## 2. API công khai

```http
GET  /api/public/services
GET  /api/public/services/:slug
GET  /api/public/projects
GET  /api/public/projects/:slug
GET  /api/public/posts
GET  /api/public/posts/:slug
GET  /api/public/appointment-slots?date=&district=&serviceId=
POST /api/public/service-requests
POST /api/public/service-requests/lookup
GET  /api/public/service-requests/:code/status?token=
```

## 3. API admin

```http
POST  /api/admin/auth/login
POST  /api/admin/auth/refresh
POST  /api/admin/auth/logout
GET   /api/admin/dashboard/summary
GET   /api/admin/service-requests
GET   /api/admin/service-requests/:id
PATCH /api/admin/service-requests/:id
POST  /api/admin/service-requests/:id/assign
POST  /api/admin/service-requests/:id/status
GET   /api/admin/technicians/availability
GET   /api/admin/customers
CRUD  /api/admin/services
CRUD  /api/admin/projects
CRUD  /api/admin/posts
CRUD  /api/admin/banners
GET   /api/admin/audit-logs
```

## 4. Create request payload

```json
{
  "serviceId": "service_air_conditioner_repair",
  "issueDescription": "Điều hòa chạy nhưng không lạnh và có tiếng kêu.",
  "priority": "HIGH",
  "deviceOperationalStatus": "PARTIAL",
  "address": {
    "provinceCode": "79",
    "districtCode": "778",
    "wardCode": "27487",
    "addressLine": "72 Nguyễn Thị Thập"
  },
  "appointmentDate": "2026-07-15",
  "appointmentSlotId": "slot_1400_1600",
  "customer": {
    "name": "Trần Minh Hương",
    "phone": "0909123456",
    "email": "huong@example.com"
  },
  "consent": true
}
```

## 5. Response chuẩn

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "requestId": "req_..."
}
```

Lỗi validation:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu chưa hợp lệ",
    "fields": {
      "phone": "Số điện thoại chưa đúng định dạng"
    }
  },
  "requestId": "req_..."
}
```

## 6. Bảo mật và độ tin cậy

- Rate limit cho form công khai và login.
- Idempotency key khi tạo yêu cầu.
- Upload qua signed URL hoặc endpoint kiểm soát MIME/size.
- Không trả dữ liệu nội bộ qua API tra cứu công khai.
- Ghi audit log cho assign và status transition.
- Backend kiểm tra state machine, không cho chuyển trạng thái tùy ý.
