# 03. Personas, Roles và Permissions

## 1. Persona khách hàng cá nhân

**Mục tiêu:** sửa thiết bị nhanh, biết trước chi phí và có bảo hành.

**Hành vi:** truy cập chủ yếu bằng điện thoại; ưu tiên gọi nhanh nhưng sẵn sàng điền form nếu ngắn và rõ.

**Nỗi lo:** thợ đến trễ, tăng giá, sửa không dứt điểm, không có chứng từ.

## 2. Persona khách hàng doanh nghiệp

**Mục tiêu:** bảo trì định kỳ, kiểm soát nhiều địa điểm và nhận báo cáo.

**Hành vi:** quan tâm SLA, lịch sử, báo giá, biên bản, hình ảnh và người phụ trách.

**Nỗi lo:** gián đoạn vận hành, xử lý không đồng nhất giữa các chi nhánh.

## 3. Persona điều phối viên

**Mục tiêu:** xác nhận và phân công nhanh, không bỏ sót yêu cầu.

**Nhu cầu chính:** bộ lọc, cảnh báo SLA, danh sách kỹ thuật viên sẵn sàng, thao tác ít bước.

## 4. Persona kỹ thuật viên

**Mục tiêu:** biết rõ công việc, vị trí, tình trạng và lịch sử thiết bị.

**Nhu cầu chính:** xem việc được giao, cập nhật trạng thái, ghi vật tư, chụp ảnh và hoàn thành biên bản.

## 5. Persona biên tập nội dung

**Mục tiêu:** cập nhật dịch vụ, dự án, bài viết và banner mà không cần sửa code.

## 6. Vai trò hệ thống

| Vai trò | Mã đề xuất |
|---|---|
| Khách vãng lai | `GUEST` |
| Khách hàng | `CUSTOMER` |
| Điều phối viên | `DISPATCHER` |
| Kỹ thuật viên | `TECHNICIAN` |
| Biên tập nội dung | `EDITOR` |
| Quản trị viên | `ADMIN` |
| Quản trị tối cao | `SUPER_ADMIN` |

## 7. Ma trận phân quyền

| Chức năng | Guest | Customer | Dispatcher | Technician | Editor | Admin | Super Admin |
|---|---:|---:|---:|---:|---:|---:|---:|
| Xem nội dung công khai | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Gửi yêu cầu dịch vụ | ✓ | ✓ | ✓ | — | — | ✓ | ✓ |
| Tra cứu yêu cầu | Theo mã | Của mình | Tất cả | Được giao | — | Tất cả | Tất cả |
| Xác nhận yêu cầu | — | — | ✓ | — | — | ✓ | ✓ |
| Phân công kỹ thuật viên | — | — | ✓ | — | — | ✓ | ✓ |
| Cập nhật tiến độ kỹ thuật | — | — | Giới hạn | ✓ | — | ✓ | ✓ |
| Quản lý khách hàng | — | Hồ sơ mình | ✓ | Giới hạn | — | ✓ | ✓ |
| Quản lý kỹ thuật viên | — | — | Xem | Hồ sơ mình | — | ✓ | ✓ |
| Quản lý nội dung | — | — | — | — | ✓ | ✓ | ✓ |
| Quản lý vai trò | — | — | — | — | — | Giới hạn | ✓ |
| Xem audit log | — | — | Giới hạn | — | — | ✓ | ✓ |
| Cấu hình hệ thống | — | — | — | — | — | Giới hạn | ✓ |

## 8. Nguyên tắc phân quyền

- Backend luôn là nguồn kiểm tra quyền cuối cùng.
- UI ẩn hành động không được phép nhưng không thay thế kiểm tra API.
- Tất cả thao tác đổi trạng thái, phân công, báo giá và hoàn thành phải ghi audit log.
- Kỹ thuật viên chỉ xem dữ liệu khách hàng cần thiết cho công việc được giao.
