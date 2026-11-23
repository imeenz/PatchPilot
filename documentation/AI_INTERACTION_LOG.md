# PatchPilot — AI Interaction Log

## Purpose
Record significant AI-assisted work performed by every team member.

Do not fabricate prompts, AI outputs, failures, or human interventions.

## What to Record
- Interaction ID.
- Date.
- Team member and role.
- Task.
- AI model.
- AI tool.
- Prompt.
- AI output summary or evidence link.
- Problem or limitation identified.
- Human intervention.
- Validation method and result.
- Status.

## Interaction Template

| Field | Entry |
|---|---|
| Interaction ID | AI-XXX |
| Date | |
| Team member / role | |
| Task | |
| AI model | |
| AI tool | |
| Prompt | |
| AI output summary / evidence | |
| Problem or limitation | |
| Human intervention | |
| Validation method | |
| Validation result | |
| Status | Not Started / In Progress / Under Review / Completed |

## Evaluation Guidance
When AI output is incorrect or unsuitable:
1. Preserve the original prompt and relevant output.
2. Describe the specific issue.
3. Explain the human correction.
4. Record how the result was validated.
5. State whether the issue was resolved.

For AI remediation recommendations, evaluate technical correctness, relevance, uncertainty, compatibility risks, and verification guidance.

## Shared Team Register
The Google Sheet contains these tabs:
- Backend Developer
- Frontend Developer
- Tester 1
- Tester 2
- AI Evaluation Summary

---

## Recorded Interactions

### Interaction AI-001

| Field | Entry |
|---|---|
| Interaction ID | AI-001 |
| Date | 2026-11-21 |
| Team member / role | Backend Developer / Senior Backend Engineer |
| Task | Phase 1A: Implement Conversational AI Backend (`POST /api/v1/chat`, `GET /api/v1/chat/conversations/{id}`, models, migrations, fallback, tests) |
| AI model | Gemini 3.8 Flash |
| AI tool | Antigravity AI Assistant |
| Prompt | Phase 1A: Implement Conversational AI Backend with database persistence, multi-turn context, finding linkage, strict safety guardrails, message limit (50), and comprehensive tests. |
| AI output summary / evidence | Created `Conversation` and `ConversationMessage` SQLAlchemy models, Alembic migration `002_add_conversations.py`, Pydantic chat schemas (`ChatRequest`, `ChatResponse`, `ConversationDetailResponse`), `ChatService` with multi-turn context management and AppSec rule-based fallback, `chat_router` endpoints, and 14 automated tests in `backend/tests/test_chat.py`. |
| Problem or limitation identified | 1. Current MVP has no user authentication; conversations are not user-isolated (documented limitation).<br>2. On Windows sandbox environments, TestClient required BypassSandbox permission due to socket pair binding.<br>3. Initial test import referenced `TestingSessionLocal` from wrong module; corrected to fixture. |
| Human intervention | 1. Approved Phase 1 technical assessment before code implementation.<br>2. Approved sandbox bypass for running tests on Windows.<br>3. Corrected test fixture import to use `db_session`. |
| Validation method | 1. Automated testing: 39 pytest tests executed and passed (25 existing + 14 new chat tests).<br>2. Alembic migration verification: tested upgrade to head and downgrade to 001 cleanly on fresh SQLite instance. |
| Validation result | 39/39 tests passed (100% pass rate in 2.49s). Migration upgrade/downgrade successful. |
| Status | Completed |

---

### Interaction AI-002

| Field | Entry |
|---|---|
| Interaction ID | AI-002 |
| Date | 2026-11-21 |
| Team member / role | Backend Developer / Senior Backend Engineer |
| Task | Conversational AI Backend — Phase 1A |
| AI model | Gemini 3.8 Flash High |
| AI tool | Google Antigravity |
| Prompt | Implement, audit, and finalize Phase 1A Conversational AI Backend with database persistence, multi-turn context, finding linkage, safety guardrails, Alembic migrations, and automated tests. |
| AI output summary / evidence | **Implementation:**<br>- Added `Conversation` and `ConversationMessage` database models.<br>- Added Alembic migration `002_add_conversations`.<br>- Implemented `POST /api/v1/chat`.<br>- Implemented `GET /api/v1/chat/conversations/{id}`.<br>- Added multi-turn conversation persistence.<br>- Added finding-aware context.<br>- Integrated the existing AI provider configuration.<br>- Implemented rule-based fallback.<br>- Added input validation and conversation limits.<br>- Added 14 chat tests.<br><br>**Git:**<br>- Branch: `feature/backend`<br>- Commit: `184701d211cb979c796f83d7e1e49224198d78ed`<br>- Message: `feat(backend): add conversational AI assistant`<br>- Push: successful.<br>- Working tree: clean. |
| Problem or limitation | **Known limitations:**<br>- No authentication or conversation ownership isolation.<br>- Duplicate external AI calls for finding-linked conversations.<br>- Missing explicit test for mismatched finding reassignment.<br>- These are documented MVP limitations or future refinements. |
| Human intervention | - Reviewed the technical assessment.<br>- Approved the architecture with security and privacy requirements.<br>- Reviewed the implementation report.<br>- Requested an independent technical audit.<br>- Reviewed the audit findings and approved the implementation for commit.<br>- Verified Git identity and authorized the commit/push. |
| Validation method | - Developer-reported full test execution: 39 passed, 0 failed, 0 skipped.<br>- Independent technical audit completed.<br>- Audit recommendation: APPROVE FOR COMMIT.<br>- This is developer validation, not independent Tester 1 QA. |
| Validation result | 39 passed, 0 failed, 0 skipped. Independent technical audit completed with recommendation APPROVE FOR COMMIT. |
| Status | Completed |

