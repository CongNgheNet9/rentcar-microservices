# RideLux — Vehicle Rental System (Hệ Thống Thuê Xe Microservices)

Tài liệu hướng dẫn tổng quan về hệ thống microservices, cấu trúc cơ sở dữ liệu và **các phương pháp kiểm tra (check) dữ liệu trong Database**.

---

## 1. Vị Trí Các File Cơ Sở Dữ Liệu (Database Locations)

Theo đúng nguyên tắc **Database-per-service** trong tài liệu kiến trúc, mỗi microservice sở hữu một cơ sở dữ liệu hoàn toàn độc lập, không chia sẻ database:

| Tên Dịch Vụ | File Cơ Sở Dữ Liệu | Đường Dẫn Thực Tế Trên Máy | Các Bảng Chính (Tables) |
|---|---|---|---|
| **User Service** | `users.db` | `E:\docsrentcar\src\backend\RentCar.UserService\users.db` | `Users`, `EmailVerifications` (OTP Codes) |
| **Vehicle Service** | `vehicles.db` | `E:\docsrentcar\src\backend\RentCar.VehicleService\vehicles.db` | `Vehicles`, `VehicleTypes`, `Locations` |
| **Booking Service** | `bookings.db` | `E:\docsrentcar\src\backend\RentCar.BookingService\bookings.db` | `Bookings`, `BookingStatusHistories`, `Payments`, `IdempotencyRecords` |

---

## 2. Các Cách Kiểm Tra (Check) Dữ Liệu Database

Bạn có thể kiểm tra dữ liệu bằng một trong các cách tiện lợi sau:

