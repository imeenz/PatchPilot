# PatchPilot project specification

## 1. Purpose

PatchPilot is an academic security-remediation workflow application. It helps a reviewer import security findings, prioritize them, request remediation guidance, track work, and record verification evidence.

## 2. Implemented MVP scope

### Finding import and review

- The frontend imports Trivy JSON and OWASP ZAP traditional JSON. It parses and maps report data; it does not execute scanners.
- The backend accepts normalized JSON findings, validates required fields and severity, and stores accepted records.
- The workspace provides an overview, finding catalog, details, search, severity/source/CVE filters, and pagination.

### Prioritization

- A deterministic score uses severity bases: Critical 95, High 75, Medium 50, Low 25, Informational 5.
- A CVE adds 2 points and an available fixed version adds 1 point; the score is capped at 100.
- This is a triage score, not CVSS and not a live exploitability assessment.

### Guidance and assistant

- Finding-specific remediation guidance and chat use a configured external provider only when provider and API key are configured. If no provider is configured or a provider request fails, a rule-based fallback can respond.
- Responses identify fallback/provider metadata. Recommendations are advisory and require human review.
- Conversations are stored and retrievable by ID. There is no endpoint to list all conversations.

### Tasks and verification

- Tasks are linked to findings and support Open, In Progress, Blocked, and Completed.
- Verification evidence is stored separately, with outcomes Verified Fixed, Failed, Partially Fixed, or Inconclusive.
- Completing a task does not establish that a finding is fixed. Verification evidence is required to represent verification state.

## 3. Architecture and data flow

The browser frontend parses supported report files and sends normalized finding payloads to the FastAPI API. The backend validates payloads, calculates scores, and persists data through SQLAlchemy. Dashboard and catalog requests read those records. Task, verification, and chat actions use separate API routes and persistence models. SQLite is the default local database; PostgreSQL can be selected using `DATABASE_URL`. Alembic migration files are included; application startup also creates missing tables.

## 4. Non-goals and limitations

The MVP does not provide authentication, authorization, user accounts, user isolation, private conversation ownership, GitHub integration, automatic patching, scanner execution, or deployment. It is not suitable for secure public or multi-user production use. Do not use it with sensitive findings or conversation content in an exposed environment.

## 5. Requirements for future work

Any future authentication, authorization, user ownership, duplicate-import policy, deployment, scanner integration, or automated remediation feature requires separately defined acceptance criteria, implementation, and QA evidence. The current MVP must not be described as having these capabilities.