---

## Frontend Recorded Interactions

Recorded by Developer 2 (Frontend). Backend entries (AI-001, AI-002, …) live on the backend branch and are not modified here.

### Interaction AI-FE-001

| Field | Entry |
|---|---|
| Interaction ID | AI-FE-001 |
| Date | 2026-11-23 |
| Team member / role | Developer 2 — Frontend |
| Task | Frontend Phase 3: product redesign (landing page, top navigation, dark/light theme), AI Assistant at `/assistant` integrated with the backend chat API, Trivy / OWASP ZAP JSON import, removal of fabricated default data, optional isolated demo mode. |
| AI model | Claude Opus 5.5 (`claude-opus-5-5`) |
| AI tool | Claude Code (Claude desktop app, Code tab), working directly in the local `TrustChain-Frontend` repository |
| Prompt | Long specification "PATCHPILOT — FRONTEND PHASE 3: Product Experience Redesign, AI Assistant & Backend Integration" (sections 1–16: design system, navigation, landing page, AI Assistant capabilities, chat interface, response experience, fresh workspace, preserve existing pages, mandatory backend coordination, technical requirements, phased plan, acceptance criteria, Git workflow, final report). Key constraints: do not invent endpoints or fields, inspect the backend before relying on contracts, no silent mock data, no browser storage instead of backend persistence, do not modify the backend. |
| AI output summary / evidence | The AI read the backend contracts on `origin/feature/backend` (`app/schemas/*.py`, `app/routers/*.py`, `finding_service.py`, `chat_service.py`) and found that the existing frontend chat contract did not match (`conversationId`/`context` vs. `conversation_id`/`finding_id`) and that every service silently fell back to mock data, including a fake chat responder. It then: added semantic theme tokens (`src/index.css`) and a ThemeProvider; replaced the sidebar with `TopNav` + `PublicLayout`/`WorkspaceLayout`; built `LandingPage`; rewrote the AI Assistant (`useConversation`, history panel, markdown renderer with syntax highlighting, composer, finding picker, paste-finding, report import with preview); wrote client-side Trivy/ZAP parsers with 13 Node tests and fixtures; removed mock fallbacks and added explicit error/empty states; added an in-memory, labelled demo dataset; restyled the existing pages onto tokens; wrote `frontend/docs/BACKEND_REQUESTS.md`. |
| Problem or limitation | (1) Python is not installed on the development machine, so Developer 1's real FastAPI backend could not be run; end-to-end tests used a temporary local Node "contract stub" written from the backend schemas (outside the repository, labelled `contract-stub`). Integration with the real backend is therefore **not yet verified**. (2) The previous mock data attached a real CVE (CVE-2024-3400, a PAN-OS issue) to an invented file; it was removed. (3) No conversation-list endpoint exists, so the history panel only covers conversations opened in the current browser tab. (4) Errors made and fixed by the AI during the session: a regex escaping bug in a helper script, an import statement inserted inside a multi-line import, an invalid regex backreference in the markdown renderer, two wrong test expectations, navigation overflowing at ~1000 px, a duplicated theme toggle in the mobile menu, and the assistant page scrolling as a whole instead of internally. |
| Human intervention | The developer chose "Supervisor review first" before any commit, asked to see the running dashboard, and later explicitly requested finalization, commit and push to `feature/frontend` (no PR, no merge). The decision not to install Python was left to the developer. The root `.gitignore` was intentionally not committed because it differs from the one on the backend branch (would cause an add/add conflict); `frontend/.gitignore` covers `.env`, `node_modules` and `dist`. |
| Validation method | `npm run lint` (oxlint), `npm run typecheck` (`tsc -b --noEmit`), `npm run build` (`tsc -b && vite build`), `npm run test:parsers` (Node test runner, Trivy/ZAP/invalid fixtures); manual browser testing with the backend offline and against the contract stub (import, multi-turn chat, conversation reload, finding-linked chat, guidance, tasks, verification, filters, pagination, demo isolation, light/dark persistence, responsive widths 375/1100/1280 px). |
| Validation result | Lint: 0 warnings, 0 errors. Typecheck: pass. Build: pass. Parser tests: 13/13 pass. Manual checks passed against the backend-offline state and the contract stub. Not validated against the real backend. |
| Commit | `cccd47b6c2a864b7cc37ab1d079ea6e3497bf875` on `feature/frontend` — "feat(frontend): redesign PatchPilot workspace and AI experience" (92 files). |
| Status | Under Review |

