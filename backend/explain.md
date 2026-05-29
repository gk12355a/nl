# 🏛️ Tài liệu Kiến trúc & Các tính năng của Hệ thống Backend (Microservices)

Hệ thống **NL - Real-time Flood Monitoring & Prediction System** được xây dựng theo kiến trúc **Microservices** hiện đại, sử dụng **FastAPI** (Python) làm framework chủ đạo cho các dịch vụ. Hệ thống được thiết kế để xử lý dữ liệu thời gian thực, lưu trữ dữ liệu không gian lớn và tích hợp Trí tuệ nhân tạo (AI) để xác minh dữ liệu cộng đồng.

Dưới đây là mô tả chi tiết các tính năng, nhiệm vụ và công nghệ của từng dịch vụ nằm trong thư mục `backend/`.

---

## 🗺️ Bản đồ các Service & Cổng kết nối (Ports)

```
                       Frontend (React + Vite)
                                 │
         ┌───────────────────────┴───────────────────────┐
         │ (HTTP Calls)                                  │ (WebSocket)
         ▼                                               ▼
   API Gateway (:8001)                          WebSocket Gateway (:8003)
         │                                               ▲
         ├─► Auth Service (:8007)                        │ (Internal Broadcast)
         ├─► Account Service (:8006)                     │
         ├─► Report Service (:8002) ─────────────────────┘
         │        │ (Async Task)
         │        └─► AI Service (:8004)
         └─► Weather Service (:8005)
```

---

## 📑 Chi tiết Từng Dịch vụ (Microservices)

### 1. API Gateway Service (`backend/api-gateway/` — Port `8001`)
*   **Mô tả:** Cổng vào duy nhất dành cho các yêu cầu HTTP từ Frontend. Nó chịu trách nhiệm định tuyến, bảo mật và kiểm soát lưu lượng truy cập toàn hệ thống.
*   **Tính năng chính:**
    *   **Proxy Định tuyến (Routing Proxy):** Ánh xạ mọi request qua endpoint động `/{service_name}/{path:path}` để trung chuyển các yêu cầu từ Frontend tới đúng microservice đích (`report`, `weather`, `ai`, `account`, `auth`).
    *   **Giới hạn Tần suất (Rate Limiting):** Sử dụng thư viện `fastapi-limiter` kết hợp với Redis để giới hạn mỗi địa chỉ IP chỉ được thực hiện tối đa **100 requests / 60 giây**, giúp ngăn chặn tấn công từ chối dịch vụ (DDoS) hoặc spam API.
    *   **Cấu hình CORS tập trung:** Cho phép Frontend truy cập tài nguyên từ các nguồn được định cấu hình trước một cách an toàn.
    *   **Tối ưu hóa kết nối:** Khởi tạo một `httpx.AsyncClient` dùng chung (connection pool) trong suốt vòng đời của Gateway để tối ưu hiệu năng mạng khi chuyển tiếp requests.

### 2. Auth Service (`backend/auth-service/` — Port `8007`)
*   **Mô tả:** Chịu trách nhiệm quản lý quy trình đăng nhập, đăng xuất và khôi phục mật khẩu của người dùng.
*   **Tính năng chính:**
    *   **Đăng nhập (Login):** Tiếp nhận thông tin email & mật khẩu, đối sánh mật khẩu đã được băm trong MongoDB.
    *   **Đăng xuất (Logout):** Tiếp nhận token hiện tại và xóa phiên làm việc tương ứng khỏi Redis ngay lập tức.
    *   **Quản lý phiên làm việc (Session Management):** Khi đăng nhập thành công, tạo một `session_token` ngẫu nhiên dưới dạng UUIDv4, lưu trữ vào Redis với thời gian hết hạn (TTL) là **24 giờ (86400 giây)** để gán mã token với `user_id`.
    *   **Quên & Đặt lại mật khẩu (Forgot & Reset Password):**
        *   Khi yêu cầu quên mật khẩu, sinh ra một mã khôi phục ngẫu nhiên (`reset_token` thông qua thư viện `secrets` bảo mật cao) có thời hạn 15 phút, lưu vào Redis dạng `pwd_reset:{reset_token}`. (Trong chế độ Dev, token được trả về trực tiếp trong API response để thuận tiện cho việc kiểm thử).
        *   Khi đặt lại mật khẩu, hệ thống xác minh tính hợp lệ của mã khôi phục từ Redis, tiến hành cập nhật mật khẩu đã băm mới vào MongoDB và thu hồi mã token ngay lập tức.

