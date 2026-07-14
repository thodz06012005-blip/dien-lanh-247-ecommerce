# Media và bảo mật CMS

## 1. Media storage drivers

### Local

Dùng cho development và CI:

```env
MEDIA_STORAGE_DRIVER=local
MEDIA_STORAGE_PATH=./storage
MEDIA_MAX_BYTES=10485760
```

File được lưu theo cấu trúc:

```text
storage/<folder>/<timestamp>-<uuid>.<extension>
```

URL public:

```text
/uploads/<folder>/<filename>
```

Express static middleware:

- Không cho directory listing.
- Không dùng index file.
- Cache immutable 7 ngày.
- Chỉ phục vụ file nằm trong storage root.

### Cloudinary

Dùng cho staging/production:

```env
MEDIA_STORAGE_DRIVER=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Metadata lưu trong bảng Media:

- URL HTTPS.
- Public ID.
- Provider.
- Folder.
- MIME type.
- Width/height khi provider trả về.
- Dung lượng.
- Alt text.
- Người cập nhật và version.

## 2. Định dạng hỗ trợ

Cho phép:

```text
image/jpeg
image/png
image/webp
image/gif
application/pdf
```

Không cho SVG vì SVG có thể chứa script hoặc external resource.

Giới hạn mặc định: 10 MB/file. Có thể thay đổi bằng `MEDIA_MAX_BYTES`.

## 3. Tên file và folder

Tên file lưu trữ không dùng trực tiếp tên do người dùng cung cấp.

Local driver tạo:

```text
Date.now + randomUUID + extension đã kiểm soát
```

Folder chỉ giữ ký tự:

```text
a-z A-Z 0-9 / _ -
```

Điều này ngăn path traversal và ký tự điều khiển.

## 4. Alt text

Alt text dùng cho:

- Trợ năng.
- SEO hình ảnh.
- Fallback khi ảnh lỗi.
- Mô tả trong thư viện media.

Quy tắc:

- Mô tả nội dung ảnh, không nhồi từ khóa.
- Không dùng tên file làm alt text production.
- Ảnh trang trí có thể dùng alt rỗng tại component frontend, nhưng media quản trị vẫn nên có mô tả.

## 5. Quyền upload

Endpoint:

```http
POST /api/v1/admin/cms/media/upload
```

Yêu cầu:

- Admin access session hợp lệ.
- Role ADMIN hoặc SUPERADMIN.
- Permission `content.manage`.

STAFF có `content.view` chỉ xem được thư viện, không upload.

## 6. Token và cookie

CMS client không đọc hoặc lưu token trong:

- localStorage.
- sessionStorage.
- JavaScript state persisted storage.

Authentication dùng admin cookie HttpOnly của Giai đoạn 8. Khi access token hết hạn, API client refresh phiên qua admin refresh endpoint.

## 7. HTML sanitization

Backend làm sạch các trường rich content trước khi lưu.

Loại bỏ:

- Script/style/iframe/object/embed blocks.
- Event handler attributes như `onclick`.
- `javascript:`.
- `data:text/html`.

Preview chạy trong iframe sandbox không có quyền script/top-navigation.

Lưu ý: sanitizer hiện phù hợp cho tập HTML CMS kiểm soát. Khi mở rộng editor với embed hoặc HTML phức tạp, cần thay bằng thư viện sanitizer có allowlist rõ ràng và test XSS chuyên biệt.

## 8. Revision snapshot

Snapshot được JSON serialize với redaction theo key:

```text
password
hash
token
cookie
authorization
```

Các giá trị này được thay bằng `[REDACTED]`.

Revision không nên chứa:

- Access/refresh token.
- Mật khẩu.
- Cookie header.
- SMTP/Cloudinary secret.
- Authorization header.

## 9. Soft delete và media tham chiếu

Archive Media:

- `isActive = false`.
- `deletedAt` được đặt.
- File vật lý chưa bị xóa.

Lý do:

- Media có thể đang được Service/Project/Post/Banner sử dụng.
- Xóa file vật lý ngay sẽ tạo ảnh hỏng trên nội dung cũ.

Quy trình dọn media production nên là một job riêng:

1. Tìm media đã soft-delete quá thời gian giữ.
2. Kiểm tra toàn bộ foreign key/reference.
3. Tạo báo cáo dry-run.
4. Xóa remote object.
5. Ghi audit cleanup.

Giai đoạn 9 chưa tự động xóa remote object của media archive.

## 10. CORS và upload

Production cần:

- Chỉ cho customer/admin origins thực tế.
- `credentials: true`.
- HTTPS.
- `COOKIE_SECURE=true`.
- `SameSite` phù hợp mô hình domain.
- Reverse proxy giới hạn request body tương ứng `MEDIA_MAX_BYTES`.

## 11. Log và secret

CI kiểm tra backend log không chứa chuỗi giống JWT.

Production:

- Secret lấy từ secret manager.
- Không ghi request body multipart vào log.
- Không log cookie hoặc Authorization.
- Không log Cloudinary response chứa thông tin nhạy cảm.
- Audit chỉ lưu actor/action/resource và metadata đã sanitize.

## 12. Checklist production

- [ ] `MEDIA_STORAGE_DRIVER=cloudinary`.
- [ ] Cloudinary secret nằm trong secret manager.
- [ ] Upload MIME/size được kiểm tra tại reverse proxy và application.
- [ ] CSP cho customer/admin đã cấu hình.
- [ ] CORS chỉ chứa domain thật.
- [ ] HTTPS và secure cookie bật.
- [ ] Backup database trước migration.
- [ ] Test upload JPEG/PNG/WebP/PDF.
- [ ] Test file sai MIME và file vượt dung lượng.
- [ ] Test STAFF không upload được.
- [ ] Test archive media không làm hỏng nội dung đang tham chiếu.
