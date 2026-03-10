# External Integrations

**Analysis Date:** 2026-03-10

## APIs & External Services

**Python WASM Runtime (CDN):**
- Pyodide runtime loaded at browser startup via `src/workers/python.worker.ts`
  - CDN URL: `https://cdn.jsdelivr.net/pyodide/v0.29.3/full/`
  - Loaded once per Worker init; cached by browser
  - No API key required — public CDN

**Python Packages (micropip):**
- `opentelemetry-api` — installed via `micropip` inside the Pyodide worker on init
- `opentelemetry-sdk` — installed via `micropip` inside the Pyodide worker on init
- Source: PyPI (via micropip's default index)
- No auth required

## Data Storage

**Databases:**
- None — no server-side database

**Client-Side Storage:**
- `localStorage` key: `telemetry-academy`
- Schema versioned (`SCHEMA_VERSION = 1`) to prevent data loss on schema changes
- Stores: case progress, saved user code per case, attempt history, welcome modal seen flag
- Implementation: `src/hooks/useAcademyPersistence.ts`
- Debounced writes (300ms) to avoid excessive I/O

**File Storage:**
- None — all case data is bundled at build time via `import.meta.glob` in `src/data/caseLoader.ts`

**Caching:**
- None server-side; browser caches Pyodide WASM bundle from CDN

## Authentication & Identity

**Auth Provider:**
- None — no authentication required
- The app is fully anonymous; all state is local to the user's browser

## Monitoring & Observability

**Error Tracking:**
- None detected — no Sentry, Datadog, or similar SDK integrated

**Logs:**
- `console.error` / `console.warn` for internal errors (localStorage failures, worker errors)
- No structured logging to an external endpoint

## CI/CD & Deployment

**Hosting:**
- Static site — target domain `https://telemetry.academy/` (per `index.html` OG meta tags)
- No deployment config files detected in repo (no Dockerfile, no Netlify/Vercel config, no GitHub Actions workflows)

**CI Pipeline:**
- Not detected — no `.github/workflows/`, no CI config files found

## Environment Configuration

**Required env vars:**
- None — the application has no runtime environment variables
- Pyodide CDN URL is hardcoded in `src/workers/python.worker.ts` line 12

**Secrets location:**
- No secrets present — fully public, client-side only application

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Internal Messaging (postMessage Protocol)

**Web Worker ↔ Main Thread:**
The Pyodide worker communicates with the main thread via `postMessage`. This is an internal integration boundary:

- `{ type: 'init', setupScript }` — Main → Worker: initialize Pyodide + install OTel packages
- `{ type: 'ready' }` — Worker → Main: Pyodide initialized successfully
- `{ type: 'run', code, id }` — Main → Worker: execute user Python code
- `{ type: 'success', id, result }` — Worker → Main: code ran successfully
- `{ type: 'error', id?, error }` — Worker → Main: execution or init error
- `{ type: 'stdout', message }` — Worker → Main: Python print() output captured via `JSStdout`
- `{ type: 'telemetry', span }` — Worker → Main: OTel span exported via `JSSpanExporter`

Implementation: `src/workers/python.worker.ts`, `src/workers/python/setup_telemetry.py`, `src/hooks/useCodeRunner.ts`

---

*Integration audit: 2026-03-10*
