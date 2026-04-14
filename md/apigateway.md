Dưới đây là toàn bộ nội dung tài liệu hướng dẫn về API Gateway được định dạng chuẩn Markdown. Bạn có thể sao chép phần nội dung trong khung dưới đây để lưu thành file `.md`.

```markdown
# Hướng dẫn Kỹ thuật API Gateway - Hệ thống MiniBattle

Tài liệu này mô tả chi tiết kiến trúc, luồng hoạt động và mã nguồn của thành phần API Gateway trong dự án MiniBattle. Gateway này đóng vai trò là Reverse Proxy siêu nhẹ tự viết bằng Python.

## 1. Tổng quan Kiến trúc

API Gateway là điểm chạm duy nhất (Single Entry Point) cho toàn bộ các request từ phía Frontend (thông qua Nginx). Nó tiếp nhận, phân giải URL và định tuyến chính xác đến các microservices nội bộ (như User, Auth, Match, Game, Chat).

- **Framework:** FastAPI (Python 3.10)
- **Thư viện Proxy:** `httpx` (AsyncClient) giúp xử lý request bất đồng bộ (non-blocking).
- **Web Server:** Uvicorn (chạy trên cổng 8000).

## 2. Đặc tả Kỹ thuật & Logic Cốt lõi

### 2.1. Cấu hình Middleware (CORS)
Gateway mở hoàn toàn CORS để cho phép Client từ mọi origin (ví dụ: `localhost:3000`) có thể giao tiếp mà không bị trình duyệt chặn.
- `allow_origins=["*"]`
- `allow_methods=["*"]`
- `allow_headers=["*"]`

### 2.2. Khai báo Service Registry
Thay vì dùng Service Discovery động, hệ thống sử dụng một Dictionary (hardcode) để map (ánh xạ) tiền tố URL với địa chỉ của các container trong mạng Docker:
```python
services = {
    "users": "http://user-service:8000",
    "auth": "http://auth-service:8000",
    "match": "http://match-service:8000",
    "game": "http://game-service:8000",
    "notify": "http://notification-service:8000"
}
```

### 2.3. Cơ chế Dynamic Routing (Định tuyến Động)
Hệ thống sử dụng kỹ thuật "Catch-all route" của FastAPI để bắt mọi pattern URL:
`/{svc}/{path:path}`

**Luồng xử lý của 1 request:**
1. Trích xuất biến `svc` (ví dụ: `auth`) và `path` (ví dụ: `login`).
2. Kiểm tra `svc` có trong dictionary `services` không. Nếu không, trả về lỗi `{"error": "Unknown service"}`.
3. Nối chuỗi tạo URL đích: `http://auth-service:8000/login`.
4. Dùng `httpx.AsyncClient` để forward (chuyển tiếp) nguyên vẹn Method, Body và Headers từ request gốc đến URL đích.
5. Nhận kết quả và trả về Client dưới định dạng JSON.

## 3. Quy trình Triển khai (Deployment)

Dịch vụ được đóng gói bằng Docker và khởi chạy cùng hệ thống thông qua `docker-compose`.

**Dockerfile:**
Sử dụng `python:3.10-slim` để tối ưu dung lượng.
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY main.py .
RUN pip install fastapi uvicorn motor httpx PyJWT
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Docker Compose Integration:**
API Gateway phụ thuộc vào (`depends_on`) tất cả các dịch vụ con để đảm bảo nó chỉ sẵn sàng khi các dịch vụ phía sau đã chạy. Nginx từ Frontend sẽ trỏ `proxy_pass` trực tiếp vào Gateway này qua port `8000`.

## 4. Ưu điểm & Hạn chế

### Ưu điểm:
- Cực kỳ gọn nhẹ (dưới 40 dòng code).
- Hiệu năng cao nhờ xử lý I/O bất đồng bộ (async/await).
- Dễ hiểu, dễ tùy biến logic proxy (ví dụ: thêm auth token check vào giữa request).

### Cần cải thiện cho Production:
1. **Xử lý lỗi (Error Handling):** Cần bọc khối lệnh gọi `httpx` trong `try...except`. Hiện tại nếu service con bị sập, Gateway sẽ văng lỗi 500 thay vì xử lý êm đẹp trả về 502 Bad Gateway.
2. **Hỗ trợ định dạng file:** Lệnh `return res.json()` ép buộc kết quả trả về phải là JSON. Cần đổi sang trả về `Response` object của FastAPI để hỗ trợ tải file, ảnh.
3. **WebSockets:** Hệ thống proxy HTTP hiện tại không hỗ trợ chuyển tiếp giao thức `ws://` (WebSocket) dùng cho Chat Service.
```

---

### Hướng dẫn sử dụng file Markdown (.md)

File Markdown (`.md`) là một định dạng văn bản thuần túy có hỗ trợ các ký tự định dạng để hiển thị thành tiêu đề, danh sách, đoạn code một cách trực quan, rõ ràng.

**Cách 1: Lưu và xem trực tiếp trên máy tính của bạn**
1. Mở bất kỳ trình soạn thảo văn bản nào (Notepad trên Windows, TextEdit trên Mac, hoặc VS Code).
2. Sao chép toàn bộ nội dung trong khung code bên trên (bắt đầu từ `# Hướng dẫn Kỹ thuật...` đến hết phần `...dùng cho Chat Service.`).
3. Dán vào trình soạn thảo và chọn **Save As...** (Lưu file).
4. Đặt tên file là `api-gateway-docs.md` (lưu ý phần mở rộng bắt buộc phải là `.md`).
5. **Để xem định dạng đẹp (Preview):**
   - Nếu bạn dùng **VS Code**: Mở file `.md` đó lên, sau đó nhấn tổ hợp phím `Ctrl + Shift + V` (trên Windows) hoặc `Cmd + Shift + V` (trên Mac). Màn hình sẽ hiển thị tài liệu đã được định dạng màu sắc và font chữ rõ ràng.
   - Bạn cũng có thể tải các phần mềm chuyên đọc/viết Markdown như **Obsidian** hoặc **Typora** để mở file này.

**Cách 2: Sử dụng trong mã nguồn của bạn (GitLab/GitHub)**
1. Lưu file `.md` này vào thẳng thư mục chứa code `api-gateway` của dự án. Ví dụ đặt tên là `README.md`.
2. Commit và Push lên kho lưu trữ code (GitHub hoặc GitLab).
3. Khi bạn bè hoặc đồng nghiệp truy cập vào thư mục này trên nền tảng web (như GitLab của công ty), hệ thống sẽ tự động hiển thị file Markdown này thành một trang tài liệu rất chuyên nghiệp để mọi người dễ đọc.

**Cách 3: Chia sẻ cho nhóm**
- Bạn có thể gửi file `.md` này cho đồng nghiệp tham khảo để họ có thể hiểu cấu trúc của API Gateway, hoặc dùng làm tài liệu nền tảng khi các bạn có ý định viết lại một Gateway tương tự cho một project mới.