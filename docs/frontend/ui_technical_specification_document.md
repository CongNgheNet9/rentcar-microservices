# TÀI LIỆU ĐẶC TẢ KỸ THUẬT GIAO DIỆN (UI/UX SPECIFICATION)

## 1. Giới thiệu chung & Hướng dẫn phân rã Component
Tài liệu này chuẩn hóa cấu trúc thiết kế của 2 màn hình chính trong hệ thống cho thuê xe:
* **Trang chủ (Home Page):** Giao diện Dark Theme sang trọng, tập trung vào thương hiệu và trưng bày sản phẩm.
* **Trang chi tiết (Detail Page):** Giao diện Light Theme dạng Dashboard hiện đại, tích hợp trợ lý AI và các tiện ích cấu hình xe.

### Có cần tách ảnh phân tích từng phần component không?
**CÓ.** Việc phân rã (dissect/slice) hình ảnh thành các component nhỏ độc lập là **cực kỳ cần thiết** trước khi đưa cho AI Agent triển khai vì những lý do sau:
1. **Tránh sót chi tiết nhỏ:** Các trạng thái (Hover, Active, Disabled), icon, khoảng cách (Spacing/Padding) thường bị bỏ qua nếu nhìn toàn cảnh.
2. **Tái sử dụng code (Reusability):** Tách nhỏ giúp xây dựng các UI Component chuẩn (Atomic Design), dễ quản lý và dễ bảo trì.
3. **Độ chính xác cao (Pixel-Perfect):** Giúp AI Agent hiểu rõ cấu trúc DOM lồng nhau (Parent-Child hierarchy) của từng khối.

---

## PHẦN 2: TRANG CHỦ (HOME PAGE - RIDELUX)
* **Chủ đề:** Nền tảng xe siêu sang ( Car Rental).
* **Màu nền chủ đạo:** Đen tuyền (`#0B0B0B`) kết hợp điểm nhấn màu vàng đồng (`#DFB15B`).

### Cấu trúc Component Chi tiết:

#### 1. Header Component (`<NavigationHeader />`)
* **Bố cục:** Cố định ở trên cùng (Sticky/Fixed top), hiệu ứng nền mờ (Blur effect).
* **Thành phần con:**
  * **Logo:** Biểu tượng chữ 'R' cách điệu + Chữ **RIDELUX** (Trắng, chữ R màu vàng đồng).
  * **Nav Links:** Danh sách liên kết: `Home`, `Cars`, `Destinations`, `Experiences`, `About`. Trạng thái hover đổi sang màu vàng đồng.
  * **Action Area:** Nút tìm kiếm (Search icon) + Nút kêu gọi hành động **"Rent a Car →"** dạng hình viên thuốc (Pill shape), nền vàng đồng, chữ đen.

#### 2. Hero Section Component (`<HeroSection />`)
* **Bố cục:** Chia 2 cột (Cột trái: Nội dung chữ & CTA; Cột phải: Hình ảnh trưng bày).
* **Nội dung trái:**
  * Subtitle: `CAR RENTAL` (Chữ hoa, khoảng cách chữ rộng).
  * Main Title (H1): *"Unforgettable Drives Await"* (Từ "Await" đổi màu vàng đồng).
  * Đoạn mô tả (Paragraph): Giới thiệu ngắn gọn dịch vụ thuê xe toàn cầu.
  * Nhóm nút bấm (Button Group):
    * Nút chính: *"Browse Cars →"* (Nền vàng đồng).
    * Nút phụ: *"▶ Watch Video"* (Viền trong suốt, bo tròn).
* **Nội dung phải:** Khối hình ảnh chiếc Lamborghini màu vàng kim trong không gian showroom sang trọng, có tích hợp nút điều hướng ảnh ở góc dưới.

#### 3. Stats Bar Component (`<StatsBar />`)
* **Bố cục:** Hàng ngang chia thành 4 cột thống kê:
  1. `200+` -  Vehicles
  2. `50+` - Global Locations
  3. `10K+` - Happy Customers
  4. `4.9` - Average Rating (kèm cụm avatar khách hàng nhỏ và mũi tên điều hướng).

#### 4. Brand Logos Component (`<BrandPartners />`)
* **Bố cục:** Dải logo các thương hiệu đối tác (Lamborghini, Ferrari, Porsche, McLaren, Aston Martin, Bentley, Rolls-Royce) hiển thị đơn sắc, tinh tế.

