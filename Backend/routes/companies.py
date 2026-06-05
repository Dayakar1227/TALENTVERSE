"""
Company routes: get company + its active job listings.
"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId

from config.database import get_db
from utils.helpers import serialize_doc

router = APIRouter()


@router.get("/{company_id}")
async def get_company(company_id: str, db=Depends(get_db)):
    if not ObjectId.is_valid(company_id):
        raise HTTPException(status_code=400, detail="Invalid company ID")
    company = await db.companies.find_one({"_id": ObjectId(company_id)})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Attach active job listings
    jobs_cursor = db.jobs.find({"company_id": company_id, "is_active": True})
    jobs = [serialize_doc(j) async for j in jobs_cursor]
    result = serialize_doc(company)
    result["jobs"] = jobs
    return result


@router.get("/")
async def list_companies(
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
    skip: Annotated[int, Query(ge=0)] = 0,
    db=Depends(get_db),
):
    cursor = db.companies.find().sort("name", 1).skip(skip).limit(limit)
    return [serialize_doc(c) async for c in cursor]
