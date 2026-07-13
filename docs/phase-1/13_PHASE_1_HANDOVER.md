# 13. Phase 1 Handover

## 1. Kết quả đã tạo

- Bộ tài liệu sản phẩm và UX.
- Design System và Motion guideline.
- API draft.
- Acceptance criteria.
- Test plan.
- Prototype website khách hàng.
- Prototype dashboard admin.

## 2. Cách dùng prototype

```bash
python -m http.server 8080 -d prototypes/phase-1
```

Mở:

- `/customer/`
- `/admin/`

## 3. Giới hạn của prototype

- Dữ liệu nằm trong JavaScript, không kết nối API.
- Upload không gửi file.
- Lịch là dữ liệu minh họa.
- Không có authentication.
- Không lưu dữ liệu sau reload.
- Chart là CSS minh họa.

## 4. Hướng chuyển sang code React hiện có

### Website khách hàng

- Tách section thành component.
- Chuyển form sang React Hook Form + schema validation.
- Dùng TanStack Query cho service, slot và create request.
- Dùng Motion/Framer Motion có giới hạn.
- Lưu draft form trong session storage.

### Admin

- Dùng layout và router hiện có.
- Tách MetricCard, RequestTable, QuickFilter, DetailDrawer.
- Đồng bộ filter vào query string.
- Dùng API thật cho assign/status.
- Kiểm tra permission trước khi hiển thị action.

## 5. Quyết định cần chốt trước Giai đoạn 2

- Có bắt buộc đăng nhập khách hàng không.
- Khu vực phục vụ chính thức.
- Danh sách dịch vụ và giá tham khảo.
- Quy tắc SLA theo priority.
- Quy tắc chọn và phân công kỹ thuật viên.
- Kênh thông báo: email, SMS hay Zalo.
- Chính sách lưu ảnh và dữ liệu cá nhân.

## 6. Branch và quy trình review

Khuyến nghị review prototype và tài liệu trên branch riêng, sau đó merge bằng squash để giữ lịch sử gọn.
