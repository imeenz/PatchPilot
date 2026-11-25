import os

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Set the application database before importing app.main or app.database.session.
# The lifespan creates tables through the global engine even when request
# dependencies are overridden, so every pytest process must use memory here.
TEST_APPLICATION_DATABASE_URL = "sqlite://"
os.environ["DATABASE_URL"] = TEST_APPLICATION_DATABASE_URL

from app.main import app, api_app
from app.database.base import Base
from app.database.session import engine, get_db

# Isolated in-memory test database using StaticPool
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=test_engine
)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


if str(engine.url) != TEST_APPLICATION_DATABASE_URL:
    raise RuntimeError("Pytest application engine must use the isolated in-memory SQLite database.")
if test_engine.url.database != ":memory:" or test_engine is engine:
    raise RuntimeError("Pytest request dependencies must use their separate in-memory test database.")

api_app.dependency_overrides[get_db] = override_get_db
if api_app.dependency_overrides[get_db] is not override_get_db:
    raise RuntimeError("Pytest request dependency override was not installed.")


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def isolated_database_engines():
    return engine, test_engine


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
