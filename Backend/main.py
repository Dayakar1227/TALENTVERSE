from contextlib import asynccontextmanager
import logging
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from config.database import (
    USE_LOCAL_DB_FALLBACK,
    close_db,
    connect_db,
    get_connection_status,
    set_connection_error,
    use_local_fallback_db,
)
from routes import auth, collaborations, companies, connections, jobs, portfolio, users


BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BASE_DIR.parent / "Frontend" / "dist"
logger = logging.getLogger("talentverse")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))


def _cors_origins() -> list[str]:
    configured = os.getenv("CORS_ORIGINS")
    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip()]
    return [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await connect_db()
    except Exception as exc:
        set_connection_error(exc)
        if USE_LOCAL_DB_FALLBACK:
            use_local_fallback_db()
            logger.exception("Database connection failed; API is using local fallback storage.")
        else:
            logger.exception("Database connection failed; API is starting without MongoDB.")
    yield
    await close_db()


app = FastAPI(
    title="TalentVerse API",
    description="Backend for India's creative talent platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["Portfolio"])
app.include_router(connections.router, prefix="/api/connections", tags=["Connections"])
app.include_router(
    collaborations.router,
    prefix="/api/collaborations",
    tags=["Collaborations"],
)
app.include_router(companies.router, prefix="/api/companies", tags=["Companies"])


@app.middleware("http")
async def log_requests(request: Request, call_next):
    response = await call_next(request)
    logger.info(
        "request",
        extra={
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
        },
    )
    return response


@app.get("/api/health", tags=["Health"])
async def health():
    return {
        "status": "ok",
        "message": "TalentVerse API is running",
        "database": get_connection_status(),
    }


if (FRONTEND_DIST / "assets").exists():
    app.mount(
        "/assets",
        StaticFiles(directory=FRONTEND_DIST / "assets"),
        name="frontend-assets",
    )

UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
app.mount(
    "/uploads",
    StaticFiles(directory=UPLOADS_DIR),
    name="uploads",
)


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)

    return {
        "status": "frontend_build_missing",
        "message": "Run `npm run build` inside the Frontend folder, then restart the backend.",
    }
