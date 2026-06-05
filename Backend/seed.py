"""
Seed script – populates MongoDB Atlas with TalentVerse demo data.
Run once:  python seed.py
"""
import asyncio
import os
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv
from pymongo.errors import DuplicateKeyError, OperationFailure

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "")
DB_NAME = os.getenv("DB_NAME", "talentverse")
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


COMPANIES = [
    {"slug": "c1", "name": "Creative India Labs",   "logo": "https://picsum.photos/seed/ci/200/200",  "banner": "https://picsum.photos/seed/ci_banner/1200/400",  "mission": "Empowering Bharat with world-class visual storytelling.", "description": "Creative India Labs is Mumbai's premier agency for commercial photography.", "industry": "Advertising & Marketing", "size": "100-200 Employees", "website": "https://creativeindialabs.in",  "location": "Mumbai, India"},
    {"slug": "c2", "name": "Desi Reels Productions", "logo": "https://picsum.photos/seed/dr/200/200",  "banner": "https://picsum.photos/seed/dr_banner/1200/400",  "mission": "The future of Indian OTT and digital content.",           "description": "Based in Bengaluru, digital-first production house.",              "industry": "Media Production",        "size": "50-100 Employees",  "website": "https://desireels.com",        "location": "Bengaluru, India"},
    {"slug": "c3", "name": "Delhi Design House",     "logo": "https://picsum.photos/seed/ddh/200/200", "banner": "https://picsum.photos/seed/ddh_banner/1200/400", "mission": "Crafting luxury visual identities for the modern India.",  "description": "Premium branding for lifestyle and fashion brands.",              "industry": "Design Services",         "size": "20-50 Employees",   "website": "https://delhidesignhouse.in",  "location": "New Delhi, India"},
    {"slug": "c4", "name": "Hyderabad Motion Tech",  "logo": "https://picsum.photos/seed/hmt/200/200", "banner": "https://picsum.photos/seed/hmt_banner/1200/400", "mission": "Pioneering VFX and post-production for Indian cinema.",    "description": "Specialized post-production studio in Hitech City.",             "industry": "Entertainment",           "size": "40-80 Employees",   "website": "https://hyderabadmotion.io",  "location": "Hyderabad, India"},
]

JOBS_TEMPLATE = [
    {"title": "Senior Commercial Photographer", "company": "Creative India Labs",    "company_slug": "c1", "location": "Mumbai (Andheri)",  "salary": "₹15L - ₹25L PA",    "type": "Full-time", "category": "Photography",   "min_trust_score": 85},
    {"title": "Video Editor (OTT Series)",       "company": "Desi Reels Productions", "company_slug": "c2", "location": "Bengaluru",         "salary": "₹80k - ₹1.2L /mo",  "type": "Contract",  "category": "Video Edit",    "min_trust_score": 70},
    {"title": "Art Director",                    "company": "Delhi Design House",     "company_slug": "c3", "location": "New Delhi",          "salary": "₹18L - ₹30L PA",    "type": "Full-time", "category": "Direction",     "min_trust_score": 90},
    {"title": "Product Colorist",                "company": "Hyderabad Motion Tech",  "company_slug": "c4", "location": "Remote",             "salary": "₹3,500 /hr",         "type": "Freelance", "category": "Video Edit",    "min_trust_score": 80},
    {"title": "Scriptwriter (Vernacular)",        "company": "Desi Reels Productions", "company_slug": "c2", "location": "Chennai",            "salary": "₹6L - ₹10L PA",     "type": "Contract",  "category": "Story Writing", "min_trust_score": 75},
    {"title": "Assistant Film Director",          "company": "Delhi Design House",     "company_slug": "c3", "location": "Mumbai",             "salary": "₹12L+ PA",           "type": "Full-time", "category": "Direction",     "min_trust_score": 85},
]

