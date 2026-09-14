# Điện Lạnh 247 — Service-only release

Release hiện tại tập trung duy nhất vào **đặt lịch, điều phối, thực hiện và đối soát dịch vụ sửa chữa điện lạnh**. Dữ liệu ecommerce vẫn được giữ trong database để rollback nhưng route, menu, module và API commerce bị đóng khi `SERVICE_ONLY=true`.

## Baseline kiểm toán

- Commit trước khi khóa phạm vi: `65cddd2`
- Internal tag: `audit-service-only-baseline-20260913`
- Ngày chốt: `2026-09-13`
- Working tree trước khi sửa: sạch.
- Baseline build: `frontend-user` PASS, `frontend-admin` PASS; `backend` FAIL có sẵn do môi trường chưa cài Nest CLI (`nest: not found`).

Không xóa bảng hoặc seed commerce trong bước khóa phạm vi này. Đặt `SERVICE_ONLY=false` và `VITE_SERVICE_ONLY=false` chỉ dành cho rollback có chủ đích.

## Chạy local không nhầm backend

```bash
# Mock API :3001 + User :5173 + Admin :5174
npm run dev:mock:all

# Nest API :3000 + User :5173 + Admin :5174
npm run dev:real:all
```

Hai frontend hiển thị banner nhỏ trong development với mode `MOCK`/`REAL`, trạng thái `SERVICE ONLY` và API base URL. Banner bị loại khỏi production.

Xem hướng dẫn đầy đủ tại [DEV_MODE_GUIDE.md](./DEV_MODE_GUIDE.md) và hợp đồng endpoint tại [API_CONTRACT.md](./API_CONTRACT.md).

## Build production

Production không có localhost fallback. Phải truyền API URL:

```bash
VITE_API_BASE_URL=https://api.example.com/api/v1 \
VITE_BACKEND_MODE=REAL \
VITE_SERVICE_ONLY=true \
npm run build:all

npm --prefix backend run build
```

## Baseline route UI trước khi khóa

| User | Admin |
| --- | --- |
| `/`, `/services`, `/service-booking`, `/service-booking/success` | `/`, `/service-requests`, `/service-requests/:id` |
| `/my-services`, `/my-services/:id`, `/track-service` | `/technicians`, `/finance`, `/customers`, `/settings` |
| `/login`, `/register`, `/account`, `/contact`, `/about`, `/policy/:slug` | `/login`, `/403` |
| Commerce tồn tại trước khóa: `/products`, `/products/:id`, `/cart`, `/checkout`, `/orders` | Commerce tồn tại trước khóa: `/products`, `/orders` |

Trong service-only release, các route commerce ở dòng cuối không được đăng ký.

## Active Admin scope

This release is service-only. Admin exposes dispatch, service requests, technicians, service customers, finance, and settings. Product/order source is excluded from the active Admin bundle; retained commerce database tables are migration/rollback data only.