### Cách 1: Dùng Tool Tự Động 1-Click (Nhanh nhất ⭐)
Tôi đã viết sẵn công cụ dòng lệnh trực quan kiểm tra toàn bộ 3 database cùng lúc:
* **Nhấp đúp chuột vào file:** **[`check-db.bat`](file:///E:/docsrentcar/check-db.bat)** tại thư mục `E:\docsrentcar`.
* Hoặc mở PowerShell tại `E:\docsrentcar` và gõ:
  ```powershell
  .\check-db.ps1
  ```
👉 Công cụ sẽ tự động đọc và in toàn bộ bảng biểu (`Users`, `Vehicles`, `VehicleTypes`, `Locations`, `Bookings`, `IdempotencyRecords`) ra màn hình console với số lượng bản ghi và thông tin chi tiết.

---

### Cách 2: Xem Trực Quan Trong VS Code (Bằng Extension)
Nếu bạn đang mở thư mục dự án trong VS Code:
1. Mở tab **Extensions** (`Ctrl + Shift + X`).
2. Tìm kiếm extension tên **"SQLite Viewer"** (tác giả *Florian Klampfer*).
3. Nhấn **Install**.
4. Sau khi cài xong, trong cây thư mục VS Code, bạn chỉ cần **nhấp chuột vào file `.db` bất kỳ**:
   - `src/backend/RentCar.UserService/users.db`
   - `src/backend/RentCar.VehicleService/vehicles.db`
   - `src/backend/RentCar.BookingService/bookings.db`
👉 Giao diện bảng biểu đồ họa trực quan sẽ mở ra ngay trong VS Code, cho phép tìm kiếm, lọc và phân trang dữ liệu.

---

### Cách 3: Dùng Phần Mềm Giao Diện Đồ Họa (DB Browser for SQLite)
1. Tải phần mềm miễn phí **[DB Browser for SQLite](https://sqlitebrowser.org/dl/)** (chọn bản Portable hoặc Installer cho Windows).
2. Mở phần mềm -> Chọn **"Open Database"**.
3. Trỏ tới file `.db` bạn muốn kiểm tra (ví dụ `E:\docsrentcar\src\backend\RentCar.BookingService\bookings.db`).
4. Chuyển sang tab **"Browse Data"** để xem toàn bộ dữ liệu bảng hoặc tab **"Execute SQL"** để gõ câu lệnh truy vấn tùy ý.

---

### Cách 4: Kiểm Tra Qua Swagger UI (Trình Duyệt Web)
Khi các dịch vụ đang chạy (qua `run-dev.bat`), bạn có thể kiểm tra trực tiếp qua giao diện Swagger UI:
* **User Service DB**: Mở [http://localhost:5001/swagger](http://localhost:5001/swagger) -> gọi API `POST /auth/login` hoặc `GET /users/me`.
* **Vehicle Service DB**: Mở [http://localhost:5002/swagger](http://localhost:5002/swagger) -> gọi API `GET /api/vehicles` hoặc `GET /api/admin/vehicles`.
* **Booking Service DB**: Mở [http://localhost:5003/swagger](http://localhost:5003/swagger) -> gọi API `GET /bookings`.

---

## 3. Cấu Trúc Bảng Chi Tiết Của Từng Dịch Vụ

### 3.1 `users.db` (User Service)
* **Bảng `Users`**:
  - `UserId` (Guid - Khóa chính)
  - `Name` (Họ tên hiển thị)
  - `Email` (Email đăng nhập - Unique)
  - `PasswordHash` (Mật khẩu băm an toàn bằng BCrypt)
  - `Role` (`Customer` hoặc `Admin`)
  - `Status` (`Active` hoặc `Inactive`)
  - `CreatedAtUtc`, `UpdatedAtUtc`, `DeletedAtUtc`

### 3.2 `vehicles.db` (Vehicle Service)
* **Bảng `Vehicles`**:
  - `Id` (long - Khóa chính)
  - `Brand`, `Model`, `Year`, `LicensePlate` (Biển số xe - Unique)
  - `VehicleTypeId` (FK tham chiếu `VehicleTypes`)
  - `LocationId` (FK tham chiếu `Locations`)
  - `Status` (`Available`, `Maintenance`, `Unavailable`, `Retired`)
  - `IsActive` (true/false)
  - `PricePerDay` (Giá thuê theo ngày, ví dụ: $1,299)
  - `ImageUrl` (Ảnh xe sắc nét)
* **Bảng `VehicleTypes`**: Danh mục loại xe (`Supercars`, `SUVs`, `Sedans`, `Convertibles`, `Electric`).
* **Bảng `Locations`**: Điểm nhận/trả xe (`Los Angeles`, `Miami`, `New York`, `Dubai`).

### 3.3 `bookings.db` (Booking Service)
* **Bảng `Bookings`**:
  - `BookingId` (Guid - Khóa chính)
  - `CustomerUserId` (Tham chiếu logic tới User ID)
  - `VehicleId` (Tham chiếu logic tới Vehicle ID)
  - `PickupLocationId`, `ReturnLocationId`
  - `PickupUtc`, `ReturnUtc` (Thời gian thuê nửa mở `[PickupUtc, ReturnUtc)`)
  - `Status` (`Pending`, `Confirmed`, `Active`, `Returned`, `Completed`, `Cancelled`, `Rejected`)
  - `TotalPrice` (Tổng tiền thuê)
  - `RowVersion` (Token kiểm soát tranh chấp đồng thời)
* **Bảng `BookingStatusHistories`**: Lưu vết lịch sử chuyển đổi trạng thái của đơn đặt xe và lý do.
* **Bảng `Payments`**: Quản lý lịch sử thanh toán giao dịch:
  - `PaymentId` (Guid - Khóa chính)
  - `BookingId` (FK liên kết với Booking)
  - `CustomerUserId` (Người thanh toán)
  - `Amount` (Số tiền thanh toán)
  - `Currency` (Loại tiền tệ, ví dụ: USD)
  - `PaymentMethod` (`CreditCard`, `VietQR`, `BankTransfer`, `PayPal`)
  - `Status` (`Completed`, `Pending`, `Failed`, `Refunded`)
  - `TransactionReference` (Mã tham chiếu giao dịch độc nhất `TXN-YYYYMMDD-XXXXXX`)
  - `CardLast4`, `CardBrand`, `PayerName`, `BankCode`, `Note`, `PaidAtUtc`
* **Bảng `IdempotencyRecords`**:
  - `CustomerUserId` + `IdempotencyKey` (Khóa chính kép)
  - `RequestHash` (Mã băm SHA256 của request)
  - `ResponseStatusCode`, `ResponseBody` (Lưu kết quả đơn đã tạo để trả về ngay khi gửi trùng).

---

## 4. Khởi Động Toàn Bộ Hệ Thống

Để khởi động toàn bộ hệ thống gồm 4 Microservices + 1 Web Frontend:
* **Cách nhanh nhất:** Nhấp đúp chuột vào file **[`run-dev.bat`](file:///E:/docsrentcar/run-dev.bat)**.
* Các cổng dịch vụ:
  - **Website Người Dùng**: 👉 **[http://localhost:5173](http://localhost:5173)**
  - **API Gateway (YARP)**: [http://localhost:5000](http://localhost:5000)
  - **User Service API**: [http://localhost:5001](http://localhost:5001)
  - **Vehicle Service API**: [http://localhost:5002](http://localhost:5002)
  - **Booking Service API**: [http://localhost:5003](http://localhost:5003)

---

## 5. Tài Khoản Đăng Nhập Mẫu

| Tài khoản | Email | Mật khẩu | Quyền hạn |
|---|---|---|---|
| **Khách hàng (Customer)** | `customer@rentcar.com` | `Customer@123` | Xem xe, đặt xe, thanh toán tiền, xem hóa đơn, hủy đơn của mình |
| **Quản trị viên (Admin)** | `admin@rentcar.com` | `Admin@123` | Duyệt đơn (`Confirm`/`Reject`), nhận xe (`Pickup`), trả xe (`Return`), hoàn tất (`Complete`), thêm/sửa xe, quản lý loại xe & địa điểm |

---

## 6. Hướng Dẫn Chức Năng Thanh Toán & Hóa Đơn Điện Tử (Payment System)

Hệ thống thanh toán đã được tích hợp hoàn chỉnh và hoạt động thực tế (End-to-End):

### 6.1 Các Phương Thức Thanh Toán Hỗ Trợ
1. **Thẻ Tín Dụng / Ghi Nợ Quốc Tế (Credit Card)**:
   - Hỗ trợ Visa, MasterCard, American Express.
   - Có nút **"Fill Demo VIP Card"** tự động điền thẻ mẫu VIP hợp lệ để kiểm thử 1-click.
2. **Chuyển Khoản Ngân Hàng 24/7 (VietQR / Napas 247)**:
   - Hiển thị mã QR chuẩn VietQR (MB Bank, STK: `0988 7766 55`, Chủ TK: `RIDELUX VIETNAM LLC`).
   - Cú pháp chuyển khoản tự động gán theo mã đơn: `RIDELUX [Mã Đơn]`.
   - Nút mô phỏng quét thanh toán tức thì.
3. **PayPal VIP Express**:
   - Thanh toán 1-chạm được bảo chứng người mua.

### 6.2 Hai Luồng Thanh Toán Trên Website
* **Luồng 1 — Thanh toán tức thì khi chọn xe**:
  1. Vào chi tiết xe bất kỳ (ví dụ: *Lamborghini Huracán*).
  2. Chọn ngày nhận & trả xe -> Kiểm tra tình trạng xe còn trống (Live Availability).
  3. Tại Card 3 (**Payment & Settlement**), chọn loại thẻ hoặc VietQR.
  4. Nhấn **"Pay $... & Confirm"** -> Hệ thống tạo đơn và thực hiện giao dịch thanh toán.
  5. Màn hình **Hóa đơn điện tử (Official Electronic Receipt)** bật lên ngay lập tức với dấu mộc vàng **PAID & VERIFIED**, mã giao dịch duy nhất `TXN-...`, chi tiết thời gian và nút **Print / Save Receipt** (in/lưu file PDF).
* **Luồng 2 — Thanh toán đơn đang chờ (Pending) trong mục Quản lý đặt xe**:
  1. Nhấn nút **"Bookings"** trên thanh Menu để mở danh sách đặt xe của bạn.
  2. Với các đơn ở trạng thái `Pending` (chưa thanh toán), sẽ xuất hiện nút vàng **"Pay Now"**.
  3. Nhấn **"Pay Now"** -> Chọn phương thức thanh toán -> Tiền được xác nhận và đơn chuyển sang `Confirmed`.
  4. Với các đơn đã thanh toán, nhấn nút **"Receipt"** để xem và in lại hóa đơn bất cứ lúc nào!

---

## 7. Các Mục Giao Diện Mới Đã Hoàn Thành
* **Destinations (Cung Đường Hạng Sang)**: Giới thiệu các cung đường lái xe ngoạn mục (Pacific Coast Highway, Ocean Drive Miami, The Hamptons, Đèo Hải Vân Đà Nẵng) kèm đề xuất dòng xe tương ứng.
* **Experiences (Dịch Vụ Trải Nghiệm Đẳng Cấp)**: Dịch vụ tài xế riêng VIP đưa đón tận máy bay (FBO Tarmac Concierge), trải nghiệm lái xe trường đua chuyên nghiệp (Track Day), đoàn xe hộ tống lễ cưới (Wedding Convoy).
* **About (Tiêu Chuẩn Kỹ Thuật RideLux)**: Kiến trúc vi dịch vụ .NET 8 độc lập, cam kết không trùng lịch với thuật toán khóa khoảng thời gian nửa mở, bảo hiểm triệu đô từ Lloyd's.

---

## 8. Chức Năng Đăng Ký Tài Khoản Bằng Gmail & Xác Thực Mã OTP (Gmail Verification)

Hệ thống cung cấp quy trình đăng ký tài khoản bảo mật bằng Gmail với cơ chế xác thực OTP:

### 8.1 Quy Trình Hoạt Động (Flow)
1. **Giao diện Đăng Ký**:
   - Khách hàng bấm **Sign In** -> Chọn **"Chưa có tài khoản? Đăng ký xác thực qua Gmail"**.
   - Nhập **Họ và tên**, **Gmail / Email**.
   - Bấm nút **"Gửi mã xác nhận Gmail"**.
2. **Cơ chế Sinh & Gửi Mã OTP**:
   - Backend sinh mã OTP ngẫu nhiên 6 chữ số, thời gian hết hạn trong 10 phút và lưu vào bảng `EmailVerifications` trong `users.db`.
   - Nếu đã cấu hình tài khoản Gmail trong file `appsettings.json` (`SmtpSettings:SenderEmail` và `SenderPassword`), hệ thống sẽ gửi email thật với giao diện HTML hoàng gia sang trọng.
   - Trong môi trường phát triển / kiểm thử: Hệ thống đồng thời log mã ra console và hiển thị một huy hiệu thông minh **"Mã kiểm thử: [XXXXXX] (Bấm để điền nhanh)"** giúp bạn test đăng ký tức thì mà không cần thoát khỏi màn hình.
3. **Xác Thực & Tạo Tài Khoản**:
   - Nhập mã 6 số và mật khẩu -> Bấm **"Xác Thực Gmail & Đăng Ký"**.
   - Backend đối soát mã xác thực, nếu đúng và còn hạn sẽ băm mật khẩu với BCrypt, đánh dấu mã đã sử dụng, tạo User mới trong database và cấp token JWT đăng nhập ngay!

### 8.2 Cấu Hình Gửi Mail Thật Bằng Gmail (Tùy Chọn)
Mở file `src/backend/RentCar.UserService/appsettings.json` và cập nhật thông tin App Password của Google:
```json
"SmtpSettings": {
  "Host": "smtp.gmail.com",
  "Port": 587,
  "EnableSsl": true,
  "SenderEmail": "your-email@gmail.com",
  "SenderPassword": "your-app-password",
  "SenderName": "RideLux Verification"
}
```
*(Lưu ý: `SenderPassword` là Mật khẩu ứng dụng 16 ký tự được tạo trong mục [Bảo mật tài khoản Google -> Mật khẩu ứng dụng](https://myaccount.google.com/apppasswords)).*

---

## 9. Đặc Quyền Admin, Quy Trình Duyệt Đơn, Idempotency & Cụm Redis (Replication + Sharding)

### 9.1 Đặc Quyền Tài Khoản Quản Trị Viên (Admin Privileges)
- **Miễn phí thanh toán toàn bộ**: Khi Admin (`admin@rentcar.com`) thực hiện đặt xe, hệ thống tự động đánh dấu `IsPaid = true`, số tiền `0 VND` và mã thanh toán `EXEMPT-ADMIN`.
- **Lấy xe trực tiếp (Direct Pickup)**: Admin có nút riêng **"Lấy Xe Trực Tiếp (Admin)"** trên chi tiết xe. Trạng thái lập tức chuyển thành `Active` (Đang sử dụng xe), không cần qua bước duyệt hay chuẩn bị.
- **Đặt trước giữ xe (Free Booking)**: Admin có thể chọn **"Đặt Giữ Xe Ngay (Miễn Phí Admin)"**, đơn sẽ chuyển thẳng sang `Confirmed` (Đã duyệt), không cần bất kỳ bên thứ ba nào can thiệp.

### 9.2 Quy Trình Phê Duyệt Đơn Thuê Xe Khách Hàng (Customer Booking Lifecycle)
1. **Khách hàng tạo đơn**: Đơn đặt xe được khởi tạo ở trạng thái `Pending` (Chờ duyệt).
2. **Khách hàng thanh toán tiền**: Khách hàng thực hiện thanh toán online (Thẻ quốc tế / VNPay / MoMo). Sau khi tiền được trừ và giao dịch ghi nhận thành công, đơn đặt xe **VẪN Ở TRẠNG THÁI `Pending`** chờ Admin duyệt.
3. **Admin phê duyệt trong Dashboard**:
   - Admin mở modal **Admin Management** -> chuyển sang tab **Bookings**.
   - Admin nhìn thấy danh sách đơn hàng kèm huy hiệu trạng thái thanh toán (**Đã Thanh Toán** hoặc **Chưa Thanh Toán**).
   - Với đơn `Pending`, Admin bấm nút **"✓ Xác Nhận Duyệt Xe"** (`POST /bookings/{id}/confirm`).
   - Đơn chuyển sang `Confirmed` (Đã xác nhận), lúc này xe mới chính thức được giữ chỗ và sẵn sàng bàn giao cho khách!
   - Admin cũng có toàn quyền Từ chối (`Reject`), Giao xe (`Pickup`), Nhận xe (`Return`), Hoàn tất (`Complete`) hoặc Hủy (`Cancel`).

### 9.3 Idempotency (Chống Đặt Lặp / Double-Submission)
- **Tầng Redis Cache**: Áp dụng Header `Idempotency-Key` (ví dụ UUID). Kết quả phản hồi của request đầu tiên được mã hóa kèm SHA-256 hash của request body và lưu trên Redis Master với thời gian TTL 24 giờ.
- **Fast Replay**: Các request gửi lại cùng `Idempotency-Key` sẽ được đọc trực tiếp từ **Redis Replica** và trả về kết quả lưu trữ ngay lập tức mà không ghi lại database.
- **Database Fallback**: Bảng `IdempotencyRecords` trong database đảm bảo tính toàn vẹn dữ liệu ngay cả khi hệ thống cache khởi động lại.

### 9.4 Khóa Phân Tán (Redis Distributed Lock)
- **Phạm vi khóa (Lock Scope)**: `lock:vehicle:{vehicleId}`.
- **Cơ chế**: Sử dụng lệnh nguyên tử `SET NX PX` (thời gian sống TTL 15 giây). Chỉ 1 tiến trình duy nhất được quyền kiểm tra lịch trùng và tạo đơn cho xe đó tại một thời điểm, ngăn ngừa hoàn toàn tình trạng Race Condition (2 khách cùng book 1 xe cùng giờ).
- **Giải phóng an toàn bằng Lua Script**: Sử dụng script Lua để kiểm tra chủ sở hữu lock token trước khi `DEL`, tránh tình trạng giải phóng nhầm lock của request khác khi hết hạn thời gian chờ.
- **High Availability Fallback**: Tự động fallback về `SemaphoreSlim` nội bộ nếu Redis offline tạm thời.

### 9.5 Mô Hình Redis Phân Vùng Ngang (Sharding) & Sao Chép Dữ Liệu (Replication)
1. **Mô hình Master - Replica (Read/Write Split)**:
   - **Redis Master (Port 6379)**: Nhận toàn bộ lệnh ghi (Distributed Lock, Lưu Idempotency record).
   - **Redis Replica (Port 6380)**: Đồng bộ dữ liệu liên tục (`slaveof redis-master 6379`), phục vụ đọc nhanh cho các truy vấn kiểm tra Idempotency cache.
2. **Phân vùng dữ liệu theo Shard (Horizontal Sharding)**:
   - Dữ liệu được băm và định tuyến theo thuật toán `VehicleId % ShardCount`.
   - Node **Redis Shard 2 (Port 6381)** đảm nhận việc phân phối tải cho các xe có ID thuộc shard phụ, giúp mở rộng dung lượng bộ nhớ tuyến tính.
3. **Database Sharding Resolver**:
   - `DbShardResolver.cs` tự động phân tách chuỗi kết nối cơ sở dữ liệu dựa trên ID phương tiện, sẵn sàng cho việc mở rộng nhiều node database độc lập.
4. **Khởi Chạy Cụm Redis Bằng Docker Compose**:
   ```bash
   docker compose -f docker/docker-compose.redis-cluster.yml up -d
   ```
   Lệnh trên sẽ tự động khởi tạo:
   - `redis-master` (cổng 6379)
   - `redis-replica` (cổng 6380 - replica của master)
   - `redis-shard2` (cổng 6381 - shard phân vùng ngang độc lập)



