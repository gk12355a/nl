Dưới đây là **PRD (Product Requirement Document)** hoàn chỉnh cho hệ thống của bạn — được tổng hợp từ toàn bộ các quyết định đã chốt 👇

---

# 📄 PRODUCT REQUIREMENT DOCUMENT (PRD)

# 🌊 1. Project Overview

## 🎯 Tên dự án

**NL – Real-time Flood Monitoring & Prediction System**

## 📌 Mục tiêu

Xây dựng một nền tảng web cho phép:

* Hiển thị **bản đồ ngập lụt theo thời gian thực**
* Thu thập dữ liệu từ **người dùng (crowdsourcing)**
* Dự báo nguy cơ ngập dựa trên **dữ liệu thời tiết**
* Cung cấp thông tin giúp người dùng:

  * Tránh khu vực ngập
  * Lên kế hoạch di chuyển an toàn

## 👥 Đối tượng người dùng

* Người dân
* Tài xế (Grab, shipper, logistics)
* Admin (quản trị hệ thống)

---

# ⚙️ 2. Core Requirements

## Functional Requirements

### 1. Real-time Flood Reporting

* User có thể:

  * Gửi báo cáo ngập
  * Upload ảnh (bắt buộc)
  * Chọn mức độ ngập
  * Thêm mô tả

### 2. Flood Map Visualization

* Hiển thị:

  * Marker (điểm ngập)
  * Heatmap (mức độ ngập tổng hợp)

### 3. Real-time Update

* Sử dụng WebSocket
* Update theo:

  * Viewport
  * Radius (10km)

### 4. Data Validation

* Trust score user
* Voting (crowd confirmation)
* AI validation (image)
* Admin moderation

### 5. Flood Prediction

* Dữ liệu từ API thời tiết
* Rule-based (MVP)
* ML-based (future)

---

## Non-functional Requirements

* High availability (Kubernetes)
* Scalable (microservices)
* Low latency (real-time updates)
* Secure (rate limit + auth)
* Observable (monitoring + logging)

---

# 🚀 3. Core Features

## 📍 1. Report Flood

* Input:

  * GPS (auto)
  * Image (required)
  * Flood level:

    * Nhẹ (≤10cm)
    * Trung bình (10–30cm)
    * Nặng (>30cm)
  * Description
  * reported_at (user)
  * created_at (server)

---

## 🗺 2. Map Visualization

* Marker:

  * Red / Yellow / Green
* Heatmap:

  * Density-based visualization

---

## ⚡ 3. Real-time Updates

* WebSocket push
* Geo filtering:

  * Viewport-based
  * Radius-based (10km)

---

## 🧠 4. Data Validation System

* Trust-based scoring
* Voting system
* AI image validation
* Admin moderation

---

## 🌦 5. Flood Prediction

* Weather API integration
* Rule-based detection:

  * Rain threshold
  * Tide level
* ML upgrade (future)

---

## 🔐 6. Authentication & Security

* Email/password
* Social login
* Anonymous access
* Rate limiting:

  * IP
  * User
  * Device

---

# 🧩 4. Core Components

## 🧱 Microservices Architecture

### 1. API Gateway

* Request routing
* Proxy đến services

### 2. User Service

* Authentication
* User profile
* Trust score

### 3. Report Service

* CRUD report
* Geo queries
* Voting
* Aggregation

### 4. AI Service

* Image validation (flood detection)

### 5. Weather Service

* Fetch weather API
* Rule-based prediction

### 6. WebSocket Gateway

* Manage real-time connections
* Geo filtering
* Push updates

---

## 🗄 Data Layer

* MongoDB (GeoJSON)
* Redis:

  * Cache
  * Rate limit
  * WebSocket scaling

---

## ☁️ External Services

* Cloudinary (image storage + CDN)
* Weather API (OpenWeather)

---

# 🔄 5. App / User Flow

## 📌 Flow 1: Submit Report

1. User upload ảnh → Cloudinary
2. Submit report → API Gateway
3. → Report Service
4. → AI Service (validate ảnh)
5. Update:

   * status
   * trust score
6. → WebSocket Gateway
7. Push đến user khác

---

## 📌 Flow 2: Real-time Map

1. User mở app
2. Client gửi:

   * viewport
   * location
3. WebSocket Gateway:

   * Query MongoDB
   * Filter theo geo
4. Push:

   * Marker
   * Heatmap

---

## 📌 Flow 3: Prediction

1. Weather Service gọi API
2. Apply rule-based logic
3. Generate risk zones
4. Frontend hiển thị overlay

---

# 🧪 6. Tech Stack

## 🔹 Backend

* Python
* FastAPI (async)

## 🔹 Frontend

* React / Vue (TBD)

## 🔹 Database

* MongoDB (GeoJSON)
* Redis

## 🔹 Real-time

* WebSocket (FastAPI / Socket.io)

## 🔹 AI

* Python (FastAPI)
* Model:

  * Classification (MVP)
  * Depth estimation (future)

## 🔹 Storage

* Cloudinary

## 🔹 Infrastructure

* Docker
* Kubernetes (kubeadm)

## 🔹 CI/CD

* Jenkins
* Docker Registry

## 🔹 Monitoring

* Prometheus + Grafana

## 🔹 Logging

* EFK (Elasticsearch + Fluentd + Kibana)

---

# 🛠 7. Implementation Plan

## 🚀 Phase 1: MVP (4–6 tuần)

### Backend

* Setup FastAPI services
* API Gateway
* Report Service
* User Service

### Frontend

* Map UI (Google Maps / Leaflet)
* Submit report

### Data

* MongoDB + Geo index

### Real-time

* WebSocket basic

---

## 🚀 Phase 2: Validation + Scaling

* AI Service (image classification)
* Voting system
* Trust score
* Redis integration
* Rate limiting

---

## 🚀 Phase 3: Prediction

* Weather API integration
* Rule-based prediction
* Overlay visualization

---

## 🚀 Phase 4: Production-ready

* Kubernetes deployment
* CI/CD pipeline
* Monitoring + logging

---

## 🚀 Phase 5: Advanced (Future)

* ML flood prediction
* Advanced AI (depth estimation)
* Route optimization (avoid flood)

---

# 🔥 Tổng kết

Hệ thống của bạn là một:

> **Real-time, geo-distributed, AI-assisted, microservices-based platform**

Điểm mạnh:

* Real-world impact
* Scalable architecture
* DevOps-ready
* AI integration

---

👉 Nếu bạn muốn bước tiếp:

* Mình có thể convert PRD này → **SRS / System Design Interview Answer**
* Hoặc build **diagram (Mermaid cực đẹp)** cho bạn
