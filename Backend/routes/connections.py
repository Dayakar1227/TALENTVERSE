"""
Connection routes: friend requests for collaboration discovery.
"""
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from config.database import get_db
from middleware.auth import get_current_user
from utils.helpers import serialize_doc

router = APIRouter()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _pair(first_id: str, second_id: str) -> list[str]:
    return sorted([first_id, second_id])


def _public_user_snapshot(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user.get("name", "TalentVerse user"),
        "avatar": user.get("avatar"),
        "roles": user.get("roles", []),
        "skills": user.get("skills", []),
        "location": user.get("location"),
        "trust_score": user.get("trust_score", 50),
    }


def _connection_public(doc: dict, current_user_id: str) -> dict:
    data = serialize_doc(doc)
    requester_id = data.get("requester_id")
    recipient_id = data.get("recipient_id")
    data["direction"] = "outgoing" if requester_id == current_user_id else "incoming"
    data["other_user"] = data.get("recipient") if requester_id == current_user_id else data.get("requester")
    data.pop("participants_pair", None)
    return data


@router.get("/", response_model=dict)
async def list_connections(current_user=Depends(get_current_user), db=Depends(get_db)):
    uid = str(current_user["_id"])
    cursor = db.connections.find({
        "$or": [{"requester_id": uid}, {"recipient_id": uid}],
        "status": {"$in": ["pending", "accepted"]},
    }).sort("updated_at", -1)

    incoming = []
    outgoing = []
    accepted = []
    async for connection in cursor:
        item = _connection_public(connection, uid)
        if item["status"] == "accepted":
            accepted.append(item)
        elif item["direction"] == "incoming":
            incoming.append(item)
        else:
            outgoing.append(item)

    return {"incoming": incoming, "outgoing": outgoing, "accepted": accepted}


@router.post("/request/{user_id}", status_code=status.HTTP_201_CREATED)
async def send_connection_request(
    user_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    requester_id = str(current_user["_id"])
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    if user_id == requester_id:
        raise HTTPException(status_code=400, detail="You cannot send a request to yourself")

    recipient = await db.users.find_one({"_id": ObjectId(user_id)})
    if not recipient:
        raise HTTPException(status_code=404, detail="User not found")

    existing = await db.connections.find_one({"participants_pair": _pair(requester_id, user_id)})
    now = _now()
    if existing:
        if existing.get("status") == "accepted":
            return {"message": "Already connected", "connection": _connection_public(existing, requester_id)}
        if existing.get("status") == "pending":
            return {"message": "Request already pending", "connection": _connection_public(existing, requester_id)}

        await db.connections.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "requester_id": requester_id,
                    "recipient_id": user_id,
                    "requester": _public_user_snapshot(current_user),
                    "recipient": _public_user_snapshot(recipient),
                    "status": "pending",
                    "updated_at": now,
                }
            },
        )
        updated = await db.connections.find_one({"_id": existing["_id"]})
        return {"message": "Request sent", "connection": _connection_public(updated, requester_id)}

    doc = {
        "requester_id": requester_id,
        "recipient_id": user_id,
        "participants_pair": _pair(requester_id, user_id),
        "requester": _public_user_snapshot(current_user),
        "recipient": _public_user_snapshot(recipient),
        "status": "pending",
        "created_at": now,
        "updated_at": now,
    }
    result = await db.connections.insert_one(doc)
    created = await db.connections.find_one({"_id": result.inserted_id})
    return {"message": "Request sent", "connection": _connection_public(created, requester_id)}


@router.patch("/{connection_id}/accept")
async def accept_connection_request(
    connection_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    if not ObjectId.is_valid(connection_id):
        raise HTTPException(status_code=400, detail="Invalid request ID")

    uid = str(current_user["_id"])
    connection = await db.connections.find_one({"_id": ObjectId(connection_id)})
    if not connection:
        raise HTTPException(status_code=404, detail="Request not found")
    if connection.get("recipient_id") != uid:
        raise HTTPException(status_code=403, detail="Only the recipient can accept this request")
    if connection.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Request is not pending")

    await db.connections.update_one(
        {"_id": connection["_id"]},
        {"$set": {"status": "accepted", "updated_at": _now()}},
    )
    updated = await db.connections.find_one({"_id": connection["_id"]})
    return {"message": "Request accepted", "connection": _connection_public(updated, uid)}


@router.patch("/{connection_id}/decline")
async def decline_connection_request(
    connection_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    if not ObjectId.is_valid(connection_id):
        raise HTTPException(status_code=400, detail="Invalid request ID")

    uid = str(current_user["_id"])
    connection = await db.connections.find_one({"_id": ObjectId(connection_id)})
    if not connection:
        raise HTTPException(status_code=404, detail="Request not found")
    if connection.get("recipient_id") != uid:
        raise HTTPException(status_code=403, detail="Only the recipient can decline this request")
    if connection.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Request is not pending")

    await db.connections.update_one(
        {"_id": connection["_id"]},
        {"$set": {"status": "declined", "updated_at": _now()}},
    )
    return {"message": "Request declined"}
