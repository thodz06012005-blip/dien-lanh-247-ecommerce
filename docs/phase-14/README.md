# Giai đoạn 14 — Security hardening và an toàn dữ liệu

## Mục tiêu

Giảm rủi ro mất dữ liệu, truy cập trái phép, brute force, spam, refresh-token reuse và upload nguy hiểm mà không thay đổi business logic của Giai đoạn 1–13.

## Kiến trúc bảo mật đã áp dụng

- Global `ValidationPipe` whitelist, cấm field ngoài DTO, transform có kiểm soát và lỗi validation dạng `{ field, messages }`.
- Helmet-compatible response policy: CSP, HSTS, frame denial, no-sniff, COOP, CORP, Permissions Policy và loại bỏ `X-Powered-By`.
- CORS allowlist theo môi trường; production chỉ chấp nhận origin HTTPS.
- Global throttle đọc từ environment và quota riêng cho login, reset password, contact, service request và upload.
- Brute-force protection theo email, IP và cặp IP/email, có khóa tạm và `retryAfterSeconds`.
- RBAC và permission guard tại backend; chỉnh request hoặc ẩn/hiện nút frontend không thay đổi quyền thực tế.
- Refresh token chỉ lưu hash, rotation mỗi lần refresh, thu hồi cả token family khi phát hiện reuse, hỗ trợ logout phiên hiện tại và logout tất cả thiết bị.
- Upload chỉ nhận JPEG, PNG, WebP; kiểm tra MIME, phần mở rộng, tên tệp kép, kích thước và magic bytes trước Cloudinary.
- Audit log append-only JSONL, quyền file `0600`, hash IP, redaction secret/payment data và hash-chain chống sửa lịch sử.
- Product delete là soft delete, bắt buộc xác nhận thao tác nguy hiểm và ghi audit.
- Secret scanner chạy trước build trong CI; không in giá trị secret khi phát hiện.
- Backup MySQL dùng `MYSQL_PWD` qua environment của process con, không đưa password vào command line; kết quả gzip, SHA-256 và retention tự động.

## Không thay đổi

- Không thêm migration hoặc sửa Prisma schema.
- Không đổi order pricing, cart, checkout hoặc payment calculation.
- Không đổi CMS publishing, notification outbox, service workflow hoặc SEO Phase 13.
- Không merge trực tiếp; Phase 14 là stacked Draft PR trên `agent/phase-13-seo-performance`.

## Lệnh kiểm tra

```bash
npm run security:scan
node --test tests/architecture/phase14-security-hardening.test.mjs
npm --prefix backend run lint
npm --prefix backend run typecheck
npm --prefix backend run test:architecture
npm --prefix backend run build
```

## Lệnh backup

```bash
DATABASE_URL='mysql://user:password@host:3306/database' npm run backup:mysql
```

Không đặt `DATABASE_URL` trực tiếp trong lịch sử shell trên máy dùng chung. Production nên inject secret từ secret manager hoặc CI environment.

## Đầu ra

- [Security checklist](./SECURITY_CHECKLIST.md)
- [Báo cáo phân quyền backend](./RBAC_REPORT.md)
- [Backup và restore runbook](./BACKUP_RUNBOOK.md)
- GitHub Actions: `.github/workflows/phase14-security.yml`
- Audit integrity API: `GET /api/v1/admin/audit-logs/integrity` — chỉ `SUPERADMIN`
