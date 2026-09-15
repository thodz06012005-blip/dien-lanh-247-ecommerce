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

---

## 4. Hướng Dẫn Kiểm Thử Bảo Mật (Security-1A: Admin Login & Route Guarding)

Hệ thống đã được thiết lập tính năng bảo mật **Security-1A** tại phân hệ quản lý (`frontend-admin`). Hãy thực hiện theo các bước sau để xác nhận các tính năng hoạt động đúng:

### Bước 1: Kiểm thử chặn Route (Route Guarding)
1. Hãy mở trang quản trị `http://localhost:5174/` khi chưa đăng nhập (hoặc sau khi đã chạy `localStorage.clear()` trên console F12).
2. Thử truy cập trực tiếp các URL nội bộ như:
   - `http://localhost:5174/#/products`
   - `http://localhost:5174/#/orders`
3. Xác nhận: Bạn sẽ bị hệ thống chặn lại lập tức và tự động chuyển hướng về trang Login tại:
   `http://localhost:5174/#/login`

### Bước 2: Đăng nhập với tài khoản Mock
1. Tại màn hình đăng nhập `http://localhost:5174/#/login`, nhập sai thông tin hoặc để trống -> Xác nhận hệ thống báo lỗi rõ ràng ở phía trên form với hiệu ứng rung (shake) mượt mà.
2. Bấm vào nút điền nhanh tài khoản thử nghiệm ở hộp thông tin màu xám phía dưới:
   - **Email:** `owner@dienlanh247.vn`
   - **Password:** `Admin@123`
3. Bấm nút **Đăng nhập** -> Xác nhận hệ thống hiển thị trạng thái loading mượt mà trên nút bấm, sau đó chuyển hướng bạn thành công vào trang Dashboard.

### Bước 3: Duy trì phiên đăng nhập & Tự động hết hạn (Session Expiry)
1. Khi đã đăng nhập thành công vào Dashboard, bấm nút F5 tải lại trang -> Xác nhận phiên đăng nhập vẫn được giữ nguyên (do session được lưu trữ trong `localStorage`).
2. Tên người dùng và Email hiển thị động chính xác tại Sidebar Footer và Header Profile Dropdown (`Owner Điện Lạnh 247` / `owner@dienlanh247.vn`).
3. Thời hạn session là **30 phút**.
4. Để test nhanh cơ chế tự động logout khi hết hạn, bạn hãy mở F12 -> Application -> Local Storage -> thay đổi giá trị của `dl247_admin_expires_at` thành một mốc thời gian trong quá khứ (ví dụ: `1000000000000`) -> Click chuyển đổi giữa các menu trang quản trị -> Xác nhận hệ thống phát hiện session hết hạn và tự động logout đẩy bạn về trang `/login`.

### Bước 4: Đăng xuất & Chặn nhấn Back trình duyệt
1. Tại header trang quản trị, bấm vào avatar người dùng để mở menu thả xuống -> Bấm **Đăng xuất**.
2. Hệ thống sẽ xóa sạch state, token và `localStorage`, sau đó chuyển hướng về trang `/login`.
3. Tại trang `/login`, thử bấm phím **Back (quay lại)** của trình duyệt -> Xác nhận bạn **không** thể quay lại trang dashboard admin, hệ thống tiếp tục chặn và giữ bạn lại tại trang `/login`.

### Bước 5: Kiểm tra Trang 403 Forbidden
1. Truy cập trực tiếp link trang 403 Forbidden: `http://localhost:5174/#/403`
2. Xác nhận giao diện hiển thị thông báo "Không có quyền truy cập" màu đỏ chuyên nghiệp, cung cấp 2 nút thao tác:
   - **Quay về Dashboard** (quay lại `/` nếu đã đăng nhập).

## 5. Hướng Dẫn Xác Minh UI-Fix-1 (Sửa Tương Tác Frontend User)

Phiên bản sửa đổi tương tác **UI-Fix-1** đã tích hợp thành công các tinh chỉnh về mặt giao tiếp người dùng trên Website Khách hàng (`frontend-user`):

