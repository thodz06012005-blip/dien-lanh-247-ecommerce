# Báo cáo kiểm toán hình ảnh — Giai đoạn 15

## Kết luận chính

1. Nhiều ảnh sản phẩm và nội dung vẫn lấy trực tiếp từ Unsplash.
2. Một số URL đang được dùng cho nhiều model hoặc nhiều loại thiết bị không liên quan.
3. Ảnh sản phẩm, dịch vụ, dự án và bài viết được khai báo tại nhiều seed/data source khác nhau.
4. `OptimizedImage` và `ImageWithFallback` trước đây có logic trùng nhau.
5. Đã thiết lập thư viện canonical và cơ chế alias để thay ảnh mà không làm mất đường dẫn cũ.

## Thư viện canonical

```text
assets/images/
├── hero/
├── products/
├── services/
├── projects/
├── articles/
├── brands/
├── avatars/
├── admin/
├── icons/
├── placeholders/
└── legacy/
```

## Các lỗi ngữ cảnh đã xác định

| Nhóm | Nguồn hiện tại | Vấn đề | Trạng thái manifest |
|---|---|---|---|
| Điều hòa Daikin/Panasonic | Hai URL Unsplash tái sử dụng | Không phản ánh đúng model | `nguon-ngoai-tam-thoi` / `trung-lap` |
| Máy giặt LG/Samsung, máy sấy Electrolux | Cùng URL | Sai model và loại thiết bị | `trung-lap` |
| Tủ lạnh LG và tủ đông Sanaky | Cùng URL | Sai loại thiết bị | `trung-lap` |
| Bình nóng lạnh Ariston và tủ lạnh Panasonic | Cùng URL | Sai ngữ cảnh | `sai-noi-dung` |
| Máy lọc không khí Sharp/Xiaomi | Ảnh generic giống điều hòa | Không đúng sản phẩm | `sai-noi-dung` |
| Dịch vụ sửa/vệ sinh | URL ngoài | Phụ thuộc nhà cung cấp ngoài | `nguon-ngoai-tam-thoi` |
| Dự án văn phòng | Ảnh văn phòng generic | Không thể hiện công việc kỹ thuật | `can-thay` |
| Bài viết tiết kiệm điện | Ảnh năng lượng generic | Chưa có bản local | `nguon-ngoai-tam-thoi` |

## Nguồn code và dữ liệu cần tiếp tục rà

- `backend/prisma/seed.ts`
- `backend/prisma/seed-content.ts`
- `backend/prisma/seed-editorial-cms.ts`
- `mock-api/seed/initialData.js`
- `mock-api/mock-db.json`
- `frontend-user/src/mock/data.ts`
- `frontend-user/src/constants/visualAssets.ts`
- `frontend-user/src/pages/**`
- `frontend-user/src/components/**`
- `frontend-admin/src/features/products/**`
- `tests/**`

## Tên file canonical mới

Ví dụ:

```text
products/anh-sp-dieu-hoa-daikin-ftkf25xvmv-mat-truoc-01.webp
services/anh-dv-sua-dieu-hoa-anh-bia-01.webp
projects/anh-da-bao-tri-dieu-hoa-van-phong-anh-bia-01.webp
articles/anh-bv-tiet-kiem-dien-dieu-hoa-anh-bia-01.webp
brands/logo-th-daikin-chinh-01.svg
placeholders/anh-bg-khong-co-hinh-01.svg
```

Các file ảnh chụp thật chưa được thêm nếu chưa xác định đúng model và quyền sử dụng.

## Fallback

Canonical mới:

```text
assets/images/placeholders/anh-bg-khong-co-hinh-01.svg
```

Alias tương thích:

```text
assets/images/placeholders/image-unavailable.svg
```

`OptimizedImage` dùng canonical mới. `ImageWithFallback` được giữ dưới dạng wrapper tương thích, có ghi chú deprecated; không bị xóa trong đợt này.

## Script sync

`scripts/sync-image-assets.mjs` hiện:

- đọc manifest;
- chỉ copy file canonical tồn tại;
- hỗ trợ alias;
- so sánh SHA-256 trước khi ghi;
- không xóa file đích;
- dừng khi file required bị thiếu.

## Script audit

`scripts/audit-image-assets.mjs` kiểm tra:

- manifest JSON;
- key và target trùng;
- file required bị thiếu;
- dung lượng vượt giới hạn;
- filename không đúng kebab-case không dấu;
- metadata alt bị thiếu;
- URL ảnh ngoài chưa ghi manifest;
- `/images/...` không có canonical source;
- file local chưa đăng ký manifest;
- file local trùng SHA-256;
- thẻ `<img>` trực tiếp cần rà soát.

## Nguyên tắc thay ảnh

1. Không xóa URL cũ khỏi manifest.
2. Không đổi seed sang local path khi file canonical chưa tồn tại.
3. Không tải tự động ảnh ngoài về repository.
4. Không dùng ảnh người thật nếu chưa có quyền công khai.
5. Mỗi model cần file riêng.
6. Giữ alias trong ít nhất một chu kỳ phát hành khi đường dẫn cũ đã được dùng.

## Tiêu chí nghiệm thu

- Không ảnh méo hoặc layout shift.
- Không có model không liên quan dùng chung ảnh.
- Ảnh nghiệp vụ có alt, width, height.
- Hero có priority và kích thước cố định.
- File required tồn tại.
- URL ngoài đều được ghi manifest.
- Không có local file ngoài manifest trong chế độ strict.
- Lint, typecheck, architecture test và build PASS.
