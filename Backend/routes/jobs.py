"""
Jobs routes: list, create, apply, filter, recruiter applicants view.
"""
import re
from datetime import datetime, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from config.database import get_db
from middleware.auth import get_current_user, get_current_recruiter
from models.schemas import JobCreate, JobPublic, RecruiterJobCreate
from utils.helpers import serialize_doc
from utils.trust_score import recalculate_trust_score

router = APIRouter()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _job_public(doc: dict) -> dict:
    doc = serialize_doc(doc)
    doc["applicant_count"] = len(doc.pop("applicants", []))
    return doc


@router.get("/", response_model=list[dict])
async def list_jobs(
    category: str | None = None,
    search: str | None = None,
    type: str | None = None,
    location: str | None = None,
    limit: Annotated[int, Query(le=50)] = 20,
    skip: Annotated[int, Query(ge=0)] = 0,
    db=Depends(get_db),
):
    query: dict = {"is_active": True}
    if category and category != "All":
        query["category"] = category
    if type:
        query["type"] = type
    if location:
        # Fix: re.escape to prevent regex injection
        query["location"] = {"$regex": re.escape(location[:80]), "$options": "i"}
    if search:
        query["$text"] = {"$search": search}

    cursor = db.jobs.find(query).skip(skip).limit(limit).sort("created_at", -1)
    return [_job_public(j) async for j in cursor]


@router.get("/{job_id}", response_model=dict)
async def get_job(job_id: str, db=Depends(get_db)):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _job_public(job)


@router.get("/{job_id}/applicants", response_model=list[dict])
async def list_job_applicants(
    job_id: str,
    limit: Annotated[int, Query(le=100)] = 50,
    skip: Annotated[int, Query(ge=0)] = 0,
    recruiter=Depends(get_current_recruiter),
    db=Depends(get_db),
):
    """Return paginated applicant profiles for a job the recruiter owns."""
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("posted_by") != str(recruiter["_id"]):
        raise HTTPException(status_code=403, detail="Not your listing")

    cursor = (
        db.job_applications.find({"job_id": job_id})
        .skip(skip)
        .limit(limit)
        .sort("applied_at", -1)
    )
    results = []
    async for app in cursor:
        results.append({
            "application_id": str(app["_id"]),
            "status": app.get("status", "pending"),
            "applied_at": app.get("applied_at"),
            **app.get("user_profile", {}),
        })
    return results


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_job(
    payload: JobCreate,
    recruiter=Depends(get_current_recruiter),
    db=Depends(get_db),
):
    if not ObjectId.is_valid(payload.company_id):
        raise HTTPException(status_code=400, detail="Invalid company ID")
    company = await db.companies.find_one({"_id": ObjectId(payload.company_id)})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if company.get("owner_id") != str(recruiter["_id"]):
        raise HTTPException(status_code=403, detail="You can only post jobs for companies you own")

    doc = payload.model_dump(mode="json")
    doc["company"] = company["name"]
    doc["posted_by"] = str(recruiter["_id"])
    doc["applicants"] = []
    doc["created_at"] = _now()
    result = await db.jobs.insert_one(doc)
    job = await db.jobs.find_one({"_id": result.inserted_id})
    return _job_public(job)


@router.post("/recruiter-post", response_model=dict, status_code=status.HTTP_201_CREATED)
async def post_recruiter_job(
    payload: RecruiterJobCreate,
    recruiter=Depends(get_current_recruiter),
    db=Depends(get_db),
):
    recruiter_id = str(recruiter["_id"])
    company_name = payload.company_name.strip()
    company = await db.companies.find_one({
        "owner_id": recruiter_id,
        "name": company_name,
    })

    if not company:
        company_doc = {
            "name": company_name,
            "owner_id": recruiter_id,
            "industry": payload.category,
            "location": payload.location,
            "created_at": _now(),
        }
        company_result = await db.companies.insert_one(company_doc)
        company = await db.companies.find_one({"_id": company_result.inserted_id})

    doc = payload.model_dump(mode="json", exclude={"company_name"})
    doc["company"] = company["name"]
    doc["company_id"] = str(company["_id"])
    doc["posted_by"] = recruiter_id
    doc["applicants"] = []
    doc["is_active"] = True
    doc["created_at"] = _now()

    result = await db.jobs.insert_one(doc)
    job = await db.jobs.find_one({"_id": result.inserted_id})
    return _job_public(job)


@router.post("/{job_id}/apply", status_code=status.HTTP_200_OK)
async def apply_to_job(
    job_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")

    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job or not job.get("is_active", True):
        raise HTTPException(status_code=404, detail="Job not found")

    uid = str(current_user["_id"])
    trust = current_user.get("trust_score", 50)

    if trust < job.get("min_trust_score", 0):
        raise HTTPException(
            status_code=403,
            detail=f"Your trust score ({trust}) is below the required {job['min_trust_score']}",
        )
    if await db.job_applications.find_one({"user_id": uid, "job_id": job_id}):
        raise HTTPException(status_code=409, detail="Already applied")

    user_profile = {
        "user_id": uid,
        "name": current_user.get("name", ""),
        "email": current_user.get("email", ""),
        "trust_score": trust,
        "trust_score_level": current_user.get("trust_score_level", "Newcomer"),
        "is_verified": current_user.get("is_verified", False),
        "portfolio_count": current_user.get("portfolio_count", 0),
        "roles": current_user.get("roles", []),
        "skills": current_user.get("skills", []),
        "location": current_user.get("location", ""),
        "avatar": current_user.get("avatar", ""),
    }

    try:
        await db.job_applications.insert_one({
            "user_id": uid,
            "job_id": job_id,
            "status": "pending",
            "applied_at": _now(),
            "user_profile": user_profile,
        })
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Already applied")

    # Keep applicants array for backward compat but rely on job_applications for queries
    await db.jobs.update_one({"_id": ObjectId(job_id)}, {"$addToSet": {"applicants": uid}})
    await recalculate_trust_score(uid, db)
    return {"message": "Application submitted successfully", "user_profile": user_profile}


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: str,
    recruiter=Depends(get_current_recruiter),
    db=Depends(get_db),
):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["posted_by"] != str(recruiter["_id"]):
        raise HTTPException(status_code=403, detail="Not your listing")
    await db.jobs.delete_one({"_id": ObjectId(job_id)})
