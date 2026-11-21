# PatchPilot Backend

> **Intelligent Security Remediation Assistant**
> *Understand → Remediate → Learn*

PatchPilot backend provides a robust, developer-friendly REST API for importing software security findings, computing explainable risk prioritization scores, generating AI or rule-based remediation recommendations, assigning tasks, and independently recording manual/automated verification evidence.

---

## 1. Technology Stack

- **Framework**: FastAPI (Python 3.12+)
- **ORM**: SQLAlchemy 2.0 (synchronous sessions)
- **Migrations**: Alembic
- **Validation & Serialization**: Pydantic v2 & Pydantic-Settings
- **Testing**: Pytest & Starlette/HTTPX TestClient
- **Database**:
  - **PostgreSQL** in production/containerized environments.
  - **SQLite Fallback** (`sqlite:///./patchpilot.db`) for zero-configuration local development and testing.

---

## 2. Directory Structure

```text
backend/
├── app/
│   ├── main.py                  # FastAPI application factory, CORS, lifespan & router mounts
│   ├── core/
│   │   ├── config.py            # Pydantic BaseSettings loading from environment/.env
│   │   └── __init__.py
│   ├── database/
│   │   ├── base.py              # SQLAlchemy DeclarativeBase
│   │   ├── session.py           # Engine & SessionLocal factory with get_db dependency
│   │   └── __init__.py
│   ├── models/
│   │   ├── finding.py           # Finding model
│   │   ├── task.py              # RemediationTask model
│   │   ├── verification.py      # VerificationEvidence model
│   │   └── __init__.py
│   ├── schemas/
│   │   ├── common.py            # Enums (SeverityLevel, TaskStatus, VerificationResult)
│   │   ├── finding.py           # Finding Pydantic schemas & import responses
│   │   ├── task.py              # RemediationTask Pydantic schemas
│   │   ├── verification.py      # VerificationEvidence Pydantic schemas
│   │   ├── remediation.py       # RemediationGuidanceResponse schema
│   │   ├── dashboard.py         # DashboardSummaryResponse schema
│   │   └── __init__.py
│   ├── routers/
│   │   ├── health.py            # /health & /api/v1/health checks
│   │   ├── findings.py          # /api/v1/findings endpoints (import, list, detail, guidance, tasks, verif)
│   │   ├── tasks.py             # /api/v1/tasks endpoints (list, get, patch)
│   │   ├── dashboard.py         # /api/v1/dashboard/summary
│   │   └── __init__.py
│   ├── services/
│   │   ├── risk_scoring.py      # Deterministic, explainable risk scoring service
│   │   ├── ai_service.py        # Isolated AI service with rule-based fallback
│   │   ├── finding_service.py   # Finding business logic & JSON ingestion
│   │   ├── task_service.py      # Remediation task management
│   │   ├── verification_service.py # Verification evidence recording
│   │   ├── dashboard_service.py # Summary aggregation logic
│   │   └── __init__.py
│   └── utils/
├── alembic/
│   ├── env.py                   # Alembic environment configured with SQLAlchemy models
│   ├── script.py.mako           # Migration template
│   └── versions/
│       └── 001_initial_schema.py# Baseline migration for findings, tasks, verifications
├── tests/
│   ├── conftest.py              # Isolated in-memory SQLite database & test client
│   ├── test_health.py           # Health check tests
│   ├── test_risk_scoring.py     # Deterministic risk scoring tests
│   ├── test_import.py           # JSON import (valid, missing fields, invalid severity, atomicity)
│   ├── test_findings.py         # Finding retrieval, filtering, search, and pagination
│   ├── test_tasks.py            # Task creation, lifecycle transitions, status checks
│   ├── test_verification.py     # Verification recording & task completion separation test
│   ├── test_dashboard.py        # Metrics and summary aggregation tests
│   └── test_ai_remediation.py   # AI guidance tests, rule-based fallback & provider error handling
├── alembic.ini                  # Alembic configuration
├── requirements.txt             # Minimal dependencies
├── .env.example                 # Example environment variables
└── README.md                    # Backend documentation
```

---

