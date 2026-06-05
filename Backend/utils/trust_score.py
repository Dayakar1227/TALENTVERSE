"""
Trust Score calculation engine.

Formula (0 – 100):
  base                   = 50
  + portfolio_count * 2.4  (capped at +30)
  + verified_items * 1.5   (capped at +10)
  + unique applications * 0.25 (capped at +3)
  → clamped [0, 100]
"""
from bson import ObjectId

LEVEL_THRESHOLDS = [
    (90, "Legend"),
    (75, "Expert"),
    (60, "Professional"),
    (40, "Rising Star"),
    (0,  "Newcomer"),
]


def trust_level(score: float) -> str:
    for threshold, label in LEVEL_THRESHOLDS:
        if score >= threshold:
            return label
    return "Newcomer"


async def recalculate_trust_score(user_id: str, db) -> float:
    portfolio_count = await db.portfolio.count_documents({"user_id": user_id})
    verified_count = await db.portfolio.count_documents({
        "user_id": user_id,
        "verification_status": "verified",
    })
    application_job_ids = await db.job_applications.distinct("job_id", {"user_id": user_id})
    applications_count = len(application_job_ids)

    score = 50.0
    score += min(portfolio_count * 2.4, 30)
    score += min(verified_count * 1.5, 10)
    score += min(applications_count * 0.25, 3)
    score = round(min(max(score, 0), 100), 1)

    level = trust_level(score)
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "trust_score": score,
            "trust_score_level": level,
            "portfolio_count": portfolio_count,
        }},
    )
    return score
