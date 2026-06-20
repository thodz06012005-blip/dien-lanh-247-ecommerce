# Tài liệu Hướng Dẫn Tích Hợp & Walkthrough (Bản Hoàn Thiện Hệ Thống)

Tài liệu này tổng hợp toàn bộ các kết quả đạt được, cấu trúc tệp tin của hệ thống và hướng dẫn chi tiết cách chạy thử nghiệm liên thông 2 chiều giữa **Website Khách hàng (`frontend-user`)** và **Trang Quản trị (`frontend-admin`)** qua **Mock API Server (`mock-api`)**.

---

## 1. Kết Quả Triển Khai & Danh Sách Tệp Tin

Hệ thống đã được tích hợp hoàn chỉnh và vượt qua bài test biên dịch TypeScript thành công 100% cho cả hai cổng front-end.

### 1.1. Mock API Server (`mock-api/`)
* [NEW] [package.json](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/mock-api/package.json): Chứa cấu hình dự án chạy server Node.js Express.
* [NEW] [server.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/mock-api/server.js): Server Express lắng nghe cổng `3001`. Xử lý lưu trữ tập trung dữ liệu tại tệp `mock-db.json`. Tự động khởi tạo dữ liệu mẫu, hỗ trợ kiểm tra sức khỏe `/health`, reset `/dev/reset-db`, lọc nâng cao, phân trang, và quản lý trừ/hoàn tồn kho tự động.

### 1.2. Website Khách hàng (`frontend-user/`)
* [NEW] [.env.example](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/frontend-user/.env.example) & [.env](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/frontend-user/.env): Cấu hình Mock API gọi tới cổng `3001`.
* [MODIFY] [api.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/frontend-user/src/services/api.ts): Loại bỏ client mock adapter, chuyển sang gọi trực tiếp HTTP request tới server 3001.

### 1.3. Trang Quản trị (`frontend-admin/`)
* [NEW] [.env.example](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/frontend-admin/.env.example) & [.env](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/frontend-admin/.env): Cấu hình Mock API gọi tới cổng `3001`.
* [NEW] [api.ts](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/frontend-admin/src/services/api.ts): Axios Client gọi tới các endpoint `/admin/...` trên Mock API Server.
* [MODIFY] [Dashboard.tsx](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/frontend-admin/src/pages/Dashboard.tsx): Chuyển đổi hiển thị số liệu doanh thu động hôm nay, tổng số đơn, đơn pending, số khách hàng, và bảng 5 đơn hàng gần nhất.
* [MODIFY] [Products.tsx](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/frontend-admin/src/pages/Products.tsx): Tích hợp bảng sản phẩm nâng cao (ảnh preview, tồn kho, thẻ trạng thái ẩn/hiện) và Modal Form thêm/sửa sản phẩm đầy đủ thông số kỹ thuật (specifications), tính năng nổi bật (features).
* [MODIFY] [Orders.tsx](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/frontend-admin/src/pages/Orders.tsx): Quản lý danh sách đơn hàng toàn hệ thống, tích hợp tìm kiếm, đổi trạng thái đơn hàng & thanh toán nhanh, cùng Modal Chi tiết đơn hàng hiển thị đầy đủ thông tin khách hàng, sản phẩm và tổng hợp hóa đơn.

### 1.4. Root Config (`/`)
* [NEW] [package.json](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/package.json): Thiết lập các kịch bản khởi chạy đồng thời cả 3 dịch vụ bằng gói `concurrently`.

---

## 2. Hướng Dẫn Khởi Chạy Hệ Thống

Để khởi động toàn bộ 3 dịch vụ cùng một lúc, bạn thực hiện theo các bước sau:

1. **Mở terminal ở thư mục gốc của dự án (`ecommerce-platform`):**
   ```powershell
   cd C:\Users\Admin\.gemini\antigravity\scratch\ecommerce-platform
   ```

2. **Chạy kịch bản khởi chạy đồng thời (Sử dụng npm.cmd trên Windows):**
   ```powershell
   npm.cmd run dev:all
   ```

3. **Mở các cổng tương ứng trên trình duyệt:**
   * Website Khách hàng: `http://localhost:5173`
   * Trang Quản trị Admin: `http://localhost:5174`
   * Trang Kiểm tra sức khỏe API: `http://localhost:3001/api/v1/health` (Đảm bảo trả về JSON thành công).

---

