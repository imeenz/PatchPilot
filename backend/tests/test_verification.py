def test_verification_creation_and_listing(client):
    # Setup finding
    import_resp = client.post(
        "/api/v1/findings/import",
        json=[
            {
                "title": "Hardcoded JWT secret",
                "description": "JWT secret key is committed in code.",
                "severity": "High",
            }
        ],
    )
    finding_id = import_resp.json()["imported_findings"][0]["id"]

    # Create task
    task_resp = client.post(
        f"/api/v1/findings/{finding_id}/tasks",
        json={"title": "Rotate JWT secret and move to env", "status": "In Progress"},
    )
    task_id = task_resp.json()["id"]

    # Record verification evidence
    verif_payload = {
        "task_id": task_id,
        "evidence_description": "Secret replaced with env var. Validated that token signature fails with old secret.",
        "evidence_url": "https://github.com/org/repo/pull/42",
        "verification_result": "Verified Fixed",
    }
    create_resp = client.post(
        f"/api/v1/findings/{finding_id}/verification",
        json=verif_payload,
    )
    assert create_resp.status_code == 201
    evidence = create_resp.json()
    assert evidence["id"] is not None
    assert evidence["finding_id"] == finding_id
    assert evidence["task_id"] == task_id
    assert evidence["verification_result"] == "Verified Fixed"

    # List verification evidence
    list_resp = client.get(f"/api/v1/findings/{finding_id}/verification")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1
    assert list_resp.json()[0]["evidence_description"] == verif_payload["evidence_description"]


def test_separation_between_task_completion_and_vulnerability_verification(client):
    """
    CRITICAL REQUIREMENT:
    Completing a remediation task must NOT automatically mark a vulnerability as fixed.
    Verification must be recorded separately.
    """
    import_resp = client.post(
        "/api/v1/findings/import",
        json=[
            {
                "title": "Path Traversal in file download",
                "description": "User controlled path parameter allows reading arbitrary files.",
                "severity": "Critical",
            }
        ],
    )
    finding_id = import_resp.json()["imported_findings"][0]["id"]

    # 1. Create task
    task_resp = client.post(
        f"/api/v1/findings/{finding_id}/tasks",
        json={"title": "Sanitize path inputs", "status": "Open"},
    )
    task_id = task_resp.json()["id"]

    # 2. Mark task as Completed
    patch_resp = client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"status": "Completed"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "Completed"

    # 3. Check finding state: Must NOT be marked as verified fixed!
    finding_resp = client.get(f"/api/v1/findings/{finding_id}")
    assert finding_resp.status_code == 200
    finding_data = finding_resp.json()
    assert finding_data["is_verified_fixed"] is False
    assert len(finding_data["verifications"]) == 0

    # Dashboard must also report finding as open
    dashboard_before = client.get("/api/v1/dashboard/summary").json()
    assert dashboard_before["verified_fixed_findings"] == 0
    assert dashboard_before["open_findings"] == 1

    # 4. Explicitly record verification evidence
    verif_resp = client.post(
        f"/api/v1/findings/{finding_id}/verification",
        json={
            "evidence_description": "Manual exploit attempt with ../../../etc/passwd returned 400 Bad Request.",
            "verification_result": "Verified Fixed",
        },
    )
    assert verif_resp.status_code == 201

    # 5. Now check finding state: is_verified_fixed must be True
    finding_after = client.get(f"/api/v1/findings/{finding_id}").json()
    assert finding_after["is_verified_fixed"] is True
    assert len(finding_after["verifications"]) == 1

    dashboard_after = client.get("/api/v1/dashboard/summary").json()
    assert dashboard_after["verified_fixed_findings"] == 1
    assert dashboard_after["open_findings"] == 0


def test_verification_error_handling(client):
    # Verification on non-existent finding
    bad_resp = client.post(
        "/api/v1/findings/9999/verification",
        json={"evidence_description": "Test"},
    )
    assert bad_resp.status_code == 404

    # Setup 2 findings and 1 task
    f1_resp = client.post(
        "/api/v1/findings/import",
        json=[{"title": "Finding 1", "description": "Desc", "severity": "Low"}],
    )
    f1_id = f1_resp.json()["imported_findings"][0]["id"]

    f2_resp = client.post(
        "/api/v1/findings/import",
        json=[{"title": "Finding 2", "description": "Desc", "severity": "Low"}],
    )
    f2_id = f2_resp.json()["imported_findings"][0]["id"]

    task_f1 = client.post(
        f"/api/v1/findings/{f1_id}/tasks",
        json={"title": "Task for F1"},
    ).json()

    # Attempt to link Task for F1 to Finding F2 verification -> must reject with 400
    mismatch_resp = client.post(
        f"/api/v1/findings/{f2_id}/verification",
        json={
            "task_id": task_f1["id"],
            "evidence_description": "Cross-linked task mismatch",
        },
    )
    assert mismatch_resp.status_code == 400
