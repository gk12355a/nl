Chuẩn 🔥 — chọn **FastAPI** là “perfect fit” cho hệ thống của bạn.

Giờ mình sẽ đi sâu vào **thiết kế backend thực chiến**: structure + DB schema + API spec (đủ để bạn code luôn).

---

# 🧱 1. SERVICE STRUCTURE (Microservices với FastAPI)

Bạn sẽ có các service như sau:

### 🔹 1. user-service

* Auth (JWT)
* Social login
* Trust score

### 🔹 2. report-service ⭐ (core)

* Nhận report
* Geo query
* Voting
* Aggregation (heatmap)

### 🔹 3. ai-service

* Validate ảnh (flood / non-flood)

### 🔹 4. weather-service

* Call API + cache
* Rule-based prediction

### 🔹 5. websocket-gateway

* Manage connection
* Geo filtering (viewport + radius)

---

# 📦 2. FOLDER STRUCTURE (chuẩn production)
NL/
├── frontend/                  # FE app (React/Vue)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── Dockerfile

├── backend/
│   ├── api-gateway/           # Gateway (FastAPI proxy)
│   ├── user-service/
│   ├── report-service/
│   ├── ai-service/
│   ├── weather-service/
│   ├── websocket-gateway/

│   ├── common/                # Shared code (utils, config, libs)
│   │   ├── config/
│   │   ├── database/
│   │   ├── utils/
│   │   └── security/

│   ├── docker-compose.yml     # Dev local
│   └── requirements.txt       # (optional shared)

├── k8s/                       # Kubernetes manifests
│   ├── base/
│   ├── overlays/
│   │   ├── dev/
│   │   └── prod/

├── ci-cd/
│   ├── Jenkinsfile
│   └── scripts/

├── .env
├── .gitignore
└── README.md

---

# 🧠 3. DATABASE SCHEMA (MongoDB - GeoJSON)

## 📌 collection: `reports`

```json
{
  "_id": "ObjectId",

  "user_id": "string | null", 
  "is_anonymous": true,

  "location": {
    "type": "Point",
    "coordinates": [105.85, 21.03] 
  },

  "image_url": "string",

  "flood_level": "low | medium | high",

  "description": "string",

  "reported_at": "datetime",
  "created_at": "datetime",

  "ai_validated": true,
  "ai_confidence": 0.92,

  "trust_score": 0.8,

  "status": "pending | verified | rejected",

  "votes": {
    "up": 10,
    "down": 2
  }
}
```

---

## 📌 Index cực kỳ quan trọng

```js
db.reports.createIndex({ location: "2dsphere" })
db.reports.createIndex({ created_at: -1 })
db.reports.createIndex({ status: 1 })
```

---

# 🔥 4. API DESIGN (report-service)

## 📌 1. Tạo report

```http
POST /api/v1/reports
```

**Request:**

```json
{
  "lat": 21.03,
  "lng": 105.85,
  "image_url": "...",
  "flood_level": "medium",
  "description": "...",
  "reported_at": "2026-04-14T10:00:00"
}
```

---

## 📌 2. Lấy report theo khu vực (viewport)

```http
GET /api/v1/reports?bbox=...
```

**Query:**

* `min_lat`
* `max_lat`
* `min_lng`
* `max_lng`

---

## 📌 3. Lấy theo bán kính

```http
GET /api/v1/reports/nearby?lat=...&lng=...&radius=10000
```

---

## 📌 4. Vote report

```http
POST /api/v1/reports/{id}/vote
```

```json
{
  "type": "up" | "down"
}
```

---

# ⚡ 5. GEO QUERY (MongoDB)

## 📍 Nearby query

```python
db.reports.find({
  "location": {
    "$near": {
      "$geometry": {
        "type": "Point",
        "coordinates": [lng, lat]
      },
      "$maxDistance": 10000
    }
  }
})
```

---

## 🗺 Viewport query

```python
db.reports.find({
  "location": {
    "$geoWithin": {
      "$box": [
        [min_lng, min_lat],
        [max_lng, max_lat]
      ]
    }
  }
})
```

---

# 🔌 6. WEBSOCKET GATEWAY (FastAPI)

```python
from fastapi import WebSocket

connections = {}

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()

    while True:
        data = await ws.receive_json()

        # lưu viewport
        connections[ws] = data

        # query DB
        reports = get_reports(data)

        await ws.send_json(reports)
```

---

# 🧠 7. TRUST SCORE LOGIC (core insight)

```text
trust_score =
    base_user_score
  + vote_score
  + ai_confidence
  - penalty (spam / reject)
```

---

# 🚀 8. SCALE STRATEGY (quan trọng cho K8s)

* FastAPI chạy với:

  * `uvicorn + gunicorn`
* WebSocket scale:

  * Redis pub/sub
* MongoDB:

  * Replica set
* Rate limit:

  * Redis

