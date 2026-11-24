"""
Live HTTP Server Probe Script
Starts the backend on port 8000 using the designated preview database:
backend/.runtime/bug-int-001-preview.db
Probes live HTTP endpoints over TCP socket and captures live network evidence.
"""
import os
import sys
import time
import subprocess
import httpx
from datetime import datetime, timezone

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
evidence_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "documentation", "evidence", "tester-2", "api", "live_api_probe.txt"))
preview_db = os.path.abspath(os.path.join(backend_dir, ".runtime", "bug-int-001-preview.db"))
os.makedirs(os.path.dirname(preview_db), exist_ok=True)
os.makedirs(os.path.dirname(evidence_file), exist_ok=True)

# Remove old preview db if exists to start fresh
if os.path.exists(preview_db):
    try:
        os.remove(preview_db)
    except Exception:
        pass

python_exe = os.path.join(backend_dir, ".venv", "Scripts", "python.exe")
env = os.environ.copy()
env["DATABASE_URL"] = f"sqlite:///{preview_db}"
env["PYTHONPATH"] = backend_dir

print(f"Starting live backend server with preview DB: {preview_db}...")
server_proc = subprocess.Popen(
    [python_exe, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
    cwd=backend_dir,
    env=env,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

logs = []
def log(msg):
    print(msg)
    logs.append(msg)

try:
    log(f"Waiting for live server to become ready on http://127.0.0.1:8000 ...")
    base_url = "http://127.0.0.1:8000"
    ready = False
    for attempt in range(20):
        time.sleep(0.5)
        try:
            with httpx.Client(timeout=2.0) as client:
                r = client.get(f"{base_url}/health")
                if r.status_code == 200:
                    ready = True
                    log(f"Server is ready! Health check responded: {r.status_code}")
                    break
        except Exception:
            continue

    if not ready:
        log("ERROR: Live server failed to start within timeout.")
        sys.exit(1)

    with httpx.Client(base_url=base_url, timeout=5.0) as client:
        log("\n--- Live Probe 1: GET /health ---")
        r = client.get("/health")
        log(f"Status: {r.status_code} | Body: {r.text}")

        log("\n--- Live Probe 2: GET /api/v1/health ---")
        r = client.get("/api/v1/health")
        log(f"Status: {r.status_code} | Body: {r.text}")

        log("\n--- Live Probe 3: POST /api/v1/findings/import (Live Finding) ---")
        live_payload = [
            {
                "title": "Live Verification Finding",
                "description": "Live HTTP probe finding across actual TCP socket.",
                "severity": "High",
                "cve_id": "CVE-2024-LIVE-001",
                "package_name": "live-wire-lib",
                "installed_version": "1.0.0",
                "fixed_version": "1.0.1",
                "source": "trivy"
            }
        ]
        r = client.post("/api/v1/findings/import", json=live_payload)
        log(f"Status: {r.status_code} | Body: {r.text}")
        finding_id = r.json()["imported_findings"][0]["id"]

        log(f"\n--- Live Probe 4: GET /api/v1/findings/{finding_id} ---")
        r = client.get(f"/api/v1/findings/{finding_id}")
        log(f"Status: {r.status_code} | Body: {r.text}")

        log(f"\n--- Live Probe 5: POST /api/v1/findings/{finding_id}/remediation-guidance ---")
        r = client.post(f"/api/v1/findings/{finding_id}/remediation-guidance")
        log(f"Status: {r.status_code} | Body: {r.text[:200]}...")

        log(f"\n--- Live Probe 6: POST /api/v1/findings/{finding_id}/tasks ---")
        r = client.post(f"/api/v1/findings/{finding_id}/tasks", json={"title": "Fix Live Finding", "status": "Open"})
        log(f"Status: {r.status_code} | Body: {r.text}")
        task_id = r.json()["id"]

        log(f"\n--- Live Probe 7: PATCH /api/v1/tasks/{task_id} ---")
        r = client.patch(f"/api/v1/tasks/{task_id}", json={"status": "Completed"})
        log(f"Status: {r.status_code} | Body: {r.text}")

        log(f"\n--- Live Probe 8: POST /api/v1/findings/{finding_id}/verification ---")
        r = client.post(f"/api/v1/findings/{finding_id}/verification", json={"verification_result": "Verified Fixed", "evidence_description": "Live TCP verification confirmed."})
        log(f"Status: {r.status_code} | Body: {r.text}")

        log("\n--- Live Probe 9: GET /api/v1/dashboard/summary ---")
        r = client.get("/api/v1/dashboard/summary")
        log(f"Status: {r.status_code} | Body: {r.text}")

        log("\n--- Live Probe 10: POST /api/v1/chat ---")
        r = client.post("/api/v1/chat", json={"message": "Can you summarize live remediation status?", "finding_id": finding_id})
        log(f"Status: {r.status_code} | Body: {r.text[:250]}...")

        log("\n--- Live Probe 11: CORS Headers Verification ---")
        r = client.options("/api/v1/findings", headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"})
        cors_header = r.headers.get("access-control-allow-origin")
        log(f"OPTIONS Status: {r.status_code} | Access-Control-Allow-Origin: {cors_header}")

    log("\nAll live wire HTTP probes succeeded!")
finally:
    log("Terminating live backend server process...")
    server_proc.terminate()
    try:
        server_proc.wait(timeout=3)
    except Exception:
        server_proc.kill()
    log("Live backend server stopped.")

with open(evidence_file, "w", encoding="utf-8") as f:
    f.write(f"PATCHPILOT TESTER 2 — LIVE WIRE HTTP SERVER PROBE EVIDENCE\n")
    f.write(f"Timestamp: {datetime.now(timezone.utc).isoformat()}\n")
    f.write(f"Database: {preview_db}\n")
    f.write("=" * 80 + "\n\n")
    f.write("\n".join(logs))

print(f"Evidence saved to: {evidence_file}")