#### 5. Car Showcase Component (`<CarShowcase />`)
* **Header phần:**
  * Subtitle: `OUR CARS`
  * Tiêu đề: `Choose Your Dream Car` (nhấn mạnh cụm "Dream Car").
  * Link điều hướng: *"View All Cars →"*.
* **Filter Tabs Component:** Dải nút lọc dạng pill: `[All Cars]` (đang active, nền vàng), `[Supercars]`, `[SUVs]`, `[Sedans]`, `[Convertibles]` (nền tối).
* **Car Card Component (Lặp danh sách xe):**
  * **Trạng thái:** Nền thẻ màu tối (`#141414`), bo góc mềm mại.
  * **Bên trong thẻ:**
    * Góc trên phải: Icon Trái tim (Yêu thích/Favorite).
    * Hình ảnh xe hiển thị ngang sắc nét.
    * Tên xe (VD: *Lamborghini Huracán*, *Ferrari SF90 Stradale*, *Rolls-Royce Cullinan*).
    * Giá thuê: VD: `$1,299 / day`.
    * Góc dưới phải: Nút mũi tên chuyển hướng (`→`) nằm trong vòng tròn nhỏ.

---

## PHẦN 3: TRANG CHI TIẾT (DETAIL PAGE - VOLVO EX30)
* **Chủ đề:** Cấu hình và chi tiết xe điện kết hợp bảng điều khiển thông minh.
* **Màu nền chủ đạo:** Xám sáng (`#EBECEE`), các card thành phần nổi bật màu trắng (`#FFFFFF`).

### Cấu trúc Component Chi tiết:

#### 1. Detail Header Component (`<DetailHeader />`)
* **Left:** Biểu tượng logo chữ `Q` độc đáo.
* **Center:** Bộ chọn chế độ dạng nhóm tab nổi: `[Rent]` (đang active), `[Buy]`, `[Sell]`.
* **Right:** Thông tin vị trí người dùng (`📍 Your Location: Los Angeles`) kèm biểu tượng cài đặt.

#### 2. Left Toolbar Component (`<QuickToolbars />`)
* Dải công cụ dọc bên trái màn hình chứa các nút chức năng nhanh (Profile user, Hộp số/Cấu hình, Sạc pin).

#### 3. Main Vehicle Viewer Component (`<VehicleDisplay />`)
* Nút quay lại (`←`).
* Tên xe lớn: **Volvo EX30** kèm phụ đề `Fully electric crossover`.
* Thẻ trạng thái kỹ thuật: `[L] R F B` (với ký tự `L` nổi bật bằng màu xanh lá chủ đạo).
* Hình ảnh xe chính: Xe SUV điện Volvo EX30 màu xám bạc đặt ở trung tâm.

#### 4. AI Assistant Floating Widget Component (`<AIAssistantWidget />`)
* **Khung chứa chính:** Card nổi bật với hiệu ứng kính mờ (Backdrop blur) và bo góc lớn.
* **Header:** Tiêu đề `AI Assistant` - *"How can I help you?"* + Nút đóng (`✕`).
* **Quick Prompt Cards Grid (Lưới 2x2):**
  1. `Book a rent` (5 min)
  2. `Analysis` (Damages)
  3. `Insurance` (Pick a Plan)
  4. `Payment` (Calculate)
* **Input Box Component:**
  * Văn bản gợi ý: *"Arrange to rent this car for 8am"* (có hiệu ứng con nhấp nháy xanh lá).
  * Toolbar trong input: Icon Micro, Icon Đính kèm, Icon Cài đặt và nút **Gửi (Send)** màu xanh lá có biểu tượng máy bay giấy.

#### 5. Bottom Dashboard Cards Component (Lưới thẻ thông tin bổ trợ)
* **Card 1: My Location Widget**
  * Hiển thị tiêu đề, địa điểm (`Vermont Square, Los Angeles`), bản đồ thu nhỏ kèm ghim vị trí xanh lá (`📍`) và nút mở rộng khung nhìn.
* **Card 2: My Dates Widget**
  * Hiển thị thời gian (`20th of July · 10:25 AM`).
  * Bộ chọn ngày/giờ trực quan với mũi tên điều hướng ngày tháng (`< 20 Jul >`) và đồng hồ hiển thị giờ.
* **Card 3: Payment Method Widget**
  * Hiển thị phương thức thanh toán (`Credit Card`), số thẻ ẩn (`3451 **** **** 7896`) và nút radio lựa chọn đã kích hoạt (màu xanh lá).