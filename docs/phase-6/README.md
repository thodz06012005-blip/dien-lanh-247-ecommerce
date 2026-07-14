# Giai đoạn 6 — Luồng yêu cầu dịch vụ cốt lõi

Giai đoạn 6 xây dựng luồng nghiệp vụ hoàn chỉnh từ lúc khách hàng gửi yêu cầu đến khi doanh nghiệp đóng hồ sơ hoặc tiếp nhận bảo hành.

## Phạm vi

- Form đặt dịch vụ nhiều bước, responsive và hỗ trợ ảnh hiện trạng.
- Mã yêu cầu duy nhất `DL247-YYMMDD-XXXXXX`.
- Xác nhận qua email, có chế độ mô phỏng an toàn khi local chưa cấu hình SMTP.
- Tra cứu bằng đồng thời mã yêu cầu và số điện thoại.
- Dữ liệu tra cứu được che tên, số điện thoại và email; không trả địa chỉ chi tiết.
- Trạng thái chuẩn hóa và ma trận chuyển trạng thái được backend thực thi.
- Danh sách admin phân trang, tìm kiếm, lọc, quick filter và tự làm mới 15 giây.
- Lịch sử trạng thái bất biến, audit log database và ảnh theo giai đoạn.
- Upload ảnh trước, chẩn đoán, sau sửa chữa và bảo hành qua Cloudinary.

## Trạng thái

Luồng chính:

```text
NEW → CONFIRMED → ASSIGNED → IN_PROGRESS
                       ├─→ WAITING_PARTS → IN_PROGRESS
                       └─→ COMPLETED → WARRANTY → CLOSED
                                      └──────────→ CLOSED
```

Ngoại lệ:

```text
NEW        → REJECTED | CANCELLED | RESCHEDULED
CONFIRMED  → CANCELLED | RESCHEDULED
ASSIGNED   → CANCELLED | RESCHEDULED
IN_PROGRESS / WAITING_PARTS → CANCELLED
RESCHEDULED → CONFIRMED | CANCELLED
```

Không cho chuyển tắt, ví dụ `NEW → COMPLETED` hoặc `ASSIGNED → COMPLETED`.

## Thành phần chính

| Lớp | Tệp/Thư mục |
|---|---|
| Migration | `backend/prisma/migrations/20260714060000_phase6_service_request_lifecycle/` |
| Seed đồng bộ | `backend/prisma/seed-service-request-workflow.ts` |
| Workflow contract | `backend/src/modules/service-requests/service-request-workflow.ts` |
| API service/controller | `backend/src/modules/service-requests/` |
| Form khách hàng | `frontend-user/src/pages/ServiceBooking.tsx` |
| Tra cứu công khai | `frontend-user/src/pages/ServiceRequestLookup.tsx` |
| Admin list | `frontend-admin/src/pages/ServiceRequests.tsx` |
| Admin detail | `frontend-admin/src/pages/ServiceRequestDetail.tsx` |
| Contract test | `tests/architecture/phase6-service-request-lifecycle.test.mjs` |
| API integration | `backend/test/phase6-service-request.integration.mjs` |
| GitHub Actions | `.github/workflows/phase6-service-request-integration.yml` |

## Chạy local

```bash
npm ci
npm run bootstrap
npm --prefix backend run prisma:migrate:deploy
npm --prefix backend run prisma:seed
npm run dev:platform
```

- Customer: `http://localhost:5173/#/service-booking`
- Lookup: `http://localhost:5173/#/service-lookup`
- Admin: `http://localhost:5174/#/service-requests`
- API: `http://localhost:3000/api/v1`

## Tài liệu liên quan

- `DATA_MODEL.md`
- `WORKFLOW.md`
- `API_CONTRACT.md`
- `SECURITY_AND_PRIVACY.md`
- `CI_ACCEPTANCE.md`
- `PHASE_6_HANDOVER.md`