### 3. Account Service (`backend/account-service/` — Port `8006`)
*   **Mô tả:** Chịu trách nhiệm quản lý hồ sơ người dùng cá nhân và các thông tin định danh tài khoản.
*   **Tính năng chính:**
    *   **Đăng ký tài khoản (Register):** Tạo tài khoản mới trong cơ sở dữ liệu. Hệ thống tự động tạo **Unique Indexes** trên MongoDB cho các trường `email` và `username` để đảm bảo tính duy nhất và tăng tốc độ tìm kiếm.
    *   **Lấy thông tin cá nhân hiện tại (`/users/me`):** Trích xuất token từ Header Authorization, kiểm tra session trong Redis để tìm ra `user_id`, sau đó truy vấn hồ sơ đầy đủ từ MongoDB trả về cho Frontend.
    *   **Truy vấn thông tin người dùng khác:** Hỗ trợ API `/users/{user_id}` để các dịch vụ khác (như Report Service khi cần hiển thị tên người báo cáo) có thể tìm kiếm hồ sơ theo ID.
    *   **Giám sát sức khỏe kết nối (Health Check):** Cung cấp API `/health` để tự động ping kiểm tra trạng thái hoạt động của cả cơ sở dữ liệu MongoDB và bộ nhớ đệm Redis, giúp hệ thống CI/CD hoặc Kubernetes theo dõi trạng thái sống sót (Liveness/Readiness probe).

### 4. Report Service (`backend/report-service/` — Port `8002`)
*   **Mô tả:** Dịch vụ cốt lõi quản lý thông tin về các điểm ngập lụt và vùng ngập lụt được báo cáo bởi cộng đồng (Crowdsourcing).
*   **Tính năng chính:**
    *   **Tạo báo cáo ngập lụt (Create Report):** Tiếp nhận thông tin báo cáo gồm tọa độ địa lý, mô tả thực tế, mức độ ngập và URL hình ảnh bằng chứng (ảnh được tải lên Cloudinary thông qua API bổ trợ `/reports/upload`).
    *   **Truy vấn vị trí không gian (Spatial Query):** Cho phép tìm kiếm các điểm ngập xung quanh tọa độ địa lý chỉ định trong bán kính $X$ km bằng toán tử `$near` của MongoDB (sử dụng Geo Index `2dsphere` được tự động khởi tạo khi khởi chạy service).
    *   **Xác thực hình ảnh tự động qua AI:** Ngay sau khi lưu báo cáo thành công, một tác vụ nền bất đồng bộ (FastAPI Background Task) được kích hoạt để gọi tới **AI Service** kiểm định hình ảnh. Kết quả AI trả về sẽ tự động cập nhật trạng thái báo cáo (`status` thành `verified` hoặc `rejected`) và thay đổi điểm tin cậy tương ứng.
    *   **Hệ thống Bỏ phiếu & Chuyển đổi Trạng thái từ Cộng đồng:**
        *   Cho phép người dùng Upvote (Xác nhận ngập) hoặc Downvote (Bác bỏ báo cáo giả).
        *   Mỗi lượt Upvote cộng **+20 điểm** vào điểm tin cậy (`trust_score`). Khi điểm đạt $\ge 20.0$, trạng thái tự chuyển sang `verified` (Xác thực).
        *   Mỗi lượt Downvote trừ **-10 điểm** khỏi `trust_score`. Khi điểm rơi xuống $\le -10.0$, trạng thái chuyển thành `rejected` (Bác bỏ).
    *   **Phát sóng Thời gian thực (Real-time Broadcast):** Đồng bộ hóa các báo cáo mới hoặc cập nhật trạng thái trực tiếp tới **WebSocket Gateway** để lập tức thông báo đến bản đồ của toàn bộ người dùng đang trực tuyến.

