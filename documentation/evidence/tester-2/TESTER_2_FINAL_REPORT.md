# PatchPilot — Tester 2 Final QA Report

**Role:** Tester 2 — Automation QA Engineer  
**Project:** PatchPilot — Intelligent Security Remediation Assistant  
**Branch:** `qa/integration-baseline`  
**Head Commit:** `f65628bf048fe740d70fc18403f5f073730a8372`  
**Test Execution Date:** 2026-11-24  
**Python:** 3.12.13 | **Node:** v24.15.0 | **npm:** 11.12.1 | **pytest:** 8.4.2  
**Operating System:** Windows 11

---

## Section A — Execution Summary

| Test Area | Recorded unit | Total | Passed | Failed | Blocked | Not Run |
|---|---|---:|---:|---:|---:|---:|
| Backend automation (pytest) | Tests | 71 | 71 | 0 | 0 | 0 |
| Frontend automation | 4 checks + 16 tests | 20 | 20 | 0 | 0 | 0 |
| API testing | Test cases/probes | 43 | 43 | 0 | 0 | 0 |
| Integration testing | Workflow steps | 18 | 18 | 0 | 0 | 0 |
| Regression testing | Checks | 10 | 10 | 0 | 0 | 0 |
| White-box testing | Branch/condition evaluations | 43 | 43 | 0 | 0 | 0 |
> Across the six categories, 205 recorded outcomes/checks/steps/branch evaluations passed. This aggregate combines different measurement units and is **not** a count of 205 test cases. No aggregate case total is reported.

---

## Section B — Completed Automated Tests

### B.1 Backend Automation (71 passed, 0 failed, 2 warnings)

**Command:** `python -m pytest tests -q`  
**Duration:** 5.07s  
**Evidence:** [`pytest_run_quiet.txt`](backend/pytest_run_quiet.txt) · [`pytest_run_verbose.txt`](backend/pytest_run_verbose.txt)

**Coverage by test module:**

| Module | Tests | Focus |
|---|---:|---|
| `test_import.py` | 12 | Finding import: valid JSON, invalid JSON, malformed payloads, missing fields, invalid severities, empty collections, mixed accept/reject |
| `test_findings.py` | 10 | Findings API: list, get by ID, search, filters, pagination, invalid/nonexistent IDs |
| `test_risk_scoring.py` | 10 | Risk scoring: all 5 severity bases, CVE adjustment, fix adjustment, compound adjustment, capping, deterministic results |
| `test_remediation.py` | 8 | Remediation guidance: valid requests, missing context, rule-based fallback, provider paths, malformed responses |
| `test_tasks.py` | 8 | Tasks: create linked to finding, reject nonexistent finding, status updates, retrieval, finding relationships |
| `test_verification.py` | 10 | Verification: Verified Fixed, Failed, Partially Fixed, Inconclusive, evidence validation, invalid associations, latest result, history |
| `test_chat.py` | 7 | Chat: conversation creation, message persistence, retrieval by ID, finding context, message limits |
| `test_health.py` | 6 | Health: database readiness, degraded DB, validation errors, not-found, CORS, exception obfuscation |

**Warnings (non-blocking):**

1. `StarletteDeprecationWarning`: Using `httpx` with `starlette.testclient` is deprecated; install `httpx2` instead.
2. `StarletteDeprecationWarning`: `HTTP_422_UNPROCESSABLE_ENTITY` is deprecated; use `HTTP_422_UNPROCESSABLE_CONTENT`.

Both are upstream dependency deprecation warnings, not application defects.

---

### B.2 Frontend Automation (20 checks, 0 failures)

**Evidence:** [`lint_run.txt`](frontend/lint_run.txt) · [`typecheck_run.txt`](frontend/typecheck_run.txt) · [`build_run.txt`](frontend/build_run.txt) · [`tests_run.txt`](frontend/tests_run.txt)

| Check | Command | Result | Details |
|---|---|---|---|
| **Lint** | `npm run lint` | ✅ Pass | 0 errors, 1 warning (see below) |
| **Type Check** | `npm run typecheck` | ✅ Pass | 0 TypeScript errors |
| **Production Build** | `npm run build` | ✅ Pass | 23 assets generated in 5.99s |
| **Parser + API Presentation Tests** | `node --experimental-strip-types --test tests/*.test.mjs` | ✅ 16/16 Pass | 499ms, 0 failures |

**Lint warning (cosmetic, not a defect):**

> `VulnerabilitiesPage.tsx:36` — React `setState` call inside `useEffect` without cleanup. This is a code-quality observation, not a functional defect.

