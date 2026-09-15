## Capability / migration

<!-- Một PR chỉ xử lý một capability hoặc một migration có thể rollback. -->

- Issue:
- Phase / priority:
- Owner:
- Inventory row(s):
- D1–D10 dependency (nếu có):

## Thay đổi

- [ ] Customer Web
- [ ] Admin Web
- [ ] Backend / mock API
- [ ] Prisma / migration / seed
- [ ] OpenAPI / documentation
- [ ] Test / CI
- [ ] Operations / observability

Mô tả ngắn:

## Acceptance criteria và bằng chứng

| Tiêu chí | Bằng chứng / lệnh / ảnh |
|---|---|
|  |  |

## Data, security và consent

- [ ] Không commit secret, database dump, token hoặc dữ liệu khách hàng.
- [ ] Quyền được kiểm tra theo tài nguyên; không chỉ ẩn nút ở frontend.
- [ ] Log không chứa password, token hoặc PII không cần thiết.
- [ ] Nếu thay đổi booking: Customer được lưu/liên kết trong transaction phù hợp.
- [ ] Nếu thay đổi consent: checkbox mặc định chưa chọn, backend bắt buộc xác thực và lưu phiên bản + thời điểm đồng ý.
- [ ] Đã xem xét rate limit, idempotency, audit và retention.

## API và database

- [ ] Không thay đổi API/database.
- [ ] OpenAPI đã cập nhật trong cùng PR.
- [ ] Prisma schema và migration đã cập nhật trong cùng PR.
- [ ] Migration chạy được trên database sạch.
- [ ] Có rollback hoặc forward-fix plan.

## Verification

- [ ] `npm run check:all`
- [ ] `npm run build:all`
- [ ] `npm --prefix backend run build`
- [ ] Backend unit test liên quan
- [ ] Backend E2E liên quan
- [ ] Không có regression so với `docs/phase-1/quality-baseline.md`

Kết quả/lỗi baseline còn lại:

## Rollback

<!-- Cách tắt capability, revert code hoặc phục hồi migration/data. -->

## Review bắt buộc

- [ ] Frontend (nếu ảnh hưởng FE)
- [ ] Backend (nếu ảnh hưởng API/data)
- [ ] QA
- [ ] Product Owner
- [ ] Security/Ops (nếu ảnh hưởng auth, PII, payment, backup hoặc production)
