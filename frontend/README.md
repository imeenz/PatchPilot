# PatchPilot frontend

The frontend is a React and TypeScript single-page application. It provides the landing page, overview, vulnerability catalog and detail pages, assistant, remediation tasks, verification records, and settings.

## Requirements

Node.js is required. The locked Vite and React plugin packages specify Node `^20.19.0` or `>=22.12.0`. The parser test file documents Node 22.18 or 24; Node 22.13 was also used for the recorded combined tests with `--experimental-strip-types`. Tester 2 recorded Node 24.15. The package lock file is used for reproducible dependency installation. The repository does not pin an npm version.

## Install and run

From `frontend/`:

```powershell
npm ci
npm run dev
```

Vite normally serves at <http://localhost:5173>. Set `VITE_API_BASE_URL` in a local `.env` to change the backend API base; default is `http://localhost:8000/api/v1`. Copy `.env.example` only if `.env` does not already exist. If Vite selects a different port, add that exact origin to the backend `CORS_ORIGINS` setting.

## Routes

| Route | Page |
|---|---|
| `/` | Landing page |
| `/overview` | Workspace dashboard |
| `/assistant` | Assistant and report import |
| `/vulnerabilities` | Findings catalog |
| `/vulnerabilities/:id` | Finding details |
| `/tasks` | Remediation tasks |
| `/verification` | Verification evidence |
| `/settings` | Theme and backend connection settings |

## Scanner imports and data behavior

PatchPilot imports Trivy JSON and OWASP ZAP traditional JSON. Parsing and field mapping happen in the frontend; the application does not execute scanners. Unsupported or invalid entries are identified by the import flow. The optional presentation dataset is in-memory demo content, labelled as demo, and is separate from persisted backend records. It is not a substitute for a backend connection or imported findings.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | TypeScript build and optimized Vite bundle |
| `npm run preview` | Preview the built frontend locally |
| `npm run lint` | Run Oxlint |
| `npm run typecheck` | Run TypeScript checking without emitting application output |
| `npm run test:parsers` | Run `tests/scannerParsers.test.mjs` (the file documents Node 22.18 or 24) |
| `npm run test:verification-state` | Run verification-state replacement tests |
| `node --experimental-strip-types --test tests/apiPresentation.test.mjs tests/scannerParsers.test.mjs` | Run both retained Node test files on Node versions that need built-in TypeScript stripping |

The combined Node command has recorded results of 16 passing tests. The `test:parsers` npm script runs the parser test file only; it does not run the API presentation test file. Run commands from the `frontend/` directory.

## Backend integration and limitations

The frontend talks to the FastAPI API; it does not provide authentication or authorization. There is no user isolation or private conversation ownership. Conversations can be opened by ID, but there is no backend endpoint to list all conversations. AI output may come from a configured external provider or the backend's rule-based fallback; inspect the response metadata rather than inferring live AI availability from settings alone.

PatchPilot does not integrate with GitHub, apply patches, run scanners, or deploy changes. Risk scores are deterministic severity-based triage scores, not CVSS. Completing a task does not prove a finding is fixed; verification evidence is recorded separately.
