# PatchPilot - Test Plan

## 1. Purpose and objectives

This plan describes how to assess the implemented PatchPilot MVP and how to record work that remains planned. Testing should find defects in the import, prioritization, remediation, task, verification, assistant, and frontend workflows while checking that errors are clear and that evidence is preserved.

Testing objectives:

- Check implemented behavior against the current specification and API contracts.
- Exercise valid, invalid, missing, boundary, and unexpected inputs.
- Check data persistence and consistency across API responses and frontend views.
- Evaluate remediation guidance for relevance, safety, uncertainty, and unsupported claims.
- Confirm that a completed remediation task is not treated as proof that a vulnerability is fixed.
- Record actual results, evidence, defects, limitations, and blocked work without implying that planned tests have run.

## 2. Product scope

### 2.1 Implemented features in scope

The QA baseline includes the following implemented capabilities:

- **Finding import:** The backend accepts a JSON array or an object containing a `findings` array. It validates finding fields and severity, reports imported and rejected records, and stores accepted findings. The frontend can parse supported JSON reports and submit findings for import.
- **Supported report parsing:** The frontend parses Trivy JSON and OWASP ZAP traditional JSON. PatchPilot imports reports; it does not run scanners.
- **Findings workspace:** The UI provides an overview, findings list and detail views, search, severity/source/CVE filters, and pagination. The API provides matching listing, detail, dashboard, and health endpoints.
- **Risk prioritization:** Finding scores use the documented deterministic severity-based calculation and its registered-CVE/fixed-version adjustments. Test expected scores against the implementation and specification; do not describe the score as CVSS.
- **Remediation guidance and assistant:** Finding-specific guidance and multi-turn chat can use a configured external AI provider or the deterministic rule-based fallback. Chat supports finding context, server-side conversation/message persistence, and retrieval of a conversation by ID. The API does not provide a general conversation-list endpoint.
- **Remediation tasks:** Tasks are linked to findings and support the implemented statuses `Open`, `In Progress`, `Blocked`, and `Completed`. An assignee is a text field; it is not validated against user accounts.
- **Verification evidence:** Users can record and retrieve evidence with the results `Verified Fixed`, `Failed`, `Partially Fixed`, or `Inconclusive`. Current finding status is based on the latest valid evidence ID; historical evidence and dashboard breakdowns remain available. Completing a task does not automatically verify or resolve a finding.
- **Health and integration behavior:** Health checks report database readiness, CORS applies to API errors, and the frontend distinguishes network failures from HTTP failures. The frontend has an explicit, opt-in demo dataset for presentation; it is labelled and separate from backend records.

### 2.2 Not implemented or outside the MVP

Do not treat the following as existing product capabilities or as acceptance criteria for this baseline:

- User authentication, authorization, user accounts, assignee identity validation, or conversation ownership/isolation. The MVP has no access-control boundary; do not use real sensitive data during QA.
- A server endpoint that lists all conversations across sessions.
- GitHub integration, pull-request creation, source-control changes, automatic patching, patch deployment, or production system modification.
- Scanner execution, live scanning, or integrations beyond importing the supported report formats.
- Live threat-intelligence feeds, multi-agent orchestration, or enterprise permission management.

The production PostgreSQL deployment path is not exercised by the local SQLite test environment unless a separate approved environment is provided. No test should use the developer's default `backend/patchpilot.db`.

The existing `documentation/TEST_CASES.md` is a case register, not evidence that every proposed behavior is implemented. Its current Tester 1 manual results are 5 Passed, 0 Failed, 0 Blocked, and 48 Not Run among 53 executable MVP cases; TC-007 is Deferred, and TC-026 and TC-029 are Out of MVP. Tester 1's results are recorded separately from developer and Tester 2 automation. TC-010 currently tests the implemented source filter, and TC-016 tests the supported severity-based score boundaries; neither is deferred. Revise or defer cases only when current requirements or implementation make them inapplicable, and retain unrun cases as Not Run.

## 3. Test strategy

Use risk-based testing at more than one level. Link cases to requirements or endpoints where possible, preserve input and output evidence, and record `Pass`, `Fail`, `Blocked`, or `Not Run`. A test result applies only to the build/commit and environment recorded with it.

### 3.1 Black-box testing