### 5.1. Thao tác trên Header & User Dropdown
1. Đăng nhập tài khoản khách hàng (`user@gmail.com` / `123456`).
2. Di chuột qua avatar: dropdown menu **không còn tự động mở** bằng hover (bảo đảm tính tương thích cảm ứng di động).
3. Nhấp chuột vào avatar/tên user -> Dropdown menu mở ra bằng React state.
4. Nhấp chuột lần nữa vào avatar -> Dropdown menu đóng lại.
5. Khi dropdown đang mở, nhấp chuột ra ngoài màn hình -> Dropdown menu tự động đóng (Click Outside).
6. Nhấn phím `Escape` trên bàn phím -> Dropdown menu tự động đóng.
7. Click vào bất kỳ item nào ("Hồ sơ cá nhân", "Đơn hàng của tôi", "Lịch sử sửa chữa") hoặc chuyển trang -> Dropdown tự động đóng.
8. Bấm "Đăng xuất" ở dropdown -> Hệ thống xóa phiên đăng nhập, đóng dropdown và chuyển hướng về trang chủ `/` sạch sẽ.

### 5.2. Đồng bộ hóa Tab & Form trong Account (`/account`)
1. Nhấp "Hồ sơ cá nhân" ở dropdown -> Truy cập đúng tuyến đường `/account?tab=profile` và hiển thị tab Thông tin cá nhân.
2. Nhấp "Đơn hàng của tôi" ở dropdown -> Truy cập đúng tuyến đường `/account?tab=orders`, nhúng trực tiếp component danh sách đơn hàng `Orders` gọn gàng, không bị lặp lại breadcrumb/banner.
3. Khi ở trang Account, nhấp chuyển đổi giữa 3 tab ở sidebar bên trái:
   * **Thông tin tài khoản** -> cập nhật URL thành `/account?tab=profile`.
   * **Sổ địa chỉ giao hàng** -> cập nhật URL thành `/account?tab=address`.
   * **Lịch sử đơn hàng** -> cập nhật URL thành `/account?tab=orders`.
4. Điền thông tin và bấm **Lưu thay đổi** (tab profile) hoặc **Lưu sổ địa chỉ** (tab address):
   * Tách biệt 2 hook form validation giúp các form không bị chặn chéo lỗi validation.
   * Ghi nhận thành công vào store và xuất hiện thông báo Toast thành công phản hồi tức thì.

### 5.3. Trình đơn di động & Search Autocomplete
1. Thu nhỏ màn hình sang giao diện mobile:
   * Mở menu di động -> Kiểm tra danh sách liên kết chuẩn xác, không còn mục trùng lặp.
   * Khi user đã đăng nhập, menu hiển thị 3 nút thao tác nhanh (Tài khoản, Đơn hàng, Sửa chữa) và Đăng xuất trực quan.
2. Nhập từ khóa tìm kiếm (ví dụ: `daikin`) trên thanh tìm kiếm Header:
   * Bấm Enter hoặc bấm vào biểu tượng kính lúp / nút "Xem tất cả kết quả tìm kiếm" -> Chuyển hướng thành công sang `/products?q=daikin` và bộ lọc lọc tự động chính xác theo từ khóa.

### 5.4. Xác minh Footer & Contact
1. Tất cả liên kết ở chân trang (Footer) đều trỏ đến các route chính xác hiện có (như `/about`, `/service-booking`, `/policy/warranty`, `/my-services`, v.v.), không còn link rỗng `href="#"`.
2. Truy cập `/contact`:
   * Nút gửi form chuyển trạng thái loading và disabled chống nhấp đúp khi đang xử lý.
   * Sau khi gửi thành công, reset form và hiển thị Toast thông báo thành công.
   * Nút bản đồ hiển thị nhãn rõ ràng: **Mở Google Maps**, tự động mở tab mới khi click.

---

## 6. Hướng Dẫn Xác Minh Task 6 (Chuẩn hóa mock-db.json cho service request và technician)

Đã thực hiện chuẩn hóa dữ liệu demo trong cả tệp `mock-api/mock-db.json` và hàm tạo dữ liệu ban đầu `getInitialData` trong `mock-api/server.js`:

### 6.1. Chi tiết các thay đổi:
1. **Cập nhật preferredDate của Service Requests:**
   * Đổi ngày hẹn (`preferredDate`) của `SR-240601` thành ngày tương lai `2026-07-05`.
   * Đổi ngày hẹn (`preferredDate`) của `SR-240602` thành ngày tương lai `2026-07-06`.
   * Cả hai ngày hẹn này đều nằm sau ngày hiện tại `2026-06-27`.
2. **Trạng thái của các yêu cầu sửa chữa:**
   * Yêu cầu `SR-240601` ở trạng thái `confirmed` và chưa gán thợ (`assignedTechnicianId: null`).
