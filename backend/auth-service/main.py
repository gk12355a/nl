import os
import uuid
import secrets
import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Depends, APIRouter, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pydantic_settings import BaseSettings
import sys
import os

# Append backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common.database.mongo import (
    connect_to_mongo,
    close_mongo_connection,
    get_db as get_mongo_db,
)

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import redis.asyncio as redis
import uvicorn


# ==========================================
# 1. Configuration & Try Imports
# ==========================================
class Settings(BaseSettings):
    PROJECT_NAME: str = "Auth Service"
    API_V1_STR: str = "/api/v1"
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "nl_flood_db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), "../../.env")
        case_sensitive = True
        extra = "ignore"


settings = Settings()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from common.redis_utils import create_session, delete_session
except ImportError:
    logger.warning("common.redis_utils not found. Using fallback mock.")

    async def create_session(user_id: str, redis_client: redis.Redis) -> str:
        session_token = str(uuid.uuid4())
        await redis_client.setex(f"session:{session_token}", 86400, user_id)
        return session_token

    async def delete_session(session_token: str, redis_client: redis.Redis) -> None:
        await redis_client.delete(f"session:{session_token}")


try:
    from common.observability import instrument_fastapi
except ImportError:

    def instrument_fastapi(app):
        pass


# ==========================================
# 2. Redis Setup & Database
# ==========================================
redis_client: redis.Redis | None = None


async def init_redis() -> redis.Redis:
    global redis_client
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return redis_client


async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.aclose()
        redis_client = None


def get_redis() -> redis.Redis:
    if redis_client is None:
        raise RuntimeError("Redis not initialized")
    return redis_client


# ==========================================
# 3. Pydantic Schemas
# ==========================================
class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ==========================================
# 4. FastAPI App & Routes
# ==========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Auth Service resources...")
    await connect_to_mongo()
    await init_redis()
    yield
    logger.info("Shutting down Auth Service resources...")
    await close_redis()
    await close_mongo_connection()


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)
instrument_fastapi(app)

if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",")],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/health", tags=["health"])
async def health_check(
    db: Any = Depends(get_mongo_db), redis_db: redis.Redis = Depends(get_redis)
):
    health_status = {"service": "ok", "database": "unknown", "redis": "unknown"}
    try:
        await db.command("ping")
        health_status["database"] = "ok"
    except Exception as e:
        health_status["database"] = f"error: {e}"

    try:
        await redis_db.ping()
        health_status["redis"] = "ok"
    except Exception as e:
        health_status["redis"] = f"error: {e}"

    return health_status


auth_router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@auth_router.post("/login", response_model=TokenResponse)
async def login(
    credentials: LoginRequest,
    db: Any = Depends(get_mongo_db),
    redis_db: redis.Redis = Depends(get_redis),
):
    db_user = await db["users"].find_one({"email": credentials.email})

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )

    if not db_user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account"
        )

    is_password_valid = (
        db_user["hashed_password"] == f"mock_hash_{credentials.password}"
    )

    if not is_password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )

    token = await create_session(str(db_user["_id"]), redis_db)
    return TokenResponse(access_token=token)


@auth_router.post("/logout")
async def logout(
    authorization: str = Header(None), redis_db: redis.Redis = Depends(get_redis)
):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        await delete_session(token, redis_db)
    return {"message": "Successfully logged out"}


@auth_router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Any = Depends(get_mongo_db),
    redis_db: redis.Redis = Depends(get_redis),
):
    """Generate a password reset token (15 min TTL) and return it.
    In production, this token would be emailed to the user.
    """
    user = await db["users"].find_one({"email": request.email})
    # Always return 200 to prevent email enumeration
    if not user:
        logger.info(f"Forgot-password requested for unknown email: {request.email}")
        return {
            "message": "If this email exists, a reset link has been sent.",
            "reset_token": None,
        }

    reset_token = secrets.token_urlsafe(32)
    redis_key = f"pwd_reset:{reset_token}"
    await redis_db.setex(redis_key, 900, str(user["_id"]))  # 15 minutes

    logger.info(f"Password reset token generated for user {user['_id']}")
    # In production: send email here. For now, return token directly (dev mode).
    return {
        "message": "If this email exists, a reset link has been sent.",
        "reset_token": reset_token,
        "note": "DEV MODE: token returned directly. Remove in production.",
    }


@auth_router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: Any = Depends(get_mongo_db),
    redis_db: redis.Redis = Depends(get_redis),
):
    """Validate reset token from Redis and update password in MongoDB."""
    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters",
        )

    redis_key = f"pwd_reset:{request.token}"
    user_id = await redis_db.get(redis_key)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token is invalid or has expired",
        )

    from bson import ObjectId

    new_hashed = f"mock_hash_{request.new_password}"
    result = await db["users"].update_one(
        {"_id": ObjectId(user_id)}, {"$set": {"hashed_password": new_hashed}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    # Revoke the reset token immediately after use
    await redis_db.delete(redis_key)
    logger.info(f"Password reset successful for user {user_id}")
    return {"message": "Password has been reset successfully"}


app.include_router(auth_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8007, reload=True)
