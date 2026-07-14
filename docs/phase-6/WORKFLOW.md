# Quy trình trạng thái yêu cầu dịch vụ

## Nguồn sự thật

Ma trận duy nhất nằm tại:

`backend/src/modules/service-requests/service-request-workflow.ts`

Frontend chỉ hiển thị `allowedTransitions` do backend trả về. Backend vẫn kiểm tra lại trong transaction, vì ẩn nút ở giao diện không phải cơ chế bảo mật.

## Luồng chính

| Từ | Đến hợp lệ | Điều kiện nghiệp vụ |
|---|---|---|
| `NEW` | `CONFIRMED`, `RESCHEDULED`, `REJECTED`, `CANCELLED` | Yêu cầu vừa được gửi |
| `CONFIRMED` | `ASSIGNED`, `RESCHEDULED`, `CANCELLED` | Đã liên hệ xác nhận |
| `ASSIGNED` | `IN_PROGRESS`, `RESCHEDULED`, `CANCELLED` | Đã có kỹ thuật viên |
| `IN_PROGRESS` | `WAITING_PARTS`, `COMPLETED`, `CANCELLED` | Kỹ thuật viên đang xử lý |
| `WAITING_PARTS` | `IN_PROGRESS`, `CANCELLED` | Có linh kiện để tiếp tục |
| `COMPLETED` | `WARRANTY`, `CLOSED` | Đã nhập chi phí thực tế |
| `WARRANTY` | `IN_PROGRESS`, `CLOSED` | Bảo hành cần xử lý lại hoặc kết thúc |
| `RESCHEDULED` | `CONFIRMED`, `CANCELLED` | Có ngày và khung giờ mới |
| `CLOSED`, `CANCELLED`, `REJECTED` | Không có | Trạng thái kết thúc |

## Quy tắc bắt buộc

- `ASSIGNED`, `IN_PROGRESS`, `COMPLETED` yêu cầu đã có kỹ thuật viên.
- `RESCHEDULED` bắt buộc ngày và khung giờ mới.
- `COMPLETED` bắt buộc chi phí thực tế không âm.
- Không được chuyển `NEW → COMPLETED`.
- Không được chuyển `ASSIGNED → COMPLETED`; phải qua `IN_PROGRESS`.
- Trạng thái kết thúc không được mở lại bằng endpoint thông thường.
- Mỗi thay đổi tăng `requestVersion`.
- Mỗi thay đổi tạo một `ServiceRequestStatusEvent` và một `ServiceRequestAudit` trong cùng transaction.

## Phân công kỹ thuật viên

Phân công chỉ được thực hiện khi yêu cầu là:

- `CONFIRMED`
- `RESCHEDULED`
- hoặc `ASSIGNED` khi đổi người phụ trách

Kỹ thuật viên phải:

- tồn tại;
- đang `available`, trừ trường hợp đang là người phụ trách của chính yêu cầu;
- có `serviceCategoryId` trong `skills`;
- có khu vực yêu cầu trong `workingAreas`.

Sau phân công, kỹ thuật viên chuyển `busy`. Khi hồ sơ hoàn thành, đóng, hủy hoặc từ chối, hệ thống đếm các việc đang hoạt động trước khi trả kỹ thuật viên về `available`.

## Đồng thời và chống ghi đè

Cập nhật trạng thái và phân công sử dụng transaction với:

```sql
SELECT ... FOR UPDATE
```

Nhờ đó hai admin không thể đồng thời đọc cùng trạng thái cũ rồi ghi hai nhánh mâu thuẫn. `requestVersion` hỗ trợ quan sát thay đổi và là nền cho optimistic locking ở giai đoạn sau.
