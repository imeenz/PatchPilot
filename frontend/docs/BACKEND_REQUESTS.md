# Frontend and backend integration notes

This document describes the current frontend-to-backend contract and known gaps. It replaces the original inter-developer request list, which included questions that have since been implemented or superseded. The API source and schemas are authoritative; interactive OpenAPI documentation is available at `/docs` when the backend is running.

## Current request flow

| Request | Frontend behavior |
|---|---|
| `GET /api/v1/health` | Reports backend/database state and configured AI provider label |
| `GET /api/v1/dashboard/summary` | Loads overview metrics |
| `POST /api/v1/findings/import` | Imports parsed Trivy/ZAP findings or a manually entered finding |
| `GET /api/v1/findings` | Catalog, search, source/severity/CVE filters, and pagination |
| `GET /api/v1/findings/{id}` | Loads finding detail and related tasks/evidence |
| `POST /api/v1/findings/{id}/remediation-guidance` | Requests guidance for a finding |
| `POST /api/v1/findings/{id}/tasks`, `GET /api/v1/tasks`, `PATCH /api/v1/tasks/{id}` | Creates, lists, and updates remediation tasks |
| `GET/POST /api/v1/findings/{id}/verification` | Reads or records verification evidence |
| `POST /api/v1/chat` | Starts or continues a conversation with optional finding context |
| `GET /api/v1/chat/conversations/{id}` | Retrieves a conversation by known ID |

Chat requests support messages up to 4,000 characters and conversations up to 50 messages. A conversation may be associated with a finding. Chat and guidance responses include provider/fallback metadata. The health endpoint's `ai_provider` field is a configuration label; it does not verify credentials or provider reachability.

## Scanner parsing

Parsing is performed in the frontend. Trivy JSON and OWASP ZAP traditional JSON are mapped to the existing finding import contract. PatchPilot does not run either scanner. Unsupported report entries are reported by the parser rather than being silently treated as valid findings. The backend import endpoint accepts a findings array and also accepts a single finding object for the manual-add flow.

## Known contract limitations

- There is no conversation-list endpoint. The frontend can retrieve a conversation only when it has an ID; it cannot load a complete cross-session conversation list.
- Conversation history is stored, but there is no authenticated user identity or ownership/private conversation boundary.
- Duplicate-import behavior is unspecified; repeated reports can create duplicate findings.
- Frontend parser limits include field-length handling, but server-side import validation remains authoritative and may not enforce every frontend limit identically.
- Default CORS origins cover local development ports 5173 and 3000 on localhost/127.0.0.1. If Vite uses another port, configure `CORS_ORIGINS` accordingly.
- No API endpoint deletes findings or resets a workspace. Use an explicitly isolated local database for demonstrations; do not clear or repurpose a QA database as a reset procedure.

These are current limitations, not pending promises or committed delivery dates. Recheck the API schema and behavior before changing this document after backend work.
