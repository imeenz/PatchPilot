def test_dashboard_empty_state(client):
    resp = client.get("/api/v1/dashboard/summary")
    assert resp.status_code == 200
    data = resp.json()

    assert data["total_findings"] == 0
    assert data["average_risk_score"] == 0.0
    assert data["total_tasks"] == 0
    assert data["total_verifications"] == 0
    assert data["verified_fixed_findings"] == 0
    assert data["open_findings"] == 0


def test_dashboard_with_data(client):
    # Import findings across severities
    payload = [
        {"title": "Crit 1", "description": "D1", "severity": "Critical"},
        {"title": "High 1", "description": "D2", "severity": "High"},
        {"title": "Med 1", "description": "D3", "severity": "Medium"},
        {"title": "Low 1", "description": "D4", "severity": "Low"},
        {"title": "Info 1", "description": "D5", "severity": "Informational"},
    ]
    import_resp = client.post("/api/v1/findings/import", json=payload)
    findings = import_resp.json()["imported_findings"]
    f1_id = findings[0]["id"]
    f2_id = findings[1]["id"]

    # Create tasks
    client.post(f"/api/v1/findings/{f1_id}/tasks", json={"title": "T1", "status": "In Progress"})
    client.post(f"/api/v1/findings/{f2_id}/tasks", json={"title": "T2", "status": "Completed"})

    # Record verification for f1
    client.post(
        f"/api/v1/findings/{f1_id}/verification",
        json={"evidence_description": "Verified fixed in staging", "verification_result": "Verified Fixed"},
    )

    resp = client.get("/api/v1/dashboard/summary")
    assert resp.status_code == 200
    data = resp.json()

    assert data["total_findings"] == 5
    assert data["severity_breakdown"]["Critical"] == 1
    assert data["severity_breakdown"]["High"] == 1
    assert data["severity_breakdown"]["Medium"] == 1
    assert data["severity_breakdown"]["Low"] == 1
    assert data["severity_breakdown"]["Informational"] == 1

    # (95 + 75 + 50 + 25 + 5) / 5 = 250 / 5 = 50.0
    assert data["average_risk_score"] == 50.0

    assert data["total_tasks"] == 2
    assert data["task_status_breakdown"]["In Progress"] == 1
    assert data["task_status_breakdown"]["Completed"] == 1

    assert data["total_verifications"] == 1
    assert data["verified_fixed_findings"] == 1
    assert data["open_findings"] == 4


def test_dashboard_uses_latest_evidence_but_keeps_historical_breakdown(client):
    imported = client.post(
        "/api/v1/findings/import",
        json=[
            {"title": "Finding A", "description": "First finding", "severity": "High"},
            {"title": "Finding B", "description": "Second finding", "severity": "Medium"},
        ],
    )
    assert imported.status_code == 201
    finding_a, finding_b = [item["id"] for item in imported.json()["imported_findings"]]

    evidence_sequences = [
        (finding_a, ["Verified Fixed", "Inconclusive"]),
        (finding_b, ["Failed", "Verified Fixed"]),
    ]
    for finding_id, results in evidence_sequences:
        for result in results:
            response = client.post(
                f"/api/v1/findings/{finding_id}/verification",
                json={"evidence_description": f"Recorded result: {result}.", "verification_result": result},
            )
            assert response.status_code == 201

    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_findings"] == 2
    assert data["verified_fixed_findings"] == 1
    assert data["open_findings"] == 1
    assert data["total_verifications"] == 4
    assert data["verification_breakdown"]["Verified Fixed"] == 2
    assert data["verification_breakdown"]["Failed"] == 1
    assert data["verification_breakdown"]["Inconclusive"] == 1
