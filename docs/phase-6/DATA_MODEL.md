# Mô hình dữ liệu Giai đoạn 6

## Nguyên tắc migration

Migration Giai đoạn 6 là additive:

- Không xóa hoặc đổi tên cột cũ.
- Giữ `ServiceRequest.status` và `statusHistory` để các module trước tiếp tục hoạt động.
- Bổ sung `workflowStatus` làm nguồn trạng thái chuẩn của Giai đoạn 6.
- Mọi thay đổi trạng thái mới được ghi đồng thời vào bảng chuẩn hóa và JSON tương thích.

## ServiceRequest mở rộng

| Cột | Mục đích |
|---|---|
| `customerEmail` | Nhận xác nhận và thông báo nghiệp vụ |
| `workflowStatus` | Trạng thái chuẩn hóa của quy trình |
| `requestVersion` | Phiên bản tăng dần sau thao tác nghiệp vụ |
| `source` | Nguồn tạo yêu cầu, mặc định `WEB` |
| `scheduledAt` | Thời điểm lịch hẹn quy đổi từ ngày và khung giờ |
| `confirmedAt` | Thời điểm xác nhận đầu tiên |
| `assignedAt` | Thời điểm phân công đầu tiên |
| `startedAt` | Thời điểm bắt đầu xử lý |
| `completedAt` | Thời điểm hoàn thành |
| `warrantyStartedAt` | Thời điểm mở bảo hành |
| `closedAt` | Thời điểm đóng hồ sơ |
| `lastStatusChangedAt` | Thời điểm thay đổi trạng thái gần nhất |
| `lookupLastFour` | Bốn số cuối phục vụ vận hành, không dùng làm bí mật xác thực |

## ServiceRequestStatusEvent

Nhật ký trạng thái bất biến:

- `requestId`
- `fromStatus`
- `toStatus`
- `note`
- `actorType`
- `actorId`
- `actorName`
- `metadata`
- `createdAt`

Bản ghi không bị cập nhật hoặc xóa trong luồng thông thường. Timeline được sắp xếp theo `createdAt` và `id`.

## ServiceRequestMedia

Lưu metadata ảnh:

- `stage`: `CUSTOMER_BEFORE`, `BEFORE`, `DIAGNOSTIC`, `AFTER`, `WARRANTY`.
- `url` và `publicId` của Cloudinary.
- MIME type, dung lượng, kích thước.
- Chú thích.
- Người tải và thời điểm tải.

Tệp thực nằm trên Cloudinary; database chỉ lưu metadata và quan hệ với yêu cầu.

## ServiceRequestAudit

Audit nghiệp vụ bền vững trong database:

- `action`
- `actorType`, `actorId`, `actorName`
- `ipHash`, không lưu IP thô
- `userAgent`
- `metadata`
- `createdAt`

Audit database bổ sung cho `AuditLogService` hiện có. Audit service cũ vẫn được giữ để không phá luồng bảo mật của các giai đoạn trước.

## Chỉ mục

Các chỉ mục mới tối ưu:

- trạng thái + ngày tạo
- ưu tiên + trạng thái
- điện thoại + mã yêu cầu
- ngày mong muốn + trạng thái
- thời điểm đổi trạng thái
- request + thời gian trên event/media/audit

## Tính tương thích

`workflowStatus` được ánh xạ về enum cũ:

| Workflow mới | Legacy status |
|---|---|
| `NEW` | `pending` |
| `CONFIRMED`, `RESCHEDULED` | `confirmed` |
| `ASSIGNED`, `IN_PROGRESS`, `WAITING_PARTS`, `WARRANTY` | `assigned` |
| `COMPLETED`, `CLOSED` | `completed` |
| `CANCELLED`, `REJECTED` | `cancelled` |
