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


def test_root_endpoint(client):
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert "/docs" in data["docs"]
    assert "/api/v1" in data["api_v1"]
