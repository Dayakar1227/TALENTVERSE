"""
Pydantic v2 models for TalentVerse.
Each model mirrors a MongoDB collection document.
"""
from __future__ import annotations
from datetime import datetime, timezone
from enum import Enum
from typing import Any
from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field, HttpUrl


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ── ObjectId helper ─────────────────────────────────────────────────────────
class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v: Any) -> str:
        if isinstance(v, ObjectId):
            return str(v)
        if ObjectId.is_valid(str(v)):
            return str(v)
        raise ValueError(f"Not a valid ObjectId: {v}")

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.no_info_plain_validator_function(cls.validate)


# ── Enums ────────────────────────────────────────────────────────────────────
class UserRole(str, Enum):
    CREATIVE = "CREATIVE"
    RECRUITER = "RECRUITER"
    ADMIN = "ADMIN"


class JobType(str, Enum):
    FULL_TIME = "Full-time"
    CONTRACT = "Contract"
    FREELANCE = "Freelance"
    INTERNSHIP = "Internship"


class BudgetType(str, Enum):
    PASSION_PROJECT = "Passion Project"
    SPLIT = "Split"
    LOW_BUDGET = "Low Budget"
    PAID = "Paid"


class VerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


# ── User ─────────────────────────────────────────────────────────────────────
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    role: UserRole = UserRole.CREATIVE
    account_roles: list[UserRole] = Field(default_factory=lambda: [UserRole.CREATIVE], max_length=3)
    roles: list[str] = Field(default_factory=list, max_length=25)
    interested_roles: list[str] = Field(default_factory=list, max_length=25)
    gender: str | None = None
    date_of_birth: str | None = None
    avatar: str | None = None
    skills: list[str] = Field(default_factory=list, max_length=50)
    bio: str | None = Field(None, max_length=1000)
    location: str | None = Field(None, max_length=120)
    website: str | None = Field(None, max_length=250)


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.CREATIVE
    skills: list[str] = Field(default_factory=list, max_length=50)


class UserUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=100)
    roles: list[str] | None = Field(None, max_length=25)
    interested_roles: list[str] | None = Field(None, max_length=25)
    gender: str | None = None
    date_of_birth: str | None = None
    skills: list[str] | None = Field(None, max_length=50)
    bio: str | None = Field(None, max_length=1000)
    location: str | None = Field(None, max_length=120)
    website: str | None = Field(None, max_length=250)


class UserInDB(UserBase):
    id: PyObjectId = Field(alias="_id")
    hashed_password: str
    trust_score: float = 50.0
    trust_score_level: str = "Newcomer"
    is_verified: bool = False
    portfolio_count: int = 0
    is_email_verified: bool = False
    token_version: int = 0
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class UserPublic(UserBase):
    id: str
    trust_score: float
    trust_score_level: str
    is_verified: bool
    portfolio_count: int
    created_at: datetime

    model_config = {"populate_by_name": True}


class UserProfilePublic(BaseModel):
    id: str
    name: str
    role: UserRole
    account_roles: list[UserRole] = Field(default_factory=lambda: [UserRole.CREATIVE])
    roles: list[str] = Field(default_factory=list)
    interested_roles: list[str] = Field(default_factory=list)
    avatar: str | None = None
    skills: list[str] = Field(default_factory=list)
    bio: str | None = None
    location: str | None = None
    website: str | None = None
    trust_score: float
    trust_score_level: str
    is_verified: bool
    portfolio_count: int
    created_at: datetime


# ── Auth ─────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


# ── Job ──────────────────────────────────────────────────────────────────────
class JobBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    company: str = Field(..., max_length=150)
    company_id: str
    location: str = Field(..., max_length=120)
    salary: str = Field(..., max_length=80)
    type: JobType = JobType.FULL_TIME
    category: str = Field(..., max_length=80)
    min_trust_score: float = Field(0, ge=0, le=100)
    description: str | None = Field(None, max_length=4000)
    requirements: list[str] = Field(default_factory=list, max_length=50)
    is_active: bool = True


class JobCreate(JobBase):
    pass


class RecruiterJobCreate(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=150)
    title: str = Field(..., min_length=3, max_length=150)
    location: str = Field(..., max_length=120)
    salary: str = Field(..., max_length=80)
    type: JobType = JobType.FULL_TIME
    category: str = Field(..., max_length=80)
    min_trust_score: float = Field(0, ge=0, le=100)
    description: str | None = Field(None, max_length=4000)
    requirements: list[str] = Field(default_factory=list, max_length=50)


class JobInDB(JobBase):
    id: PyObjectId = Field(alias="_id")
    posted_by: str  # user_id of recruiter
    applicants: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=utc_now)

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class JobPublic(JobBase):
    id: str
    posted_by: str
    applicant_count: int = 0
    created_at: datetime

    model_config = {"populate_by_name": True}


# ── Portfolio ─────────────────────────────────────────────────────────────────
class PortfolioItemBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    category: str = Field(..., max_length=80)
    description: str | None = Field(None, max_length=2000)
    tags: list[str] = Field(default_factory=list, max_length=20)


class PortfolioItemCreate(PortfolioItemBase):
    pass


class PortfolioItemInDB(PortfolioItemBase):
    id: PyObjectId = Field(alias="_id")
    user_id: str
    image_url: str
    file_key: str  # Cloudinary public_id / S3 key
    verification_status: VerificationStatus = VerificationStatus.PENDING
    verification_id: str | None = None     # e.g. TV-92842-VRF
    trust_score_boost: float = 0.0
    views: int = 0
    likes: int = 0
    created_at: datetime = Field(default_factory=utc_now)

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class PortfolioItemPublic(PortfolioItemBase):
    id: str
    user_id: str
    image_url: str
    verification_status: VerificationStatus
    verification_id: str | None
    trust_score_boost: float
    views: int
    likes: int
    created_at: datetime

    model_config = {"populate_by_name": True}


# ── Collaboration ─────────────────────────────────────────────────────────────
class CollaborationBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., max_length=4000)
    location: str = Field(..., max_length=120)
    roles_needed: list[str] = Field(..., min_length=1, max_length=25)
    budget_type: BudgetType = BudgetType.PASSION_PROJECT
    category: str = Field(..., max_length=80)
    is_open: bool = True


class CollaborationCreate(CollaborationBase):
    pass


class CollaborationInDB(CollaborationBase):
    id: PyObjectId = Field(alias="_id")
    creator_id: str
    creator_name: str
    creator_avatar: str | None = None
    interested_users: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=utc_now)

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class CollaborationPublic(CollaborationBase):
    id: str
    creator_id: str
    creator_name: str
    creator_avatar: str | None
    interested_count: int = 0
    created_at: datetime

    model_config = {"populate_by_name": True}


# ── Company ───────────────────────────────────────────────────────────────────
class CompanyBase(BaseModel):
    name: str = Field(..., max_length=150)
    logo: str | None = None
    banner: str | None = None
    mission: str | None = Field(None, max_length=1000)
    description: str | None = Field(None, max_length=4000)
    industry: str | None = Field(None, max_length=120)
    size: str | None = Field(None, max_length=80)
    website: HttpUrl | None = None
    location: str | None = Field(None, max_length=120)


class CompanyInDB(CompanyBase):
    id: PyObjectId = Field(alias="_id")
    owner_id: str
    created_at: datetime = Field(default_factory=utc_now)

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class CompanyPublic(CompanyBase):
    id: str
    created_at: datetime

    model_config = {"populate_by_name": True}


# ── Auth extras ───────────────────────────────────────────────────────────────
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
