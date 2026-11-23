import logging
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import inspect
from app.database.base import Base
from app.database.session import get_db
from app.core.config import settings

router = APIRouter(tags=["Health"])
logger = logging.getLogger(__name__)


@router.get("/health")
def health_check(response: Response, db: Session = Depends(get_db)):
    try:
        inspector = inspect(db.get_bind())
        existing_tables = set(inspector.get_table_names())
        required_tables = set(Base.metadata.tables)
        missing_tables = sorted(required_tables - existing_tables)
        if missing_tables:
            database_status = "unready: missing required application tables"
            logger.error("Database readiness check found missing tables: %s", missing_tables)
            health_status = "degraded"
            response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        else:
            database_status = "connected"
            health_status = "ok"
    except Exception:
        logger.exception("Database readiness check failed")
        database_status = "unhealthy"
        health_status = "degraded"
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": health_status,
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": database_status,
        "ai_provider": settings.AI_PROVIDER or "rule-based-fallback",
    }
