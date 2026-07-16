# Kiểm tra hình ảnh và bố cục — Điện Lạnh 247

## Phạm vi

- `frontend-user`
- `frontend-admin`
- `backend/prisma/seed.ts`
- `backend/prisma/seed-content.ts`
- `backend/prisma/seed-editorial-cms.ts`
- `mock-api/seed/initialData.js`
- component ảnh dùng chung

## Kết luận chính

1. Nhiều ảnh sản phẩm hiện lấy trực tiếp từ Unsplash.
2. Một số URL ảnh được tái sử dụng cho nhiều model và thậm chí nhiều loại thiết bị khác nhau.
3. Khi Unsplash chậm hoặc lỗi, ảnh fallback có thể ảnh hưởng bố cục và Lighthouse.
4. Trước đây chưa có thư mục ảnh chuẩn và chưa có tài liệu cho biết ảnh đang được dùng ở đâu.
5. Đã bổ sung thư viện ảnh trung tâm, manifest, fallback local, script đồng bộ và script audit.

## Các lỗi ngữ cảnh ảnh đã xác định

| Nhóm | Hiện trạng | Rủi ro | Hướng xử lý |
|---|---|---|---|
| Điều hòa Daikin/Panasonic | Một số model đổi qua lại cùng hai URL | Card không phản ánh đúng model | Tạo file riêng theo model |
| Máy giặt/máy sấy | Cùng URL được dùng cho LG, Samsung và Electrolux | Sai sản phẩm, khó quản trị | Tách ảnh theo brand + model |
| Tủ lạnh/tủ đông | Ảnh LG được tái dùng cho Sanaky | Sai kiểu thiết bị | Tạo file riêng cho từng model |
| Bình nóng lạnh/tủ lạnh | Một URL được dùng cho hai nhóm | Sai hoàn toàn ngữ cảnh | Thay bằng ảnh catalog chính xác |
| Máy lọc không khí | Ảnh generic/điều hòa được tái dùng cho Sharp và Xiaomi | Giảm độ tin cậy | Tạo ảnh riêng theo model |
| Dịch vụ | Hai ảnh Unsplash được dùng cho sửa và vệ sinh điều hòa | Phụ thuộc nguồn ngoài | Chuyển sang ảnh local/CDN quản lý |
| Dự án | Ảnh văn phòng generic | Chưa thể hiện công việc kỹ thuật | Thay ảnh công trình thật đã được phép |
| Bài viết | Ảnh năng lượng generic | Chấp nhận tạm thời nhưng không có bản local | Chuyển về thư viện article |

## Cấu trúc mới

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
└── placeholders/
```

## Bản đồ thay ảnh

Mở:

```text
assets/images/manifest.json
```

Mỗi mục ghi rõ:

- mã `img_*`;
- file đích;
- nguồn hiện tại;
- file/seed đang sử dụng;
- tỷ lệ;
- kích thước;
- giới hạn dung lượng;
- ghi chú thay thế.

## Fallback

Fallback canonical:

```text
assets/images/placeholders/image-unavailable.svg
```

Bản public:

```text
frontend-user/public/images/placeholders/image-unavailable.svg
frontend-admin/public/images/placeholders/image-unavailable.svg
```

`OptimizedImage` sử dụng fallback local cho ảnh nội dung bị lỗi. Ảnh priority/LCP vẫn dùng nền gradient nhẹ để tránh fallback hình trở thành LCP muộn.

## Lệnh vận hành

```bash
npm run assets:sync
npm run assets:audit
```

Chế độ nghiêm ngặt sau khi đã chuyển hết ảnh về local:

```bash
npm run assets:audit:strict
```

## Tiêu chí nghiệm thu ảnh

- Không có ảnh méo.
- Không có card cùng hàng lệch chiều cao do ảnh.
- Không dùng chung ảnh cho model khác nhau.
- Không còn ảnh quan trọng phụ thuộc nguồn ngoài không kiểm soát.
- Hero dưới 250 KB.
- Card dưới 120 KB.
- Có `alt`, `width`, `height`, lazy loading hoặc priority phù hợp.
- Fallback không gây layout shift.
- Manifest luôn được cập nhật khi thêm hoặc thay ảnh.

## Công việc còn lại

Các ảnh chụp thật chưa được đưa vào repository vì cần nguồn ảnh hợp pháp và đúng model. Thay từng ảnh theo `targetFile` trong manifest, sau đó cập nhật seed từ URL ngoài sang `/images/...` và chạy kiểm tra toàn bộ giao diện.
