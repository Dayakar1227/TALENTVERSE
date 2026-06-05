"""
Async MongoDB Atlas connection via Motor.
"""
import os
from pathlib import Path

import certifi
from dotenv import load_dotenv
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError, OperationFailure

from config.local_database import LocalDatabase

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "Talentverse")
BASE_DIR = Path(__file__).resolve().parents[1]
USE_LOCAL_DB_FALLBACK = os.getenv("USE_LOCAL_DB_FALLBACK", "true").lower() == "true"

_client: AsyncIOMotorClient | None = None
db = None
_last_connection_error: str | None = None


async def connect_db() -> None:
    global _client, db, _last_connection_error
    if not MONGODB_URI:
        raise RuntimeError("MONGODB_URI is missing from .env")

    client = AsyncIOMotorClient(
        MONGODB_URI,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=10000,
        connectTimeoutMS=10000,
        socketTimeoutMS=10000,
    )
    database = client[DB_NAME]

    await database.users.create_index("email", unique=True)
    await database.jobs.create_index([("title", "text"), ("company", "text")])
    try:
        await database.collaborations.create_index([
            ("title", "text"),
            ("description", "text"),
            ("location", "text"),
            ("roles_needed", "text"),
            ("category", "text"),
        ], name="collaboration_text")
    except OperationFailure:
        async for index in database.collaborations.list_indexes():
            if "textIndexVersion" in index:
                await database.collaborations.drop_index(index["name"])
        await database.collaborations.create_index([
            ("title", "text"),
            ("description", "text"),
            ("location", "text"),
            ("roles_needed", "text"),
            ("category", "text"),
        ], name="collaboration_text")
    await database.portfolio.create_index("user_id")
    await database.connections.create_index([("requester_id", 1), ("recipient_id", 1)])
    await database.connections.create_index([("recipient_id", 1), ("status", 1)])
    await database.connections.create_index("participants_pair", unique=True)
    try:
        await database.job_applications.create_index([("user_id", 1), ("job_id", 1)], unique=True)
    except DuplicateKeyError:
        await database.job_applications.create_index([("user_id", 1), ("job_id", 1)])

    # Fix: add job_id-only index so recruiter applicant listing is fast
    await database.job_applications.create_index([("job_id", 1), ("applied_at", -1)])

    await database.token_blocklist.create_index("jti", unique=True)
    await database.token_blocklist.create_index("expires_at", expireAfterSeconds=0)
    await database.companies.create_index("owner_id")

    _client = client
    db = database
    _last_connection_error = None
    print(f"Connected to MongoDB Atlas database: {DB_NAME}")


async def close_db() -> None:
    if _client:
        _client.close()
        print("MongoDB connection closed.")


def get_db():
    if db is None:
        detail = "Database is not connected. Check MongoDB Atlas network access and TLS settings, then restart the backend."
        if _last_connection_error:
            detail = f"{detail} Last error: {_last_connection_error.split(', Timeout:')[0]}"
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)
    return db


def use_local_fallback_db() -> None:
    global db
    db = LocalDatabase(BASE_DIR / "local_dev_db.json")


def set_connection_error(error: Exception) -> None:
    global _last_connection_error
    _last_connection_error = str(error)


def get_connection_status() -> dict:
    is_fallback = isinstance(db, LocalDatabase)
    return {
        "connected": db is not None and not is_fallback,
        "database": DB_NAME,
        "mode": "local_fallback" if is_fallback else "mongodb",
        "last_error": _last_connection_error,
    }
