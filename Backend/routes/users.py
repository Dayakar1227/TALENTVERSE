"""
User routes: profile, dashboard stats, trust score history.
Cloudinary avatar uploads are non-blocking (thread executor).
"""
import asyncio
from datetime import datetime, timezone
from functools import partial
import os
import re
import uuid
from pathlib import Path

import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import File, UploadFile, status
from bson import ObjectId
from dotenv import load_dotenv

from config.database import get_db
from middleware.auth import get_current_user
from models.schemas import UserProfilePublic, UserPublic, UserUpdate
from utils.helpers import serialize_public_user, serialize_user

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

router = APIRouter()

AVATAR_TYPES = {"image/jpeg", "image/png", "image/webp"}
AVATAR_EXTENSIONS = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_AVATAR_SIZE = 5 * 1024 * 1024
AVATAR_DIR = Path(__file__).resolve().parents[1] / "uploads" / "avatars"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _as_aware_datetime(value, fallback: datetime) -> datetime:
    if not isinstance(value, datetime):
        return fallback
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _has_cloudinary_config() -> bool:
    values = [
        os.getenv("CLOUDINARY_CLOUD_NAME"),
        os.getenv("CLOUDINARY_API_KEY"),
        os.getenv("CLOUDINARY_API_SECRET"),
    ]
    return all(values) and not any(str(value).startswith("<") for value in values)


def _detect_image_type(data: bytes) -> str | None:
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


def _save_local_avatar(data: bytes, content_type: str) -> str:
    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    suffix = AVATAR_EXTENSIONS[content_type]
    file_key = f"{uuid.uuid4().hex}{suffix}"
    target = AVATAR_DIR / file_key
    target.write_bytes(data)
    return f"/uploads/avatars/{file_key}"


