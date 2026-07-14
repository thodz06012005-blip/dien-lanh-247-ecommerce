# Biến môi trường và security baseline

## 1. Phân loại cấu hình

### Frontend

Vite chỉ đưa biến có prefix `VITE_` vào bundle trình duyệt. Vì vậy mọi biến frontend đều phải được xem là **public**.

Không đặt trong frontend:

- JWT signing secret;
- database URL;
- API secret;
- Cloudinary secret;
- payment secret;
- email password;
- private key;
- admin seed password.

### Backend

Backend giữ cấu hình server-side và secret. File thật nằm ở `backend/.env`, không được commit.

## 2. File mẫu

```text
frontend-user/.env.example
frontend-admin/.env.example
backend/.env.example
```

Tạo file local:

```bash
cp frontend-user/.env.example frontend-user/.env
cp frontend-admin/.env.example frontend-admin/.env
cp backend/.env.example backend/.env
```

## 3. Customer/Admin variables

| Biến | Bắt buộc | Ý nghĩa |
| --- | --- | --- |
| `VITE_APP_NAME` | Không | Tên hiển thị ứng dụng |
| `VITE_APP_ENV` | Không | `development`, `test`, `staging`, `production` |
| `VITE_APP_URL` | Không | Public URL của ứng dụng |
| `VITE_API_BASE_URL` | Có | API base URL |
| `VITE_API_TIMEOUT_MS` | Không | Timeout request, 1–120 giây |
| `VITE_USE_MOCK_API` | Không | Dùng Mock API |
| `VITE_USE_MOCK` | Tạm thời | Flag cũ để tương thích |
| `VITE_ENABLE_QUERY_DEVTOOLS` | Không | Cho phép devtool khi được tích hợp |

Hai frontend validate cấu hình ngay lúc module được load. URL hoặc boolean sai sẽ dừng bootstrap thay vì lỗi ngầm khi người dùng thao tác.

## 4. Backend variables

### 4.1. Application

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `NODE_ENV` | `development` | Runtime mode |
| `HOST` | `0.0.0.0` | Listen host |
| `PORT` | `3000` | Listen port |
| `API_PREFIX` | `api/v1` | Global prefix |
| `LOG_LEVEL` | `info` | Log level dự kiến |
| `SWAGGER_ENABLED` | Theo môi trường | Bật tài liệu API |
| `TRUST_PROXY` | `false` | Tin proxy trước ứng dụng |

### 4.2. Database

```dotenv
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
```

- Dùng tài khoản riêng cho từng môi trường.
- Không dùng root ở staging/production.
- Quyền database theo least privilege.
- Password không xuất hiện trong log hoặc URL frontend.

### 4.3. Authentication

| Biến | Quy tắc |
| --- | --- |
| `JWT_ACCESS_SECRET` | Tối thiểu 32 ký tự ở staging/production |
| `JWT_REFRESH_SECRET` | Khác access secret, tối thiểu 32 ký tự |
| `JWT_EXPIRES_IN` | Access token ngắn hạn |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token dài hơn |
| `BCRYPT_SALT_ROUNDS` | 8–15, mặc định 10 |
| `COOKIE_SECURE` | Bắt buộc `true` staging/production |
| `COOKIE_SAME_SITE` | Theo kiến trúc domain, mặc định `lax` local |

Secret staging/production không được chứa `replace_`, `placeholder`, `change_me` hoặc `example`.

### 4.4. CORS

```dotenv
CORS_ORIGINS=https://www.example.com,https://admin.example.com
```

- Không dùng `*` với cookie credentials.
- Production chỉ cho phép domain thật.
- Origin không có dấu `/` cuối để tránh sai khác chuỗi.
- `X-Request-Id` và `X-Confirm-Dangerous-Action` được đưa vào allowed headers.

### 4.5. Request limits

```dotenv
JSON_BODY_LIMIT=1mb
URLENCODED_BODY_LIMIT=100kb
```

Upload file phải dùng multipart và được giới hạn riêng theo endpoint/interceptor upload.

## 5. Fail-fast rules

`validateEnvironment` dừng ứng dụng khi:

- thiếu `DATABASE_URL`;
- thiếu JWT secrets;
- số nguyên nằm ngoài phạm vi;
- boolean không hợp lệ;
- production/staging dùng secret placeholder hoặc quá ngắn;
- production/staging có CORS wildcard;
- production/staging bật dev endpoint hoặc demo account;
- production/staging tắt secure cookie.

## 6. Secret management

### Local

- Dùng `.env` không commit.
- Không gửi `.env` qua chat hoặc email.
- Có thể dùng password manager của nhóm.

### CI

- Giá trị không nhạy cảm dùng workflow `env`.
- Secret thật dùng GitHub Actions Secrets hoặc Environment Secrets.
- Không echo secret.
- Hạn chế quyền `GITHUB_TOKEN` bằng `permissions: contents: read` khi chỉ kiểm tra code.

### Staging/Production

Dùng secret manager của nền tảng triển khai hoặc biến môi trường được mã hóa. Phân tách secret theo môi trường và xoay vòng định kỳ.

## 7. Repository protection

`.gitignore` loại:

- `.env` thật;
- node_modules và build output;
- log;
- database dump và local DB;
- backup;
- archive;
- coverage/cache.

`scripts/validate-repository.mjs` kiểm tra:

- file cấu trúc bắt buộc;
- script package bắt buộc;
- `.env` thật đang được track;
- một số mẫu private key/token phổ biến;
- alias import.

Đây là guard cơ bản, không thay thế secret scanning chuyên dụng của GitHub hoặc công cụ SAST.

## 8. Request security baseline

Backend áp dụng:

- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`;
- `Referrer-Policy`;
- `Permissions-Policy`;
- `Cross-Origin-Resource-Policy`;
- API-focused Content Security Policy;
- HSTS khi request đi qua HTTPS;
- body-size limits;
- Content-Type allowlist;
- CORS allowlist;
- global validation;
- rate limiting;
- request correlation.

## 9. Authentication storage

- Token xác thực ưu tiên cookie `HttpOnly`.
- JavaScript không đọc token ký.
- Frontend có thể lưu profile/session metadata không nhạy cảm để render nhanh, nhưng server vẫn là nguồn xác thực cuối cùng.
- Khi reload, admin gọi endpoint `/admin/auth/me` để kiểm tra session.
- `401` làm clear client session.

## 10. Log và dữ liệu nhạy cảm

Không log:

- password hoặc password hash;
- JWT/cookie;
- payment secret;
- private key;
- full database URL;
- raw personal data không cần thiết.

Log lỗi nên có:

- request ID;
- method/path;
- error code;
- actor ID nếu an toàn;
- resource ID;
- timestamp;
- environment/service version.

## 11. Checklist trước production

- [ ] Secret ngẫu nhiên và khác nhau.
- [ ] `COOKIE_SECURE=true`.
- [ ] HTTPS bắt buộc.
- [ ] `ENABLE_DEV_ENDPOINTS=false`.
- [ ] `ENABLE_DEMO_ACCOUNTS=false`.
- [ ] CORS chỉ chứa domain production.
- [ ] Database user không phải root.
- [ ] Backup và restore đã thử.
- [ ] Rate limit phù hợp traffic.
- [ ] Upload limits và MIME validation.
- [ ] Error response không lộ stack.
- [ ] Audit log không chứa credential.
- [ ] Secret scanning được bật trên GitHub nếu khả dụng.
