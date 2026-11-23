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