async def _cloudinary_upload_avatar(data: bytes, folder: str, public_id: str) -> dict:
    """Run blocking Cloudinary upload in a thread pool."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        partial(
            cloudinary.uploader.upload,
            data,
            folder=folder,
            resource_type="image",
            public_id=public_id,
            overwrite=True,
        ),
    )


def _connection_status(connection: dict | None, uid: str) -> str:
    if not connection:
        return "none"
    if connection.get("status") == "accepted":
        return "accepted"
    if connection.get("status") == "pending":
        return "pending_outgoing" if connection.get("requester_id") == uid else "pending_incoming"
    return "none"


@router.get("/dashboard", summary="Dashboard stats for logged-in user")
async def dashboard(current_user=Depends(get_current_user), db=Depends(get_db)):
    uid = str(current_user["_id"])

    portfolio_count = await db.portfolio.count_documents({"user_id": uid})
    pending_jobs = await db.job_applications.count_documents({"user_id": uid, "status": "pending"})

    pipeline = [
        {"$match": {"user_id": uid}},
        {"$group": {"_id": {"$dayOfWeek": "$created_at"}, "views": {"$sum": "$views"}}},
        {"$sort": {"_id": 1}},
    ]
    chart_raw = await db.portfolio.aggregate(pipeline).to_list(7)
    day_map = {1: "Sun", 2: "Mon", 3: "Tue", 4: "Wed", 5: "Thu", 6: "Fri", 7: "Sat"}
    chart_data = [{"name": day_map.get(d["_id"], "?"), "views": d["views"]} for d in chart_raw]

    return {
        "trust_score": current_user.get("trust_score", 50),
        "trust_score_level": current_user.get("trust_score_level", "Newcomer"),
        "portfolio_count": portfolio_count,
        "pending_applications": pending_jobs,
        "chart_data": chart_data,
    }


@router.get("/notifications", summary="Notifications for logged-in user")
async def notifications(current_user=Depends(get_current_user), db=Depends(get_db)):
    uid = str(current_user["_id"])
    last_read_at = current_user.get("notifications_read_at")
    now = _now()
    items = []

    portfolio_count = await db.portfolio.count_documents({"user_id": uid})
    pending_jobs = await db.job_applications.count_documents({"user_id": uid, "status": "pending"})
    recent_upload = await db.portfolio.find_one({"user_id": uid}, sort=[("created_at", -1)])

    if not current_user.get("gender") or not current_user.get("date_of_birth"):
        items.append({
            "id": "complete-profile",
            "title": "Complete your profile details",
            "message": "Add gender, DOB, roles, and interested roles so coworkers see a complete profile.",
            "created_at": current_user.get("updated_at", now),
            "type": "profile",
        })

    if portfolio_count == 0:
        items.append({
            "id": "first-upload",
            "title": "Upload your first portfolio item",
            "message": "A verified upload makes your shared profile more useful.",
            "created_at": current_user.get("created_at", now),
            "type": "portfolio",
        })

    if recent_upload:
        items.append({
            "id": f"portfolio-{recent_upload['_id']}",
            "title": "Portfolio is ready to share",
            "message": f"{recent_upload.get('title', 'Your latest work')} is visible on your public profile.",
            "created_at": recent_upload.get("created_at", now),
            "type": "portfolio",
        })

    if pending_jobs:
        items.append({
            "id": "pending-applications",
            "title": f"{pending_jobs} job application pending",
            "message": "Check your jobs area for application updates.",
            "created_at": now,
            "type": "jobs",
        })

    incoming_connections = await db.connections.count_documents({
        "recipient_id": uid,
        "status": "pending",
    })
    if incoming_connections:
        items.append({
            "id": "incoming-connections",
            "title": f"{incoming_connections} friend request pending",
            "message": "Review new collaborators who want to connect with you.",
            "created_at": now,
            "type": "connections",
        })

    def timestamp(item):
        return _as_aware_datetime(item.get("created_at"), now)

    last_read_at = _as_aware_datetime(last_read_at, datetime.min.replace(tzinfo=timezone.utc)) if last_read_at else None

    items.sort(key=timestamp, reverse=True)
    unread_count = sum(1 for item in items if not last_read_at or timestamp(item) > last_read_at)

    return {
        "unread_count": unread_count,
        "items": [
            {
                **item,
                "created_at": timestamp(item).isoformat(),
                "is_read": bool(last_read_at and timestamp(item) <= last_read_at),
            }
            for item in items
        ],
    }


@router.post("/notifications/read")
async def mark_notifications_read(current_user=Depends(get_current_user), db=Depends(get_db)):
    read_at = _now()
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"notifications_read_at": read_at, "updated_at": read_at}},
    )
    return {"ok": True, "read_at": read_at.isoformat()}


@router.post("/me/join-recruiter", response_model=UserPublic, status_code=status.HTTP_200_OK)
async def join_as_recruiter(current_user=Depends(get_current_user), db=Depends(get_db)):
    updated_at = _now()
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {
            "$addToSet": {"account_roles": {"$each": ["CREATIVE", "RECRUITER"]}},
            "$set": {"role": current_user.get("role", "CREATIVE"), "updated_at": updated_at},
        },
    )
    updated = await db.users.find_one({"_id": current_user["_id"]})
    return serialize_user(updated)


@router.post("/me/avatar", response_model=UserPublic, status_code=status.HTTP_200_OK)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    if file.content_type not in AVATAR_TYPES:
        raise HTTPException(status_code=415, detail=f"Unsupported avatar type: {file.content_type}")

    data = await file.read()
    if len(data) > MAX_AVATAR_SIZE:
        raise HTTPException(status_code=413, detail="Avatar must be 5 MB or smaller")
    detected_type = _detect_image_type(data)
    if detected_type != file.content_type:
        raise HTTPException(status_code=415, detail="Avatar contents do not match the declared file type")

    if _has_cloudinary_config():
        try:
            upload_result = await _cloudinary_upload_avatar(
                data,
                folder=f"talentverse/avatars/{current_user['_id']}",
                public_id=uuid.uuid4().hex,
            )
            avatar_url = upload_result["secure_url"]
        except Exception:
            avatar_url = _save_local_avatar(data, detected_type)
    else:
        avatar_url = _save_local_avatar(data, detected_type)

    updated_at = _now()
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"avatar": avatar_url, "updated_at": updated_at}},
    )
    updated = await db.users.find_one({"_id": current_user["_id"]})
    return serialize_user(updated)


@router.get("/discover", response_model=list[dict])
async def discover_users(
    search: str | None = None,
    location: str | None = None,
    role: str | None = None,
    limit: int = Query(12, le=30),
    skip: int = Query(0, ge=0),
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    uid = str(current_user["_id"])
    query: dict = {"_id": {"$ne": current_user["_id"]}}

    filters = []
    if location:
        filters.append({"location": {"$regex": re.escape(location[:80]), "$options": "i"}})
    if role:
        role_pattern = re.escape(role[:80])
        filters.append({
            "$or": [
                {"roles": {"$regex": role_pattern, "$options": "i"}},
                {"interested_roles": {"$regex": role_pattern, "$options": "i"}},
                {"skills": {"$regex": role_pattern, "$options": "i"}},
            ]
        })
    if search:
        search_pattern = re.escape(search[:80])
        filters.append({
            "$or": [
                {"name": {"$regex": search_pattern, "$options": "i"}},
                {"bio": {"$regex": search_pattern, "$options": "i"}},
                {"roles": {"$regex": search_pattern, "$options": "i"}},
                {"skills": {"$regex": search_pattern, "$options": "i"}},
            ]
        })
    if filters:
        query["$and"] = filters

    # Fix: added skip for pagination
    users = await db.users.find(query).skip(skip).limit(limit).sort("trust_score", -1).to_list(limit)
    target_ids = [str(user["_id"]) for user in users]
    connections = await db.connections.find({
        "participants_pair": {"$in": [sorted([uid, target_id]) for target_id in target_ids]},
        "status": {"$in": ["pending", "accepted"]},
    }).to_list(len(target_ids))
    by_other_id = {}
    for connection in connections:
        other_id = connection["recipient_id"] if connection["requester_id"] == uid else connection["requester_id"]
        by_other_id[other_id] = connection

    return [
        {
            "id": str(user["_id"]),
            "name": user.get("name", "TalentVerse user"),
            "avatar": user.get("avatar"),
            "roles": user.get("roles", []),
            "interested_roles": user.get("interested_roles", []),
            "skills": user.get("skills", []),
            "bio": user.get("bio"),
            "location": user.get("location"),
            "trust_score": user.get("trust_score", 50),
            "trust_score_level": user.get("trust_score_level", "Newcomer"),
            "connection_status": _connection_status(by_other_id.get(str(user["_id"])), uid),
        }
        for user in users
    ]


@router.get("/{user_id}", response_model=UserProfilePublic)
async def get_user(user_id: str, db=Depends(get_db)):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_public_user(user)


@router.patch("/me", response_model=UserPublic)
async def update_profile(
    payload: UserUpdate,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    updates = {k: v for k, v in payload.model_dump(mode="json").items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    updates["updated_at"] = _now()
    await db.users.update_one({"_id": current_user["_id"]}, {"$set": updates})
    updated = await db.users.find_one({"_id": current_user["_id"]})
    return serialize_user(updated)