COLLABS_TEMPLATE = [
    {"title": 'Short Film: "The Tea Stall"', "creator_name": "Arjun Mehra", "creator_avatar": "https://picsum.photos/seed/arjun/100", "location": "Andheri West, Mumbai", "roles_needed": ["Director", "Cinematographer", "Editor"], "budget_type": "Passion Project", "description": "Looking for a small crew to film a warm Mumbai story around an old tea stall near Andheri station.", "category": "Film"},
    {"title": "Mumbai Fashion Portrait Sprint", "creator_name": "Naina Kapoor", "creator_avatar": "https://picsum.photos/seed/naina/100", "location": "Bandra, Mumbai", "roles_needed": ["Photographer", "Stylist", "Makeup Artist"], "budget_type": "Paid", "description": "Weekend fashion portrait shoot for two emerging models. Need a photographer with natural-light and editorial framing experience.", "category": "Photography"},
    {"title": "Marine Drive Brand Reel", "creator_name": "Kabir Sethi", "creator_avatar": "https://picsum.photos/seed/kabir/100", "location": "Marine Drive, Mumbai", "roles_needed": ["Director", "Video Editor", "Cinematographer"], "budget_type": "Low Budget", "description": "Creating a 45-second lifestyle reel for a local accessories label around sunset at Marine Drive.", "category": "Video"},
    {"title": "Street Photography: Cubbon Park", "creator_name": "Priya Sharma", "creator_avatar": "https://picsum.photos/seed/priya/100", "location": "Cubbon Park, Bengaluru", "roles_needed": ["Photographer", "Stylist"], "budget_type": "Split", "description": "Planning a Sunday morning photowalk at Cubbon Park with two models and a small styling team.", "category": "Photography"},
    {"title": "Bengaluru Indie Cafe Music Video", "creator_name": "Ananya Rao", "creator_avatar": "https://picsum.photos/seed/ananya/100", "location": "Indiranagar, Bengaluru", "roles_needed": ["Director", "Lighting Tech", "Editor"], "budget_type": "Paid", "description": "Acoustic music video for an indie artist inside a cafe. Looking for a small team comfortable with low-light interiors.", "category": "Video"},
    {"title": "Indie Pop Music Video", "creator_name": "Rohan Gupta", "creator_avatar": "https://picsum.photos/seed/rohan/100", "location": "Hauz Khas Village, Delhi", "roles_needed": ["Lighting Tech", "Editor"], "budget_type": "Low Budget", "description": "Shooting a music video for a new indie artist across Hauz Khas lanes and rooftop spaces.", "category": "Video"},
    {"title": "Delhi Theatre Poster Shoot", "creator_name": "Meera Khanna", "creator_avatar": "https://picsum.photos/seed/meera/100", "location": "Mandi House, Delhi", "roles_needed": ["Photographer", "Designer", "Art Director"], "budget_type": "Paid", "description": "Poster and stills shoot for a new stage play. Need dramatic lighting and quick-turnaround edits.", "category": "Theatre"},
    {"title": "Experimental Theatre Doc", "creator_name": "Ishaan Reddy", "creator_avatar": "https://picsum.photos/seed/ishaan/100", "location": "Banjara Hills, Hyderabad", "roles_needed": ["Sound Engineer", "Cameraman", "Editor"], "budget_type": "Passion Project", "description": "Documenting the rehearsal of a Telugu theatre group, with focus on backstage process and actor preparation.", "category": "Film"},
    {"title": "Hyderabad Product Launch BTS", "creator_name": "Sana Ali", "creator_avatar": "https://picsum.photos/seed/sana/100", "location": "HITEC City, Hyderabad", "roles_needed": ["Photographer", "Videographer", "Editor"], "budget_type": "Paid", "description": "Behind-the-scenes coverage for a tech product launch. Need fast delivery of photo selects and a short recap reel.", "category": "Photography"},
    {"title": "Chennai Dance Documentary", "creator_name": "Karthik Narayan", "creator_avatar": "https://picsum.photos/seed/karthik/100", "location": "Mylapore, Chennai", "roles_needed": ["Director", "Cinematographer", "Sound Engineer"], "budget_type": "Low Budget", "description": "Short documentary on young Bharatanatyam dancers preparing for their first major stage performance.", "category": "Film"},
    {"title": "Pune Startup Founder Portraits", "creator_name": "Riya Deshpande", "creator_avatar": "https://picsum.photos/seed/riya/100", "location": "Koregaon Park, Pune", "roles_needed": ["Photographer", "Retoucher", "Stylist"], "budget_type": "Paid", "description": "Clean editorial portraits for startup founders, shot across co-working spaces and outdoor cafes.", "category": "Photography"},
    {"title": "Kolkata Short Play Reading", "creator_name": "Sourav Banerjee", "creator_avatar": "https://picsum.photos/seed/sourav/100", "location": "Park Street, Kolkata", "roles_needed": ["Actor", "Director", "Writer"], "budget_type": "Passion Project", "description": "Table read and staged reading for a short theatre piece exploring old Kolkata friendships.", "category": "Theatre"},
]