Test through the public API and user interface without relying on internal implementation details. Verify observable responses, validation messages, stored records, status changes, frontend states, and behavior across refreshes. Use API contracts and documented workflows as the expected results.

### 3.2 Equivalence partitioning

Choose representative inputs from valid and invalid groups, including:

- Valid and invalid JSON payload shapes; accepted and rejected finding records; canonical, aliased, and invalid severity or verification values.
- Existing and nonexistent finding, task, and conversation IDs.
- Configured provider success, no configured provider, provider failure, and malformed provider output.
- Findings with and without optional package, version, CVE, or file-path data.

Do not infer a duplicate-handling rule or user-validation rule where the product has not specified one.

### 3.3 Boundary-value analysis

Exercise documented limits and adjacent values, including title and field length constraints, list page/size limits, chat message length (1 to 4,000 characters), and the 50-message conversation limit. Check empty collections, a single record, the first/last valid page, and values just outside each enforced boundary. Record limits from the current schema/API rather than assuming requirements from a proposed case.

### 3.4 Negative testing

Submit malformed, missing, blank, null, unknown, oversized, and type-mismatched values where the API accepts the relevant field. Exercise nonexistent resources, unsupported report structures, failed imports, HTTP errors, network loss, provider timeouts/failures, and malformed provider responses. Confirm rejected verification results are not persisted and server exceptions do not expose private details to clients.

### 3.5 White-box testing and coverage

Use source review and focused tests to exercise important internal paths:

- **Statement coverage:** execute relevant validation, scoring, persistence, and response-building statements.
- **Branch coverage:** exercise valid/invalid inputs, success/failure paths, provider/fallback paths, readiness outcomes, and current-status outcomes.
- **Condition coverage:** where compound conditions exist, exercise each boolean condition as true and false where practical, especially provider configuration and data-source status decisions.

Prioritize risk-sensitive paths; do not claim complete coverage without a generated report. The current repository does not define a coverage percentage target. If coverage tooling is introduced or used, record its command, version, report, and exclusions; do not invent percentages.

### 3.6 Static testing and code review

Review changes against requirements, API contracts, data isolation, error handling, safety constraints, and the allowed file scope. Run available static checks: frontend `npm run lint` and `npm run typecheck`, backend automated tests/import checks, and `git diff --check`. Record warnings as well as failures. A passing static check is not a substitute for functional or security testing.

### 3.7 Test levels

- **Unit:** deterministic risk scoring, normalization, parsing, helper functions, and isolated service behavior.
- **API:** request/response schemas, status codes, filters, pagination, not-found behavior, validation, and error responses using FastAPI `TestClient`.
- **Integration:** database session and lifespan behavior, persistence across requests, task/finding/verification relationships, chat history, health readiness, CORS, and frontend-to-backend requests.
- **System:** representative end-to-end user workflows across the running frontend and local backend with an isolated preview database.
- **Regression:** rerun the complete backend suite and relevant frontend tests/checks after a fix or integration change.
- **Exploratory:** Tester 1 probes navigation, empty/error/loading states, unusual input combinations, retry behavior, responsive layouts, and workflow gaps not covered by scripted cases.

### 3.8 AI-specific evaluation

Evaluate both finding-specific remediation guidance and chat responses. Use a recorded prompt set with expected facts, context, and safety criteria. For each response, record provider/model or fallback label, input finding/context, observed output, and reviewer assessment.

Assess:

- **Accuracy and relevance:** Does the response address the supplied finding and stay within known facts?
- **Hallucinations and unsupported claims:** Check invented CVEs, package/version details, affected systems, exploitability statements, or guarantees against authoritative references. Mark unverified claims as unsupported.
- **Context retention:** Across follow-up messages, confirm that the conversation ID and relevant prior messages/finding context are used consistently without leaking unrelated context.
- **Uncertainty handling:** Missing evidence should be identified explicitly; the response should ask for needed information or qualify recommendations rather than guess.
- **Compatibility and security risks:** Review suggested changes for language/runtime compatibility, security consequences, destructive commands, and assumptions about the target system.
- **Fallback and provider failures:** Check no-provider behavior, provider errors/timeouts, malformed output, response labeling (`is_fallback`/provider), and whether a failure is handled without losing persisted conversation history.
- **Verification advice and safety:** Steps should be testable and safe. Guidance is advisory, requires human review, and must not claim a finding is fixed without recorded verification evidence.

