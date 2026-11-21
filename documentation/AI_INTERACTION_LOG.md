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