# Tài liệu Hướng Dẫn Tích Hợp & Walkthrough (Bản Hoàn Thiện Hệ Thống)

---

## ⚡ QUICK START (KHỞI ĐỘNG NHANH)

### 1. Cấu hình Port hệ thống:
* **Website Khách hàng (`frontend-user`):** `http://localhost:5173`
* **Trang Quản trị (`frontend-admin`):** `http://localhost:5174`
* **Mock API Server (`mock-api`):** `http://localhost:3001` (Cổng API chính hiện tại)
* **Backend NestJS (`backend`):** `http://localhost:3000` (Chỉ sử dụng khi đã migrate API lên production)

### 2. Lệnh khởi chạy nhanh:
* Chạy toàn bộ hệ thống (Mock API + User Web + Admin Web):
  ```powershell
  npm run dev:all
  ```
* Chạy riêng Mock API:
  ```powershell
  npm run dev:mock
  ```

### 3. Lệnh kiểm tra hệ thống:
* Chạy kiểm tra toàn bộ (Cú pháp Mock API, Typecheck & Lint của cả 2 frontend):
  ```powershell
  npm run check:all
  ```

---

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

---

## 4. Hướng Dẫn Kiểm Thử Bảo Mật (Security-1A: Admin Login & Route Guarding)

Hệ thống đã được thiết lập tính năng bảo mật **Security-1A** tại phân hệ quản lý (`frontend-admin`). Hãy thực hiện theo các bước sau để xác nhận các tính năng hoạt động đúng:

### Bước 1: Kiểm thử chặn Route (Route Guarding)
1. Hãy mở trang quản trị `http://localhost:5174/` khi chưa đăng nhập (hoặc sau khi đã chạy `localStorage.clear()` trên console F12).
2. Thử truy cập trực tiếp các URL nội bộ như:
   - `http://localhost:5174/#/products`
   - `http://localhost:5174/#/orders`
3. Xác nhận: Bạn sẽ bị hệ thống chặn lại lập tức và tự động chuyển hướng về trang Login tại:
   `http://localhost:5174/#/login`

### Bước 2: Đăng nhập với tài khoản Mock
1. Tại màn hình đăng nhập `http://localhost:5174/#/login`, nhập sai thông tin hoặc để trống -> Xác nhận hệ thống báo lỗi rõ ràng ở phía trên form với hiệu ứng rung (shake) mượt mà.
2. Bấm vào nút điền nhanh tài khoản thử nghiệm ở hộp thông tin màu xám phía dưới:
   - **Email:** `owner@dienlanh247.vn`
   - **Password:** `Admin@123`
3. Bấm nút **Đăng nhập** -> Xác nhận hệ thống hiển thị trạng thái loading mượt mà trên nút bấm, sau đó chuyển hướng bạn thành công vào trang Dashboard.

### Bước 3: Duy trì phiên đăng nhập & Tự động hết hạn (Session Expiry)
1. Khi đã đăng nhập thành công vào Dashboard, bấm nút F5 tải lại trang -> Xác nhận phiên đăng nhập vẫn được giữ nguyên (do session được lưu trữ trong `localStorage`).
2. Tên người dùng và Email hiển thị động chính xác tại Sidebar Footer và Header Profile Dropdown (`Owner Điện Lạnh 247` / `owner@dienlanh247.vn`).
3. Thời hạn session là **30 phút**.
4. Để test nhanh cơ chế tự động logout khi hết hạn, bạn hãy mở F12 -> Application -> Local Storage -> thay đổi giá trị của `dl247_admin_expires_at` thành một mốc thời gian trong quá khứ (ví dụ: `1000000000000`) -> Click chuyển đổi giữa các menu trang quản trị -> Xác nhận hệ thống phát hiện session hết hạn và tự động logout đẩy bạn về trang `/login`.

### Bước 4: Đăng xuất & Chặn nhấn Back trình duyệt
1. Tại header trang quản trị, bấm vào avatar người dùng để mở menu thả xuống -> Bấm **Đăng xuất**.
2. Hệ thống sẽ xóa sạch state, token và `localStorage`, sau đó chuyển hướng về trang `/login`.
3. Tại trang `/login`, thử bấm phím **Back (quay lại)** của trình duyệt -> Xác nhận bạn **không** thể quay lại trang dashboard admin, hệ thống tiếp tục chặn và giữ bạn lại tại trang `/login`.

