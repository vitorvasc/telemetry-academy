# External Integrations

**Analysis Date:** 2026-03-13

## APIs & External Services

**Python WASM Runtime (CDN):**
- jsDelivr CDN - Pyodide runtime bundle fetched on first worker init
  - SDK/Client: `pyodide` npm package (`src/workers/python.worker.ts`)
  - CDN URL: `https://cdn.jsdelivr.net/pyodide/v0.29.3/full/` (hardcoded, must match npm version)
  - Auth: None — public CDN
  - Allowed in CSP: `script-src` and `connect-src` in `public/_headers`

**Python Package Index (micropip):**
- PyPI - Python packages installed into Pyodide at worker init via `micropip`
  - Packages: `opentelemetry-api`, `opentelemetry-sdk`
  - Called from: `src/workers/python.worker.ts` `init` handler
  - Auth: None — public PyPI

## Data Storage

**Databases:**
- None — no server-side database

**Client-Side Storage:**
- `localStorage` key: `telemetry-academy`
- Schema version: `SCHEMA_VERSION = 2` (version mismatch clears stored data to prevent corruption)
- Stores: case progress, saved user code per case, attempt history per rule, welcome modal seen flag
- Implementation: `src/hooks/useAcademyPersistence.ts`
- Debounced writes (300ms); handles `QuotaExceededError` gracefully
- Panel layout sizes also stored in `localStorage` under keys `react-resizable-panels:ta-panel-*`

**File Storage:**
- None — all case data bundled at build time via `import.meta.glob` in `src/data/caseLoader.ts`

**Caching:**
- No server-side cache; browser caches Pyodide WASM bundle and packages from CDN

## Authentication & Identity

**Auth Provider:**
- None — no authentication
- The app is fully anonymous; all state is local to the user's browser

## Monitoring & Observability

**Error Tracking:**
- None — no Sentry, Datadog, or similar SDK integrated

**Logs:**
- `console.error` / `console.warn` for internal errors (localStorage failures, worker errors)
- No structured logging to any external endpoint

## CI/CD & Deployment

**Hosting:**
- Static site at `https://telemetry.academy/`
- `public/_headers` sets HTTP security headers (served by CDN/host, not Vite)
- No Dockerfile, Netlify config, Vercel config, or GitHub Actions workflows detected in repo

**CI Pipeline:**
- None detected — no `.github/workflows/` or similar CI config files

## Environment Configuration

**Required env vars:**
- None — zero runtime environment variables
- Pyodide CDN URL is hardcoded in `src/workers/python.worker.ts`

**Secrets location:**
- No secrets present — fully public, client-side only application

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Internal Messaging (postMessage Protocol)

**Web Worker ↔ Main Thread** — the primary integration boundary in this app:

```
Main → Worker  { type: 'init', setupScript }      Initialize Pyodide + install OTel packages
Worker → Main  { type: 'loading-stage', stage, total, label }  Progress updates during init
Worker → Main  { type: 'ready' }                  Pyodide initialized successfully
Main → Worker  { type: 'run', code, id }          Execute user Python code (id = crypto.randomUUID())
Worker → Main  { type: 'success', id, result }    Code ran successfully
Worker → Main  { type: 'error', id?, error }      Init error (no id) or run error (with id)
Worker → Main  { type: 'stdout', message }        Python print() output via JSStdout override
Worker → Main  { type: 'telemetry', span }        OTel span exported by JSSpanExporter
```

Implementation files:
- `src/workers/python.worker.ts` — worker side (handles `init` and `run`)
- `src/workers/python/setup_telemetry.py` — Python bootstrap: installs `JSStdout`, `JSSpanExporter`, configures OTel `TracerProvider`
- `src/hooks/useCodeRunner.ts` — main-thread side (creates worker, dispatches messages, applies 5s execution timeout)

Full protocol reference: `docs/worker-protocol.md`

---

*Integration audit: 2026-03-13*
