from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List
import json
import httpx
from pydantic_settings import BaseSettings


# ---------------------------------------------------------
# 1. Quản lý kết nối (Single Responsibility)
# ---------------------------------------------------------
class ConnectionManager:
    def __init__(self):
        # Danh sách lưu trữ các kết nối active
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"Client moi ket noi. Tong so: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"Client da ngat ket noi. Con lai: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Gui tin nhan den tat ca client dang ket noi"""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Neu gui loi (client ngat dot ngot), ta se xu ly sau
                pass


manager = ConnectionManager()

# ---------------------------------------------------------
# 2. Khoi tao App
# ---------------------------------------------------------
app = FastAPI(title="WebSocket Gateway")


@app.get("/")
async def root():
    return {"message": "WebSocket Gateway is running!"}


# ---------------------------------------------------------
# 3. WebSocket Endpoint
# ---------------------------------------------------------
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Lang nghe tin nhan tu client (vi du: client gui viewport moi)
            data = await websocket.receive_text()
            # Tam thoi chung ta chi phan hoi lai de xac nhan ket noi
            await websocket.send_json({"status": "received", "your_data": data})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"Loi WebSocket: {e}")
        manager.disconnect(websocket)


@app.post("/broadcast")
async def broadcast_message(message: dict):
    # Goi ham manager.broadcast de gui den tat ca client WS
    await manager.broadcast(message)
    return {"status": "broadcasted"}
