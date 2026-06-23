from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

# ── Auth ──────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str

class UserOut(BaseModel):
    id: int
    username: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# ── NCC Records ───────────────────────────────────────
class NccRecordCreate(BaseModel):
    so_number:         str = Field(..., min_length=10, max_length=10, pattern=r"^\d{10}$")
    customer_name:     str = Field(..., max_length=50)
    amount:            float = Field(..., gt=0)
    quarter_year:      str
    region:            str
    location:          str
    product_group:     str
    service_portfolio: str
    cs_segment:        str
    description:       str = Field(..., min_length=10)
    root_cause:        Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None
    status:            Optional[str] = "open"

class NccRecordUpdate(BaseModel):
    customer_name:     Optional[str] = None
    amount:            Optional[float] = None
    quarter_year:      Optional[str] = None
    region:            Optional[str] = None
    location:          Optional[str] = None
    product_group:     Optional[str] = None
    service_portfolio: Optional[str] = None
    cs_segment:        Optional[str] = None
    description:       Optional[str] = None
    root_cause:        Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None
    status:            Optional[str] = None

class NccRecordOut(BaseModel):
    id:                int
    so_number:         str
    customer_name:     str
    amount:            float
    quarter_year:      str
    region:            str
    location:          str
    product_group:     str
    service_portfolio: str
    cs_segment:        str
    description:       str
    root_cause:        Optional[str]
    corrective_action: Optional[str]
    preventive_action: Optional[str]
    status:            str
    created_by:        Optional[int]
    created_at:        datetime
    updated_at:        Optional[datetime]

    class Config:
        from_attributes = True

class NccListResponse(BaseModel):
    total:   int
    page:    int
    limit:   int
    records: list[NccRecordOut]

# ── Filters ───────────────────────────────────────────
class FilterOptionOut(BaseModel):
    filter_type:   str
    value:         str
    display_label: str

    class Config:
        from_attributes = True

# ── AI ────────────────────────────────────────────────
class AISuggestRequest(BaseModel):
    description:   str
    product_group: Optional[str] = None
    region:        Optional[str] = None

class AISuggestResponse(BaseModel):
    root_cause:        str
    corrective_action: str
    preventive_action: str

class AIChatRequest(BaseModel):
    question: str

class AIChatResponse(BaseModel):
    answer: str