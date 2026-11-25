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

    ai_configuration_ready = settings.ai_configuration_ready
    configured_provider = settings.configured_ai_provider
    return {
        "status": health_status,
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": database_status,
        # Preserve the existing field, but report the mode used when required
        # configuration is absent. A ready configuration is not a live probe.
        "ai_provider": configured_provider if ai_configuration_ready else "rule-based-fallback",
        "ai_configuration": {
            "status": "configured_unverified" if ai_configuration_ready else "rule-based-fallback",
            "configured_provider": configured_provider,
            "api_key_configured": settings.ai_api_key_configured,
            "provider_reachability": "not_checked",
        },
    }
