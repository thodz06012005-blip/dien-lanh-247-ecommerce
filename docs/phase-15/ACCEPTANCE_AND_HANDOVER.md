# Biên bản nghiệm thu và bàn giao Giai đoạn 15

## 1. Phạm vi

Giai đoạn 15 đưa hệ thống Điện Lạnh 247 từ trạng thái hoàn thiện tính năng sang trạng thái có thể triển khai, theo dõi và phục hồi. Phạm vi gồm bộ test, container production, HTTPS reverse proxy, migration/seed, backup/restore, health/alert, tài liệu vận hành và quality gate cuối.

## 2. Thành phần bàn giao

| Nhóm | Thành phần | Trạng thái |
|---|---|---|
| Bộ test | unit test auth/products/health | Đã triển khai |
| API E2E | đặt dịch vụ → phân công → báo giá → hoàn thành | Đã triển khai |
| RBAC E2E | khách hàng không truy cập API admin | Đã triển khai |
| Responsive | desktop/tablet/mobile; Chromium/Firefox/WebKit | Đã triển khai |
| Deployment | Dockerfile cho backend/user/admin | Đã triển khai |
| Orchestration | MySQL, app containers, volumes, health checks | Đã triển khai |
| Gateway | Nginx, HTTPS, HTTP redirect, host routing | Đã triển khai |
| Data safety | migration deploy, seed, backup, checksum, restore | Đã triển khai |
| Observability | structured log, live/ready, webhook monitor | Đã triển khai |
| Documentation | install, operations, admin, source handover | Đã triển khai |

## 3. Chuỗi nghiệm thu

```mermaid
flowchart LR
  Q[Lint + Typecheck] --> U[Unit tests]
  U --> I[API integration]
  I --> R[Responsive browsers]
  R --> B[Production builds]
  B --> D[Docker + HTTPS]
  D --> M[Migration + Seed]
  M --> BR[Backup + Restore]
  BR --> S[Production smoke]
  S --> H[Handover]
```

Không được đánh dấu hoàn tất nếu bỏ qua bất kỳ cổng nào. Artifact CI phải chứa log, coverage, Playwright report/screenshot và kết quả restore/smoke.

## 4. Tiêu chí nghiệm thu

### Build production

- [ ] Backend production build thành công.
- [ ] Frontend user production build thành công.
- [ ] Frontend admin production build thành công.
- [ ] Ba Docker image build thành công.
- [ ] `docker compose config` hợp lệ.

### Luồng quan trọng

- [ ] Health live/ready pass.
- [ ] Khách hàng tạo yêu cầu dịch vụ thành công.
- [ ] Admin đăng nhập thành công bằng HttpOnly cookie.
- [ ] Khách hàng bị chặn khi gọi API admin.
- [ ] Admin xác nhận và phân công kỹ thuật viên.
- [ ] Yêu cầu chuyển sang đang xử lý.
- [ ] Báo giá được tính và khách hàng chấp thuận.
- [ ] Biên bản hoàn thành được tạo.
- [ ] Workspace phản ánh trạng thái hoàn thành.
- [ ] Logout thu hồi quyền truy cập.

### Responsive và trình duyệt

- [ ] 1440×900 Chromium.
- [ ] 768×1024 Chromium.
- [ ] Mobile Chromium.
- [ ] Desktop Firefox.
- [ ] Mobile WebKit.
- [ ] Không horizontal overflow và không page runtime error.

### Backup và restore

- [ ] Tạo `.sql.gz` thành công.
- [ ] Tạo/kiểm tra SHA-256 thành công.
- [ ] Restore vào database tạm thành công.
- [ ] Chạy migration sau restore thành công.
- [ ] Readiness và smoke test sau restore thành công.
- [ ] RPO/RTO được ghi lại.

### Tự vận hành

- [ ] Người tiếp nhận tự tạo env từ template.
- [ ] Người tiếp nhận tự cài certificate.
- [ ] Người tiếp nhận tự khởi chạy compose.
- [ ] Người tiếp nhận đọc được structured log và request ID.
- [ ] Người tiếp nhận tự chạy backup/restore drill.
- [ ] Người tiếp nhận biết rollback image và quy trình incident.

## 5. Bảo vệ tương thích Giai đoạn 1–14

- Không thay đổi Prisma schema trong Phase 15.
- Không thay đổi order pricing, cart/checkout, inventory hoặc payment calculations.
- Không thay đổi service transition và quotation calculations.
- Không thay đổi CMS, notification outbox hoặc SEO routing.
- Giữ nguyên refresh rotation, RBAC, upload validation, secret scan và audit hash chain của Phase 14.
- Branch Phase 15 phải có `behind_by=0` so với head Phase 14 tại thời điểm mở PR.

## 6. Bằng chứng CI

Điền sau lần chạy GitHub Actions thành công:

| Trường | Giá trị |
|---|---|
| Workflow | Phase 15 Production Readiness |
| Run ID | Chờ CI |
| Head SHA | Chờ CI |
| Kết luận | Chờ CI |
| Artifact | `phase15-acceptance-evidence` |
| Backup checksum | Chờ restore drill |
| RPO/RTO drill | Chờ restore drill |

## 7. Các việc bắt buộc khi go-live thật

- Cấp DNS và certificate CA thật.
- Inject secret qua secret manager.
- Đặt `RUN_SEED=false` sau bootstrap ban đầu.
- Lập lịch backup và health monitor.
- Lưu backup mã hóa ngoài máy chủ ứng dụng.
- Cấu hình người nhận cảnh báo và escalation.
- Chạy restore drill trên staging gần production.
- Đổi mật khẩu seed admin và review RBAC.

## 8. Xác nhận bàn giao

| Vai trò | Họ tên | Ngày | Kết quả/Ký xác nhận |
|---|---|---|---|
| Đại diện phát triển |  |  |  |
| Đại diện kiểm thử |  |  |  |
| Đại diện vận hành |  |  |  |
| Người tiếp nhận source |  |  |  |

Chỉ ký nghiệm thu khi tất cả checkbox kỹ thuật đã có bằng chứng và người tiếp nhận tự khởi chạy/khôi phục được hệ thống theo tài liệu.
