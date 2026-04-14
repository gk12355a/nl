# 🌊 NL - Real-time Flood Monitoring & Prediction System

Hệ thống giám sát và dự báo lũ lụt thời gian thực, được xây dựng theo kiến trúc **Microservices**.

## 📐 Kiến trúc tổng quan

```
Frontend (React + Vite)          :5173
       │
       ▼
API Gateway (FastAPI)            :8001  ◄── Port duy nhất Frontend gọi
       │
       ├──► Auth Service         :8007
       ├──► Account Service      :8006
       ├──► Report Service       :8002
       ├──► AI Service           :8004
       └──► Weather Service      :8005

WebSocket Gateway (FastAPI)      :8003  ◄── Frontend kết nối WS trực tiếp

Hạ tầng:
  MongoDB    :27017
  Redis      :6379
```

---

## ⚙️ Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu |
|---|---|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |
| MongoDB | 6.0+ |
| Redis | 7.0+ |

---

## 🗄️ BƯỚC 1 – Cài đặt MongoDB & Redis

### 1.1 MongoDB (Ubuntu/Linux)

```bash
# Chạy script cài đặt có sẵn
chmod +x mongodb.sh
sudo bash mongodb.sh
```

Script sẽ tự động:
- Cài MongoDB 6.0
- Bind IP theo máy chủ hiện tại
- Start & enable service

Kiểm tra MongoDB đang chạy:
```bash
mongosh --host 192.168.23.60 -u admin -p 123456 --authenticationDatabase admin
```

### 1.2 Redis (Ubuntu/Linux)

```bash
# Chạy script cài đặt có sẵn
chmod +x redis-install.sh
sudo bash redis-install.sh
```

Script sẽ tự động:
- Cài Redis
- Bind IP theo máy chủ
- Start & enable service

Kiểm tra Redis hoạt động:
```bash
redis-cli -h 192.168.23.60 ping
# Kết quả: PONG
```

---

## 🔐 BƯỚC 2 – Cấu hình biến môi trường

### 2.1 File `.env` (root project)

Tạo file `.env` tại thư mục gốc (`d:/Projects/nl/.env`):

```env
# URL các Microservices (dùng cho API Gateway proxy)
REPORT_SERVICE_URL=http://localhost:8002
WEBSOCKET_GATEWAY_URL=http://localhost:8003
AI_SERVICE_URL=http://localhost:8004
WEATHER_SERVICE_URL=http://localhost:8005
ACCOUNT_SERVICE_URL=http://localhost:8006
AUTH_SERVICE_URL=http://localhost:8007

# Database
MONGO_URI=mongodb://admin:123456@192.168.23.60:27017/?authSource=admin
MONGO_DB_NAME=nl_flood_db

# Cloudinary (để upload ảnh báo cáo)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Redis (Rate Limiting)
REDIS_URL=redis://192.168.23.60:6379/0

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,*
```

> ⚠️ **Lưu ý:** Tất cả services backend đều đọc file `.env` này từ thư mục gốc. Không cần tạo `.env` riêng lẻ cho từng service.

### 2.2 File `frontend/.env`

```env
VITE_AUTH_API_URL=http://localhost:8000/auth/api/v1/auth
VITE_ACCOUNT_API_URL=http://localhost:8000/account/api/v1/users
VITE_REPORT_API_URL=http://localhost:8000/report
VITE_WEATHER_API_URL=http://localhost:8000/weather
VITE_WS_URL=ws://localhost:8003/ws
```

---

## 🐍 BƯỚC 3 – Cài đặt & chạy Backend Services

Mỗi service là một FastAPI app độc lập. Chạy **từng service trong terminal riêng**.

> **Khuyến nghị:** Dùng `venv` riêng cho từng service, hoặc dùng chung `.venv` ở thư mục gốc.

### Tạo Virtual Environment dùng chung (từ thư mục gốc)

```bash
# Tạo venv
python -m venv .venv

# Kích hoạt (Windows)
.venv\Scripts\activate

# Kích hoạt (Linux/Mac)
source .venv/bin/activate
```

---

### 3.1 API Gateway — Port `8001`

```bash
cd backend/api-gateway
pip install -r requirements.txt
uvicorn main:app --port 8001 --reload
```

Kiểm tra: http://localhost:8001  
Swagger UI: http://localhost:8001/docs

---

### 3.2 Auth Service — Port `8007`

```bash
cd backend/auth-service
pip install -r requirements.txt
uvicorn main:app --port 8007 --reload
```

Kiểm tra: http://localhost:8007  
Swagger UI: http://localhost:8007/docs

---

### 3.3 Account Service — Port `8006`

```bash
cd backend/account-service
pip install -r requirements.txt
uvicorn main:app --port 8006 --reload
```

Kiểm tra: http://localhost:8006  
Swagger UI: http://localhost:8006/docs

---

### 3.4 Report Service — Port `8002`

```bash
cd backend/report-service
pip install -r requirements.txt
uvicorn main:app --port 8002 --reload
```

