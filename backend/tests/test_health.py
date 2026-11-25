import pytest
from unittest.mock import patch

from app.core.config import settings


def test_health_endpoints(client):
    # Test root /health
    resp1 = client.get("/health")
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["status"] == "ok"
    assert data1["database"] == "connected"

    # Test /api/v1/health
    resp2 = client.get("/api/v1/health")
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["status"] == "ok"
    assert "version" in data2


@pytest.mark.parametrize(
    ("provider", "api_key", "expected_status", "expected_provider"),
    [
        (None, None, "rule-based-fallback", "rule-based-fallback"),
        ("openai", None, "rule-based-fallback", "rule-based-fallback"),
        (None, "test-secret", "rule-based-fallback", "rule-based-fallback"),
        (" openai ", " test-secret ", "configured_unverified", "openai"),
        ("openai", "   ", "rule-based-fallback", "rule-based-fallback"),
    ],
)
def test_health_reports_ai_configuration_without_claiming_reachability(
    client, provider, api_key, expected_status, expected_provider
):
    with patch.object(settings, "AI_PROVIDER", provider), patch.object(settings, "AI_API_KEY", api_key):
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    data = response.json()
    assert data["ai_provider"] == expected_provider
    assert data["ai_configuration"]["status"] == expected_status
    assert data["ai_configuration"]["provider_reachability"] == "not_checked"
    assert "test-secret" not in response.text

    if provider:
        assert data["ai_configuration"]["configured_provider"] == "openai"
    else:
        assert data["ai_configuration"]["configured_provider"] is None


def test_root_endpoint(client):
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert "/docs" in data["docs"]
    assert "/api/v1" in data["api_v1"]
