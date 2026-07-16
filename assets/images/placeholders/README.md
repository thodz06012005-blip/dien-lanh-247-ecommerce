# Ảnh dự phòng

Dùng khi ảnh sản phẩm, dịch vụ, dự án hoặc bài viết không tải được.

- `image-unavailable.svg`: fallback chung.
- Có thể bổ sung fallback riêng theo nhóm nếu cần.
- Placeholder phải giữ đúng tỷ lệ để không gây layout shift.
- Không dùng placeholder làm ảnh nội dung chính lâu dài.
- Nếu đổi file fallback chung, chạy `npm run assets:sync` để đồng bộ sang hai frontend.
