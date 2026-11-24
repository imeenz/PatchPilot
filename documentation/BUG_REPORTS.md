# PatchPilot — Bug Reports

This register reconciles confirmed historical defects with their implementation commits and documented regression results. It distinguishes developer regression testing from independent QA retesting. Do not infer missing details; use **Undocumented** where the source record does not specify them. Suspected issues remain separate until runtime reproduction confirms them.

## Status definitions

- **Open:** Confirmed defect without an implemented fix.
- **In Progress:** A fix is being implemented.
- **Fixed:** A fix is committed and developer regression results are recorded. This does not by itself mean independent QA retest or browser verification is complete.
- **Ready for Retest:** Fix is available for independent QA verification.
- **Closed:** Required verification is complete and disposition accepted.
- **Reopened:** A previously fixed/closed defect reproduces again.

## Bug summary

| ID | Title | Severity | Priority | Status | Related test | Fix commit | Retest status |
|---|---|---|---|---|---|---|---|
| BUG-P0-001 | Reject invalid verification results and derive finding status from latest evidence | Undocumented | Undocumented | Fixed | `backend/tests/test_verification.py`; `backend/tests/test_dashboard.py` | `03423ee29088ffcc79bc97d343061bc5365fd8cd` | Developer regression reported passing; independent Tester 1 retest undocumented |
| BUG-INT-001 | Backend Database Isolation and Frontend Integration Failure | Undocumented | Undocumented | Fixed | `backend/tests/test_integration_isolation.py`; `backend/tests/test_health.py`; `backend/tests/test_chat.py`; `frontend/tests/apiPresentation.test.mjs` | `f65628bf048fe740d70fc18403f5f073730a8372` | Automated regression reported passing; browser verification and independent Tester 1 retest pending |

## BUG-P0-001 — Reject invalid verification results and derive finding status from latest evidence

- **Reported by:** Undocumented.
- **Investigation date:** 2026-11-24, as recorded in `AI_INTERACTION_LOG.md`.
- **Severity:** Undocumented.
- **Priority:** Undocumented. The `P0` identifier/task wording is not used to infer either field.
- **Environment:** Backend implementation on `backend-review`; runtime tests used the backend test environment. The focused run is documented with `DATABASE_URL=sqlite://`. Exact OS and dependency versions are undocumented.
- **Description:** Invalid or blank verification-result values could normalize to `Verified Fixed`. Separately, a prior successful evidence record could leave a finding marked fixed after newer `Failed` or `Inconclusive` evidence was recorded.
- **Preconditions:** The original incident preconditions are undocumented. The regression tests create a finding, submit verification requests, and for status sequences create multiple evidence records for that finding.
- **Original reproduction steps:** Undocumented. The following describes regression coverage, not a recovered original report:
  1. Submit verification with an unknown, empty, whitespace-only, or null `verification_result`.
  2. Check response and verify no evidence was persisted.
  3. Submit multiple results for one finding, including `Verified Fixed` followed by `Failed` or `Inconclusive`.
  4. Compare current status in finding detail, findings list, and dashboard while confirming history remains available.
