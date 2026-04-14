from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings
import logging
import os


# ---------------------------------------------------------
# 1. Cấu hình Database đọc từ .env
# ---------------------------------------------------------
class MongoSettings(BaseSettings):
    MONGO_URI: str
    MONGO_DB_NAME: str

    class Config:
        # Đường dẫn tương đối từ mongo.py lùi về thư mục gốc chứa .env
        env_file = os.path.join(os.path.dirname(__file__), "../../../.env")
        extra = "ignore"  # Bỏ qua các biến môi trường khác không liên quan


settings = MongoSettings()


# ---------------------------------------------------------
# 2. Quản lý Connection (Singleton Pattern)
# ---------------------------------------------------------
class DatabaseManager:
    client: AsyncIOMotorClient = None
    db = None


db_manager = DatabaseManager()


async def connect_to_mongo():
    """Hàm này sẽ được gọi khi ứng dụng (FastAPI) khởi động."""
    logging.info("Đang kết nối đến MongoDB...")
    try:
        # Khởi tạo kết nối với Connection Pooling tự động của Motor
        db_manager.client = AsyncIOMotorClient(settings.MONGO_URI)
        db_manager.db = db_manager.client[settings.MONGO_DB_NAME]

        # Ping thử để đảm bảo kết nối thành công
        await db_manager.client.admin.command("ping")
        logging.info("✅ Đã kết nối thành công đến MongoDB tại 192.168.23.60!")
    except Exception as e:
        logging.error(f"❌ Lỗi kết nối MongoDB: {e}")
        raise e


async def close_mongo_connection():
    """Hàm này sẽ được gọi khi ứng dụng (FastAPI) tắt."""
    logging.info("Đang đóng kết nối MongoDB...")
    if db_manager.client:
        db_manager.client.close()
        logging.info("✅ Đã đóng kết nối MongoDB an toàn.")


def get_db():
    """Hàm tiện ích để các file khác gọi và lấy đối tượng Database."""
    if db_manager.db is None:
        raise Exception(
            "Database chưa được khởi tạo. Hãy đảm bảo gọi connect_to_mongo() trước."
        )
    return db_manager.db
