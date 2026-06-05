"""
Collaborations routes: list nearby, create, show interest, delete.
"""
from datetime import datetime, timezone
import re
from fastapi import APIRouter, Depends, HTTPException, Query, status
from bson import ObjectId

from config.database import get_db
from middleware.auth import get_current_user
from models.schemas import CollaborationCreate
from utils.helpers import serialize_doc

router = APIRouter()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _collab_public(doc: dict) -> dict:
    doc = serialize_doc(doc)
    doc["interested_count"] = len(doc.pop("interested_users", []))
    return doc


@router.get("/", response_model=list[dict])
async def list_collaborations(
    category: str | None = None,
    budget_type: str | None = None,
    location: str | None = None,
    role: str | None = None,
    search: str | None = None,
    limit: int = Query(20, le=50),
    skip: int = Query(0, ge=0),
    db=Depends(get_db),
):
    query: dict = {"is_open": True}
    if category:
        query["category"] = category
    if budget_type:
        query["budget_type"] = budget_type
    if location:
        query["location"] = {"$regex": re.escape(location[:80]), "$options": "i"}
    if role:
        query["roles_needed"] = {"$regex": re.escape(role[:80]), "$options": "i"}
    if search:
        query["$text"] = {"$search": search[:80]}

    cursor = db.collaborations.find(query).skip(skip).limit(limit).sort("created_at", -1)
    return [_collab_public(c) async for c in cursor]


@router.get("/{collab_id}", response_model=dict)
async def get_collaboration(collab_id: str, db=Depends(get_db)):
    if not ObjectId.is_valid(collab_id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    c = await db.collaborations.find_one({"_id": ObjectId(collab_id)})
    if not c:
        raise HTTPException(status_code=404, detail="Collaboration not found")
    return _collab_public(c)


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_collaboration(
    payload: CollaborationCreate,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    doc = payload.model_dump(mode="json")
    doc["creator_id"] = str(current_user["_id"])
    doc["creator_name"] = current_user.get("name", "")
    doc["creator_avatar"] = current_user.get("avatar")
    doc["interested_users"] = []
    doc["created_at"] = _now()
    result = await db.collaborations.insert_one(doc)
    c = await db.collaborations.find_one({"_id": result.inserted_id})
    return _collab_public(c)


@router.post("/{collab_id}/interest", status_code=status.HTTP_200_OK)
async def express_interest(
    collab_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    if not ObjectId.is_valid(collab_id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    c = await db.collaborations.find_one({"_id": ObjectId(collab_id)})
    if not c:
        raise HTTPException(status_code=404, detail="Not found")

    uid = str(current_user["_id"])
    if uid in c.get("interested_users", []):
        # Toggle off
        await db.collaborations.update_one(
            {"_id": ObjectId(collab_id)}, {"$pull": {"interested_users": uid}}
        )
        return {"message": "Interest removed"}

    await db.collaborations.update_one(
        {"_id": ObjectId(collab_id)}, {"$addToSet": {"interested_users": uid}}
    )
    return {"message": "Interest registered"}


@router.delete("/{collab_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collaboration(
    collab_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    if not ObjectId.is_valid(collab_id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    c = await db.collaborations.find_one({"_id": ObjectId(collab_id)})
    if not c:
        raise HTTPException(status_code=404, detail="Not found")
    if c["creator_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not your collaboration")
    await db.collaborations.delete_one({"_id": ObjectId(collab_id)})
