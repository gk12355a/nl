from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
from io import BytesIO
from PIL import Image

# Import thư viện AI
import torch
from transformers import AutoImageProcessor, ResNetForImageClassification

app = FastAPI(title="AI Service", description="Dich vu kiem duyet hinh anh ngap lut")

# --- KHOI TAO MO HINH AI (Load model khi start app) ---
print("Dang tai mo hinh AI... (Co the mat vai chuc giay trong lan dau tien)")
# Su dung mo hinh ResNet50 da train tren ImageNet
processor = AutoImageProcessor.from_pretrained("microsoft/resnet-50")
model = ResNetForImageClassification.from_pretrained("microsoft/resnet-50")
print("Tai mo hinh AI thanh cong!")


# Dinh nghia Input/Output
class ImageValidationRequest(BaseModel):
    image_url: str


class ImageValidationResponse(BaseModel):
    is_flood: bool
    confidence: float
    labels: list[str]


@app.get("/")
async def root():
    return {"message": "AI Service is running!"}


# --- API KIEM DUYET ANH ---
@app.post("/validate", response_model=ImageValidationResponse)
async def validate_image(request: ImageValidationRequest):
    try:
        # 1. Tai anh tu URL
        async with httpx.AsyncClient() as client:
            response = await client.get(request.image_url)
            response.raise_for_status()
            image = Image.open(BytesIO(response.content)).convert("RGB")

        # 2. Xu ly anh va dua vao mo hinh
        inputs = processor(image, return_tensors="pt")

        with torch.no_grad():
            logits = model(**inputs).logits

        # 3. Lay Top 3 du doan
        predicted_classes = torch.topk(logits, 3).indices[0].tolist()
        predicted_probs = torch.topk(logits.softmax(dim=1), 3).values[0].tolist()

        labels = [model.config.id2label[cls] for cls in predicted_classes]

        # 4. Logic quyet dinh don gian (MVP): Kiem tra xem co tu khoa lien quan den nuoc/ngap khong
        # Day la danh sach tu khoa mau bang tieng Anh (tu ImageNet)
        water_keywords = [
            "water",
            "river",
            "lake",
            "puddle",
            "flood",
            "seashore",
            "dam",
            "fountain",
            "valley",
        ]

        is_flood = False
        max_water_confidence = 0.0

        for label, prob in zip(labels, predicted_probs):
            if any(keyword in label.lower() for keyword in water_keywords):
                is_flood = True
                max_water_confidence = max(max_water_confidence, prob)

        # Neu khong co tu khoa nuoc, ta van tra ve confidence cua nhan cao nhat
        final_confidence = max_water_confidence if is_flood else predicted_probs[0]

        return {
            "is_flood": is_flood,
            "confidence": round(final_confidence * 100, 2),  # Tra ve phan tram
            "labels": labels,
        }

    except httpx.RequestError:
        raise HTTPException(status_code=400, detail="Khong the tai anh tu URL")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Loi xu ly AI: {str(e)}")