**Node `--experimental-strip-types` warning:**

> `ExperimentalWarning: Type Stripping is an experimental feature and might change at any time.` — Expected per assignment instructions; not classified as a failure.

**Frontend test breakdown (16 test cases):**

| # | Test Case | Status |
|---:|---|---|
| 1 | Network rejection distinguished from HTTP 500 | ✅ |
| 2 | HTTP status codes get distinct labels | ✅ |
| 3 | Data source badge reports live after successful health check | ✅ |
| 4 | Trivy JSON: format detection and classification | ✅ |
| 5 | Trivy JSON: vulnerability maps to import fields | ✅ |
| 6 | Trivy JSON: non-CVE identifiers not placed in cve_id | ✅ |
| 7 | Trivy JSON: UNKNOWN severity and secrets are unsupported | ✅ |
| 8 | Trivy JSON: missing title/description is invalid | ✅ |
| 9 | Trivy JSON: failed misconfiguration is importable | ✅ |
| 10 | OWASP ZAP JSON: format detection and classification | ✅ |
| 11 | OWASP ZAP JSON: risk codes, CWE and HTML handling | ✅ |
| 12 | Invalid JSON syntax rejected with clear error | ✅ |
| 13 | Unknown JSON structure rejected | ✅ |
| 14 | Empty file rejected | ✅ |
| 15 | PatchPilot native array: validates required fields | ✅ |
| 16 | Helpers utility | ✅ |

---

## Section C — Live API & Integration Results

### C.1 API Testing (43 passed, 0 failed)

**Test Script:** [`test_api_endpoints.py`](../../../tests/automation/test_api_endpoints.py)
**Evidence:** [`api_test_results.json`](api/api_test_results.json) · [`api_test_report.txt`](api/api_test_report.txt) · [`live_api_probe.txt`](api/live_api_probe.txt)

**Endpoints tested by category:**

| Category | Tests | Endpoints Covered |
|---|---:|---|
| Health | 3 | `GET /`, `GET /health`, `GET /api/v1/health` |
| Import | 6 | `POST /api/v1/findings/import` (valid, invalid JSON, missing fields, invalid severity, empty array, mixed valid/invalid) |
| Findings | 8 | `GET /api/v1/findings` (list, filters, search, pagination), `GET /api/v1/findings/{id}` (valid, invalid, nonexistent) |
| Dashboard | 4 | `GET /api/v1/dashboard/summary` (counts, severity breakdown, verification breakdown, task metrics) |
| Remediation | 5 | `POST /api/v1/remediation/guidance/{id}` (valid, nonexistent, fallback labels, provider info) |
| Tasks | 7 | `POST /api/v1/tasks`, `GET /api/v1/tasks`, `GET /api/v1/tasks/{id}`, `PATCH /api/v1/tasks/{id}` (create, retrieve, update status, nonexistent finding, invalid status) |
| Verification | 6 | `POST /api/v1/verification/evidence`, `GET /api/v1/verification/evidence` (all 4 canonical results, validation, latest result, history) |
| Chat | 4 | `POST /api/v1/chat/conversations`, `GET /api/v1/chat/conversations/{id}` (create, follow-up, retrieval, finding context) |

**Live API probe (11 probes, all passed):**

Separate live HTTP probe was executed against a fresh uvicorn instance using an isolated `.runtime/` database. All 11 probes passed, including CORS header verification on cross-origin requests.

---

### C.2 Integration Testing (18 steps, 0 failed)

**Test Script:** [`test_integration_workflows.py`](../../../tests/integration/test_integration_workflows.py)
**Evidence:** [`integration_test_results.json`](integration/integration_test_results.json) · [`integration_test_report.txt`](integration/integration_test_report.txt)

| Integration Workflow | Steps | Result | Description |
|---|---:|---|---|
| **INT-1:** Finding Import Pipeline | 3 | ✅ Pass | Trivy fixture → parser → `POST /import` → DB → `GET /findings` list |
| **INT-2:** Remediation Guidance | 1 | ✅ Pass | Finding context → guidance request → rule-based fallback with transparent labels |
| **INT-3:** Task Management Lifecycle | 5 | ✅ Pass | Create task → retrieve → Open → In Progress → Blocked → Completed transitions |
| **INT-4:** Verification Integrity | 6 | ✅ Pass | Evidence creation → latest result rule → task independence → history preservation |
| **INT-5:** Chat Persistence | 3 | ✅ Pass | Create conversation → multi-turn follow-up → full history retrieval (4 messages) |

