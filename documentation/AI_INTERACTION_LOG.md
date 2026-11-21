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

