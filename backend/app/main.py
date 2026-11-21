import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.base import Base
from app.database.session import engine
import app.models  # Ensure all SQLAlchemy models are registered
from app.routers import (
    health_router,
    findings_router,
    tasks_router,
    dashboard_router,
    chat_router,
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("patchpilot")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist (useful for SQLite fallback and tests)
    logger.info("Initializing PatchPilot database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
    yield
    logger.info("Shutting down PatchPilot backend...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "PatchPilot backend API — Intelligent Security Remediation Assistant.\n\n"
        "Workflow: Understand → Remediate → Learn.\n"
        "Helps developers import findings, prioritize risk, generate remediation guidance, "
        "assign tasks, and independently record verification evidence."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root-level health check (in addition to /api/v1/health)
app.include_router(health_router, tags=["Health"])

# API v1 routes
app.include_router(health_router, prefix=settings.API_V1_PREFIX)
app.include_router(findings_router, prefix=settings.API_V1_PREFIX)
app.include_router(tasks_router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)
app.include_router(chat_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to PatchPilot — Intelligent Security Remediation Assistant API",
        "docs": "/docs",
        "api_v1": settings.API_V1_PREFIX,
        "health": "/health",
    }
