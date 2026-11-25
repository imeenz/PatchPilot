from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from app.core.config import settings

def create_database_engine(database_url: str):
    connect_args = {}
    engine_options = {}
    if database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        # A plain sqlite:// URL is in-memory. Keep one shared connection so the
        # schema created during app lifespan is visible to request worker threads.
        database_name = make_url(database_url).database
        if database_name in (None, "", ":memory:"):
            engine_options["poolclass"] = StaticPool

    return create_engine(
        database_url,
        connect_args=connect_args,
        pool_pre_ping=not database_url.startswith("sqlite"),
        **engine_options,
    )


engine = create_database_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
