from fastapi import FastAPI, HTTPException, Query
import httpx
import os
from datetime import datetime
from pydantic_settings import BaseSettings


class WeatherSettings(BaseSettings):
    # Mac dinh de trong de he thong tu dung Mock Data
    OPENWEATHER_API_KEY: str = ""
    REPORT_SERVICE_URL: str = "http://localhost:8002"

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), "../../.env")
        extra = "ignore"


settings = WeatherSettings()

app = FastAPI(
    title="Weather Service",
    description="Dich vu thong tin thoi tiet va du bao nguy co ngap lut",
)


@app.get("/")
async def root():
    return {"message": "Weather Service is running!"}


@app.get("/weather")
async def get_weather(
    lat: float = Query(..., description="Vi do (Latitude)"),
    lng: float = Query(..., description="Kinh do (Longitude)"),
):
    # Logic kiem tra API Key de quyet dinh dung Mock hay Live data
    if (
        not settings.OPENWEATHER_API_KEY
        or settings.OPENWEATHER_API_KEY == "dien_api_key_cua_ban_vao_day"
    ):
        return {
            "status": "mock",
            "message": "Dang su dung du lieu gia lap",
            "temperature_c": 26.5,
            "weather_main": "Rain",
            "rain_1h_mm": 15.5,
        }

    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lng}&appid={settings.OPENWEATHER_API_KEY}&units=metric"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()
            data = response.json()

            weather_main = (
                data["weather"][0]["main"] if "weather" in data else "Unknown"
            )
            temp = data["main"]["temp"] if "main" in data else 0.0

            rain_1h = 0.0
            if "rain" in data and "1h" in data["rain"]:
                rain_1h = data["rain"]["1h"]

            return {
                "status": "live",
                "temperature_c": temp,
                "weather_main": weather_main,
                "rain_1h_mm": rain_1h,
            }
        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=f"Loi tu OpenWeather API: {exc.response.text}",
            )
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Loi ket noi thoi tiet: {str(e)}"
            )


@app.get("/predict/flood-risk")
async def predict_flood_risk(
    lat: float = Query(..., description="Vi do"),
    lng: float = Query(..., description="Kinh do"),
):
    try:
        # 1. Lay luong mua (Uu tien Mock Data nhu ban yeu cau)
        rain_1h_mm = 15.5

        if (
            settings.OPENWEATHER_API_KEY
            and settings.OPENWEATHER_API_KEY != "dien_api_key_cua_ban_vao_day"
        ):
            weather_data = await get_weather(lat, lng)
            rain_1h_mm = weather_data.get("rain_1h_mm", 0.0)

        # 2. Goi Report Service de lay du lieu thuc te tu cong dong
        nearby_reports_count = 0
        async with httpx.AsyncClient() as client:
            report_url = f"{settings.REPORT_SERVICE_URL}/reports/nearby?lat={lat}&lng={lng}&radius_km=5.0"
            try:
                report_res = await client.get(report_url, timeout=10.0)
                if report_res.status_code == 200:
                    reports = report_res.json()
                    nearby_reports_count = len(reports)
            except Exception as e:
                print(f"Khong the ket noi Report Service: {e}")

        # 3. Thuat toan du bao dua tren quy tac (Rule-Based)
        risk_level = "Low"
        reasons = []

        if rain_1h_mm > 30 or nearby_reports_count > 5:
            risk_level = "High"
            if rain_1h_mm > 30:
                reasons.append("Luong mua rat lon (>30mm/h)")
            if nearby_reports_count > 5:
                reasons.append("Mat do diem ngap xung quanh rat cao")
        elif (rain_1h_mm >= 15) or (nearby_reports_count >= 3):
            risk_level = "Medium"
            if rain_1h_mm >= 15:
                reasons.append("Luong mua trung binh (15-30mm/h)")
            if nearby_reports_count >= 3:
                reasons.append("Co dau hieu ngap cuc bo tai khu vuc")
        else:
            reasons.append("Thoi tiet va du lieu cong dong on dinh")

        return {
            "risk_level": risk_level,
            "rain_1h_mm": rain_1h_mm,
            "nearby_reports_count": nearby_reports_count,
            "reasons": reasons,
            "calculation_time": datetime.now().isoformat(),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Loi he thong du bao: {str(e)}")
