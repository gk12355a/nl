from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone


class GeoLocation(BaseModel):
    type: str = "Point"
    coordinates: List[float] = Field(
        ..., min_items=2, max_items=2, example=[106.700981, 10.776889]
    )


class ReportCreate(BaseModel):
    location: GeoLocation
    image_url: str = Field(
        ..., description="Bắt buộc: URL ảnh (sau khi upload lên Cloudinary)"
    )
    flood_level: str = Field(
        ...,
        description="Mức độ ngập: 'nhẹ' (<=10cm), 'trung_bình' (10-30cm), 'nặng' (>30cm)",
    )
    description: Optional[str] = None
    reported_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReportResponse(ReportCreate):
    id: str
    created_at: datetime
    trust_score: float = 0.0
    status: str = "pending"
    votes: int = 0


class VoteCreate(BaseModel):
    user_id: str = Field(..., description="ID cua nguoi dung thuc hien vote")
    is_upvote: bool = Field(
        ..., description="True: Xac nhan co ngap. False: Bac bo (khong ngap)"
    )
