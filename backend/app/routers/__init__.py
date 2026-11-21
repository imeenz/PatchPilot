from app.routers.health import router as health_router
from app.routers.findings import router as findings_router
from app.routers.tasks import router as tasks_router
from app.routers.dashboard import router as dashboard_router
from app.routers.chat import router as chat_router

__all__ = [
    "health_router",
    "findings_router",
    "tasks_router",
    "dashboard_router",
    "chat_router",
]