**Key integration findings:**

- INT-1: Per-record validation works correctly — valid records are imported while invalid records in the same batch are individually rejected (HTTP 201 with both `imported_findings` and `rejected_findings` arrays).
- INT-2: Fallback guidance is correctly labelled with `is_fallback: true` and `provider: "rule-based-fallback"` — no silent misrepresentation.
- INT-3: All 4 task status transitions succeed and remain linked to the correct finding.
- INT-4: Completing a task does **not** automatically mark the vulnerability as fixed — verification evidence is independent. Latest evidence is determined by highest `evidence_id`, matching the BUG-P0-001 fix.
- INT-5: Conversation messages persist across requests with correct ordering and finding context.

---

## Section D — Regression Results

### 10 regression checks passed, 0 failed

**Test Script:** [`test_regression_defects.py`](../../../tests/automation/test_regression_defects.py)
**Evidence:** [`regression_test_results.json`](regression/regression_test_results.json) · [`regression_test_report.txt`](regression/regression_test_report.txt)

### BUG-P0-001 — Verification Result Normalization (commit `03423ee`)

| # | Regression Check | Result |
|---:|---|---|
| 1 | Canonical values & aliases normalization (13 variations) | ✅ Pass |
| 2 | Invalid/blank/null rejection with zero persistence | ✅ Pass |
| 3 | Omitted result defaults to Inconclusive | ✅ Pass |
| 4 | 5-evidence sequence correctly controls finding status | ✅ Pass |
| 5 | Dashboard historical breakdown preserved | ✅ Pass |

### BUG-INT-001 — Database Isolation & Error Handling (commit `f65628b`)

| # | Regression Check | Result |
|---:|---|---|
| 6 | Database engine isolation (StaticPool, in-memory) | ✅ Pass |
| 7 | Multi-thread schema visibility under SQLite | ✅ Pass |
| 8 | Chat persistence across separate requests | ✅ Pass |
| 9 | Health endpoint returns 503 on missing/degraded tables | ✅ Pass |
| 10 | CORS headers on 500 responses with traceback obfuscation | ✅ Pass |

---

## Section E — White-Box & Code Path Analysis

### 43 internal branches exercised, 0 failures

**Test Script:** [`test_whitebox_paths.py`](../../../tests/automation/test_whitebox_paths.py)
**Evidence:** [`whitebox_test_results.json`](coverage/whitebox_test_results.json) · [`whitebox_coverage_report.txt`](coverage/whitebox_coverage_report.txt)

| Category | Branches | Description |
|---|---:|---|
| SeverityLevel normalization | 15 | 9 valid mappings (Critical, CRITICAL, critical, High, Medium, MODERATE, Low, Informational, INFO) + 6 rejections (empty, whitespace, Severe, Catastrophic, None, 123) |
| TaskStatus normalization | 13 | 8 valid mappings (Open, In Progress, in_progress, inprogress, Blocked, Completed, done, closed) + 5 rejections (empty, whitespace, pending, archived, None) |
| Risk scoring calculations | 9 | 5 severity baselines + CVE adjustment (+2.0) + fix adjustment (+1.0) + compound (+3.0) + cap boundary (98.0 ≤ 100.0) |
| Verification algorithm | 4 | Empty input → None, all invalid → None, mixed valid/invalid → correct filter, max ID selection → correct priority |
| AI remediation paths | 2 | No API key → rule-based fallback, provider exception → graceful recovery with error note |

---

## Section F — Remaining Warnings & Limitations

### Scope notes for the current Test Case Register

| ID | Description | Reason |
|---|---|---|
| TC-007 | Duplicate import policy | Deferred in the current register until duplicate-import policy is specified |
| TC-010 | Source filtering | Current register defines an MVP source-filter case; the findings API implements a `source` filter. The earlier status-filter disposition is obsolete. This Tester 2 report records no execution result for the revised case. |
| TC-016 | Risk-score boundaries | Current register defines an MVP case for supported severity-based score boundaries, not CVSS input. The implementation provides severity bases and CVE/fix adjustments. The earlier CVSS disposition is obsolete. This Tester 2 report records no execution result for the revised case. |
| TC-026 | Assignee validation on tasks | Out of MVP; assignee is free text and there is no user identity directory |
| TC-029 | Authorization / user ownership | Out of MVP; authentication and authorization are not implemented |

### Non-Blocking Warnings