### Bước 5: Kiểm tra Trang 403 Forbidden
1. Truy cập trực tiếp link trang 403 Forbidden: `http://localhost:5174/#/403`
2. Xác nhận giao diện hiển thị thông báo "Không có quyền truy cập" màu đỏ chuyên nghiệp, cung cấp 2 nút thao tác:
   - **Quay về Dashboard** (quay lại `/` nếu đã đăng nhập).

---

## 5. Hướng Dẫn Xác Minh UI-Fix-1 (Sửa Tương Tác Frontend User)

Phiên bản sửa đổi tương tác **UI-Fix-1** đã tích hợp thành công các tinh chỉnh về mặt giao tiếp người dùng trên Website Khách hàng (`frontend-user`):

### 5.1. Thao tác trên Header & User Dropdown
1. Đăng nhập tài khoản khách hàng (`user@gmail.com` / `123456`).
2. Di chuột qua avatar: dropdown menu **không còn tự động mở** bằng hover (bảo đảm tính tương thích cảm ứng di động).
3. Nhấp chuột vào avatar/tên user -> Dropdown menu mở ra bằng React state.
4. Nhấp chuột lần nữa vào avatar -> Dropdown menu đóng lại.
5. Khi dropdown đang mở, nhấp chuột ra ngoài màn hình -> Dropdown menu tự động đóng (Click Outside).
6. Nhấn phím `Escape` trên bàn phím -> Dropdown menu tự động đóng.
7. Click vào bất kỳ item nào ("Hồ sơ cá nhân", "Đơn hàng của tôi", "Lịch sử sửa chữa") hoặc chuyển trang -> Dropdown tự động đóng.
8. Bấm "Đăng xuất" ở dropdown -> Hệ thống xóa phiên đăng nhập, đóng dropdown và chuyển hướng về trang chủ `/` sạch sẽ.

### 5.2. Đồng bộ hóa Tab & Form trong Account (`/account`)
1. Nhấp "Hồ sơ cá nhân" ở dropdown -> Truy cập đúng tuyến đường `/account?tab=profile` và hiển thị tab Thông tin cá nhân.
2. Nhấp "Đơn hàng của tôi" ở dropdown -> Truy cập đúng tuyến đường `/account?tab=orders`, nhúng trực tiếp component danh sách đơn hàng `Orders` gọn gàng, không bị lặp lại breadcrumb/banner.
3. Khi ở trang Account, nhấp chuyển đổi giữa 3 tab ở sidebar bên trái:
   * **Thông tin tài khoản** -> cập nhật URL thành `/account?tab=profile`.
   * **Sổ địa chỉ giao hàng** -> cập nhật URL thành `/account?tab=address`.
   * **Lịch sử đơn hàng** -> cập nhật URL thành `/account?tab=orders`.
4. Điền thông tin và bấm **Lưu thay đổi** (tab profile) hoặc **Lưu sổ địa chỉ** (tab address):
   * Tách biệt 2 hook form validation giúp các form không bị chặn chéo lỗi validation.
   * Ghi nhận thành công vào store và xuất hiện thông báo Toast thành công phản hồi tức thì.

### 5.3. Trình đơn di động & Search Autocomplete
1. Thu nhỏ màn hình sang giao diện mobile:
   * Mở menu di động -> Kiểm tra danh sách liên kết chuẩn xác, không còn mục trùng lặp.
   * Khi user đã đăng nhập, menu hiển thị 3 nút thao tác nhanh (Tài khoản, Đơn hàng, Sửa chữa) và Đăng xuất trực quan.
2. Nhập từ khóa tìm kiếm (ví dụ: `daikin`) trên thanh tìm kiếm Header:
   * Bấm Enter hoặc bấm vào biểu tượng kính lúp / nút "Xem tất cả kết quả tìm kiếm" -> Chuyển hướng thành công sang `/products?q=daikin` và bộ lọc lọc tự động chính xác theo từ khóa.

### 5.4. Xác minh Footer & Contact
1. Tất cả liên kết ở chân trang (Footer) đều trỏ đến các route chính xác hiện có (như `/about`, `/service-booking`, `/policy/warranty`, `/my-services`, v.v.), không còn link rỗng `href="#"`.
2. Truy cập `/contact`:
   * Nút gửi form chuyển trạng thái loading và disabled chống nhấp đúp khi đang xử lý.
   * Sau khi gửi thành công, reset form và hiển thị Toast thông báo thành công.
   * Nút bản đồ hiển thị nhãn rõ ràng: **Mở Google Maps**, tự động mở tab mới khi click.