DEMO_USER = {
    "name": "Dayakar",
    "email": "dayakar@talentverse.com",
    "password": "password123",
    "role": "RECRUITER",
    "avatar": "https://picsum.photos/seed/dayakar/150",
    "skills": ["Photography", "Lightroom", "Branding"],
    "trust_score": 88.0,
    "trust_score_level": "Expert",
}


async def seed():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]

    print("Seeding TalentVerse...")

    # ── Companies ────────────────────────────────────────────────────────────
    slug_to_id: dict = {}
    for company_template in COMPANIES:
        c = company_template.copy()
        slug = c.pop("slug")
        c["owner_id"] = "seed"
        c["updated_at"] = utc_now()
        existing = await db.companies.find_one({"name": c["name"]})
        if existing:
            slug_to_id[slug] = str(existing["_id"])
            await db.companies.update_one(
                {"_id": existing["_id"]},
                {"$set": c},
            )
        else:
            c["created_at"] = utc_now()
            r = await db.companies.insert_one(c)
            slug_to_id[slug] = str(r.inserted_id)
    print(f"  OK {len(COMPANIES)} companies")

    # ── Demo user ─────────────────────────────────────────────────────────────
    existing_user = await db.users.find_one({"email": DEMO_USER["email"]})
    if existing_user:
        demo_user_id = str(existing_user["_id"])
    else:
        u = DEMO_USER.copy()
        u["hashed_password"] = pwd_ctx.hash(u.pop("password"))
        u["is_verified"] = True
        u["portfolio_count"] = 0
        u["is_email_verified"] = True
        u["token_version"] = 0
        u["created_at"] = utc_now()
        u["updated_at"] = utc_now()
        r = await db.users.insert_one(u)
        demo_user_id = str(r.inserted_id)
    print("  OK Demo user (dayakar@talentverse.com / password123)")

    # ── Jobs ─────────────────────────────────────────────────────────────────
    if await db.jobs.count_documents({}) == 0:
        jobs_to_insert = []
        for job_template in JOBS_TEMPLATE:
            j = job_template.copy()
            slug = j.pop("company_slug")
            j["company_id"] = slug_to_id.get(slug, "")
            j["posted_by"] = demo_user_id
            j["applicants"] = []
            j["is_active"] = True
            j["description"] = ""
            j["requirements"] = []
            j["created_at"] = utc_now()
            jobs_to_insert.append(j)
        await db.jobs.insert_many(jobs_to_insert)
    print(f"  OK {len(JOBS_TEMPLATE)} jobs")

    # ── Collaborations ────────────────────────────────────────────────────────
    for collab_template in COLLABS_TEMPLATE:
        c = collab_template.copy()
        c["creator_id"] = demo_user_id
        c["interested_users"] = []
        c["is_open"] = True
        c["updated_at"] = utc_now()
        await db.collaborations.update_one(
            {"title": c["title"]},
            {
                "$set": c,
                "$setOnInsert": {"created_at": utc_now()},
            },
            upsert=True,
        )
    print(f"  OK {len(COLLABS_TEMPLATE)} collaborations")

    # ── Indexes ────────────────────────────────────────────────────────────────
    await db.users.create_index("email", unique=True)
    await db.jobs.create_index([("title", "text"), ("company", "text")])
    try:
        await db.collaborations.create_index([
            ("title", "text"),
            ("description", "text"),
            ("location", "text"),
            ("roles_needed", "text"),
            ("category", "text"),
        ], name="collaboration_text")
    except OperationFailure:
        async for index in db.collaborations.list_indexes():
            if "textIndexVersion" in index:
                await db.collaborations.drop_index(index["name"])
        await db.collaborations.create_index([
            ("title", "text"),
            ("description", "text"),
            ("location", "text"),
            ("roles_needed", "text"),
            ("category", "text"),
        ], name="collaboration_text")
    await db.portfolio.create_index("user_id")
    try:
        await db.job_applications.create_index([("user_id", 1), ("job_id", 1)], unique=True)
    except DuplicateKeyError:
        await db.job_applications.create_index([("user_id", 1), ("job_id", 1)])
    print("  OK Indexes created")

    client.close()
    print("\nSeed complete! Login: dayakar@talentverse.com / password123")


if __name__ == "__main__":
    asyncio.run(seed())