## 3. Database Models & Schema

### Finding
- `id`: Integer primary key (autoincrement).
- `title`: String (not null).
- `description`: Text (not null).
- `severity`: String (Critical, High, Medium, Low, Informational).
- `cve_id`: String (optional, e.g. CVE-2023-12345).
- `package_name`: String (optional).
- `installed_version`: String (optional).
- `fixed_version`: String (optional).
- `source`: String (scanner origin or manual).
- `file_path`: String (optional source code path).
- `risk_score`: Float (calculated severity prioritization score).
- `original_data`: JSON (raw imported finding payload).
- `created_at`: DateTime UTC.
- Relationships:
  - `tasks` (Cascade delete).
  - `verifications` (Cascade delete).

### RemediationTask
- `id`: Integer primary key.
- `finding_id`: Foreign key to `findings.id` (ondelete CASCADE).
- `title`: String (not null).
- `description`: Text (optional).
- `assignee`: String (optional).
- `status`: String (`Open`, `In Progress`, `Blocked`, `Completed`).
- `created_at`, `updated_at`: DateTime UTC.

### VerificationEvidence
- `id`: Integer primary key.
- `finding_id`: Foreign key to `findings.id` (ondelete CASCADE).
- `task_id`: Optional Foreign key to `remediation_tasks.id` (ondelete SET NULL).
- `evidence_description`: Text (not null).
- `evidence_url`: String (optional commit, PR, or report URL).
- `verification_result`: String (`Verified Fixed`, `Failed`, `Partially Fixed`, `Inconclusive`).
- `created_at`: DateTime UTC.

> **Crucial Rule**: Completing a remediation task does **NOT** automatically mark a vulnerability as fixed. Verification is maintained as an independent evidence log to enforce real security verification.

---

## 4. Deterministic Risk Scoring

PatchPilot uses a transparent, explainable severity-based prioritization score:

- **Critical**: 95.0
- **High**: 75.0
- **Medium**: 50.0
- **Low**: 25.0
- **Informational**: 5.0

**Secondary Explainable Factors**:
- Known registered CVE: `+2.0`
- Fixed version available: `+1.0` (indicates high triage actionability)
- Score range: clamped to `[0.0, 100.0]`.

*Disclaimer: This is a severity-based prioritization score for developer triage, not an official CVSS vector score or a live exploitability assessment.*

---

## 5. AI Remediation & Rule-Based Fallback

When an external LLM is configured via `AI_PROVIDER` and `AI_API_KEY`:
- PatchPilot formats a strict structured prompt without hallucinating facts.
- Requests valid JSON for explanation, impact, steps, compatibility, and verification.

When no LLM is configured (or if the external provider fails/times out):
- PatchPilot automatically engages its deterministic **rule-based remediation engine**.
- The response clearly identifies `is_fallback: True` and `provider: "rule-based-fallback"`.
- It never pretends fallback output was produced by an AI model.

---

## 6. API Reference (`/api/v1`)

| Endpoint | Method | Description |
|---|---|---|
| `/health` | `GET` | Health check and database connectivity |
| `/api/v1/health` | `GET` | API v1 health check |
| `/api/v1/findings/import` | `POST` | Import JSON array or `{ "findings": [...] }` |
| `/api/v1/findings` | `GET` | List findings (filters: `severity`, `source`, `has_cve`, `query`, pagination) |
| `/api/v1/findings/{id}` | `GET` | Get finding details, tasks, and verifications |
| `/api/v1/findings/{id}/remediation-guidance` | `POST` | Generate remediation guidance (AI or fallback) |
| `/api/v1/findings/{id}/tasks` | `POST` | Create a task for a finding |
| `/api/v1/tasks` | `GET` | List all tasks (filters: `finding_id`, `status`, `assignee`) |
| `/api/v1/tasks/{id}` | `GET` | Get task by ID |
| `/api/v1/tasks/{id}` | `PATCH` | Update task status or details |
| `/api/v1/findings/{id}/verification` | `POST` | Record verification evidence |
| `/api/v1/findings/{id}/verification` | `GET` | List verification evidence for finding |
| `/api/v1/dashboard/summary` | `GET` | Dashboard counts, breakdowns, and statistics |
| `/api/v1/chat` | `POST` | Send message to AI conversational assistant (multi-turn, finding context, fallback) |
| `/api/v1/chat/conversations/{id}` | `GET` | Get conversation details and chronological message history |

