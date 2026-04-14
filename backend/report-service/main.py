from fastapi import FastAPI, HTTPException, Query, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from bson.objectid import ObjectId
from typing import List
import sys
import os
import sys
import os
import httpx
import cloudinary
import cloudinary.uploader
from pydantic_settings import BaseSettings

from models import ReportCreate, ReportResponse, VoteCreate

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common.database.mongo import connect_to_mongo, close_mongo_connection, get_db


class ServiceSettings(BaseSettings):
    WEBSOCKET_GATEWAY_URL: str = "http://localhost:8003"
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), "../../.env")
        extra = "ignore"


svc_settings = ServiceSettings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Dang khoi dong Report Service...")
    await connect_to_mongo()

    db = get_db()
    await db["reports"].create_index([("location", "2dsphere")])
    print("Da tao Geo Index (2dsphere) cho bang reports.")

    # Configure Cloudinary
    if (
        svc_settings.CLOUDINARY_CLOUD_NAME
        and svc_settings.CLOUDINARY_CLOUD_NAME != "my_cloud_name"
    ):
        cloudinary.config(
            cloud_name=svc_settings.CLOUDINARY_CLOUD_NAME,
            api_key=svc_settings.CLOUDINARY_API_KEY,
            api_secret=svc_settings.CLOUDINARY_API_SECRET,
        )
        print("Đã config Cloudinary API.")

    yield
    print("Dang tat Report Service...")
    await close_mongo_connection()


