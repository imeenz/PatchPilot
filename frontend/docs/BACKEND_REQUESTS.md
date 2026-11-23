# Frontend → Backend coordination (Phase 3)

Prepared by Developer 2 (frontend) for Developer 1 (backend).
Contracts below were read from `origin/feature/backend` (commit `4c82d01`):
`app/schemas/*.py`, `app/routers/*.py`, `app/services/finding_service.py`, `app/services/chat_service.py`.
The backend directory was **not** modified.

## Endpoints the frontend now uses

| Method | Path | Frontend use |
|---|---|---|
| GET | `/api/v1/health` | Backend status pill, Settings (database, `ai_provider`) |
| GET | `/api/v1/dashboard/summary` | Overview metrics |
| POST | `/api/v1/findings/import` | Trivy / ZAP / native import (`{ "findings": [...] }`), and "Add a finding" (single record) |
| GET | `/api/v1/findings` | Catalog, finding picker (search/filters/pagination) |
| GET | `/api/v1/findings/{id}` | Finding details, `?finding=` deep link into the assistant |
| POST | `/api/v1/findings/{id}/remediation-guidance` | Finding page + assistant "Remediation guidance" action |
| POST | `/api/v1/findings/{id}/tasks` · GET `/api/v1/tasks` · PATCH `/api/v1/tasks/{id}` | Task management |
| POST/GET | `/api/v1/findings/{id}/verification` | Evidence recording / history |
| POST | `/api/v1/chat` | All assistant messages (`message`, `conversation_id?`, `finding_id?`) |
| GET | `/api/v1/chat/conversations/{id}` | Reloading a conversation (URL `?c=<id>`, history panel, open-by-ID) |

No endpoint or request field was invented. Behaviour relied on from the backend code:
new conversation = POST without `conversation_id`; one finding per conversation (400 on conflict);
50-message limit; 4000-character message limit; `is_fallback` / `provider` / `model` per message.

## Requests / questions for Developer 1

1. **Conversation list endpoint (blocking a full history panel).**
   There is no way to list conversations. The frontend currently lists only conversations opened in
   the current browser tab (ids kept in memory only; content always fetched from the backend).
   Proposed: `GET /api/v1/chat/conversations?page=&size=` →
   `{ items: [{ conversation_id, title, finding_id, updated_at, message_count }], total, page, size }`.

2. **`structured_guidance` in chat.** `ChatResponse.structured_guidance` is rendered when present, but
   `ChatMessageResponse` (conversation history) has no such field, so it disappears after reload.
   When is it populated, and could it be stored per message?

3. **Import field-length validation.** `import_findings` validates required fields and severity but not
   lengths (`title` 255, `cve_id` 50, versions 100, `file_path` 1000). On PostgreSQL an over-long value
   would raise during the atomic commit and fail the whole batch with a 500. The frontend shortens values
   (and shows a warning), but backend-side rejection per record would be safer.

4. **Duplicate imports.** Re-importing the same report creates duplicate findings. Is de-duplication
   (e.g. on `source` + scanner id + package + location) planned? The frontend sends extra keys
   (`scanner_id`, `scanner_target`, `cwe_id`, `affected_urls`, …) which end up in `original_data`.

5. **Manual finding creation.** "Add a finding" posts a single object to `/findings/import`
   (the importer accepts one object). Please confirm this is an acceptable use, or provide `POST /findings`.

6. **CORS for local development.** Default `CORS_ORIGINS` allows ports 5173 and 3000 only. If Vite picks
   another port (e.g. 5174 when 5173 is busy) requests are blocked; set `CORS_ORIGINS` in `.env` accordingly.

7. **Resetting a workspace.** There is no delete endpoint for findings. Not required now; mentioned because
   academic demos currently use the frontend-only demo dataset instead of real records.

## Scanner formats

Scanner parsing is done in the frontend (`src/features/import/scannerParsers.ts`) and mapped to the
existing import fields, so no new backend endpoint is needed:

* **Trivy JSON** — `Results[].Vulnerabilities[]` and failed `Misconfigurations[]` are imported;
  `Secrets[]` (contain the secret text) and `Licenses[]` are listed as unsupported; `UNKNOWN` severity is unsupported.
  Non-CVE identifiers (GHSA, TEMP-…) are never put in `cve_id`.
* **OWASP ZAP JSON** — `site[].alerts[]`, `riskcode` 3/2/1/0 → High/Medium/Low/Informational, HTML
  descriptions reduced to text, CWE kept as `cwe_id` (never as a CVE).