### 5. AI Service (`backend/ai-service/` — Port `8004`)
*   **Mô tả:** Dịch vụ trí tuệ nhân tạo độc lập chuyên duyệt hình ảnh hiện trường để phát hiện ngập nước và phân loại độ tin cậy của thông tin.
*   **Tính năng chính:**
    *   **Tải & Xử lý ảnh bất đồng bộ:** Nhận URL ảnh từ Report Service, tải ảnh về bộ nhớ và chuẩn hóa định dạng ảnh RGB qua thư viện PIL.
    *   **Phân loại ảnh bằng Học sâu (Deep Learning):** Tích hợp mô hình học sâu **ResNet-50** tiền huấn luyện (`microsoft/resnet-50` từ HuggingFace Transformers & PyTorch) để phân tích các vật thể và cảnh quan trong ảnh.
    *   **Thuật toán phát hiện ngập dựa trên nhãn ảnh (Water Keyword Mapping):**
        *   Lấy ra Top 3 nhãn dự đoán có xác suất cao nhất.
        *   Đối sánh nhãn với danh sách các từ khóa tiếng Anh liên quan đến nước/ngập lụt: `water`, `river`, `lake`, `puddle`, `flood`, `seashore`, `dam`, `fountain`, `valley`.
        *   Nếu khớp nhãn và có độ tin cậy tương ứng $> 70\%$, dịch vụ xác định ảnh là cảnh ngập lụt thực tế (`is_flood=True`).

### 6. Weather Service (`backend/weather-service/` — Port `8005`)
*   **Mô tả:** Cung cấp thông tin thời tiết thời gian thực và đưa ra các cảnh báo, dự báo nguy cơ ngập lụt tại các tọa độ địa điểm cụ thể.
*   **Tính năng chính:**
    *   **Thu thập thông tin thời tiết thực:** Tích hợp với dịch vụ **OpenWeather API** để lấy nhiệt độ và lượng mưa trong vòng 1 giờ qua (`rain_1h_mm`). Dịch vụ tự động chuyển sang cơ chế giả lập dữ liệu (Mock data) nếu thiếu API Key để đảm bảo hệ thống không bị gián đoạn.
    *   **Thuật toán dự báo nguy cơ lũ lụt (Rule-Based Algorithm):** Kết hợp hai luồng thông tin: lượng mưa thực tế (từ OpenWeather) và số lượng điểm ngập đang hoạt động xung quanh địa điểm đó trong bán kính 5km (truy vấn từ `report-service`).
        *   🔴 **High (Cao):** Lượng mưa $> 30\text{ mm/h}$ hoặc có trên 5 điểm ngập xung quanh.
        *   🟡 **Medium (Trung bình):** Lượng mưa từ $15 - 30\text{ mm/h}$ hoặc có từ 3 đến 5 điểm ngập xung quanh.
        *   🟢 **Low (Thấp):** Không thỏa mãn các điều kiện trên (thời tiết ổn định).

### 7. WebSocket Gateway (`backend/websocket-gateway/` — Port `8003`)
*   **Mô tả:** Dịch vụ cổng kết nối hai chiều (Full-Duplex) thời gian thực sử dụng giao thức WebSocket để truyền tải các sự kiện lập tức tới khách hàng.
*   **Tính năng chính:**
    *   **Quản lý kết nối tập trung (Connection Manager):** Tiếp nhận kết nối và quản lý danh sách các clients đang trực tuyến. Tự động dọn dẹp các kết nối bị ngắt đột ngột (do rớt mạng, tắt trình duyệt) để tránh rò rỉ bộ nhớ.
    *   **Phát sóng thông tin thời gian thực (Broadcasting):** Cung cấp API nội bộ `/broadcast` để các microservice khác gọi vào. Khi nhận được yêu cầu phát sóng (ví dụ từ Report Service khi có điểm ngập mới), WebSocket Gateway sẽ lập tức gửi dữ liệu định dạng JSON tới toàn bộ trình duyệt đang kết nối để cập nhật bản đồ thời gian thực.

### 8. Common Component (`backend/common/`)
*   **Mô tả:** Thư viện chứa các đoạn mã nguồn và tiện ích được chia sẻ chung giữa tất cả các microservices để tuân thủ nguyên tắc DRY (Don't Repeat Yourself).
*   **Tính năng chính:**
    *   **Quản lý kết nối MongoDB tập trung (`common/database/mongo.py`):** Triển khai kết nối cơ sở dữ liệu MongoDB theo mô hình **Singleton Pattern** thông qua thư viện bất đồng bộ `motor`. Cung cấp khả năng tự động thiết lập và dọn dẹp các tài nguyên kết nối khi FastAPI khởi động hoặc dừng (FastAPI Lifespan Management).
    *   **Tiện ích phiên làm việc Redis (`common/redis_utils`):** Cung cấp các hàm tạo phiên, truy vấn phiên đăng nhập từ session token và xóa phiên làm việc thống nhất trên toàn hệ thống.