- **Expected result:** Invalid result values are rejected with HTTP 422 and not persisted; an omitted result defaults to `Inconclusive`; current status is determined consistently by the latest valid evidence ID, while evidence history and historical result counts remain intact.
- **Actual result before fix:** As summarized in the interaction log, invalid/blank inputs could be treated as `Verified Fixed`, and status calculations could continue to reflect historical success despite newer negative or inconclusive evidence.
- **Root cause:** Verification-result normalization was permissive for invalid/blank inputs, and finding/dashboard status calculations did not consistently use the latest valid evidence record.
- **Fix reference:** Commit `03423ee29088ffcc79bc97d343061bc5365fd8cd` — `fix(verification): use latest valid evidence consistently`.
- **Changed implementation files:** `backend/app/schemas/common.py`, `backend/app/schemas/verification.py`, `backend/app/routers/findings.py`, `backend/app/services/finding_service.py`, and `backend/app/services/dashboard_service.py`.
- **Regression tests:** `backend/tests/test_verification.py` includes `test_verification_accepts_canonical_results_and_aliases`, `test_invalid_verification_results_are_rejected_without_persisting`, `test_omitted_verification_result_defaults_to_inconclusive`, `test_verification_history_is_ordered_by_descending_evidence_id`, and `test_latest_evidence_controls_detail_list_and_dashboard`. `backend/tests/test_dashboard.py` includes `test_dashboard_uses_latest_evidence_but_keeps_historical_breakdown`.
- **Developer retest status:** The interaction log reports 30 focused verification/dashboard tests passed with 1 warning and a 64-test full backend suite passed with 2 warnings. The later combined QA baseline reports the complete backend suite passed with 71 tests and 2 warnings. These are developer regression results, not independent Tester 1 retest.
- **Independent QA retest:** Undocumented.
- **Evidence:** Fix commit and named regression tests above; result summaries are recorded in `documentation/AI_INTERACTION_LOG.md`. Separate retained test-output artifact paths are undocumented.
- **Known limitation:** Existing database records were not rewritten; the interaction log notes that stored results alone cannot distinguish previously misclassified records from intentionally recorded `Verified Fixed` evidence.
- **Current status:** Fixed; automated regression reported passing. Independent Tester 1 retest is not documented.

## BUG-INT-001 — Backend Database Isolation and Frontend Integration Failure

- **Reported by:** Undocumented.
- **Investigation date:** 2026-11-24, as recorded in `AI_INTERACTION_LOG.md`.
- **Severity:** Undocumented.
- **Priority:** Undocumented.
- **Environment:** Backend/frontend development on `backend-review`; test runs used isolated SQLite configuration. The interaction log records `DATABASE_URL=sqlite:///C:/Users/ASUS/Desktop/projects/TrustChain/backend/.runtime/bug-int-001-tests.db` for one test phase and a later full-suite run with launcher `DATABASE_URL` unset. The exact OS and dependency versions are undocumented.
- **Description:** In-memory SQLite state was not reliably shared between startup and request worker threads. The health check did not verify that application tables were present. CORS headers were missing on unhandled server errors. Frontend presentation did not distinguish network failures from HTTP failures clearly and could report a live findings data source before a successful findings response.
- **Preconditions:** An in-memory SQLite database with schema created during application lifespan and requests served from worker threads; health checks against missing tables; an unhandled API error from an allowed frontend origin; or frontend requests producing network and HTTP errors. The exact original chat traceback and full original reproduction sequence were not captured.
- **Original reproduction steps:** Exact original steps and traceback are undocumented. Regression coverage exercises the following:
  1. Initialize the application with an in-memory SQLite URL, create schema during lifespan, and inspect table visibility from a request worker thread.
  2. Exercise chat creation, follow-up, and history through the application database with the rule-based fallback.
  3. Check health with required tables missing.
  4. Trigger an unhandled API error from an allowed origin and inspect CORS headers and response details.
  5. Exercise frontend presentation for network rejection, HTTP errors, and health/findings request state.