## 3. Quy Trình Kiểm Thử Liên Thông (E2E Test Steps)

Hãy kiểm nghiệm tính năng đồng bộ thời gian thực theo kịch bản chuẩn dưới đây:

### Bước 1: Reset Database
1. Gọi API Reset DB thông qua ứng dụng Postman hoặc chạy lệnh curl sau để đảm bảo DB ở trạng thái ban đầu:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:3001/api/v1/dev/reset-db" -Method Post
   ```

### Bước 2: Thêm & Ẩn sản phẩm ở Admin
1. Truy cập trang Admin: `http://localhost:5174/#/products`.
2. Bấm **Thêm sản phẩm**. Nhập:
   * Tên: `Điều hòa Daikin Inverter Test 2026`
   * SKU: `DAIKIN-TEST-2026`
   * Danh mục: *Chọn Điều hòa*
   * Thương hiệu: *Chọn Daikin*
   * Giá bán gốc: `10,500,000`
   * Số lượng tồn kho: `5`
   * Trạng thái: *Hiển thị bán*
   * Bấm thêm 1 dòng thông số kỹ thuật: `Xuất xứ` - `Thái Lan`.
   * Bấm **Lưu sản phẩm**.
3. Thêm một sản phẩm thứ 2 với Tên: `Điều hòa Daikin Ẩn`, Trạng thái: *Ẩn sản phẩm*.
4. Sang Website Khách hàng `http://localhost:5173`. Tìm kiếm `Daikin Inverter Test 2026`. Xác nhận sản phẩm xuất hiện đầy đủ với giá bán và thông số kỹ thuật Thái Lan.
5. Thử tìm kiếm `Daikin Ẩn`. Xác nhận sản phẩm này **không** xuất hiện trên website khách hàng.

### Bước 3: Đặt hàng & Khấu trừ Tồn Kho
1. Trên trang chi tiết sản phẩm `Điều hòa Daikin Inverter Test 2026` ở Website Khách, chọn số lượng mua là `2` và bấm **Thêm vào giỏ** -> Tiến hành **Checkout COD**.
2. Nhập thông tin giao hàng: `Nguyễn Hoàng Long`, SĐT `0989999999`, địa chỉ `Số 10 Nguyễn Cơ Thạch, Hà Nội`. Bấm đặt hàng thành công.
3. Quay lại trang Admin -> Quản lý sản phẩm. Xác nhận tồn kho của `Điều hòa Daikin Inverter Test 2026` đã bị trừ từ `5` xuống còn `3`.

### Bước 4: Hủy đơn & Hoàn trả Tồn Kho
1. Trên Website Khách, đăng nhập tài khoản khách hàng (`user@gmail.com` / `123456`), truy cập **Đơn hàng của tôi**.
2. Tìm đơn hàng vừa đặt (Trạng thái *Chờ xác nhận*), bấm **Hủy đơn** và xác nhận.
3. Quay lại trang Admin -> Quản lý sản phẩm. Xác nhận tồn kho của sản phẩm đã tự động được hoàn trả từ `3` tăng lên `5`.

### Bước 5: Giao hàng & Dashboard ghi nhận doanh thu
1. Trên Website Khách, tiếp tục đặt lại đơn hàng trên với số lượng mua `1`. (Tồn kho giảm còn `4`).
2. Sang trang Admin -> Quản lý đơn hàng:
   * Xác nhận đơn hàng mới xuất hiện ở trạng thái `Chờ xác nhận`.
   * Mở trang **Dashboard** của Admin. Xác nhận Doanh thu hôm nay vẫn đang là `179,000đ` (từ đơn hàng mẫu có sẵn). Số đơn pending tăng thêm `1`.
3. Quay lại trang Admin -> Quản lý đơn hàng. Chuyển trạng thái đơn hàng sang **Đang giao hàng** (shipping).
   * Kiểm tra Dashboard: Doanh thu vẫn chưa tăng. Số đơn pending giảm đi `1`.
4. Chuyển trạng thái đơn hàng sang **Đã giao hàng** (delivered).
   * Kiểm tra Dashboard: Doanh thu hôm nay lập tức tăng thêm đúng bằng giá trị đơn hàng vừa giao (`total` đơn hàng giao thành công hôm nay).
5. Quay lại Website Khách -> Lịch sử đơn hàng. Xác nhận trạng thái đơn đã hiển thị là "Đã giao hàng".