FastAPI Swagger documentation is accessible at `http://localhost:8000/docs`.

### Conversational AI Assistant (`/api/v1/chat`)

PatchPilot provides an AI-first conversational assistant designed to help developers and students understand and remediate security vulnerabilities.

#### Request Format (`POST /api/v1/chat`):
```json
{
  "message": "How do I remediate this vulnerability?",
  "conversation_id": "optional-uuid-string-or-null",
  "finding_id": 1
}
```

- `message`: Required string, 1 to 4000 characters.
- `conversation_id`: Optional UUID. If omitted or `null`, a new conversation is initialized.
- `finding_id`: Optional integer referencing an existing imported finding. When provided, finding context is injected into the assistant's memory.

#### Response Format:
```json
{
  "conversation_id": "c1a2b3c4-...",
  "message_id": "m1a2b3c4-...",
  "role": "assistant",
  "content": "Explanation and actionable steps...",
  "structured_guidance": {
    "vulnerability_explanation": "...",
    "potential_impact": "...",
    "recommended_remediation_steps": ["..."],
    "compatibility_considerations": "...",
    "verification_steps": ["..."],
    "uncertainty_or_missing_information": "..."
  },
  "is_fallback": false,
  "provider": "openai",
  "model": "gpt-4o-mini",
  "finding_context": {
    "id": 1,
    "title": "Vulnerable library log4j",
    "severity": "Critical",
    "risk_score": 98.0,
    "cve_id": "CVE-2021-44228",
    "package_name": "log4j-core",
    "installed_version": "2.14.1",
    "fixed_version": "2.17.1",
    "file_path": "pom.xml"
  },
  "disclaimer": "AI and rule-based guidance requires human review. PatchPilot does not automatically modify source code or systems.",
  "created_at": "2026-11-21T14:30:00Z"
}
```

#### Multi-turn Conversation & History Retrieval (`GET /api/v1/chat/conversations/{id}`):
Returns metadata and all messages stored in the database in chronological order.

#### Limits & Safety Guardrails:
- **Message size limit**: 4000 characters max. Empty or whitespace-only messages are rejected with 422.
- **Conversation length limit**: Maximum 50 messages per conversation. Exceeding returns 400 Bad Request.
- **Context sliding window**: Latest 20 messages sent to the LLM to control token costs while preserving full history in the database.
- **Rule-based fallback**: When no LLM is configured or when the provider is unreachable, PatchPilot engages a deterministic rule-based security knowledge base (`is_fallback: true`, `provider: "rule-based-fallback"`).
- **Anti-hallucination constraints**: Prompts strictly prohibit inventing CVEs, package versions, or systems.
- **Independent verification requirement**: AI guidance never claims a vulnerability is fixed without recorded verification evidence.

#### ⚠️ Security and Authentication Limitation:
The current MVP does not implement user authentication or authorization. Conversations are stored globally and are not user-isolated. This configuration is intended for controlled academic demonstration and local testing, and is **not suitable for public production deployment**.

---

## 7. Setup & Local Execution

### Prerequisites
- Python 3.12+ (or `uv`)

### Step 1: Create Virtual Environment and Install Dependencies

Using `uv` (recommended):
```bash
cd backend
uv venv .venv
uv pip install -r requirements.txt
```

Or using standard `pip`:
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### Step 2: Configure Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(By default, SQLite is configured at `sqlite:///./patchpilot.db`, so no additional setup is required for local use).*

### Step 3: Run Database Migrations

```bash
# From the backend directory:
alembic upgrade head
```

### Step 4: Start the Backend Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
The API is now running at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.

---

## 8. Running Automated Tests

Run the full pytest suite:
```bash
pytest tests -v
```
All 25 automated tests run against an isolated in-memory test database, mocking external AI calls to ensure zero external API costs.
