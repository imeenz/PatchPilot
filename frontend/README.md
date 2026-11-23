# PatchPilot Frontend

AI-first conversational security assistant client application built with React, TypeScript, Vite, Tailwind CSS, and React Router.

## Tech Stack

- **Framework**: React 19 + TypeScript (strict mode)
- **Build Tool**: Vite 8 with `@vitejs/plugin-react`
- **Styling**: Tailwind CSS v4 with `@tailwindcss/vite`
- **Routing**: React Router v7 (`react-router-dom`)
- **Icons**: Lucide React
- **Linter**: Oxlint
- **Type Checker**: TypeScript Compiler (`tsc`)

## Folder Structure

```text
frontend/
├── public/              # Static public assets
├── src/
│   ├── assets/          # Application assets (images, SVGs)
│   ├── components/      # Reusable UI & common presentation components
│   │   ├── common/      # Global layout components (Header, Footer)
│   │   └── ui/          # Atomic UI primitives (Badge, Card)
│   ├── features/        # Feature domain modules (vulnerabilities, remediation, verification)
│   ├── hooks/           # Custom reusable React hooks
│   ├── layouts/         # Page shell layouts (RootLayout)
│   ├── pages/           # Route-level views (HomePage, NotFoundPage)
│   ├── router/          # Client-side router definition
│   ├── services/        # HTTP API client and external services
│   ├── types/           # Shared TypeScript interfaces and env declarations
│   ├── App.tsx          # Root provider component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global Tailwind CSS imports
├── .env.example         # Template for environment configuration
├── .gitignore           # Git ignore rules for frontend dependencies and local env files
├── package.json         # Package configuration and scripts
├── tsconfig.json        # TypeScript configuration root
├── tsconfig.app.json    # Application TypeScript configuration with path aliases (@/*)
├── tsconfig.node.json   # Node/Vite toolchain TypeScript configuration
└── vite.config.ts       # Vite configuration with Tailwind CSS & path aliases
```

## Environment Configuration

Copy `.env.example` to `.env` for local development:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Backend FastAPI service base URL | `http://localhost:8000/api/v1` |

> Note: `.env` and `.env.*.local` files are ignored by git to avoid committing secrets or machine-specific URLs.

## Available Scripts

In the `frontend` directory, you can run:

- `npm run dev`: Starts the local Vite development server with HMR.
- `npm run build`: Runs TypeScript project compilation (`tsc -b`) and produces an optimized Vite production bundle in `dist/`.
- `npm run typecheck`: Runs TypeScript compiler in check-only mode (`tsc -b --noEmit`).
- `npm run lint`: Fast linting using Oxlint.
- `npm run preview`: Locally previews the production build.
- `npm run test:parsers`: Runs the scanner report parser tests (Node built-in test runner, Trivy/ZAP fixtures in `tests/fixtures/`).

## Phase 3: Product experience

### Routes

| Route | Experience |
|---|---|
| `/` | Public landing page (Features, How It Works, About) |
| `/overview` | Workspace overview (live dashboard summary) |
| `/assistant` | AI Assistant. `?c=<conversation id>` reloads a conversation from the backend, `?finding=<id>` starts a conversation about a finding, `?import=1` opens the report import dialog |
| `/vulnerabilities`, `/vulnerabilities/:id` | Findings catalog and details |
| `/tasks` | Remediation tasks |
| `/verification` | Verification evidence |
| `/settings` | Theme, backend connection, demo mode |

### Theme

Design tokens live in `src/index.css` (`--pp-*` variables mapped to Tailwind colours such as `bg-surface`,
`text-fg-muted`, `border-line`, `bg-primary`, `text-critical`). Dark is the default; light is fully supported.
The preference is stored in `localStorage` (`patchpilot.theme`) and applied before first paint (`index.html`).

### Data honesty rules

- Services never fall back to sample data. If the backend is unreachable, pages show a connection error with Retry.
- A fresh workspace is empty ("Your security workspace is ready.").
- **Demo dataset** (optional, Overview/Settings): sample records held in memory in the current tab only, labelled
  `demo-dataset`, never sent to the backend, cleared on exit or refresh. Chat context, guidance and import are
  disabled for demo records.
- Assistant answers show whether they came from the configured AI provider or the rule-based fallback,
  using the `is_fallback` / `provider` / `model` fields returned by the backend.
- Conversation content is never stored in the browser; the backend is the source of truth.

Backend coordination items for Developer 1: see [`docs/BACKEND_REQUESTS.md`](docs/BACKEND_REQUESTS.md).
