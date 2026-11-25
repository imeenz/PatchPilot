from unittest.mock import patch

from app.services.finding_service import FindingService


def test_import_array_payload(client):
    payload = [
        {
            "title": "SQL Injection in auth",
            "description": "Unescaped query parameter in login route.",
            "severity": "Critical",
            "cve_id": "CVE-2023-1111",
            "package_name": "db-driver",
            "installed_version": "1.0.0",
            "fixed_version": "1.0.1",
            "source": "trivy",
            "file_path": "backend/auth.py",
        },
        {
            "title": "Cross-Site Scripting (XSS)",
            "description": "Raw HTML rendering without sanitization.",
            "severity": "High",
            "source": "snyk",
        },
    ]

    response = client.post("/api/v1/findings/import", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["total_records"] == 2
    assert data["imported_count"] == 2
    assert data["rejected_count"] == 0
    assert len(data["imported_findings"]) == 2
    assert data["imported_findings"][0]["title"] == "SQL Injection in auth"
    assert data["imported_findings"][0]["risk_score"] == 98.0  # 95 + 2 (CVE) + 1 (Fix)


def test_import_object_payload_with_findings_key(client):
    payload = {
        "findings": [
            {
                "title": "Insecure cookie setting",
                "description": "Session cookie missing HttpOnly flag.",
                "severity": "Medium",
                "source": "manual",
            }
        ]
    }

    response = client.post("/api/v1/findings/import", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["total_records"] == 1
    assert data["imported_count"] == 1
    assert data["rejected_count"] == 0
    assert data["imported_findings"][0]["severity"] == "Medium"
    assert data["imported_findings"][0]["risk_score"] == 50.0


def test_import_missing_required_fields_and_invalid_severity(client):
    payload = [
        # Missing description
        {
            "title": "Missing description test",
            "severity": "High",
        },
        # Missing title
        {
            "description": "Missing title test",
            "severity": "Low",
        },
        # Invalid severity
        {
            "title": "Invalid severity test",
            "description": "Some description",
            "severity": "ExtremeDanger",
        },
        # Valid finding
        {
            "title": "Valid finding",
            "description": "Valid description",
            "severity": "Low",
        },
    ]

    response = client.post("/api/v1/findings/import", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["total_records"] == 4
    assert data["imported_count"] == 1
    assert data["rejected_count"] == 3
    assert len(data["rejected_findings"]) == 3

    # Check reasons
    reasons = [r["reason"] for r in data["rejected_findings"]]
    assert any("description" in r for r in reasons)
    assert any("title" in r for r in reasons)
    assert any("Invalid severity" in r for r in reasons)

    # Verify only the valid finding is stored in DB
    list_resp = client.get("/api/v1/findings")
    assert list_resp.status_code == 200
    findings = list_resp.json()["items"]
    assert len(findings) == 1
    assert findings[0]["title"] == "Valid finding"


def test_import_invalid_payload_type(client):
    response = client.post("/api/v1/findings/import", json="not a list or dict")
    assert response.status_code == 422


def test_import_unexpected_error_does_not_expose_exception_or_report_content(client, caplog):
    sensitive_detail = "private-report-value-and-db-credential"
    with patch.object(FindingService, "import_findings", side_effect=RuntimeError(sensitive_detail)):
        response = client.post(
            "/api/v1/findings/import",
            json=[{"title": "safe test", "description": "test", "severity": "Low"}],
        )

    assert response.status_code == 500
    assert response.json()["detail"] == "An unexpected error occurred while importing findings."
    assert sensitive_detail not in response.text
    assert sensitive_detail not in caplog.text
    assert "RuntimeError" in caplog.text


def test_import_alias_handling(client):
    payload = [
        {
            "title": "Alias test",
            "description": "Testing cve, package, path aliases",
            "severity": "High",
            "cve": "CVE-2024-9999",
            "package": "lib-ssl",
            "version": "0.9.1",
            "path": "src/crypto.c",
        }
    ]

    response = client.post("/api/v1/findings/import", json=payload)
    assert response.status_code == 201
    finding = response.json()["imported_findings"][0]

    assert finding["cve_id"] == "CVE-2024-9999"
    assert finding["package_name"] == "lib-ssl"
    assert finding["installed_version"] == "0.9.1"
    assert finding["file_path"] == "src/crypto.c"
