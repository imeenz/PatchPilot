# PatchPilot

PatchPilot is an academic security-remediation workflow application. It helps a user import findings, review and prioritize them, request remediation guidance, assign tasks, and record verification evidence.

## What it does

- Imports Trivy JSON and OWASP ZAP traditional JSON reports. PatchPilot parses reports; it does not run either scanner.
- Lists, filters, and displays findings and dashboard summaries.
- Calculates an explainable, deterministic severity-based risk score. The score is not CVSS and is not an exploitability assessment.
- Provides AI-assisted remediation guidance when an external provider is configured, with a deterministic rule-based fallback otherwise.
- Tracks remediation tasks separately from verification evidence. Completing a task does not prove a vulnerability is fixed.

## Architecture and data flow

The React/TypeScript single-page frontend parses supported scanner report files and sends normalized findings to the FastAPI REST API. The API validates and stores findings through SQLAlchemy, computes the risk score, and serves dashboard, catalog, task, verification, and chat routes. SQLite is the zero-configuration local database; PostgreSQL can be selected through `DATABASE_URL`. Alembic migration files are included. The backend creates missing application tables at startup.

For chat and guidance, the backend sends requests to the configured AI provider only when both `AI_PROVIDER` and `AI_API_KEY` are set. Otherwise, or after a provider failure, it uses rule-based guidance. Responses expose fallback/provider metadata. A configured provider name or the health endpoint alone does not prove an external AI call is available.

## Prerequisites

- Python: `backend/requirements.txt` does not declare a minimum Python version. The repository records local setup with Python 3.11.9 and Tester 2 validation with Python 3.12.13.
- Node.js: the locked Vite and React plugin packages require Node `^20.19.0` or `>=22.12.0`. Recorded project environments include Node 22.13 and 24.15. npm is required; dependencies are locked in `frontend/package-lock.json`.
- SQLite is sufficient for local development. PostgreSQL requires a running PostgreSQL service and a matching `DATABASE_URL`.

## Local setup

Open two terminals from the repository root.

### Backend

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
# Optional: copy .env.example to .env only if .env does not already exist.
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Use `python -m venv .venv` instead if the `py` launcher is unavailable. On macOS/Linux, activate with `source .venv/bin/activate`. The backend defaults to `sqlite:///./patchpilot.db`, relative to the `backend/` working directory. Starting the app creates missing tables. Do not copy an environment example over an existing `.env` file. No AI key is needed; without a configured key the assistant uses the rule-based fallback.

API root: <http://127.0.0.1:8000/>
Health: <http://127.0.0.1:8000/health>
Interactive API docs: <http://127.0.0.1:8000/docs>

### Frontend

```powershell
cd frontend
npm ci
# Optional: copy .env.example to .env only if .env does not already exist.
npm run dev
```

Vite prints the local URL, normally <http://localhost:5173>. `VITE_API_BASE_URL` defaults to `http://localhost:8000/api/v1`. The backend CORS defaults allow localhost and 127.0.0.1 on ports 5173 and 3000; if Vite selects another port, configure `CORS_ORIGINS` for that exact local origin.

See [backend setup and API notes](backend/README.md) and [frontend setup and scripts](frontend/README.md).

## Tests and recorded QA

- Backend suite: from `backend/`, run `python -m pytest tests -q`. The test fixture selects isolated in-memory SQLite databases. The retained Tester 2 report records 71 backend tests passed for its stated baseline; this is historical evidence, not a claim that tests were run during a fresh setup.
- Frontend checks: from `frontend/`, run `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test:verification-state`. `npm run test:parsers` runs scanner parser tests. The recorded combined Node test command is documented in `frontend/README.md`.
- Current Tester 1 manual QA: 5 passed, 0 failed, 0 blocked, and 48 not run across 53 executable MVP cases. TC-007 remains deferred. See [manual execution report](documentation/TEST_EXECUTION_REPORT.md) and [test case register](documentation/TEST_CASES.md).
- Tester 2 automation and its detailed evidence are reported separately in [Tester 2 report](documentation/evidence/tester-2/TESTER_2_FINAL_REPORT.md).

## Limitations and safe use

This MVP has no authentication, authorization, user isolation, or private conversation ownership. Do not deploy it for public or multi-user use with sensitive data. It does not create GitHub issues or pull requests, integrate with GitHub, apply patches, or deploy changes. AI output is advisory and requires human review. A completed remediation task is not verification; record evidence separately.

See [project specification](documentation/SPEC.md), [test plan](documentation/TEST_PLAN.md), [bug register](documentation/BUG_REPORTS.md), and [AI interaction log](documentation/AI_INTERACTION_LOG.md).
