# PatchPilot backend

The backend is a FastAPI REST API for importing and reviewing security findings, producing deterministic risk scores and remediation guidance, managing tasks, and recording verification evidence.

## Requirements and dependencies

The repository does not declare a minimum Python version. Python 3.11.9 is recorded for local setup and Python 3.12.13 for Tester 2 validation. Install the ranges in `requirements.txt` with pip. SQLite is the default local database; PostgreSQL is supported through SQLAlchemy and the included psycopg2 driver when `DATABASE_URL` points to a configured PostgreSQL service.

## Local setup

From this directory:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Use the Python installation available on your system; `python -m venv .venv` is an alternative if `py -3.11` is unavailable. On macOS/Linux, activate with `source .venv/bin/activate`.

The default URL is `sqlite:///./patchpilot.db`, resolved relative to the backend working directory. You can set `DATABASE_URL` in the process environment or in a local `.env` file. `backend/.env.example` is a template, not a credential file. Do not overwrite an existing `.env` when copying it. The app lifespan creates missing tables; a migration command is not required for a fresh local run. Alembic migration files are available for explicit schema migration workflows; review the target database and migration state before applying them to an existing database.

The default bind is loopback (`127.0.0.1`) for local use. Do not expose this unauthenticated MVP to a network as a production service.

API root: <http://127.0.0.1:8000/>
Health: <http://127.0.0.1:8000/health> and <http://127.0.0.1:8000/api/v1/health>
Interactive docs: <http://127.0.0.1:8000/docs>
OpenAPI JSON: <http://127.0.0.1:8000/openapi.json>

## Configuration

| Setting | Purpose | Default / behavior |
|---|---|---|
| `DATABASE_URL` | SQLAlchemy database URL | `sqlite:///./patchpilot.db` |
| `CORS_ORIGINS` | Allowed browser origins | localhost/127.0.0.1 ports 5173 and 3000 |
| `AI_PROVIDER` | External provider identifier | unset in application defaults |
| `AI_API_KEY` | Provider credential | unset; no external call without it |
| `AI_MODEL` | Provider model name | unset unless configured |
| `AI_API_URL` | Provider endpoint | unset unless configured |

The example environment leaves provider and key blank, so the default is the rule-based fallback. An external call is attempted only when both values are nonblank. The health response reports `rule-based-fallback` when configuration is incomplete; when both values are present it reports `configured_unverified` and explicitly does not test reachability. Chat/guidance response fields such as `is_fallback`, `provider`, and `model` report the outcome of that request. Never commit API keys.

SQLite is recommended for local development. To select PostgreSQL, configure a valid SQLAlchemy URL such as `postgresql+psycopg2://...` and make the service available. Do not put real credentials in tracked documentation or `.env.example`.

## Architecture and API

The frontend parses supported Trivy and OWASP ZAP reports and posts normalized records to `POST /api/v1/findings/import`. The backend validates records, calculates a severity-based score, stores data using SQLAlchemy, and returns findings to the dashboard/catalog. Other routes serve findings, dashboard metrics, remediation guidance, tasks, verification evidence, and chat. FastAPI generates the OpenAPI document and Swagger UI at runtime.

| Route | Methods | Purpose |
|---|---|---|
| `/health`, `/api/v1/health` | GET | Application and database readiness |
| `/api/v1/dashboard/summary` | GET | Dashboard totals and breakdowns |
| `/api/v1/findings/import` | POST | Import JSON findings |
| `/api/v1/findings` | GET | Search, filters, pagination |
| `/api/v1/findings/{id}` | GET | Finding details and related records |
| `/api/v1/findings/{id}/remediation-guidance` | POST | AI or rule-based guidance |
| `/api/v1/findings/{id}/tasks` | POST | Create a linked task |
| `/api/v1/tasks` | GET | List tasks |
| `/api/v1/tasks/{id}` | GET, PATCH | Read or update a task |
| `/api/v1/findings/{id}/verification` | GET, POST | Read or record verification evidence |
| `/api/v1/chat` | POST | Start or continue a conversation |
| `/api/v1/chat/conversations/{id}` | GET | Retrieve a conversation by ID |

There is no endpoint to list all conversations. Chat messages are stored in the database and are not private to an authenticated user because the MVP has no user identity or authorization model.

## Scoring, tasks, and verification

Scores are deterministic severity-based triage values: Critical 95, High 75, Medium 50, Low 25, and Informational 5, with +2 for a CVE and +1 when a fixed version is available, capped at 100. This is not CVSS and does not assess live exploitability.

Tasks use Open, In Progress, Blocked, or Completed. Completing a task does not mark a finding fixed. Verification evidence is a separate record and the latest valid evidence determines current verification status.

## Running tests

From `backend/`, use the same virtual environment:

```powershell
python -m pytest tests -q
```

`backend/tests/conftest.py` configures isolated in-memory SQLite databases before importing the application. The retained Tester 2 report records 71 backend tests passed, with two dependency deprecation warnings, for its identified baseline. Treat that as historical evidence, not a result for every checkout or future change. See the separate Tester 2 report and `documentation/TEST_PLAN.md` for broader API/frontend validation.

## Limitations

There is no authentication, authorization, user isolation, private conversation ownership, GitHub integration, automatic patching, or deployment. The service is for local development and controlled academic demonstration, not secure public or multi-user deployment. Scanner tools are not invoked; PatchPilot imports supported report JSON only.