Automated provider tests may use mocks. Live-provider testing is optional and requires explicit approval, a non-production key, non-sensitive synthetic data, and cost/rate limits. Never place secrets in prompts, logs, screenshots, or test evidence.

## 4. Test environment and prerequisites

### Backend automation

- Use the existing backend virtual environment and installed requirements; do not install dependencies as part of a test run.
- Run the suite from `backend/` with the launcher `DATABASE_URL` unset. `backend/tests/conftest.py` sets the application URL to `sqlite://` before importing application/database modules and creates a separate in-memory request-fixture database. This prevents tests from using the developer's default database.
- The test client enters the application lifespan. Tests that exercise the application engine must retain the in-memory setup; do not substitute the default `patchpilot.db`.
- Typical command: `python -m pytest tests -q` (using the selected environment's Python). Record the exact interpreter and command.

### Frontend automation

- Use Node/npm with the existing frontend dependencies. The locked Vite toolchain specifies Node `^20.19.0` or `>=22.12.0`; the parser test documents Node 22.18 or 24. Node 22.13 was used for the combined test command with `--experimental-strip-types`, and Tester 2 evidence records Node 24.15. Do not install packages as part of a QA run.
- Current scripts: `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test:parsers`. The API-presentation tests are also in `frontend/tests/apiPresentation.test.mjs`.
- The combined Node test command used for the current baseline is `node --experimental-strip-types --test tests/apiPresentation.test.mjs tests/scannerParsers.test.mjs`. On Node versions that require it, the type-stripping flag is needed by the parser tests that import TypeScript; Node reports this as experimental.

### Manual integration environment

- Start the backend and frontend on local development ports with the frontend API base set to `http://localhost:8000/api/v1` (or the equivalent documented local URL).
- Use the dedicated preview database `backend/.runtime/bug-int-001-preview.db` for manual preview, not `backend/patchpilot.db`. Preserve existing test and preview databases; do not run destructive database operations.
- External AI is not required for baseline functional testing. Use the labelled rule-based fallback by default. If testing a configured provider, follow the AI-specific precautions above.
- Use synthetic findings and scanner fixtures. Keep demo-mode checks separate from backend persistence checks; demo records are not imported findings.

## 5. Roles and responsibilities

- **Tester 1:** Manual QA, test design, exploratory testing, bug reports, evidence capture, and retesting fixes.
- **Tester 2:** Automated testing, API/integration automation, regression testing, and white-box testing.
- **Backend Developer:** Backend implementation, developer tests, API/database diagnostics, and fixes assigned after triage.
- **Frontend Developer:** Frontend implementation, frontend automated checks, and frontend/integration support.

Testers report observed behavior and evidence; developers do not mark independent QA as complete on a tester's behalf.

## 6. Entry criteria

Begin a test phase when:

- The target commit/build and requirements under test are identified.
- The relevant service or UI is available, or its unavailable state is explicitly part of the test.
- Required dependencies are already installed and the test environment is isolated from production and developer data.
- Synthetic input fixtures and expected results are prepared.
- Known limitations, unsupported features, and any required provider configuration are documented.

## 7. Exit criteria

A test phase may close when:

- Planned in-scope cases have an actual result, evidence, and build/environment reference, or are explicitly marked `Blocked`/`Not Run` with a reason.
- Critical/high defects are fixed and retested, or have a documented disposition accepted by the release owner.
- Regression checks relevant to the change pass; warnings and remaining limitations are recorded.
- AI evaluations include reviewer findings and unsupported claims, not just response-generation success.
- Coverage is reported only if measured; no unmeasured target is represented as achieved.
- The summary distinguishes developer checks, Tester 1 manual QA, and Tester 2 automation.

## 8. Defect severity and priority

Severity describes impact; priority describes urgency. Keep them separate and use the same terms as `documentation/BUG_REPORTS.md`.

### Severity

- **Critical:** Core workflow is unusable or there is a severe security/data-integrity risk with no safe workaround.
- **High:** Major feature is unavailable or important data/status is wrong; workaround is absent or materially risky.
- **Medium:** Partial feature failure with a reasonable workaround and limited impact.
- **Low:** Minor cosmetic, wording, or low-impact usability issue.

### Priority

- **High:** Fix or obtain a release-owner disposition before QA sign-off; includes release blockers and urgent security/data-integrity defects.
- **Medium:** Schedule for the current QA/release cycle when feasible; track a workaround and retest if fixed.
- **Low:** Non-blocking improvement that may be scheduled later; retain a clear defect record.

Set priority based on exposure, affected users/workflows, workaround, and release timing, not severity alone. Do not assign severity or priority without reproducible evidence where reproduction is possible.

## 9. Test deliverables

Maintain and link:

- This test plan and the in-scope test-case register.
- Synthetic JSON/report fixtures and expected outcomes.
- Automated test scripts, exact commands, environment/commit, output, and warnings.
- Manual execution records with tester, steps, expected/actual result, and screenshots/logs where useful.
- Confirmed defect reports with reproduction steps, severity, priority, evidence, owner, and retest result.
- Coverage reports only when generated, with command and scope.
- A final QA summary listing passed, failed, blocked, and not-run work, residual risks, and sign-off status.

## 10. Phase-based testing schedule

This is a planned sequence for each QA cycle, not a dated completion record. Assign calendar dates after a target build and tester availability are agreed.

| Phase | Planned work | Primary roles | Status/evidence |
|---|---|---|---|
| 0. Scope and readiness | Confirm build, requirements, supported inputs, test data, isolated databases, and entry criteria. Review candidate test cases for unsupported assumptions. | Tester 1, Tester 2, Developers | Planned per cycle |
| 1. Developer and component checks | Run backend unit/API tests and frontend parser/helper tests, lint, typecheck, and build. Triage failures before tester handoff. | Backend Developer, Frontend Developer | Baseline automation results are recorded below; repeat for each target build |
| 2. API and data validation | Exercise import, validation, filters, scoring, task states, evidence outcomes, chat limits, error responses, and persistence boundaries. | Tester 2; developers support | Planned |
| 3. Integration and system workflows | Test import-to-review-to-task-to-evidence workflows, finding-linked chat, latest-evidence status, health/CORS, and actual frontend/backend behavior using the isolated preview. | Tester 1, Tester 2 | Partially evidenced: Tester 1 recorded TC-005, TC-006, TC-008, TC-009, and TC-011 as Pass; 48 executable MVP cases remain Not Run. Tester 2 has API/integration automation evidence. Full browser verification against the integrated FastAPI backend and remaining workflows are not established by these records |
| 4. AI evaluation | Assess curated prompts for accuracy, context, uncertainty, safety, verification advice, and fallback/provider failures. | Tester 1, Tester 2; developers support | Planned; live provider use is optional and controlled |
| 5. Exploratory, regression, and retest | Explore UI/error states, rerun relevant regression checks, retest fixes, and update defect evidence. | Tester 1, Tester 2 | Planned |
| 6. Exit review and reporting | Reconcile results, blockers, defect dispositions, limitations, and sign-off; publish no unsupported coverage or completion claims. | Testers, Developers, release owner | Planned |

### Previously executed developer validation

The following historical results were recorded for the QA baseline at `f65628bf048fe740d70fc18403f5f073730a8372`; they are developer validation, not Tester 1 manual results or a substitute for Tester 2's separate report:

- Full backend pytest suite: 71 passed, 2 deprecation warnings, 0 failures, with launcher `DATABASE_URL` unset.
- Frontend Node tests: 16 passed, 0 failed, using `--experimental-strip-types`; Node emitted the corresponding experimental-feature warning.
- Frontend lint: passed with one Oxlint warning in `VulnerabilitiesPage.tsx` (`react(set-state-in-effect)`).
- TypeScript checking and production build: passed.
- No coverage percentage was measured. The interaction log records earlier frontend browser checks against an offline backend and a contract stub; visual browser verification against the integrated FastAPI backend remains outstanding.

Tester 1's current manual summary is 5 passed, 0 failed, 0 blocked, and 48 not run among the 53 executable MVP cases; TC-007 remains Deferred and TC-026/TC-029 remain Out of MVP. These results do not complete the remaining manual, exploratory, AI-evaluation, or full browser integration work. Record future results against the exact commit tested.
