import os
import logging
from contextlib import asynccontextmanager
from typing import Optional, Any, Callable
from datetime import datetime, timezone

from fastapi import FastAPI, Depends, APIRouter, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
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
import redis.asyncio as redis
import uvicorn
from bson import ObjectId


# ==========================================
# 1. Configuration & Try Imports
# ==========================================
class Settings(BaseSettings):
    PROJECT_NAME: str = "Account Service"
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
    from common.redis_utils import get_user_id_from_session
except ImportError:
    logger.warning("common.redis_utils not found. Using fallback mock.")

    async def get_user_id_from_session(
        session_id: str, redis_client: redis.Redis
    ) -> str | None:
        return await redis_client.get(f"session:{session_id}")


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
class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = None
    password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: Optional[str] = None
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime


def map_mongo_to_user(mongo_doc: dict) -> dict:
    mongo_doc["id"] = str(mongo_doc.pop("_id"))
    return mongo_doc


# ==========================================
# 4. Dependencies
# ==========================================
async def get_current_user_id(
    authorization: str = Header(None), redis_db: redis.Redis = Depends(get_redis)
) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing Authorization header",
        )

    session_id = authorization.split(" ")[1]
    user_id = await get_user_id_from_session(session_id, redis_db)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired"
        )
    return user_id


# ==========================================
# 5. FastAPI App & Routes
# ==========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Account Service resources...")
    await connect_to_mongo()

    # Ensure indexes
    db = get_mongo_db()
    try:
        await db["users"].create_index("email", unique=True)
        await db["users"].create_index("username", unique=True)
    except Exception as e:
        logger.warning(f"Could not create indexes: {e}")

    await init_redis()
    yield
    logger.info("Shutting down Account Service resources...")
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


users_router = APIRouter(prefix="/api/v1/users", tags=["users"])


@users_router.post(
    "/", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def create_user(user_in: UserCreate, db: Any = Depends(get_mongo_db)):
    existing_user = await db["users"].find_one(
        {"$or": [{"email": user_in.email}, {"username": user_in.username}]}
    )
    if existing_user:
        raise HTTPException(
            status_code=400, detail="User with this email or username already exists."
        )

    hashed_password = f"mock_hash_{user_in.password}"
    new_user = {
        "email": user_in.email,
        "username": user_in.username,
        "full_name": user_in.full_name,
        "hashed_password": hashed_password,
        "is_active": True,
        "is_superuser": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = await db["users"].insert_one(new_user)
    new_user["_id"] = result.inserted_id

    return UserResponse(**map_mongo_to_user(new_user))


@users_router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    user_id: str = Depends(get_current_user_id), db: Any = Depends(get_mongo_db)
):
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**map_mongo_to_user(user))


@users_router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: str,
    current_id: str = Depends(get_current_user_id),
    db: Any = Depends(get_mongo_db),
):
    try:
        user = await db["users"].find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return UserResponse(**map_mongo_to_user(user))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format")


app.include_router(users_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8006, reload=True)
