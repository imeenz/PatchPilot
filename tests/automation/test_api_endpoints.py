"""
Comprehensive API Automation Test Suite for PatchPilot
Tests all REST API endpoints, request validation, edge cases, error handling, and persistence.
Saves structured JSON evidence and a human-readable report.
"""
import json
import os
import sys
import uuid
from datetime import datetime, timezone

# Set isolated test database
os.environ["DATABASE_URL"] = "sqlite://"

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app, api_app
from app.database.base import Base
from app.database.session import engine, create_database_engine, get_db
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Prepare test database
test_engine = create_database_engine("sqlite:///:memory:")
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

api_app.dependency_overrides[get_db] = override_get_db

evidence_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "documentation", "evidence", "tester-2", "api"))
os.makedirs(evidence_dir, exist_ok=True)

test_results = []

def record_test(test_id, category, method, endpoint, request_body, expected_status, actual_status, passed, notes, response_sample):
    record = {
        "test_id": test_id,
        "category": category,
        "method": method,
        "endpoint": endpoint,
        "request_body": request_body,
        "expected_status": expected_status,
        "actual_status": actual_status,
        "passed": passed,
        "notes": notes,
        "response_sample": response_sample,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    test_results.append(record)
    status_str = "PASS" if passed else "FAIL"
    print(f"[{status_str}] {test_id} - {method} {endpoint} -> Status: {actual_status} (Expected: {expected_status})")

def run_all_api_tests():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    
    with TestClient(app) as client:
        print("=== 1. Health Endpoints ===")
        # Health 1: Root health check
        r = client.get("/health")
        passed = r.status_code == 200 and r.json().get("status") == "ok"
        record_test("API-HLTH-01", "Health", "GET", "/health", None, 200, r.status_code, passed, "Root health check returns status ok and connected db", r.json())

        # Health 2: API v1 health check
        r = client.get("/api/v1/health")
        passed = r.status_code == 200 and r.json().get("database") == "connected"
        record_test("API-HLTH-02", "Health", "GET", "/api/v1/health", None, 200, r.status_code, passed, "API v1 health check returns connected database", r.json())

        # Health 3: Root landing endpoint
        r = client.get("/")
        passed = r.status_code == 200 and "docs" in r.json()
        record_test("API-HLTH-03", "Health", "GET", "/", None, 200, r.status_code, passed, "API root endpoint returns welcome and documentation links", r.json())

        print("=== 2. Finding Import Endpoint ===")
        # Import 1: Valid array payload
        valid_findings = [
            {
                "title": "Remote Code Execution in Apache Log4j",
                "description": "Apache Log4j2 JNDI features do not protect against attacker controlled LDAP.",
                "severity": "Critical",
                "cve_id": "CVE-2021-44228",
                "package_name": "log4j-core",
                "installed_version": "2.14.1",
                "fixed_version": "2.17.1",
                "source": "trivy",
                "file_path": "pom.xml"
            },
            {
                "title": "SQL Injection in User Authentication",
                "description": "User input concatenated directly into SQL statement.",
                "severity": "High",
                "cve_id": "CVE-2022-12345",
                "package_name": "auth-service",
                "installed_version": "1.0.0",
                "fixed_version": "1.0.1",
                "source": "manual",
                "file_path": "src/auth.py"
            },
            {
                "title": "Cross-Site Scripting (XSS) in Comments",
                "description": "Unsanitized user comment rendered directly in HTML.",
                "severity": "Medium",
                "package_name": "comment-widget",
                "source": "owasp-zap",
                "file_path": "views/comment.html"
            },
            {
                "title": "Information Disclosure in Error Pages",
                "description": "Server stack traces displayed to unauthenticated clients.",
                "severity": "Low",
                "source": "manual"
            },
            {
                "title": "Missing Security Headers",
                "description": "X-Frame-Options header not set.",
                "severity": "Informational",
                "source": "owasp-zap"
            }
        ]
        r = client.post("/api/v1/findings/import", json=valid_findings)
        data = r.json()
        passed = r.status_code == 201 and data.get("imported_count") == 5
        imported_id = data["imported_findings"][0]["id"] if passed else None
        record_test("API-IMP-01", "Import", "POST", "/api/v1/findings/import", f"[{len(valid_findings)} findings]", 201, r.status_code, passed, "Import valid array of 5 findings across severities", data)

        # Import 2: Object with 'findings' key
        r = client.post("/api/v1/findings/import", json={"findings": [valid_findings[0]]})
        data = r.json()
        passed = r.status_code == 201 and data.get("imported_count") == 1
        record_test("API-IMP-02", "Import", "POST", "/api/v1/findings/import", "{'findings': [1 item]}", 201, r.status_code, passed, "Import object payload containing 'findings' key", data)

        # Import 3: Empty JSON array
        r = client.post("/api/v1/findings/import", json=[])
        data = r.json()
        passed = r.status_code == 201 and data.get("imported_count") == 0
        record_test("API-IMP-03", "Import", "POST", "/api/v1/findings/import", "[]", 201, r.status_code, passed, "Import empty array handles gracefully with 0 imported", data)

        # Import 4: Invalid payload type (string)
        r = client.post("/api/v1/findings/import", json="not a valid payload")
        passed = r.status_code == 422
        record_test("API-IMP-04", "Import", "POST", "/api/v1/findings/import", "\"not a valid payload\"", 422, r.status_code, passed, "Reject non-collection payload with HTTP 422", r.json())

        # Import 5: Missing required fields and invalid severity in partial batch
        partial_batch = [
            {"title": "Missing desc", "severity": "High"},
            {"description": "Missing title", "severity": "Low"},
            {"title": "Bad Severity", "description": "Desc", "severity": "SuperCritical"},
            {"title": "Valid In Batch", "description": "Good finding", "severity": "Low"}
        ]
        r = client.post("/api/v1/findings/import", json=partial_batch)
        data = r.json()
        passed = r.status_code == 201 and data.get("imported_count") == 1 and data.get("rejected_count") == 3
        record_test("API-IMP-05", "Import", "POST", "/api/v1/findings/import", "[4 records with 3 invalid]", 201, r.status_code, passed, "Import partial batch accepts valid record and documents rejected records with reasons", data)

        # Import 6: Alias handling
        alias_payload = [{
            "title": "Alias Finding",
            "description": "Testing aliases cve, package, version, path",
            "severity": "High",
            "cve": "CVE-2024-5555",
            "package": "openssl",
            "version": "1.1.1",
            "path": "src/ssl.c"
        }]
        r = client.post("/api/v1/findings/import", json=alias_payload)
        data = r.json()
        passed = r.status_code == 201 and data.get("imported_findings", [{}])[0].get("cve_id") == "CVE-2024-5555"
        record_test("API-IMP-06", "Import", "POST", "/api/v1/findings/import", "[1 record with aliases]", 201, r.status_code, passed, "Import handles field aliases (cve->cve_id, package->package_name, etc.)", data)

        print("=== 3. Findings List & Detail Endpoints ===")
        # Findings 1: List all findings
        r = client.get("/api/v1/findings")
        data = r.json()
        passed = r.status_code == 200 and data.get("total", 0) >= 7
        record_test("API-FIND-01", "Findings", "GET", "/api/v1/findings", None, 200, r.status_code, passed, "List all findings returns items and total count", {"total": data.get("total")})

        # Findings 2: Filter by severity
        r = client.get("/api/v1/findings?severity=Critical")
        data = r.json()
        passed = r.status_code == 200 and all(item["severity"] == "Critical" for item in data.get("items", [])) and len(data.get("items", [])) >= 1
        record_test("API-FIND-02", "Findings", "GET", "/api/v1/findings?severity=Critical", None, 200, r.status_code, passed, "Filter by severity=Critical returns only Critical findings", {"count": len(data.get("items", []))})

        # Findings 3: Filter by CVE
        r = client.get("/api/v1/findings?has_cve=true")
        data = r.json()
        passed = r.status_code == 200 and all(item["cve_id"] is not None for item in data.get("items", []))
        record_test("API-FIND-03", "Findings", "GET", "/api/v1/findings?has_cve=true", None, 200, r.status_code, passed, "Filter by has_cve=true returns only findings with registered CVE", {"count": len(data.get("items", []))})

        # Findings 4: Search query
        r = client.get("/api/v1/findings?query=Log4j")
        data = r.json()
        passed = r.status_code == 200 and len(data.get("items", [])) >= 1
        record_test("API-FIND-04", "Findings", "GET", "/api/v1/findings?query=Log4j", None, 200, r.status_code, passed, "Search query finds matching records by keyword", {"count": len(data.get("items", []))})

        # Findings 5: Pagination
        r = client.get("/api/v1/findings?page=1&size=2")
        data = r.json()
        passed = r.status_code == 200 and len(data.get("items", [])) == 2 and data.get("page") == 1
        record_test("API-FIND-05", "Findings", "GET", "/api/v1/findings?page=1&size=2", None, 200, r.status_code, passed, "Pagination limits page size correctly", {"page": 1, "size": 2, "items": len(data.get("items", []))})

        # Findings 6: Retrieve existing finding by ID
        r = client.get(f"/api/v1/findings/{imported_id}")
        data = r.json()
        passed = r.status_code == 200 and data.get("id") == imported_id
        record_test("API-FIND-06", "Findings", "GET", f"/api/v1/findings/{imported_id}", None, 200, r.status_code, passed, "Retrieve single finding detail by valid ID", data)

        # Findings 7: Retrieve nonexistent finding ID
        r = client.get("/api/v1/findings/999999")
        passed = r.status_code == 404
        record_test("API-FIND-07", "Findings", "GET", "/api/v1/findings/999999", None, 404, r.status_code, passed, "Nonexistent finding ID returns HTTP 404 Not Found", r.json())

        print("=== 4. Dashboard Summary Endpoint ===")
        # Dashboard 1: Summary metrics
        r = client.get("/api/v1/dashboard/summary")
        data = r.json()
        passed = r.status_code == 200 and "total_findings" in data and data.get("severity_breakdown", {}).get("Critical", 0) >= 1
        record_test("API-DASH-01", "Dashboard", "GET", "/api/v1/dashboard/summary", None, 200, r.status_code, passed, "Dashboard summary returns accurate severity breakdown and resolution metrics", data)

        print("=== 5. Remediation Guidance Endpoint ===")
        # Guidance 1: Valid finding guidance
        r = client.post(f"/api/v1/findings/{imported_id}/remediation-guidance")
        data = r.json()
        passed = r.status_code == 200 and data.get("is_fallback") is True and len(data.get("recommended_remediation_steps", [])) >= 2
        record_test("API-REMED-01", "Remediation", "POST", f"/api/v1/findings/{imported_id}/remediation-guidance", None, 200, r.status_code, passed, "Remediation guidance generated with fallback transparency and actionable steps", data)

        # Guidance 2: Nonexistent finding guidance
        r = client.post("/api/v1/findings/999999/remediation-guidance")
        passed = r.status_code == 404
        record_test("API-REMED-02", "Remediation", "POST", "/api/v1/findings/999999/remediation-guidance", None, 404, r.status_code, passed, "Remediation guidance for nonexistent ID returns HTTP 404", r.json())

        print("=== 6. Task Management Endpoints ===")
        # Task 1: Create task for finding
        task_payload = {
            "title": "Upgrade Log4j to 2.17.1 in pom.xml",
            "description": "Update Maven dependency and rebuild project container.",
            "assignee": "Alex Dev",
            "status": "Open"
        }
        r = client.post(f"/api/v1/findings/{imported_id}/tasks", json=task_payload)
        data = r.json()
        passed = r.status_code == 201 and data.get("finding_id") == imported_id and data.get("status") == "Open"
        task_id = data.get("id") if passed else None
        record_test("API-TASK-01", "Tasks", "POST", f"/api/v1/findings/{imported_id}/tasks", task_payload, 201, r.status_code, passed, "Create remediation task linked to finding", data)

        # Task 2: Create task for nonexistent finding
        r = client.post("/api/v1/findings/999999/tasks", json=task_payload)
        passed = r.status_code == 404
        record_test("API-TASK-02", "Tasks", "POST", "/api/v1/findings/999999/tasks", task_payload, 404, r.status_code, passed, "Create task for nonexistent finding returns HTTP 404", r.json())

        # Task 3: List tasks via finding-filter
        r = client.get(f"/api/v1/tasks?finding_id={imported_id}")
        data = r.json()
        passed = r.status_code == 200 and len(data) >= 1 and any(t["id"] == task_id for t in data)
        record_test("API-TASK-03", "Tasks", "GET", f"/api/v1/tasks?finding_id={imported_id}", None, 200, r.status_code, passed, "List tasks filtered by finding_id", data)

        # Task 4: Global list tasks with status filter
        r = client.get("/api/v1/tasks?status=Open")
        data = r.json()
        passed = r.status_code == 200 and any(t["id"] == task_id for t in data)
        record_test("API-TASK-04", "Tasks", "GET", "/api/v1/tasks?status=Open", None, 200, r.status_code, passed, "List all tasks with status filter returns created task", data)

        # Task 5: Get task by ID
        r = client.get(f"/api/v1/tasks/{task_id}")
        data = r.json()
        passed = r.status_code == 200 and data.get("id") == task_id
        record_test("API-TASK-05", "Tasks", "GET", f"/api/v1/tasks/{task_id}", None, 200, r.status_code, passed, "Get single task by ID", data)

        # Task 6: Update task status to In Progress
        r = client.patch(f"/api/v1/tasks/{task_id}", json={"status": "In Progress"})
        data = r.json()
        passed = r.status_code == 200 and data.get("status") == "In Progress"
        record_test("API-TASK-06", "Tasks", "PATCH", f"/api/v1/tasks/{task_id}", {"status": "In Progress"}, 200, r.status_code, passed, "Update task status to In Progress", data)

        # Task 7: Update task status to Completed
        r = client.patch(f"/api/v1/tasks/{task_id}", json={"status": "Completed"})
        data = r.json()
        passed = r.status_code == 200 and data.get("status") == "Completed"
        record_test("API-TASK-07", "Tasks", "PATCH", f"/api/v1/tasks/{task_id}", {"status": "Completed"}, 200, r.status_code, passed, "Update task status to Completed", data)

        # Task 8: Update task with invalid status
        r = client.patch(f"/api/v1/tasks/{task_id}", json={"status": "InvalidStatus"})
        passed = r.status_code in (400, 422)
        record_test("API-TASK-08", "Tasks", "PATCH", f"/api/v1/tasks/{task_id}", {"status": "InvalidStatus"}, 422, r.status_code, passed, "Reject invalid task status with validation error (HTTP 422)", r.json())

        # Task 9: Verify task completion does NOT automatically mark finding fixed
        r = client.get(f"/api/v1/findings/{imported_id}")
        data = r.json()
        passed = r.status_code == 200 and data.get("is_verified_fixed") is False
        record_test("API-TASK-09", "Tasks", "GET", f"/api/v1/findings/{imported_id}", None, 200, r.status_code, passed, "Task completion does not automatically mark finding as verified fixed", {"is_verified_fixed": data.get("is_verified_fixed")})

        print("=== 7. Verification Evidence Endpoints ===")
        # Verification 1: Record valid verification evidence (canonical Verified Fixed)
        verif_payload = {
            "verification_result": "Verified Fixed",
            "evidence_description": "CI container build scanned with Trivy v0.45; CVE-2021-44228 no longer detected.",
            "evidence_url": "https://ci.example.com/build/1042",
            "task_id": task_id
        }
        r = client.post(f"/api/v1/findings/{imported_id}/verification", json=verif_payload)
        data = r.json()
        passed = r.status_code == 201 and data.get("verification_result") == "Verified Fixed"
        record_test("API-VER-01", "Verification", "POST", f"/api/v1/findings/{imported_id}/verification", verif_payload, 201, r.status_code, passed, "Record valid canonical 'Verified Fixed' verification evidence", data)

        # Verification 2: Check finding status updated to verified fixed
        r = client.get(f"/api/v1/findings/{imported_id}")
        data = r.json()
        passed = r.status_code == 200 and data.get("is_verified_fixed") is True
        record_test("API-VER-02", "Verification", "GET", f"/api/v1/findings/{imported_id}", None, 200, r.status_code, passed, "Finding status is now verified fixed following valid evidence", {"is_verified_fixed": data.get("is_verified_fixed")})

        # Verification 3: Record subsequent Failed evidence (latest evidence rule)
        verif_failed = {
            "verification_result": "Failed",
            "evidence_description": "Regression test re-detected vulnerable classes in nested uber-jar."
        }
        r = client.post(f"/api/v1/findings/{imported_id}/verification", json=verif_failed)
        data = r.json()
        passed = r.status_code == 201 and data.get("verification_result") == "Failed"
        record_test("API-VER-03", "Verification", "POST", f"/api/v1/findings/{imported_id}/verification", verif_failed, 201, r.status_code, passed, "Record subsequent Failed verification evidence", data)

        # Verification 4: Finding status must flip to False based on latest evidence ID
        r = client.get(f"/api/v1/findings/{imported_id}")
        data = r.json()
        passed = r.status_code == 200 and data.get("is_verified_fixed") is False
        record_test("API-VER-04", "Verification", "GET", f"/api/v1/findings/{imported_id}", None, 200, r.status_code, passed, "Latest evidence ID controls current status (switches back to False)", {"is_verified_fixed": data.get("is_verified_fixed")})

        # Verification 5: List verification history
        r = client.get(f"/api/v1/findings/{imported_id}/verification")
        data = r.json()
        passed = r.status_code == 200 and len(data) == 2 and data[0]["id"] > data[1]["id"]
        record_test("API-VER-05", "Verification", "GET", f"/api/v1/findings/{imported_id}/verification", None, 200, r.status_code, passed, "Verification history preserved in descending ID order", data)

        # Verification 6: Reject invalid verification result
        r = client.post(f"/api/v1/findings/{imported_id}/verification", json={"verification_result": "bogus_status", "evidence_description": "Test"})
        passed = r.status_code == 422
        record_test("API-VER-06", "Verification", "POST", f"/api/v1/findings/{imported_id}/verification", {"verification_result": "bogus_status"}, 422, r.status_code, passed, "Reject unknown verification result with HTTP 422", r.json())

        # Verification 7: Reject whitespace-only verification result
        r = client.post(f"/api/v1/findings/{imported_id}/verification", json={"verification_result": "   ", "evidence_description": "Test"})
        passed = r.status_code == 422
        record_test("API-VER-07", "Verification", "POST", f"/api/v1/findings/{imported_id}/verification", {"verification_result": "   "}, 422, r.status_code, passed, "Reject whitespace-only verification result with HTTP 422", r.json())

        # Verification 8: Reject explicit null verification result
        r = client.post(f"/api/v1/findings/{imported_id}/verification", json={"verification_result": None, "evidence_description": "Test"})
        passed = r.status_code == 422
        record_test("API-VER-08", "Verification", "POST", f"/api/v1/findings/{imported_id}/verification", {"verification_result": None}, 422, r.status_code, passed, "Reject explicit null verification result with HTTP 422", r.json())

        # Verification 9: Omitted verification result defaults to Inconclusive
        r = client.post(f"/api/v1/findings/{imported_id}/verification", json={"evidence_description": "Follow-up test pending complete scan"})
        data = r.json()
        passed = r.status_code == 201 and data.get("verification_result") == "Inconclusive"
        record_test("API-VER-09", "Verification", "POST", f"/api/v1/findings/{imported_id}/verification", {"evidence_description": "Follow-up"}, 201, r.status_code, passed, "Omitted verification result defaults safely to Inconclusive", data)

        # Verification 10: Nonexistent finding verification returns 404
        r = client.post("/api/v1/findings/999999/verification", json={"evidence_description": "test"})
        passed = r.status_code == 404
        record_test("API-VER-10", "Verification", "POST", "/api/v1/findings/999999/verification", None, 404, r.status_code, passed, "Post verification to nonexistent finding returns HTTP 404", r.json())

        print("=== 8. Chat Endpoints ===")
        # Chat 1: Create new conversation
        r = client.post("/api/v1/chat", json={"message": "What is the recommended fix for CVE-2021-44228?", "finding_id": imported_id})
        data = r.json()
        passed = r.status_code == 200 and "conversation_id" in data and data.get("is_fallback") is True
        conv_id = data.get("conversation_id") if passed else None
        record_test("API-CHAT-01", "Chat", "POST", "/api/v1/chat", {"message": "Fix for Log4j", "finding_id": imported_id}, 200, r.status_code, passed, "Create chat conversation with finding context, receiving rule-based fallback response", data)

        # Chat 2: Continue conversation
        r = client.post("/api/v1/chat", json={"conversation_id": conv_id, "message": "Can I use log4j 2.15.0 or is 2.17.1 required?"})
        data = r.json()
        passed = r.status_code == 200 and data.get("conversation_id") == conv_id
        record_test("API-CHAT-02", "Chat", "POST", "/api/v1/chat", {"conversation_id": conv_id, "message": "Follow up"}, 200, r.status_code, passed, "Continue existing conversation with multi-turn context", data)

        # Chat 3: Retrieve full conversation message history
        r = client.get(f"/api/v1/chat/conversations/{conv_id}")
        data = r.json()
        passed = r.status_code == 200 and len(data.get("messages", [])) == 4
        record_test("API-CHAT-03", "Chat", "GET", f"/api/v1/chat/conversations/{conv_id}", None, 200, r.status_code, passed, "Retrieve full conversation message history (4 messages persisted in sequence)", data)

        # Chat 4: Nonexistent conversation ID
        r = client.get(f"/api/v1/chat/conversations/{str(uuid.uuid4())}")
        passed = r.status_code == 404
        record_test("API-CHAT-04", "Chat", "GET", "/api/v1/chat/conversations/<uuid>", None, 404, r.status_code, passed, "Nonexistent conversation UUID returns HTTP 404 Not Found", r.json())

        # Chat 5: Whitespace-only message rejected
        r = client.post("/api/v1/chat", json={"message": "   "})
        passed = r.status_code in (400, 422)
        record_test("API-CHAT-05", "Chat", "POST", "/api/v1/chat", {"message": "   "}, 422, r.status_code, passed, "Whitespace-only chat message rejected with validation error", r.json())

    # Write evidence files
    json_path = os.path.join(evidence_dir, "api_test_results.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(test_results, f, indent=2)

    txt_path = os.path.join(evidence_dir, "api_test_report.txt")
    total = len(test_results)
    passed_count = sum(1 for t in test_results if t["passed"])
    failed_count = total - passed_count

    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(f"PATCHPILOT TESTER 2 — AUTOMATED API TEST REPORT\n")
        f.write(f"Execution Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}\n")
        f.write(f"Total Endpoints / Tests Executed: {total}\n")
        f.write(f"Passed: {passed_count}\n")
        f.write(f"Failed: {failed_count}\n")
        f.write(f"Success Rate: {(passed_count/total)*100:.1f}%\n")
        f.write("=" * 80 + "\n\n")
        for t in test_results:
            status = "PASS" if t["passed"] else "FAIL"
            f.write(f"[{status}] {t['test_id']} | {t['method']} {t['endpoint']}\n")
            f.write(f"  Category: {t['category']}\n")
            f.write(f"  Expected Status: {t['expected_status']} | Actual Status: {t['actual_status']}\n")
            f.write(f"  Notes: {t['notes']}\n")
            f.write(f"  Sample Response: {json.dumps(t['response_sample'])[:200]}...\n")
            f.write("-" * 80 + "\n")

    print(f"\nAPI Testing Complete! Total: {total}, Passed: {passed_count}, Failed: {failed_count}")
    print(f"Evidence saved to: {json_path} and {txt_path}")
    return failed_count == 0

if __name__ == "__main__":
    success = run_all_api_tests()
    sys.exit(0 if success else 1)
