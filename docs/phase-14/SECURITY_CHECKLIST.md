# Security checklist — Giai đoạn 14

## 1. Validation và lỗi API

- [x] Global DTO whitelist.
- [x] Từ chối property không khai báo bằng `forbidNonWhitelisted`.
- [x] Transform query/path theo DTO.
- [x] Không trả `target` hoặc raw input trong validation error.
- [x] Lỗi validation chuẩn hóa theo field và danh sách message.
- [x] JSON malformed, payload quá lớn và unsupported media type dùng cùng response envelope.

## 2. Authentication và session

- [x] Password hash bằng bcrypt, salt rounds có giới hạn 8–15.
- [x] So sánh dummy hash khi email không tồn tại để giảm timing leak.
- [x] Login limit theo email, IP và cặp IP/email.
- [x] Khóa tạm 15 phút mặc định sau ngưỡng sai.
- [x] Customer và admin login có endpoint throttle riêng.
- [x] Access token 15 phút mặc định.
- [x] Refresh token lưu dạng SHA-256 hash trong session store.
- [x] Refresh token rotation.
- [x] Phát hiện token reuse và revoke cả family.
- [x] Token version thu hồi toàn bộ access token cũ.
- [x] Logout phiên hiện tại.
- [x] Logout tất cả thiết bị.
- [x] Reset password thu hồi toàn bộ session.
- [x] Cookie `HttpOnly`, `Secure` bắt buộc ở staging/production.

## 3. Authorization

- [x] Backend `JwtAuthGuard` trên route quản trị.
- [x] Backend `RolesGuard`; không dựa vào nút frontend.
- [x] `PermissionsGuard` cho module có permission matrix.
- [x] Ghi audit khi RBAC từ chối.
- [x] Product delete chỉ SUPERADMIN.
- [x] Audit log chỉ SUPERADMIN.
- [x] Contract test kiểm tra guard/decorator trên route trọng yếu.

## 4. HTTP và browser security

- [x] Helmet-compatible headers trên mọi response.
- [x] Xóa `X-Powered-By`.
- [x] CSP deny-by-default cho REST API.
- [x] HSTS khi HTTPS.
- [x] CORS allowlist; production chỉ origin HTTPS.
- [x] Credentialed CORS không dùng wildcard.
- [x] JSON body mặc định tối đa 1 MB.
- [x] Form-urlencoded mặc định 100 KB và tối đa 100 parameter.
- [x] Chỉ cho phép JSON, form-urlencoded và multipart ở body methods.
- [x] Global throttle lấy từ environment.

## 5. Upload

- [x] Tối đa 5 file/lần.
- [x] Tối đa 5 MB/file.
- [x] Chỉ JPEG/JPG, PNG và WebP.
- [x] MIME phải khớp extension.
- [x] Chặn extension kép nguy hiểm.
- [x] Kiểm tra magic bytes JPEG.
- [x] Kiểm tra PNG signature.
- [x] Kiểm tra RIFF/WEBP signature.
- [x] Không cho SVG, HTML, script hoặc executable.
- [x] Static upload có `nosniff`, deny dotfiles và không directory index.

## 6. Audit và logging

- [x] Audit log append-only JSONL.
- [x] File permission `0600`; directory `0700`.
- [x] Audit nằm ngoài static upload path.
- [x] Hash-chain `previousHash` → `integrityHash`.
- [x] Endpoint kiểm tra integrity chỉ SUPERADMIN.
- [x] IP được hash trước khi lưu.
- [x] Redact password, token, cookie, authorization, private key, OTP, PIN, CVV và card number.
- [x] Không log request body khi 401/403/413/415/429.
- [x] Không log nguyên exception trong production.

## 7. Data safety

- [x] Product delete là soft delete (`isActive=false`).
- [x] Dangerous action cần confirmation và lý do.
- [x] Backup script không đưa password vào process arguments.
- [x] Backup gzip, SHA-256 và retention.
- [x] Audit và backup runtime bị `.gitignore`.
- [ ] Production scheduler chạy backup tối thiểu mỗi ngày.
- [ ] Thực hiện restore drill trên môi trường staging mỗi tháng.
- [ ] Đẩy backup mã hóa sang object storage khác máy chủ ứng dụng.

## 8. Repository và CI

- [x] Secret scanner đọc toàn bộ tracked text files.
- [x] Scanner không in secret match.
- [x] CI chặn private key, provider token, JWT hard-code và sensitive assignment.
- [x] Phase 14 workflow chạy lint, typecheck, inherited architecture, build và secret scan.
- [x] Không commit `.env`, audit log, dump SQL hoặc backup archive.

## Điều kiện trước khi production

- [ ] Thay toàn bộ placeholder secret bằng secret độc lập >= 32 ký tự.
- [ ] `NODE_ENV=production`.
- [ ] `COOKIE_SECURE=true`.
- [ ] `CORS_ORIGINS` chỉ chứa domain HTTPS thực tế.
- [ ] `TRUST_PROXY=true` chỉ khi có reverse proxy đáng tin cậy và proxy xóa header giả mạo từ client.
- [ ] Rotate credential ngay nếu secret scanner phát hiện giá trị từng được commit.
