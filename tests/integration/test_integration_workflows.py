"""
Integration Testing Suite for PatchPilot
Executes the 5 canonical integration workflows:
1. Finding Import (Scanner report -> Parser -> Import API -> Database -> Findings List)
2. Remediation Guidance (Finding -> Guidance Request -> Provider / Fallback Labeling)
3. Task Management (Finding -> Create Task -> Retrieve -> State Transitions)
4. Verification & Status Integrity (Evidence creation -> Latest-result rule -> History preservation -> Task separation)
5. Chat Multi-turn Persistence (Conversation creation -> Multi-turn dialogue -> Historical retrieval)

Saves evidence to documentation/evidence/tester-2/integration/
"""
import os
import sys
import json
from datetime import datetime, timezone

os.environ["DATABASE_URL"] = "sqlite://"

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))
evidence_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "documentation", "evidence", "tester-2", "integration"))
os.makedirs(evidence_dir, exist_ok=True)

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app, api_app
from app.database.base import Base
from app.database.session import create_database_engine, get_db
from sqlalchemy.orm import sessionmaker

test_engine = create_database_engine("sqlite:///:memory:")
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

api_app.dependency_overrides[get_db] = override_get_db

integration_records = []

def record_step(path_id, step_name, status, details, payload=None, response=None):
    rec = {
        "workflow": path_id,
        "step": step_name,
        "status": status,
        "details": details,
        "payload": payload,
        "response": response,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    integration_records.append(rec)
    print(f"[{status}] {path_id} :: {step_name} - {details}")

def run_integration_tests():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    with TestClient(app) as client:
        # =====================================================================
        # INTEGRATION 1: Scanner Report -> Parser -> Backend Import -> DB -> List
        # =====================================================================
        print("\n--- Running Integration 1: Finding Import Workflow ---")
        # Load Trivy scanner fixture
        trivy_path = os.path.join(frontend_dir, "tests", "fixtures", "trivy-image.json")
        with open(trivy_path, "r", encoding="utf-8") as f:
            trivy_raw = json.load(f)

        # Emulate frontend Trivy parser mapping as tested in scannerParsers.test.mjs
        # Extracts valid vulnerability entries mapped to backend schema
        trivy_valid_entries = []
        for result in trivy_raw.get("Results", []):
            target = result.get("Target", "unknown")
            for vuln in result.get("Vulnerabilities", []):
                sev = vuln.get("Severity", "UNKNOWN").title()
                if sev in ("Critical", "High", "Medium", "Low", "Informational"):
                    trivy_valid_entries.append({
                        "title": vuln.get("Title") or f"Vulnerability {vuln.get('VulnerabilityID')} in {vuln.get('PkgName')}",
                        "description": vuln.get("Description") or "No description provided",
                        "severity": sev,
                        "cve_id": vuln.get("VulnerabilityID") if vuln.get("VulnerabilityID", "").startswith("CVE-") else None,
                        "package_name": vuln.get("PkgName"),
                        "installed_version": vuln.get("InstalledVersion"),
                        "fixed_version": vuln.get("FixedVersion"),
                        "source": "trivy",
                        "file_path": target
                    })

        record_step("INT-1", "Scanner Parser", "PASS", f"Parsed Trivy report fixture into {len(trivy_valid_entries)} importable findings", response={"parsed_count": len(trivy_valid_entries)})

        # Import parsed findings into backend API
        r = client.post("/api/v1/findings/import", json=trivy_valid_entries)
        assert r.status_code == 201
        import_data = r.json()
        assert import_data["imported_count"] == len(trivy_valid_entries)
        record_step("INT-1", "Backend Import API", "PASS", f"Backend accepted and persisted {import_data['imported_count']} findings", payload={"count": len(trivy_valid_entries)}, response=import_data)

        # Verify findings list displays the imported records
        r = client.get("/api/v1/findings?size=50")
        assert r.status_code == 200
        findings_list = r.json()
        assert findings_list["total"] == len(trivy_valid_entries)
        target_finding = findings_list["items"][0]
        finding_id = target_finding["id"]
        record_step("INT-1", "Database Persistence & Query", "PASS", f"Verified findings list displays all {findings_list['total']} imported records. Selected finding ID: {finding_id}", response={"total": findings_list["total"]})

        # =====================================================================
        # INTEGRATION 2: Remediation Guidance & Fallback Transparency
        # =====================================================================
        print("\n--- Running Integration 2: Remediation Guidance Workflow ---")
        # Request remediation guidance for the selected finding
        r = client.post(f"/api/v1/findings/{finding_id}/remediation-guidance")
        assert r.status_code == 200
        guidance = r.json()

        # Verify correct context and fallback transparency
        assert guidance["finding_id"] == finding_id
        assert guidance["is_fallback"] is True
        assert guidance["provider"] == "rule-based-fallback"
        assert len(guidance["recommended_remediation_steps"]) >= 2
        assert len(guidance["verification_steps"]) >= 1
        assert "disclaimer" in guidance
        record_step("INT-2", "Remediation Guidance Request", "PASS", f"Guidance returned with accurate finding context ({target_finding['title']}) and transparent rule-based fallback labels", response=guidance)

        # =====================================================================
        # INTEGRATION 3: Task Management Lifecycle & State Transitions
        # =====================================================================
        print("\n--- Running Integration 3: Task Management Lifecycle ---")
        # Create task linked to finding
        task_create = {
            "title": f"Remediate {target_finding['package_name']} vulnerability",
            "description": "Bump package version and verify regression suite.",
            "assignee": "Alex Security",
            "status": "Open"
        }
        r = client.post(f"/api/v1/findings/{finding_id}/tasks", json=task_create)
        assert r.status_code == 201
        task = r.json()
        task_id = task["id"]
        assert task["finding_id"] == finding_id
        assert task["status"] == "Open"
        record_step("INT-3", "Task Creation", "PASS", f"Created remediation task ID {task_id} linked to finding {finding_id}", payload=task_create, response=task)

        # State transition 1: Open -> In Progress
        r = client.patch(f"/api/v1/tasks/{task_id}", json={"status": "In Progress"})
        assert r.status_code == 200
        assert r.json()["status"] == "In Progress"
        record_step("INT-3", "Task Transition -> In Progress", "PASS", "Updated task status to In Progress", response=r.json())

        # State transition 2: In Progress -> Blocked
        r = client.patch(f"/api/v1/tasks/{task_id}", json={"status": "Blocked"})
        assert r.status_code == 200
        assert r.json()["status"] == "Blocked"
        record_step("INT-3", "Task Transition -> Blocked", "PASS", "Updated task status to Blocked", response=r.json())

        # State transition 3: Blocked -> Completed
        r = client.patch(f"/api/v1/tasks/{task_id}", json={"status": "Completed"})
        assert r.status_code == 200
        assert r.json()["status"] == "Completed"
        record_step("INT-3", "Task Transition -> Completed", "PASS", "Updated task status to Completed", response=r.json())

        # Verify task is retrieved under finding's task list
        r = client.get(f"/api/v1/tasks?finding_id={finding_id}")
        assert r.status_code == 200
        tasks = r.json()
        assert any(t["id"] == task_id and t["status"] == "Completed" for t in tasks)
        record_step("INT-3", "Task Relationship Verification", "PASS", f"Verified task {task_id} remains linked to finding {finding_id} in Completed status", response={"task_count": len(tasks)})

        # =====================================================================
        # INTEGRATION 4: Verification Integrity & Separation from Task
        # =====================================================================
        print("\n--- Running Integration 4: Verification Evidence & Finding Status ---")
        # Step 4a: Confirm finding is NOT resolved merely because task was completed
        r = client.get(f"/api/v1/findings/{finding_id}")
        assert r.status_code == 200
        finding_check = r.json()
        assert finding_check["is_verified_fixed"] is False
        record_step("INT-4", "Task Separation Check", "PASS", "Confirmed finding.is_verified_fixed remains False even when task is Completed", response={"is_verified_fixed": False})

        # Step 4b: Submit successful verification evidence
        v1 = client.post(f"/api/v1/findings/{finding_id}/verification", json={
            "verification_result": "Verified Fixed",
            "evidence_description": "Clean scan report confirmed with patch applied.",
            "task_id": task_id
        })
        assert v1.status_code == 201
        v1_id = v1.json()["id"]
        record_step("INT-4", "Record Evidence 1 (Verified Fixed)", "PASS", f"Recorded Verified Fixed evidence (ID {v1_id})", response=v1.json())

        # Verify finding status is now True
        r = client.get(f"/api/v1/findings/{finding_id}")
        assert r.json()["is_verified_fixed"] is True
        record_step("INT-4", "Status Update (Verified Fixed)", "PASS", "Finding status updated to is_verified_fixed=True", response={"is_verified_fixed": True})

        # Step 4c: Submit subsequent negative verification evidence (Failed)
        v2 = client.post(f"/api/v1/findings/{finding_id}/verification", json={
            "verification_result": "Failed",
            "evidence_description": "Re-audit found regressions in dependent microservice.",
            "task_id": task_id
        })
        assert v2.status_code == 201
        v2_id = v2.json()["id"]
        record_step("INT-4", "Record Evidence 2 (Failed)", "PASS", f"Recorded subsequent Failed evidence (ID {v2_id})", response=v2.json())

        # Verify finding status updated back to False based on highest evidence ID
        r = client.get(f"/api/v1/findings/{finding_id}")
        assert r.json()["is_verified_fixed"] is False
        record_step("INT-4", "Latest Evidence Rule Check", "PASS", "Finding status reverted to is_verified_fixed=False based on latest evidence ID", response={"is_verified_fixed": False})

        # Step 4d: Verify historical evidence list preserves both records in descending order
        r = client.get(f"/api/v1/findings/{finding_id}/verification")
        assert r.status_code == 200
        history = r.json()
        assert len(history) == 2
        assert history[0]["id"] == v2_id
        assert history[1]["id"] == v1_id
        record_step("INT-4", "Evidence History Preservation", "PASS", f"Historical evidence preserved in descending ID order ({v2_id} > {v1_id})", response={"history_count": len(history)})

        # =====================================================================
        # INTEGRATION 5: Chat Multi-turn Persistence
        # =====================================================================
        print("\n--- Running Integration 5: Chat Multi-turn Persistence ---")
        # Turn 1: New conversation linked to finding
        turn1 = client.post("/api/v1/chat", json={
            "message": f"Explain remediation steps for {target_finding['title']}",
            "finding_id": finding_id
        })
        assert turn1.status_code == 200
        t1_data = turn1.json()
        conv_id = t1_data["conversation_id"]
        record_step("INT-5", "Chat Turn 1 (Create)", "PASS", f"Created conversation {conv_id} linked to finding {finding_id}", response=t1_data)

        # Turn 2: Follow-up question
        turn2 = client.post("/api/v1/chat", json={
            "conversation_id": conv_id,
            "message": "What testing should I run to verify no breaking changes occur?"
        })
        assert turn2.status_code == 200
        t2_data = turn2.json()
        record_step("INT-5", "Chat Turn 2 (Follow-up)", "PASS", f"Continued conversation {conv_id} with multi-turn context", response=t2_data)

        # Turn 3: Query full conversation history
        r = client.get(f"/api/v1/chat/conversations/{conv_id}")
        assert r.status_code == 200
        conv_history = r.json()
        assert len(conv_history["messages"]) == 4
        assert [m["role"] for m in conv_history["messages"]] == ["user", "assistant", "user", "assistant"]
        record_step("INT-5", "Chat History Retrieval", "PASS", f"Retrieved full conversation history (4 messages in order: user, assistant, user, assistant)", response={"message_count": len(conv_history["messages"])})

    # Save integration evidence files
    json_path = os.path.join(evidence_dir, "integration_test_results.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(integration_records, f, indent=2)

    txt_path = os.path.join(evidence_dir, "integration_test_report.txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("PATCHPILOT TESTER 2 — INTEGRATION WORKFLOW TEST REPORT\n")
        f.write(f"Execution Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}\n")
        f.write(f"Total Steps Executed: {len(integration_records)}\n")
        f.write("=" * 80 + "\n\n")
        for rec in integration_records:
            f.write(f"[{rec['status']}] {rec['workflow']} :: {rec['step']}\n")
            f.write(f"  Details: {rec['details']}\n")
            if rec['payload']:
                f.write(f"  Payload: {json.dumps(rec['payload'])}\n")
            if rec['response']:
                f.write(f"  Response: {json.dumps(rec['response'])[:200]}...\n")
            f.write("-" * 80 + "\n")

    print(f"\nAll 5 Integration Workflows Tested Successfully!")
    print(f"Evidence saved to: {json_path} and {txt_path}")
    return True

if __name__ == "__main__":
    success = run_integration_tests()
    sys.exit(0 if success else 1)
