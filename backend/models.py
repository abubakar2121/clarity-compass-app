from pydantic import BaseModel, Field, EmailStr
from typing import Literal, Dict, Any
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, values):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class User(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    fullName: str
    email: EmailStr = Field(..., unique=True)
    passwordHash: str
    companySize: Literal["15-35", "36-60", "61-95", "96-200"]
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    lastLoginAt: datetime | None = None
    isActive: bool = True
    consentAccepted: bool = False

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Session(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    answers: Dict[str, Any] = {}
    status: Literal["started", "completed", "dropped_off"] = "started"
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: datetime | None = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
          
# ADD THESE MODELS
class Report(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    session_id: PyObjectId
    mindset_shift: str
    mindset_shift_insight: str
    operational_focus: str
    operational_focus_insight: str
    next_move: Dict[str, Any]
    generated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class TrackingEvent(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    session_id: PyObjectId | None = None
    user_id: PyObjectId | None = None
    event_type: Literal["completion", "drop_off", "cta_click"]
    details: Dict[str, Any] | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}