---

## 6. Hướng Dẫn Xác Minh Task 6 (Chuẩn hóa mock-db.json cho service request và technician)

Đã thực hiện chuẩn hóa dữ liệu demo trong cả tệp `mock-api/mock-db.json` và hàm tạo dữ liệu ban đầu `getInitialData` trong `mock-api/server.js`:

### 6.1. Chi tiết các thay đổi:
1. **Cập nhật preferredDate của Service Requests:**
   * Đổi ngày hẹn (`preferredDate`) của `SR-240601` thành ngày tương lai `2026-07-05`.
   * Đổi ngày hẹn (`preferredDate`) của `SR-240602` thành ngày tương lai `2026-07-06`.
   * Cả hai ngày hẹn này đều nằm sau ngày hiện tại `2026-06-27`.
2. **Trạng thái của các yêu cầu sửa chữa:**
   * Yêu cầu `SR-240601` ở trạng thái `confirmed` và chưa gán thợ (`assignedTechnicianId: null`).
   * Yêu cầu `SR-240602` ở trạng thái `pending` và chưa gán thợ (`assignedTechnicianId: null`).
3. **Tính tương thích của thợ kỹ thuật:**
   * Bổ sung kỹ năng sửa điều hòa (`sua-dieu-hoa`) cho kỹ thuật viên `TECH-002` (Trần Minh Hải) để thợ này có đầy đủ các thông số tương ứng.
   * Kỹ thuật viên `TECH-001` (Nguyễn Văn Hùng) có trạng thái `available`, hoạt động tại `Cầu Giấy` và có kỹ năng `ve-sinh-dieu-hoa`. Điều này khớp hoàn hảo với yêu cầu dịch vụ `SR-240601` (Quận Cầu Giấy, Danh mục Vệ sinh điều hòa).
   * Kỹ thuật viên `TECH-003` (Lê Hoàng Nam) có trạng thái `busy` để kiểm tra các kịch bản chặn phân công thợ bận.