app = FastAPI(
    title="Report Service",
    description="Dich vu quan ly bao cao ngap lut",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, set to proper origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Report Service is running!"}


@app.get("/test-db")
async def test_db():
    db = get_db()
    collections = await db.list_collection_names()
    return {"status": "success", "collections": collections}


async def process_image_validation(report_id: str, image_url: str):
    print(f"[{report_id}] Bat dau kiem duyet anh qua AI...")

    async with httpx.AsyncClient() as client:
        try:
            ai_response = await client.post(
                "http://localhost:8004/validate",
                json={"image_url": image_url},
                timeout=15.0,
            )
            ai_data = ai_response.json()

            is_flood = ai_data.get("is_flood", False)
            confidence = ai_data.get("confidence", 0.0)

            new_status = "pending"
            trust_bonus = 0.0

            if is_flood and confidence > 70.0:
                new_status = "verified"
                trust_bonus = 10.0
            elif not is_flood and confidence > 70.0:
                new_status = "rejected"
                trust_bonus = -5.0

            print(
                f"[{report_id}] Ket qua AI: {is_flood} ({confidence}%). Trang thai moi: {new_status}"
            )

            db = get_db()
            await db["reports"].update_one(
                {"_id": ObjectId(report_id)},
                {
                    "$set": {
                        "status": new_status,
                        "ai_confidence": confidence,
                        "ai_labels": ai_data.get("labels", []),
                    },
                    "$inc": {"trust_score": trust_bonus},
                },
            )

        except Exception as e:
            print(f"[{report_id}] Loi khi goi AI Service: {e}")


@app.post("/reports/upload")
async def upload_image(file: UploadFile = File(...)):
    if (
        not svc_settings.CLOUDINARY_CLOUD_NAME
        or svc_settings.CLOUDINARY_CLOUD_NAME == "my_cloud_name"
    ):
        import asyncio

        await asyncio.sleep(1.2)
        return {"image_url": "https://picsum.photos/500/300?random=backend_mock"}

    try:
        contents = await file.read()
        response = cloudinary.uploader.upload(contents, resource_type="image")
        return {"image_url": response.get("secure_url")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi Upload Cloudinary: {str(e)}")


@app.post("/reports", response_model=ReportResponse, status_code=201)
async def create_report(report: ReportCreate, background_tasks: BackgroundTasks):
    try:
        db = get_db()

        report_dict = report.model_dump()

        report_dict["created_at"] = datetime.now(timezone.utc)
        report_dict["trust_score"] = 0.0
        report_dict["status"] = "pending"
        report_dict["votes"] = 0

        result = await db["reports"].insert_one(report_dict)

        report_id_str = str(result.inserted_id)
        report_dict["id"] = report_id_str
        report_dict.pop("_id", None)

        background_tasks.add_task(
            process_image_validation,
            report_id=report_id_str,
            image_url=report_dict["image_url"],
        )

        async with httpx.AsyncClient() as client:
            try:
                payload = jsonable_encoder(report_dict)
                await client.post(
                    f"{svc_settings.WEBSOCKET_GATEWAY_URL}/broadcast", json=payload
                )
                print("Da gui broadcast den WebSocket Gateway thanh cong.")
            except Exception as e:
                print(f"Khong the gui broadcast sang WebSocket: {e}")

        return report_dict

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Loi khi luu bao cao: {str(e)}")


@app.get("/reports/nearby", response_model=List[ReportResponse])
async def get_nearby_reports(
    lat: float = Query(..., description="Vi do (Latitude)"),
    lng: float = Query(..., description="Kinh do (Longitude)"),
    radius_km: float = Query(10.0, description="Ban kinh tim kiem (km)"),
    hours_active: int = Query(24, description="Chi lay bot cao trong X gio qua"),
):
    try:
        from datetime import timedelta

        db = get_db()
        radius_meters = radius_km * 1000

        time_threshold = datetime.now(timezone.utc) - timedelta(hours=hours_active)

        query = {
            "created_at": {"$gte": time_threshold},
            "location": {
                "$near": {
                    "$geometry": {
                        "type": "Point",
                        "coordinates": [lng, lat],
                    },
                    "$maxDistance": radius_meters,
                }
            },
        }

        cursor = db["reports"].find(query)
        reports = await cursor.to_list(length=100)

        for rep in reports:
            rep["id"] = str(rep.pop("_id"))

        return reports

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Loi khi truy van vi tri: {str(e)}"
        )


@app.post("/reports/{report_id}/vote", status_code=200)
async def vote_report(report_id: str, vote_data: VoteCreate):
    try:
        db = get_db()

        existing_vote = await db["votes"].find_one(
            {"report_id": report_id, "user_id": vote_data.user_id}
        )

        if existing_vote:
            raise HTTPException(
                status_code=400, detail="Nguoi dung da vote cho bao cao nay roi."
            )

        await db["votes"].insert_one(
            {
                "report_id": report_id,
                "user_id": vote_data.user_id,
                "is_upvote": vote_data.is_upvote,
                "created_at": datetime.now(timezone.utc),
            }
        )

        vote_increment = 1 if vote_data.is_upvote else -1
        # [TESTING MODE] Đã buff điểm để 1 lượt Upvote có sức sát thương +20 điểm (Lên Verified liền tay)
        trust_increment = 20.0 if vote_data.is_upvote else -10.0

        report = await db["reports"].find_one({"_id": ObjectId(report_id)})
        if not report:
            raise HTTPException(status_code=404, detail="Khong tim thay bao cao.")

        current_trust = report.get("trust_score", 0.0)
        new_trust = current_trust + trust_increment
        current_status = report.get("status", "pending")

        new_status = current_status
        if new_trust <= -10.0 and current_status != "rejected":
            new_status = "rejected"
        elif new_trust >= 20.0 and current_status == "pending":
            new_status = "verified"

        result = await db["reports"].find_one_and_update(
            {"_id": ObjectId(report_id)},
            {
                "$inc": {"votes": vote_increment, "trust_score": trust_increment},
                "$set": {"status": new_status},
            },
            return_document=True,
        )

        return {
            "status": "success",
            "new_total_votes": result.get("votes", 0),
            "new_trust_score": result.get("trust_score", 0.0),
            "report_status": result.get("status"),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Loi khi xu ly vote: {str(e)}")
