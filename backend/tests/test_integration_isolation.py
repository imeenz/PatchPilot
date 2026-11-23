from concurrent.futures import ThreadPoolExecutor

from fastapi.testclient import TestClient
import pytest
from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.database.base import Base
from app.database.session import SessionLocal, create_database_engine, engine, get_db
from app.main import api_app, app
from app.services.dashboard_service import DashboardService


def test_application_startup_engine_is_in_memory_and_request_dependency_is_separate(isolated_database_engines):
    application_engine, request_engine = isolated_database_engines
    assert str(application_engine.url) == "sqlite://"
    assert isinstance(application_engine.pool, StaticPool)
    assert request_engine.url.database == ":memory:"
    assert isinstance(request_engine.pool, StaticPool)
    assert application_engine is not request_engine
    assert get_db in api_app.dependency_overrides


def test_startup_database_schema_is_visible_from_request_worker_thread(client):
    expected_tables = set(Base.metadata.tables)

    def read_tables_from_worker():
        with SessionLocal() as session:
            return set(inspect(session.get_bind()).get_table_names())

    with ThreadPoolExecutor(max_workers=1) as executor:
        worker_tables = executor.submit(read_tables_from_worker).result()

    assert expected_tables <= worker_tables


def test_chat_create_follow_up_and_history_use_isolated_application_database(client):
    # Bypass the request-fixture override to exercise the app's isolated
    # DATABASE_URL-backed in-memory session factory.
    test_override = api_app.dependency_overrides.pop(get_db)
    try:
        first = client.post("/api/v1/chat", json={"message": "How do I prevent SQL injection?"})
        assert first.status_code == 200
        first_result = first.json()
        conversation_id = first_result["conversation_id"]
        assert first_result["is_fallback"] is True
        assert first_result["provider"] == "rule-based-fallback"

        second = client.post(
            "/api/v1/chat",
            json={"conversation_id": conversation_id, "message": "What should I test afterward?"},
        )
        assert second.status_code == 200
        assert second.json()["conversation_id"] == conversation_id
        assert second.json()["is_fallback"] is True

        history = client.get(f"/api/v1/chat/conversations/{conversation_id}")
        assert history.status_code == 200
        messages = history.json()["messages"]
        assert len(messages) == 4
        assert [message["role"] for message in messages] == ["user", "assistant", "user", "assistant"]
    finally:
        api_app.dependency_overrides[get_db] = test_override


@pytest.mark.parametrize("database_url", ["sqlite://", "sqlite:///:memory:"])
def test_in_memory_sqlite_uses_one_shared_database_across_threads(database_url):
    shared_engine = create_database_engine(database_url)
    try:
        Base.metadata.create_all(bind=shared_engine)

        def read_tables_from_worker():
            with Session(shared_engine) as session:
                return set(inspect(session.get_bind()).get_table_names())

        with ThreadPoolExecutor(max_workers=1) as executor:
            worker_tables = executor.submit(read_tables_from_worker).result()

        assert set(Base.metadata.tables) <= worker_tables
    finally:
        shared_engine.dispose()


def test_health_reports_missing_application_tables_as_not_ready(client):
    from sqlalchemy import create_engine

    empty_engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)

    def empty_database_session():
        with Session(empty_engine) as session:
            yield session

    previous_override = api_app.dependency_overrides[get_db]
    api_app.dependency_overrides[get_db] = empty_database_session
    try:
        response = client.get("/api/v1/health")
    finally:
        api_app.dependency_overrides[get_db] = previous_override
        empty_engine.dispose()

    assert response.status_code == 503
    assert response.json()["status"] == "degraded"
    assert "missing required application tables" in response.json()["database"]


def test_unhandled_api_errors_keep_cors_headers_and_hide_exception_details(monkeypatch):
    def fail_summary(_db):
        raise RuntimeError("private database detail")

    monkeypatch.setattr(DashboardService, "get_summary", fail_summary)
    with TestClient(app, raise_server_exceptions=False) as test_client:
        response = test_client.get(
            "/api/v1/dashboard/summary",
            headers={"Origin": "http://localhost:5173"},
        )

    assert response.status_code == 500
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert "private database detail" not in response.text