### 6.2. Kiểm thử Tích hợp Tự động:
1. Chạy script kiểm thử tích hợp tự động dành riêng cho Task 6 tại đường dẫn [test_task6.js](file:///C:/Users/Admin/.gemini/antigravity/brain/1ec938c5-52e2-4bd6-87ad-22231bc04644/scratch/test_task6.js):
   ```powershell
   node C:\Users\Admin\.gemini\antigravity\brain\1ec938c5-52e2-4bd6-87ad-22231bc04644\scratch\test_task6.js
   ```
2. Kịch bản test tự động đăng nhập admin, reset cơ sở dữ liệu mẫu về ban đầu thông qua API `/api/v1/dev/reset-db`, kiểm tra ngày hẹn của toàn bộ lịch sửa chữa nằm trong tương lai, xác minh các thợ sẵn có đầy đủ kỹ năng & trạng thái, đồng thời giả lập phân công thợ đúng/sai khu vực, kỹ năng, và kiểm tra các trường hợp chặn phân công thợ bận đúng nghiệp vụ.

Toàn bộ kiểm tra đều đã được xác thực thành công tốt đẹp!

---

## 7. Hướng Dẫn Xác Minh Task 7 (Hoàn thiện UI completed service request trong admin)

Đã hoàn thiện giao diện hoàn tất yêu cầu dịch vụ trong phân hệ Admin:
* **Giao diện Modal xác nhận hoàn tất:** Khi chọn trạng thái `completed` và bấm **Cập nhật**, hệ thống sẽ hiển thị một Modal yêu cầu nhập các thông tin:
  * Chi phí thực tế (`finalPrice`): Bắt buộc nhập và phải lớn hơn 0.
  * Trạng thái thanh toán (`paymentStatus`): Dropdown chọn `Chưa thanh toán (unpaid)` hoặc `Đã thanh toán (paid)`.
  * Ghi chú hoàn tất (`statusNote`): Nhập lý do/mô tả quá trình xử lý thực tế.
* **Cơ chế Cảnh báo & Khóa hành động:** Nếu yêu cầu sửa chữa chưa được phân công kỹ thuật viên phụ trách, Modal sẽ hiển thị một banner cảnh báo màu đỏ và vô hiệu hóa nút xác nhận hoàn thành, ngăn không cho gửi dữ liệu lỗi.
* **Thay thế Alert bằng Toast:** Loại bỏ hoàn toàn các thông báo `alert()` gốc của trình duyệt và thay thế bằng các thông báo Toast nội bộ tự thiết kế có màu sắc tương ứng (`success`/`error`) ở góc phải bên dưới màn hình.
* **Đồng bộ hóa dữ liệu:** Sau khi bấm lưu thành công, dữ liệu chi tiết yêu cầu dịch vụ được tự động cập nhật và làm mới qua React Query (`finalPrice`, `completedAt`, `statusHistory`, `paymentStatus`).

---

## 8. Hướng Dẫn Xác Minh Task 8 (Siết workflow trạng thái đơn hàng)

Đã siết chặt quy trình nghiệp vụ đổi trạng thái đơn hàng ở cả 2 phân hệ:
* **Ràng buộc nghiệp vụ phía Backend:** Trong `mock-api/server.js`, các tuyến đổi trạng thái đơn hàng được kiểm soát nghiêm ngặt theo luồng:
  * `pending` (Chờ XN) -> chỉ đi tiếp sang `confirmed` (Đã XN) hoặc `cancelled` (Đã hủy).
  * `confirmed` (Đã XN) -> chỉ đi tiếp sang `processing` (Đang XL) hoặc `cancelled` (Đã hủy).
  * `processing` (Đang XL) -> chỉ đi tiếp sang `shipping` (Đang giao) hoặc `cancelled` (Đã hủy).
  * `shipping` (Đang giao) -> chỉ đi tiếp sang `delivered` (Đã giao).
  * Các đơn hàng ở trạng thái `delivered` và `cancelled` bị khóa vĩnh viễn, không thể chuyển đổi trạng thái tiếp.
* **Cập nhật UI Dropdown:** Trong `frontend-admin/src/pages/Orders.tsx`, danh sách dropdown cập nhật trạng thái đơn hàng sẽ tự động lọc, chỉ hiển thị trạng thái hợp lệ tiếp theo của đơn hàng. Nếu đơn hàng đã giao (`delivered`) hoặc đã hủy (`cancelled`), dropdown sẽ tự động bị disable.
* **Hoàn trả Tồn kho chính xác:** Nếu đơn hàng bị hủy ở bất kỳ trạng thái nào trước đó, Backend tự động tìm lại các sản phẩm trong đơn hàng và hoàn trả lại số lượng tồn kho tương ứng (`stock += quantity`), đồng thời kích hoạt lại trạng thái bán nếu sản phẩm đang bị hết hàng.
* **Lọc trạng thái Thanh toán:** Triển khai tính năng lọc thực tế theo "Trạng thái thanh toán" (`paymentStatusFilter`), cho phép lọc nhanh danh sách đơn hàng theo trạng thái thanh toán (Chưa thanh toán, Đã thanh toán, Thất bại, Đã hoàn tiền) thời gian thực.

---

## 9. Kiểm thử Tích hợp Tự động Task 7 & Task 8

1. Chạy script kiểm thử tích hợp tự động dành riêng cho Task 7 & 8 tại đường dẫn [test_task7_8.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/scratch/test_task7_8.js):
   ```powershell
   node scratch/test_task7_8.js
   ```
2. Tập lệnh kiểm thử sẽ giả lập:
   * Chặn hoàn tất yêu cầu dịch vụ khi chưa gán thợ.
   * Chặn hoàn tất yêu cầu khi chi phí thực tế bằng 0.
   * Gán thợ và hoàn tất thành công với chi phí `120,000đ` và trạng thái thanh toán `paid`, xác nhận các thông tin được cập nhật đúng.
   * Checkout đơn hàng mới (tạo trạng thái `pending`) và thử đổi các trạng thái sai nghiệp vụ (đều bị chặn 400).
   * Đi qua đúng workflow `pending -> confirmed -> processing -> shipping -> delivered` thành công.
   * Tạo đơn hàng mới, ghi nhận stock giảm, sau đó hủy đơn và xác nhận stock được phục hồi hoàn chỉnh.

Toàn bộ các bước kiểm tra đã vượt qua thành công!

---

## 10. Hướng Dẫn Xác Minh Task 9 (Sửa cart stock limit và validate checkout)

Đã hoàn thiện việc kiểm soát giới hạn số lượng theo tồn kho trong giỏ hàng và chuẩn hóa validate số điện thoại ở checkout:
* **Cart Stock Limit ở Store:** Trong `cartStore.ts`, cả hai phương thức `addItem` và `updateQuantity` đã được thêm bộ lọc giới hạn `Math.min(quantity, product.quantity)`. Số lượng sản phẩm trong giỏ không bao giờ vượt quá tồn kho thực tế.
* **Vô hiệu hóa tăng số lượng ở UI:** Trong cả `Cart.tsx` và `MiniCart.tsx`, nút cộng (`Plus`) sẽ tự động chuyển sang trạng thái `disabled` khi số lượng hiện tại đạt mức tồn kho tối đa của sản phẩm (`quantity >= product.quantity`).
* **Hiển thị thông báo số lượng còn lại:** Nếu một sản phẩm có số lượng tồn kho thấp (`<= 10`), hệ thống sẽ hiển thị một dòng chữ cảnh báo trực quan màu cam: *"Chỉ còn X sản phẩm"* ngay bên dưới tên sản phẩm để người dùng nắm được thông tin.
* **Chuẩn hóa Regex số điện thoại:** Regex kiểm tra số điện thoại ở trang `Checkout.tsx` đã được chỉnh sửa thành `/^0(3|5|7|8|9)\d{8}$/` (loại bỏ ký tự `|` thừa thãi bên trong cụm vuông).
* **Chuẩn hóa số điện thoại đầu vào:** Số điện thoại của khách hàng nhập vào sẽ tự động được loại bỏ toàn bộ khoảng trắng và trim thông qua thuộc tính `setValueAs` của React Hook Form trước khi tiến hành kiểm tra biểu thức chính quy (Regex).
* **Normalize phía Backend:** Trong `mock-api/server.js`, khi nhận được yêu cầu từ API đặt hàng (`POST /api/v1/orders`) và đặt lịch dịch vụ (`POST /api/v1/service-requests`), hệ thống sẽ tự động dọn dẹp và chuẩn hóa số điện thoại bằng cách loại bỏ khoảng trắng dư thừa trước khi lưu trữ vào cơ sở dữ liệu.

### 10.1. Kiểm thử Tích hợp Tự động Task 9:
1. Chạy script kiểm thử tích hợp tự động dành riêng cho Task 9 tại đường dẫn [test_task9.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/scratch/test_task9.js):
   ```powershell
   node scratch/test_task9.js
   ```
2. Tập lệnh kiểm thử xác nhận việc gửi thông tin số điện thoại chứa khoảng trắng lên API đặt hàng và đặt lịch sửa chữa đều được chuẩn hóa chính xác thành chuỗi không chứa khoảng trắng ở Database.

---

## 11. Hướng Dẫn Xác Minh Task 10 (Sửa lỗi giao diện admin cơ bản)

Đã khắc phục hoàn toàn các lỗi giao diện cơ bản và làm cho cổng Admin trở nên chuyên nghiệp hơn:
* **Ngăn ngừa vỡ bảng ở màn hình nhỏ:** Trong `Table.tsx`, bổ sung thuộc tính `minWidth` mặc định là `1000px` cho toàn bộ các bảng. Khi xem ở giao diện Mobile/Tablet, bảng sẽ hiển thị thanh cuộn ngang mượt mà, giúp các cột không bị bóp méo, mất cân đối.
* **Sidebar Active thông minh cho các trang chi tiết:** Trong `AdminLayout.tsx`, cơ chế tính toán `isActive` đã được nâng cấp bằng phương thức kiểm tra `location.pathname.startsWith(item.path)`. Do đó, khi xem chi tiết một yêu cầu sửa chữa (ví dụ `/service-requests/SR-240601`), menu cha *"Yêu cầu sửa chữa"* ở Sidebar vẫn hiển thị trạng thái active sáng màu đồng bộ.
* **Cập nhật tiêu đề Breadcrumb động cho các trang chi tiết:** Thay vì hiển thị *"Dashboard"* mặc định khi truy cập các route chi tiết, Breadcrumb hiện tại sẽ hiển thị đúng phân cấp:
  * `/service-requests/:id` -> *"Yêu cầu sửa chữa / Chi tiết yêu cầu"*
  * `/orders/:id` -> *"Quản lý Đơn hàng / Chi tiết đơn hàng"*
  * `/products/:id` -> *"Quản lý Sản phẩm / Chi tiết sản phẩm"*
* **Làm rõ các tính năng đang phát triển:** Các nút **Search** và **Bell** ở Header đã được thêm thuộc tính `title` mô tả rõ *"Tính năng đang được phát triển"*, đồng thời giảm độ mờ (`opacity-50`) và đổi con trỏ chuột thành `cursor-not-allowed` để tránh gây hiểu nhầm cho người dùng.
* **Loại bỏ Alert thô trong Quản lý sản phẩm:** Thay thế toàn bộ các thông báo `alert()` thô của trình duyệt tại trang `Products.tsx` (khi tạo mới, chỉnh sửa, xóa sản phẩm hoặc gặp lỗi) bằng cơ chế Toast notification chuyên nghiệp hiển thị mượt mà ở góc dưới bên phải màn hình.
* **Đồng bộ hóa build hệ thống:** Đã kiểm tra build và lint sạch sẽ cho toàn bộ hệ thống cổng Admin.

---

## 12. Hướng Dẫn Xác Minh Task 11 (Siết validate form sản phẩm admin)

Đã thắt chặt quy trình validate sản phẩm ở cả 2 đầu frontend và backend để ngăn ngừa lỗi dữ liệu nghiêm trọng:
* **Ràng buộc validate phía Frontend:** Trong `Products.tsx`, nút submit form sẽ thực hiện kiểm tra:
  * Tên sản phẩm, SKU, Slug không được trống.
  * Danh mục và thương hiệu phải được chọn.
  * Giá gốc (`basePrice`) bắt buộc lớn hơn `0`.
  * Giá khuyến mãi (`salePrice`) nếu điền khác `0` thì bắt buộc lớn hơn `0` và phải nhỏ hơn hoặc bằng giá gốc (`<= basePrice`).
  * Số lượng tồn kho (`stock`) không được là số âm (`>= 0`).
  * Ảnh đại diện (`thumbnail`) không được bỏ trống.
  * Nếu phát hiện lỗi dữ liệu, hệ thống tự động hiển thị thông báo Toast cảnh báo trực quan tương ứng mà không dùng `alert()` của trình duyệt.
* **Đồng bộ validate phía Backend:** Trong `mock-api/server.js`, các đầu cuối `POST /api/v1/admin/products` và `PATCH /api/v1/admin/products/:id` đã được siết chặt với các quy tắc validate tương đương để ngăn chặn người dùng cố tình bypass frontend.

### 12.1. Kiểm thử Tích hợp Tự động Task 11:
1. Chạy script kiểm thử tích hợp tự động dành riêng cho Task 11 tại đường dẫn [test_task11.js](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/scratch/test_task11.js):
   ```powershell
   node scratch/test_task11.js
   ```
2. Tập lệnh kiểm thử xác nhận:
   * Chặn tạo sản phẩm khi `salePrice > basePrice`.
   * Chặn tạo sản phẩm khi `stock < 0`.
   * Chặn tạo sản phẩm khi `thumbnail` trống.
   * Chặn tạo sản phẩm khi `basePrice <= 0`.
   * Cho phép tạo thành công sản phẩm hợp lệ và ghi nhận mã trạng thái `201 Created`.

---

## 13. Hướng Dẫn Xác Minh Task 12 (Sửa package-lock backend bị lệch)

Đã đồng bộ hóa và cấu hình chuẩn chỉnh tệp `package-lock.json` của thư mục `backend` để hỗ trợ môi trường CI/CD và triển khai thực tế trên máy mới:
1. **Đồng bộ hóa Lockfile:** Chạy thành công lệnh `npm install` trong thư mục [backend](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend) để sinh ra tệp [package-lock.json](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/package-lock.json) đồng bộ hoàn toàn với các phiên bản package được mô tả trong [package.json](file:///C:/Users/Admin/.gemini/antigravity/scratch/ecommerce-platform/backend/package.json).
2. **Kiểm tra Phục hồi Sạch (npm ci):** Chạy lệnh `npm ci` thành công hoàn chỉnh, xác minh toàn bộ các gói phụ thuộc được tải xuống và cài đặt từ tệp lockfile một cách nhất quán mà không gặp bất kỳ xung đột phiên bản nào.
3. **Kiểm tra Biên dịch (Build):** Thực hiện lệnh `npm run build` dự án NestJS thành công 100%, tạo ra gói phân phối sản xuất trong thư mục `dist` mà không có bất kỳ lỗi biên dịch TypeScript nào.