| Source | Warning | Impact |
|---|---|---|
| Backend (pytest) | `StarletteDeprecationWarning`: httpx → httpx2 migration | None — upstream dependency |
| Backend (pytest) | `StarletteDeprecationWarning`: HTTP_422 name change | None — upstream dependency |
| Frontend (lint) | `setState` in `useEffect` in `VulnerabilitiesPage.tsx:36` | Cosmetic code-quality note |
| Frontend (test) | `ExperimentalWarning`: Type Stripping is experimental | Expected — documented in assignment |

### Other Limitations

- **No formal code coverage percentage:** `pytest-cov` is not installed; `python -m trace` failed due to stale `.pyc` paths from a previous environment. White-box analysis was performed via direct branch-level unit testing (43 branches exercised).
- **Browser/UI verification** is outside Tester 2 scope (Tester 1 responsibility).
- **Live AI provider testing** was not performed. All AI-related tests use mocked providers or confirm rule-based fallback behavior. Testing a live AI provider would require an approved non-production API key.

---

## Section G — Defects Found

**No new defects were discovered during this testing cycle.**

All recorded Tester 2 outcomes in the six categories passed (71 backend tests, 20 frontend checks/tests, 43 API cases/probes, 18 integration steps, 10 regression checks, and 43 white-box branch/condition evaluations). These unlike units are not 205 test cases. Automated regression evidence supports the fixes for BUG-P0-001 and BUG-INT-001; independent Tester 1 retests are not recorded, and BUG-INT-001 browser verification remains pending.

---

## Section H — Environment & Technical Notes

### Test Database Safety

All backend tests use an isolated in-memory SQLite database (`sqlite://`), configured in `conftest.py` via dependency override. The developer database `backend/patchpilot.db` was never accessed during testing.

### Windows Sandbox Limitation

The FastAPI `TestClient` requires loopback socket access (`socket.socketpair()` → `127.0.0.1`). On Windows, the sandbox blocks this, causing `lsock.accept()` to hang indefinitely. All backend Python test commands were executed with explicit loopback access. This is a test environment constraint, not an application defect.

### Test Execution Commands

| Test Area | Command |
|---|---|
| Backend pytest | `backend\.venv\Scripts\python.exe -m pytest tests -q` |
| Frontend lint | `npm run lint` |
| Frontend typecheck | `npm run typecheck` |
| Frontend build | `npm run build` |
| Frontend parser tests | `node --experimental-strip-types --test tests/apiPresentation.test.mjs tests/scannerParsers.test.mjs` |
| API tests | `backend\.venv\Scripts\python.exe tests/automation/test_api_endpoints.py` |
| Integration tests | `backend\.venv\Scripts\python.exe tests/integration/test_integration_workflows.py` |
| Regression tests | `backend\.venv\Scripts\python.exe tests/automation/test_regression_defects.py` |
| White-box tests | `backend\.venv\Scripts\python.exe tests/automation/test_whitebox_paths.py` |

---

## Section I — Recommendation

> **Tester 2 results recorded; release readiness not assessed.**

Tester 2 recorded passing evidence for 205 outcomes across six categories, using the category-specific units shown above; this is not 205 test cases. Two backend deprecation warnings and one frontend lint warning are recorded. In the current case register, TC-007 is Deferred, TC-026 and TC-029 are Out of MVP, and TC-010 and TC-016 are MVP cases with no Tester 2 execution result recorded here. Defect severity and priority remain undocumented in `documentation/BUG_REPORTS.md`, so this report makes no claim that no critical/high-priority defects remain. Automated regression evidence is recorded for both historical fixes, while independent Tester 1 retesting and BUG-INT-001 browser verification remain outstanding. Release readiness is not assessed by this Tester 2 report.

---

## Evidence Directory

All evidence is preserved at:

```
documentation/evidence/tester-2/
├── backend/
│   ├── pytest_run_quiet.txt
│   └── pytest_run_verbose.txt
├── frontend/
│   ├── lint_run.txt
│   ├── typecheck_run.txt
│   ├── build_run.txt
│   └── tests_run.txt
├── api/
│   ├── api_test_results.json
│   ├── api_test_report.txt
│   └── live_api_probe.txt
├── integration/
│   ├── integration_test_results.json
│   └── integration_test_report.txt
├── regression/
│   ├── regression_test_results.json
│   └── regression_test_report.txt
├── coverage/
│   ├── whitebox_test_results.json
│   └── whitebox_coverage_report.txt
└── TESTER_2_FINAL_REPORT.md  ← this file
```

---

*Report generated: 2026-11-24 | Tester 2 — Automation QA Engineer*