---

### Interaction BUG-P0-001

| Field | Entry |
|---|---|
| Interaction ID | BUG-P0-001 |
| Date | 2026-11-24 |
| Team member / role | Backend implementation / Senior Backend Engineer |
| Task | Investigate and implement the approved P0 verification integrity corrections on `backend-review`. |
| AI model | The exact model identifier was not exposed in this session; not guessed. |
| AI tool | Codex (OpenAI coding agent in this session). |
| Prompt | Faithful summary of the investigation and approved implementation requests: inspect verification normalization, storage, status calculations, and tests; preserve four canonical results and documented aliases; reject unknown, empty, whitespace-only, and explicit null values with HTTP 422; default an omitted result to Inconclusive; use the highest verification evidence ID as current status consistently for finding detail, finding list, and dashboard; preserve history and historical breakdowns; add tests; modify only the seven authorized files; do not switch branches, migrate, modify the database, commit, push, or merge. |
| AI output summary / evidence | Investigated both reported defects: invalid or blank inputs could normalize to `Verified Fixed`, and status calculations counted any historical `Verified Fixed` evidence even when newer evidence was negative or inconclusive. Implemented strict normalization and the Inconclusive default. Added a shared latest-valid-evidence-by-ID rule for finding detail/list and a matching latest-evidence query for dashboard current status. Added tests for canonical values, aliases, invalid/blank/null inputs, omitted result, no persistence on rejected requests, history ordering, the five requested evidence sequences, cross-surface consistency, and dashboard historical counts. The full evidence and implementation report are in the conversation for BUG-P0-001. |
| Files modified | `backend/app/schemas/common.py`; `backend/app/schemas/verification.py`; `backend/app/routers/findings.py`; `backend/app/services/finding_service.py`; `backend/app/services/dashboard_service.py`; `backend/tests/test_verification.py`; `backend/tests/test_dashboard.py`. |
| Problem or limitation | Implementation and runtime verification are complete. Existing records were not rewritten; previously misclassified records cannot be distinguished from intentionally recorded `Verified Fixed` evidence using the stored result alone. |
| Human intervention | Supervisor approval specified the accepted values and aliases, strict rejection behavior, Inconclusive omission default, latest-evidence-by-ID semantics, preservation of history, authorized file list, and restrictions against database changes, migrations, branch changes, commits, pushes, merges, and unrelated work. |
| Validation method | Read-only Python AST syntax parsing for the seven changed files; `git diff --check`; attempted focused pytest run for `backend/tests/test_verification.py` and `backend/tests/test_dashboard.py` with `DATABASE_URL=sqlite://` and pytest cache/bytecode writes disabled. |
| Validation result | Initial implementation-stage checks: Python syntax parsing passed for all seven changed files; `git diff --check` passed. The initial pytest attempt did not start because pytest was unavailable (`No module named pytest`). Subsequent runtime verification results are recorded below. |
| Runtime verification results | Focused verification and dashboard tests: 30 passed, 1 warning, 0 failures. Full backend regression suite: 64 passed, 2 warnings, 0 failures. Final warning inspection run duration: 4.26 seconds. |
| Warnings | Both observed warnings are non-blocking technical debt, not test failures: (1) Starlette TestClient deprecation for using httpx with Starlette TestClient; warning recommends httpx2. (2) FastAPI telemetry deprecation: `HTTP_422_UNPROCESSABLE_ENTITY` should be replaced with `HTTP_422_UNPROCESSABLE_CONTENT`. No application code or dependencies were changed for these warnings. |
| Remaining limitations / next steps | Runtime verification is complete. Supervisor approval remains pending. Review existing stored verification records for possible historical false-success status; no automatic rewrite was authorized or performed. |
| Git and database actions | No commit, push, merge, migration, or database modification occurred. Branch remained `backend-review`. |
| Status | Implementation: Complete.<br>Self-review: Passed.<br>Focused runtime tests: Passed.<br>Full backend regression tests: Passed.<br>Warnings: Documented, non-blocking.<br>Supervisor approval: Pending. |
