from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.session import get_db
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": db_status,
        "ai_provider": settings.AI_PROVIDER or "rule-based-fallback",
    }