- **Expected result:** Startup and request workers see the same in-memory application schema; request fixtures remain isolated; health reports missing required tables as degraded/unready; allowed-origin CORS headers remain on unhandled errors without exposing exception details; frontend distinguishes network and HTTP errors and only reports live findings after successful health and findings requests.
- **Actual result before fix:** The interaction log reports that worker threads could see separate empty SQLite databases, `SELECT 1` could pass without application tables, unhandled 500 responses lacked CORS, and frontend status/error labels did not represent the failure state accurately. The original chat exception text is unknown and is not asserted here.
- **Root cause:** The in-memory SQLite engine used a pool that did not share one database across worker threads; readiness checked connectivity rather than required schema; CORS middleware did not wrap the full ASGI application/server-error path; frontend health/data-source/error presentation did not distinguish the relevant request outcomes.
- **Fix reference:** Commit `f65628bf048fe740d70fc18403f5f073730a8372` — `fix(integration): isolate database and improve API error handling`.
- **Changed implementation files:** `backend/app/database/session.py`, `backend/app/main.py`, `backend/app/routers/health.py`, `frontend/src/components/ui/StateViews.tsx`, `frontend/src/hooks/useBackendHealth.ts`, `frontend/src/pages/VulnerabilitiesPage.tsx`, `frontend/src/services/apiPresentation.mjs`, and `frontend/src/services/apiPresentation.d.mts`. Test configuration, README, `.gitignore`, tests, and the interaction log were also changed in that commit.
- **Backend regression tests:** `backend/tests/test_integration_isolation.py` includes `test_application_startup_engine_is_in_memory_and_request_dependency_is_separate`, `test_startup_database_schema_is_visible_from_request_worker_thread`, `test_chat_create_follow_up_and_history_use_isolated_application_database`, `test_in_memory_sqlite_uses_one_shared_database_across_threads`, `test_health_reports_missing_application_tables_as_not_ready`, and `test_unhandled_api_errors_keep_cors_headers_and_hide_exception_details`. Related coverage is in `backend/tests/test_health.py` and `backend/tests/test_chat.py`.
- **Frontend regression tests:** `frontend/tests/apiPresentation.test.mjs` covers network versus HTTP errors, status labels, and live data-source readiness.
- **Developer retest status:** The interaction log reports a focused backend run of 54 passed/1 warning, a full run of 70 passed/2 warnings, and a later environment-free full backend run of 71 passed/2 warnings. Frontend tests reported 16 passed; TypeScript checking and the Vite production build passed. These are developer results, not independent Tester 1 retest.
- **Browser verification:** Pending; the interaction log explicitly says visual browser verification was not performed.
- **Independent QA retest:** Pending/not documented.
- **Evidence:** Fix commit, named backend/frontend regression tests, and result summaries in `documentation/AI_INTERACTION_LOG.md`. Separate retained test-output artifact paths are undocumented.
- **Current status:** Fixed; automated regression reported passing. Browser verification and independent Tester 1 retest remain pending.

## Suspected issues / pending reproduction

### BUG-VER-001 — Whitespace-only verification evidence description (not confirmed)

Code inspection suggests that whitespace-only `evidence_description` may pass the schema's `min_length=1` validation and then be stripped by the service before storage. This observation is linked to `TC-034` in `documentation/TEST_CASES.md`.

- **TC-034 status:** Not Run.
- **Runtime reproduction:** None documented.
- **Confirmation status:** Not a confirmed defect. Do not record it as a confirmed bug unless runtime testing reproduces the behavior.
- **Severity / priority:** Unassigned; do not infer before confirmation and impact assessment.
- **Evidence source:** Code-inspection note in the test case register only; no execution output is recorded.

## Evidence and retest notes

- Commit references identify the fixes; test file/function references identify regression coverage. The interaction log is the source for reported counts and warnings.
- Developer regression results are not independent Tester 1 retests.
- BUG-INT-001's browser verification remains pending. The exact historical chat traceback was not captured.
- BUG-P0-001's evidence-description whitespace scenario is distinct from its whitespace-only `verification_result` regression test. The latter does not provide runtime evidence for BUG-VER-001.
- No separate test-output artifact paths, bug reporter names, assignees, or severity/priority values were documented for these historical records.

## Bug report template for future confirmed defects

- Bug ID:
- Title:
- Reported by: Undocumented until recorded
- Date:
- Build or commit:
- Related test case:
- Severity: Critical / High / Medium / Low / Undocumented
- Priority: High / Medium / Low / Undocumented
- Environment:
- Preconditions:
- Steps to reproduce:
- Expected result:
- Actual result:
- Evidence:
- Reproducibility:
- Assigned to:
- Status: Open / In Progress / Fixed / Ready for Retest / Closed / Reopened
- Root cause:
- Fix summary:
- Retest result:
