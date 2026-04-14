from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import httpx
import os
from pydantic_settings import BaseSettings

# Thư viện Rate Limit
from redis import asyncio as aioredis
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter


# 1. Quản lý cấu hình (SRP)
class Settings(BaseSettings):
    REDIS_URL: str
    USER_SERVICE_URL: str
    REPORT_SERVICE_URL: str
    AI_SERVICE_URL: str
    WEATHER_SERVICE_URL: str

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), "../../.env")
        extra = "ignore"


settings = Settings()

# Khởi tạo HTTP Client dùng chung để tối ưu hiệu suất
http_client = httpx.AsyncClient(timeout=15.0)


# 2. Quản lý vòng đời ứng dụng (SRP)
@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Đang kết nối Redis tại: {settings.REDIS_URL}")
    try:
        redis_conn = aioredis.from_url(
            settings.REDIS_URL, encoding="utf-8", decode_responses=True
        )
        await FastAPILimiter.init(redis_conn)
        print("Kết nối Redis thành công. Rate Limiter đã sẵn sàng bảo vệ hệ thống!")
    except Exception as e:
        print(f"Lỗi kết nối Redis: {e}")

    yield

    print("Đang đóng các kết nối...")
    await FastAPILimiter.close()
    await http_client.aclose()


app = FastAPI(
    title="API Gateway",
    description="Cổng giao tiếp chính & Bảo mật hệ thống",
    lifespan=lifespan,
)


@app.get("/")
async def root():
    return {"message": "API Gateway is running!"}


# 3. Logic ánh xạ Service (SRP)
def get_target_url(service_name: str, path: str) -> str:
    services = {
        "report": settings.REPORT_SERVICE_URL,
        "weather": settings.WEATHER_SERVICE_URL,
        "ai": settings.AI_SERVICE_URL,
        "user": settings.USER_SERVICE_URL,
    }
    base_url = services.get(service_name)
    if not base_url:
        raise HTTPException(status_code=404, detail="Service không tồn tại")
    return f"{base_url}/{path}"


# 4. API Proxy Controller với Rate Limiting
# Giới hạn: 5 requests / 60 giây (Cho mỗi IP)
@app.api_route(
    "/{service_name}/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    dependencies=[Depends(RateLimiter(times=5, seconds=60))],
)
async def proxy_gateway(service_name: str, path: str, request: Request):
    """Hàm trung chuyển (Proxy) chuyển tiếp yêu cầu đến các Microservices"""
    target_url = get_target_url(service_name, path)

    headers = dict(request.headers)
    headers.pop("host", None)  # Gỡ header host để tránh xung đột

    try:
        body = await request.body()
        response = await http_client.request(
            method=request.method,
            url=target_url,
            headers=headers,
            params=request.query_params,
            content=body,
        )

        return JSONResponse(
            status_code=response.status_code,
            content=response.json() if response.content else None,
        )
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503, detail=f"Service '{service_name}' đang bảo trì hoặc tắt"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tại Gateway: {str(e)}")
