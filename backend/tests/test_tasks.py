def test_task_creation_and_listing(client):
    # Setup finding
    import_resp = client.post(
        "/api/v1/findings/import",
        json=[
            {
                "title": "Outdated express framework",
                "description": "Express version has known security defects.",
                "severity": "High",
            }
        ],
    )
    finding_id = import_resp.json()["imported_findings"][0]["id"]

    # Create task
    task_payload = {
        "title": "Upgrade express to v4.19.2",
        "description": "Update package.json and run npm test.",
        "assignee": "Alex",
        "status": "Open",
    }
    create_resp = client.post(f"/api/v1/findings/{finding_id}/tasks", json=task_payload)
    assert create_resp.status_code == 201
    task = create_resp.json()
    assert task["id"] is not None
    assert task["finding_id"] == finding_id
    assert task["title"] == "Upgrade express to v4.19.2"
    assert task["status"] == "Open"
    assert task["assignee"] == "Alex"

    # List tasks
    list_resp = client.get("/api/v1/tasks")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1

    # Filter tasks by assignee
    filter_resp = client.get("/api/v1/tasks?assignee=Alex")
    assert len(filter_resp.json()) == 1

    filter_none = client.get("/api/v1/tasks?assignee=NonExistent")
    assert len(filter_none.json()) == 0


def test_task_status_updates(client):
    import_resp = client.post(
        "/api/v1/findings/import",
        json=[{"title": "Bug", "description": "Desc", "severity": "Medium"}],
    )
    finding_id = import_resp.json()["imported_findings"][0]["id"]

    task_resp = client.post(
        f"/api/v1/findings/{finding_id}/tasks",
        json={"title": "Fix bug", "status": "Open"},
    )
    task_id = task_resp.json()["id"]

    # Transition to In Progress
    patch1 = client.patch(f"/api/v1/tasks/{task_id}", json={"status": "In Progress"})
    assert patch1.status_code == 200
    assert patch1.json()["status"] == "In Progress"

    # Transition to Completed
    patch2 = client.patch(f"/api/v1/tasks/{task_id}", json={"status": "Completed"})
    assert patch2.status_code == 200
    assert patch2.json()["status"] == "Completed"


def test_task_invalid_status_and_not_found(client):
    # Non-existent finding
    bad_finding_task = client.post(
        "/api/v1/findings/9999/tasks",
        json={"title": "Task", "status": "Open"},
    )
    assert bad_finding_task.status_code == 404

    # Non-existent task get
    bad_get = client.get("/api/v1/tasks/9999")
    assert bad_get.status_code == 404

    # Invalid status
    import_resp = client.post(
        "/api/v1/findings/import",
        json=[{"title": "Bug", "description": "Desc", "severity": "Low"}],
    )
    finding_id = import_resp.json()["imported_findings"][0]["id"]
    bad_status_task = client.post(
        f"/api/v1/findings/{finding_id}/tasks",
        json={"title": "Task", "status": "InvalidStatusXYZ"},
    )
    assert bad_status_task.status_code == 422