Kiểm tra: http://localhost:8002  
Swagger UI: http://localhost:8002/docs

> **Ghi chú:** Service này tự động tạo geo index `2dsphere` cho MongoDB khi khởi động.

---

### 3.5 AI Service — Port `8004`

```bash
cd backend/ai-service
pip install -r requirements.txt
uvicorn main:app --port 8004 --reload
```

Kiểm tra: http://localhost:8004  
Swagger UI: http://localhost:8004/docs

---

### 3.6 Weather Service — Port `8005`

```bash
cd backend/weather-service
pip install -r requirements.txt
uvicorn main:app --port 8005 --reload
```

Kiểm tra: http://localhost:8005  
Swagger UI: http://localhost:8005/docs

---

### 3.7 WebSocket Gateway — Port `8003`

```bash
cd backend/websocket-gateway
pip install -r requirements.txt
uvicorn main:app --port 8003 --reload
```

Kiểm tra: http://localhost:8003

---

## ⚛️ BƯỚC 4 – Cài đặt & chạy Frontend

```bash
cd frontend

# Cài dependencies
npm install

# Chạy dev server
npm run dev
```

Frontend chạy tại: **http://localhost:5173**

### Build production

```bash
cd frontend
npm run build
npm run preview
```

---

## 🧪 Kiểm tra hệ thống hoạt động

Sau khi đã start tất cả services, kiểm tra theo thứ tự:

```
1. MongoDB     → mongosh hoặc MongoDB Compass
2. Redis       → redis-cli ping → PONG
3. Auth        → GET http://localhost:8007
4. Account     → GET http://localhost:8006
5. Report      → GET http://localhost:8002/test-db
6. AI          → GET http://localhost:8004
7. Weather     → GET http://localhost:8005
8. WS Gateway  → GET http://localhost:8003
9. API Gateway → GET http://localhost:8001
10. Frontend   → http://localhost:5173
```

---

## 📁 Cấu trúc thư mục

```
nl/
├── .env                        # Biến môi trường toàn hệ thống
├── mongodb.sh                  # Script cài MongoDB (Ubuntu)
├── redis-install.sh            # Script cài Redis (Ubuntu)
│
├── backend/
│   ├── common/                 # Code dùng chung (MongoDB connection...)
│   ├── api-gateway/            # Cổng vào duy nhất, port 8001
│   ├── auth-service/           # Đăng nhập, JWT, port 8007
│   ├── account-service/        # Quản lý người dùng, port 8006
│   ├── report-service/         # Báo cáo lũ lụt + Cloudinary, port 8002
│   ├── ai-service/             # AI validate ảnh, port 8004
│   ├── weather-service/        # Thời tiết, dự báo, port 8005
│   └── websocket-gateway/      # Real-time broadcast, port 8003
│
├── frontend/                   # React + Vite + TailwindCSS
│   ├── .env                    # Biến môi trường frontend
│   └── src/
│       ├── config/env.js       # Cấu hình API URL
│       └── components/
│
├── k8s/                        # Kubernetes manifests
├── ci-cd/                      # Jenkins / CI pipeline
└── md/                         # Tài liệu thiết kế, todo
```

---

## 🗺️ API Routes qua Gateway

Tất cả request từ frontend đi qua `API Gateway (:8001)` với format:

```
http://localhost:8001/{service}/{path}
```

| Service | Prefix | Ví dụ |
|---|---|---|
| Auth | `/auth` | `POST /auth/api/v1/auth/login` |
| Account | `/account` | `GET /account/api/v1/users/me` |
| Report | `/report` | `POST /report/reports` |
| Weather | `/weather` | `GET /weather/forecast` |
| AI | `/ai` | `POST /ai/validate` |

> **Rate Limit:** 100 requests / 60 giây / IP (bảo vệ bởi Redis)

---

## 🔧 Lỗi thường gặp

### ❌ `REDIS_URL` not found / Redis connection failed
- Đảm bảo Redis đang chạy và `REDIS_URL` trong `.env` đúng IP/port
- Thử: `redis-cli -h <IP> ping`

### ❌ MongoDB connection error
- Kiểm tra `MONGO_URI` trong `.env` đúng user, password, IP
- Thử: `mongosh "mongodb://admin:123456@IP:27017/?authSource=admin"`

### ❌ CORS error ở Frontend
- Đảm bảo `CORS_ORIGINS` trong `.env` chứa `http://localhost:5173`
- Hoặc giữ `*` trong môi trường dev

### ❌ Service không nhận `.env`
- File `.env` phải nằm ở **thư mục gốc** `d:/Projects/nl/.env`
- Mỗi service đọc `.env` qua path tương đối `../../.env`

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, TailwindCSS 4, Leaflet |
| Backend | FastAPI, Uvicorn, Python 3.10+ |
| Database | MongoDB 6 (Motor async driver) |
| Cache / Rate Limit | Redis + fastapi-limiter |
| Image Upload | Cloudinary |
| Real-time | WebSocket (FastAPI native) |
| Auth | JWT |
| Container (tuỳ chọn) | Docker, Kubernetes |
