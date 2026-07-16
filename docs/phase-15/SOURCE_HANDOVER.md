# Bàn giao source code Điện Lạnh 247

## Repository và chiến lược nhánh

- Repository chính thức: `thodz06012005-blip/dien-lanh-247-ecommerce`.
- Giai đoạn 14: `agent/phase-14-security-hardening`, Draft PR #15.
- Giai đoạn 15: `agent/phase-15-production-readiness`, stacked trực tiếp trên head Giai đoạn 14.
- Không merge Giai đoạn 15 trước Giai đoạn 14.
- Không force-push, rewrite history hoặc copy commit riêng lẻ làm mất quan hệ stacked branch.

## Bản đồ source

```text
backend/                 NestJS, Prisma, MySQL, auth/RBAC, operations
frontend-user/           React/Vite portal khách hàng
frontend-admin/          React/Vite portal quản trị
mock-api/                API demo/dev, không dùng production
tests/                   architecture, mock contract, Playwright E2E
deploy/                  Nginx TLS, env template, certificate helper
scripts/                 secret scan, backup, restore, monitor, smoke
docs/phase-14/           security hardening
docs/phase-15/           test, deployment, operation, acceptance
```

## Điểm vào quan trọng

- Backend bootstrap: `backend/src/main.ts`.
- Module composition: `backend/src/app.module.ts`.
- Prisma schema/migrations: `backend/prisma/`.
- Health: `backend/src/modules/health/`.
- Request observability: `backend/src/common/interceptors/request-logging.interceptor.ts`.
- Security validation/audit/upload: các file trong `backend/src/common/` và `backend/src/modules/audit/`.
- Production stack: `docker-compose.production.yml`.
- Gateway: `deploy/nginx/default.conf.template`.
- Critical API E2E: `backend/test/phase15-critical-flows.integration.mjs`.
- Responsive matrix: `tests/e2e/`.

## Lệnh phát triển

```bash
npm run bootstrap
npm run dev:platform
npm run lint
npm run typecheck
npm run test:architecture
npm run test:unit
npm run build:all
```

Mock API chỉ dùng khi phát triển frontend độc lập:

```bash
npm run dev:all
npm run test:mock
```

## Lệnh production readiness

```bash
npm run security:scan
npm run test:phase15
npm run backup:mysql
npm run restore:mysql
npm run monitor:health
npm run smoke:production
```

`restore:mysql` yêu cầu checksum, đường dẫn an toàn, xác nhận tên database và cờ riêng nếu đích là production.

## Quy tắc thay đổi database

1. tạo migration mới bằng `prisma migrate dev` chỉ trên máy phát triển;
2. review SQL migration;
3. kiểm tra backward compatibility;
4. commit migration;
5. staging chạy `prisma migrate deploy`;
6. tạo backup và restore drill;
7. production chỉ chạy `migrate deploy` qua entrypoint.

Không dùng `db push` hoặc reset trên staging/production.

## Quy tắc bảo mật

- Không commit `.env`, certificate private key, database dump, audit log, token hoặc file upload thật.
- Secret phải được inject từ secret manager.
- Chạy `npm run security:scan` trước push.
- Không ghi request body/cookie/authorization vào log.
- Mọi admin route phải có guard backend; ẩn nút frontend không được tính là phân quyền.
- Upload mới phải đi qua MIME, extension, size và magic-byte validation.

## Quality gate trước merge

- lint toàn repository;
- type-check ba ứng dụng;
- unit tests backend;
- architecture contracts kế thừa;
- Phase 15 contracts;
- critical API integration;
- responsive Chromium/Firefox/WebKit;
- production builds;
- Docker compose config/build;
- migration + seed;
- backup/restore drill;
- HTTPS production smoke test;
- secret scan.

## Thành phần không được thay đổi tùy tiện

- order pricing và inventory calculations;
- refresh-token rotation/session revocation;
- service workflow transitions;
- quotation calculation;
- CMS publish contracts;
- audit redaction/hash chain;
- SEO routing/sitemap của Giai đoạn 13;
- upload security của Giai đoạn 14.

## Quy trình tiếp nhận

Người tiếp nhận cần:

1. clone repository và checkout đúng branch/release tag;
2. chạy bootstrap, lint, typecheck, unit và architecture tests;
3. đọc `INSTALLATION_GUIDE.md`;
4. dựng môi trường staging bằng compose;
5. chạy API E2E, responsive tests và smoke test;
6. thực hiện backup/restore drill;
7. ghi kết quả vào `ACCEPTANCE_AND_HANDOVER.md`;
8. chỉ ký nhận khi có thể tự khởi chạy, quan sát và phục hồi hệ thống.

## Liên hệ và quyền sở hữu

Tài khoản dịch vụ, DNS, cloud, email, Cloudinary, payment gateway và alert webhook phải được bàn giao qua password manager/secret manager theo quyền tối thiểu. Tài liệu này không chứa và không thay thế thông tin bí mật thực tế.
