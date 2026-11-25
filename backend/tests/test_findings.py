def test_finding_retrieval_and_404(client):
    # Import a single finding
    payload = [
        {
            "title": "CSRF in password reset",
            "description": "Missing anti-CSRF token on POST route.",
            "severity": "High",
            "source": "owasp-zap",
        }
    ]
    import_resp = client.post("/api/v1/findings/import", json=payload)
    finding_id = import_resp.json()["imported_findings"][0]["id"]

    # Retrieve by ID
    get_resp = client.get(f"/api/v1/findings/{finding_id}")
    assert get_resp.status_code == 200
    detail = get_resp.json()
    assert detail["title"] == "CSRF in password reset"
    assert detail["tasks"] == []
    assert detail["verifications"] == []

    # Non-existent ID returns 404
    not_found_resp = client.get("/api/v1/findings/99999")
    assert not_found_resp.status_code == 404


def test_finding_filters_and_pagination(client):
    payload = [
        {
            "title": "RCE in parser",
            "description": "Remote code execution vulnerability",
            "severity": "Critical",
            "source": "snyk",
            "cve": "CVE-2022-1001",
        },
        {
            "title": "Information disclosure in headers",
            "description": "Server version exposed in response headers",
            "severity": "Low",
            "source": "manual",
        },
        {
            "title": "Denial of service in regex",
            "description": "ReDoS in email validator",
            "severity": "Medium",
            "source": "snyk",
            "cve": "CVE-2023-2002",
        },
    ]
    client.post("/api/v1/findings/import", json=payload)

    # Filter by severity
    resp_crit = client.get("/api/v1/findings?severity=Critical")
    assert resp_crit.status_code == 200
    assert resp_crit.json()["total"] == 1
    assert resp_crit.json()["items"][0]["severity"] == "Critical"

    # Filter by source
    resp_source = client.get("/api/v1/findings?source=snyk")
    assert resp_source.status_code == 200
    assert resp_source.json()["total"] == 2

    # Filter by has_cve
    resp_has_cve = client.get("/api/v1/findings?has_cve=true")
    assert resp_has_cve.status_code == 200
    assert resp_has_cve.json()["total"] == 2

    resp_no_cve = client.get("/api/v1/findings?has_cve=false")
    assert resp_no_cve.status_code == 200
    assert resp_no_cve.json()["total"] == 1

    # Search query
    resp_query = client.get("/api/v1/findings?query=headers")
    assert resp_query.status_code == 200
    assert resp_query.json()["total"] == 1
    assert "headers" in resp_query.json()["items"][0]["title"]

    # Pagination
    resp_page = client.get("/api/v1/findings?page=1&size=2")
    assert resp_page.status_code == 200
    paged_data = resp_page.json()
    assert len(paged_data["items"]) == 2
    assert paged_data["total"] == 3
    assert paged_data["total_pages"] == 2
