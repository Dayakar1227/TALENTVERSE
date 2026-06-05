"""
Portfolio routes: upload file, AI verification simulation, list, delete.
Cloudinary calls are wrapped in a thread executor to avoid blocking the event loop.
"""
import asyncio
import uuid
import os
from datetime import datetime, timezone
from functools import partial
from pathlib import Path

import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from bson import ObjectId
from dotenv import load_dotenv

from config.database import get_db
from middleware.auth import get_current_user
from utils.helpers import serialize_doc, serialize_portfolio_public
from utils.trust_score import recalculate_trust_score

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "video/mp4"}
FILE_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB
UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads" / "portfolio"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _has_cloudinary_config() -> bool:
    values = [
        os.getenv("CLOUDINARY_CLOUD_NAME"),
        os.getenv("CLOUDINARY_API_KEY"),
        os.getenv("CLOUDINARY_API_SECRET"),
    ]
    return all(values) and not any(str(value).startswith("<") for value in values)


def _detect_file_type(data: bytes) -> str | None:
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    if len(data) >= 12 and data[4:8] == b"ftyp":
        return "video/mp4"
    return None


def _save_local_file(data: bytes, content_type: str) -> tuple[str, str]:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    suffix = FILE_EXTENSIONS[content_type]
    file_key = f"{uuid.uuid4().hex}{suffix}"
    target = UPLOAD_DIR / file_key
    target.write_bytes(data)
    return f"/uploads/portfolio/{file_key}", file_key


def _delete_local_file(file_key: str) -> None:
    target = (UPLOAD_DIR / file_key).resolve()
    upload_root = UPLOAD_DIR.resolve()
    if upload_root not in target.parents:
        raise HTTPException(status_code=400, detail="Invalid stored file key")
    if target.exists():
        target.unlink()


async def _cloudinary_upload(data: bytes, folder: str, public_id: str) -> dict:
    """Run blocking Cloudinary upload in a thread pool to avoid blocking the event loop."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        partial(
            cloudinary.uploader.upload,
            data,
            folder=folder,
            resource_type="auto",
            public_id=public_id,
        ),
    )


async def _cloudinary_destroy(file_key: str) -> dict:
    """Run blocking Cloudinary destroy in a thread pool."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        partial(cloudinary.uploader.destroy, file_key, resource_type="auto"),
    )


@router.get("/", response_model=list[dict])
async def list_portfolio(
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    target_id = str(current_user["_id"])
    cursor = db.portfolio.find({"user_id": target_id}).sort("created_at", -1)
    return [serialize_portfolio_public(p) async for p in cursor]


@router.get("/public/{user_id}", response_model=list[dict])
async def list_public_portfolio(user_id: str, db=Depends(get_db)):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    cursor = db.portfolio.find({"user_id": user_id}).sort("created_at", -1)
    return [serialize_portfolio_public(p) async for p in cursor]


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_portfolio(
    request: Request,
    title: str = Form(..., min_length=2, max_length=150),
    category: str = Form(..., max_length=80),
    description: str = Form("", max_length=2000),
    tags: str = Form("", max_length=500),
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    # Guard against oversized uploads before reading entire body
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 500 MB limit")

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {file.content_type}")

    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 500 MB limit")
    detected_type = _detect_file_type(data)
    if detected_type != file.content_type:
        raise HTTPException(status_code=415, detail="File contents do not match the declared file type")

    if _has_cloudinary_config():
        try:
            folder = f"talentverse/{current_user['_id']}"
            upload_result = await _cloudinary_upload(data, folder, uuid.uuid4().hex)
            image_url = upload_result["secure_url"]
            file_key = upload_result["public_id"]
        except Exception:
            image_url, file_key = _save_local_file(data, detected_type)
    else:
        image_url, file_key = _save_local_file(data, detected_type)

    doc = {
        "user_id": str(current_user["_id"]),
        "title": title,
        "category": category,
        "description": description,
        "tags": [t.strip()[:40] for t in tags.split(",") if t.strip()][:20],
        "image_url": image_url,
        "file_key": file_key,
        "verification_status": "pending",
        "verification_id": None,
        "trust_score_boost": 0.0,
        "views": 0,
        "likes": 0,
        "created_at": _now(),
    }
    result = await db.portfolio.insert_one(doc)
    await recalculate_trust_score(str(current_user["_id"]), db)
    item = await db.portfolio.find_one({"_id": result.inserted_id})
    return serialize_portfolio_public(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio_item(
    item_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid item ID")
    item = await db.portfolio.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item["user_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not your portfolio item")

    if str(item.get("image_url", "")).startswith("/uploads/portfolio/"):
        _delete_local_file(item["file_key"])
    elif _has_cloudinary_config():
        try:
            result = await _cloudinary_destroy(item["file_key"])
            if result.get("result") not in {"ok", "not found"}:
                raise HTTPException(status_code=502, detail="Could not delete remote file")
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Could not delete remote file") from exc

    await db.portfolio.delete_one({"_id": ObjectId(item_id)})
    await recalculate_trust_score(str(current_user["_id"]), db)


# ── Helpers ────────────────────────────────────────────────────────────────────
def _simulate_ai_verification(content_type: str) -> float:
    """Returns a trust-score boost. Replace with real AI pipeline."""
    return 2.4 if content_type.startswith("image") else 3.2
