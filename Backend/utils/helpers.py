"""
Helper utilities: MongoDB document serialization, pagination.
"""
from bson import ObjectId
from models.schemas import UserProfilePublic, UserPublic


def _account_roles(user: dict) -> list[str]:
    roles = user.get("account_roles")
    if not roles:
        roles = [user.get("role", "CREATIVE")]
    if user.get("role") == "RECRUITER" and "CREATIVE" not in roles:
        roles = ["CREATIVE", *roles]
    return list(dict.fromkeys(roles))


def _serialize_value(v):
    """Recursively convert ObjectId values to strings."""
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, dict):
        return {k: _serialize_value(val) for k, val in v.items()}
    if isinstance(v, list):
        return [_serialize_value(item) for item in v]
    return v


def serialize_doc(doc: dict) -> dict:
    """Convert a raw MongoDB document to a JSON-safe dict (handles nested ObjectIds)."""
    result = {}
    for k, v in doc.items():
        if k == "_id":
            result["id"] = str(v)
        else:
            result[k] = _serialize_value(v)
    return result


def serialize_user(user: dict) -> UserPublic:
    """Build a UserPublic model from a raw MongoDB user document."""
    return UserPublic(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user["role"],
        account_roles=_account_roles(user),
        roles=user.get("roles", []),
        interested_roles=user.get("interested_roles", []),
        gender=user.get("gender"),
        date_of_birth=user.get("date_of_birth"),
        avatar=user.get("avatar"),
        skills=user.get("skills", []),
        bio=user.get("bio"),
        location=user.get("location"),
        website=user.get("website"),
        trust_score=user.get("trust_score", 50.0),
        trust_score_level=user.get("trust_score_level", "Newcomer"),
        is_verified=user.get("is_verified", False),
        portfolio_count=user.get("portfolio_count", 0),
        created_at=user["created_at"],
    )


def serialize_public_user(user: dict) -> UserProfilePublic:
    """Build a sanitized public profile without email, gender, DOB, or auth state."""
    return UserProfilePublic(
        id=str(user["_id"]),
        name=user["name"],
        role=user.get("role", "CREATIVE"),
        account_roles=_account_roles(user),
        roles=user.get("roles", []),
        interested_roles=user.get("interested_roles", []),
        avatar=user.get("avatar"),
        skills=user.get("skills", []),
        bio=user.get("bio"),
        location=user.get("location"),
        website=user.get("website"),
        trust_score=user.get("trust_score", 50.0),
        trust_score_level=user.get("trust_score_level", "Newcomer"),
        is_verified=user.get("is_verified", False),
        portfolio_count=user.get("portfolio_count", 0),
        created_at=user["created_at"],
    )


def serialize_portfolio_public(item: dict) -> dict:
    """Return a public-safe portfolio item without storage internals."""
    doc = serialize_doc(item)
    doc.pop("file_key", None)
    return doc
