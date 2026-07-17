# Mục lục và bằng chứng 15 giai đoạn — Điện Lạnh 247

## Mục đích

Tài liệu này không tự tuyên bố giai đoạn đã hoàn thành. Trạng thái chỉ dựa trên thư mục, source, test, workflow và tài liệu hiện có tại thời điểm kiểm toán.

| Giai đoạn | Phạm vi chính | Bằng chứng tài liệu/source đã biết | Trạng thái tài liệu | Ghi chú |
|---:|---|---|---|---|
| 1 | Nền tảng frontend khách hàng | Source `frontend-user`; tài liệu gốc và lịch sử dự án | Một phần | Chưa tìm thấy bộ `docs/phase-1` độc lập; cần lập mapping từ tài liệu root và commit |
| 2 | Danh mục và chi tiết sản phẩm | `docs/phase-2`, frontend sản phẩm, API sản phẩm | Có thư mục riêng | Cần kiểm tra link và mức độ đồng bộ với backend hiện tại |
| 3 | Giỏ hàng, biến thể, tồn kho | `docs/phase-3`, cart/store, product variant | Có thư mục riêng | Không đổi tên file đang được architecture test tham chiếu |
| 4 | Checkout và địa chỉ | `docs/phase-4`, checkout, order API | Có thư mục riêng | Cần giữ API contract tương thích |
| 5 | Đơn hàng và nội dung quản lý | `docs/phase-5`, `backend/prisma/seed-content.ts` | Có thư mục riêng | Ảnh seed còn phụ thuộc nguồn ngoài |
| 6 | Admin dashboard và quản lý cơ bản | `docs/phase-6`, `frontend-admin` | Có thư mục riêng | Cần kiểm tra responsive và permission |
| 7 | CMS, bài viết, dự án | `docs/phase-7`, CMS source | Có thư mục riêng | Cần map ảnh article/project vào manifest |
| 8 | Authentication và tài khoản khách hàng | Backend auth, frontend auth, test | Một phần | Chưa tìm thấy bộ `docs/phase-8` độc lập; không được tự đánh dấu hoàn thành |
| 9 | Quy trình yêu cầu sửa chữa và CMS editorial | `docs/phase-9`, service request workflow, seed editorial | Có thư mục riêng | Không đổi đường dẫn tài liệu nếu test tham chiếu chính xác |
| 10 | Điều phối kỹ thuật viên, SLA, vận hành | Source technician/service request; nhiều file handover root | Phân tán | Cần gom tài liệu root vào `docs/ban-giao/giai-doan-10` bằng `git mv` sau khi kiểm tra reference |
| 11 | Phạm vi chưa được mô tả thống nhất | Commit/source/test liên quan | Chưa xác minh | Không tạo nội dung giả; cần truy nguồn PR/commit và tài liệu bàn giao |
| 12 | Notification, integration, outbox | `docs/phase-12`, notification/integration source | Có thư mục riêng | Cần kiểm tra retry, idempotency và outbox contract |
| 13 | SEO, hiệu năng, sitemap, ảnh | `docs/phase-13`, workflow SEO/Lighthouse | Có thư mục riêng | Thư viện ảnh canonical liên quan trực tiếp giai đoạn này |
| 14 | Security hardening | `docs/phase-14`, PR #15, auth/RBAC/audit/upload | Có thư mục riêng | Không làm yếu bảo mật khi đồng bộ Mock API và backend thật |
| 15 | Production readiness và bàn giao | `docs/phase-15`, PR #16, Docker/Nginx/backup/monitoring | Có thư mục riêng | Nhánh refactor hiện tại được tạo từ head của Phase 15 |

## Các thư mục tài liệu giai đoạn hiện đã biết

```text
docs/phase-2/
docs/phase-3/
docs/phase-4/
docs/phase-5/
docs/phase-6/
docs/phase-7/
docs/phase-9/
docs/phase-12/
docs/phase-13/
docs/phase-14/
docs/phase-15/
```

## Các giai đoạn cần truy nguồn thêm

### Giai đoạn 1

- Tìm trong README, tài liệu frontend khách hàng và lịch sử commit.
- Không tạo `docs/phase-1` với nội dung suy đoán.

### Giai đoạn 8

- Tìm source auth, DTO, session, frontend store và test.
- Đối chiếu tài khoản customer, admin và Mock API.

### Giai đoạn 10

- Tìm các file `HANDOVER_10*`, technician, SLA, service request lifecycle.
- Chỉ di chuyển tài liệu sau khi cập nhật mọi link.

### Giai đoạn 11

- Tìm commit/PR có nhãn Phase 11 hoặc tài liệu mô tả phạm vi.
- Nếu không có bằng chứng đủ, giữ trạng thái `Chưa xác minh`.

## Quy tắc khi sắp xếp tài liệu

1. Không đổi tên `docs/phase-*` trong lần refactor đầu.
2. Không đổi tên file được workflow/test tham chiếu nếu chưa cập nhật reference.
3. Tài liệu root chỉ được di chuyển sau khi tạo bảng `old_path → new_path`.
4. Mọi di chuyển local phải dùng `git mv`.
5. Không xóa tài liệu cũ; tài liệu lỗi thời được chuyển vào `docs/luu-tru/tai-lieu-cu/` và ghi rõ tài liệu thay thế.

## Kiểm thử bắt buộc sau sắp xếp

```bash
node scripts/audit-file-organization.mjs
node scripts/audit-image-assets.mjs
npm run validate:repo
npm run security:scan
npm run lint
npm run typecheck
npm run test:architecture
npm run build:all
```
