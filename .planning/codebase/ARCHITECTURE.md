# Architecture

**Analysis Date:** 2026-03-13

## Pattern Overview

**Overall:** Single-Page Application (SPA) with client-side WASM execution — no backend required

**Key Characteristics:**
- Zero-backend: all execution and state management happens in the browser
- Python runs in a Web Worker via Pyodide (WASM), sandboxed from the main thread
- Two-phase case structure: Phase 1 (Instrumentation) → Phase 2 (Investigation)
- Cases are data-driven YAML files, auto-discovered at build time via Vite glob imports
- All state persisted in `localStorage` with versioned schema (SCHEMA_VERSION=2)
- URL-based routing: `/` (home), `/case/:id` (per-case workspace)

## Layers

**Entry / Shell:**
- Purpose: Bootstraps React and renders the root `App` component
- Location: `src/main.tsx`, `index.html`
- Contains: React DOM mount with `wouter` Router wrapper, CSS imports
- Depends on: App component
- Used by: Browser

**App Orchestrator:**
- Purpose: Holds all cross-cutting state, routes between views, wires hooks to components
- Location: `src/App.tsx`
- Contains: All top-level state (`useState`/`useEffect`), event handlers (`handleValidate`, `handleCaseSolved`), dual desktop/mobile layouts with resizable panels
- Depends on: All hooks, all major components, lib functions, data layer
- Used by: Browser (root render)

**Components Layer:**
- Purpose: Presentational and interactive UI, receives props from App
- Location: `src/components/`
- Contains: `CodeEditor`, `InstructionsPanel`, `ValidationPanel`, `InvestigationView`, `TraceViewer`, `LogViewer`, `RootCauseSelector`, `CaseSelector`, `CaseSolvedScreen`, `HomePage`, `ReviewModal`, `WelcomeModal`, `MobileCaseDrawer`, `ErrorBoundary`, `terminal/OutputPanel`
- Depends on: Types, lib (rootCauseEngine), lucide-react
- Used by: App.tsx

**Hooks Layer:**
- Purpose: Encapsulates stateful side effects and derived state
- Location: `src/hooks/`
- Contains:
  - `useCodeRunner.ts` — manages Web Worker lifecycle, runs Python, collects spans/stdout, enforces 5s timeout
  - `useAcademyPersistence.ts` — versioned localStorage read/write with 300ms debounced auto-save
  - `usePhase2Data.ts` — transforms raw OTel spans into Phase2Data; merges user attributes into static data; generates synthetic logs
- Depends on: lib, data, workers, types
- Used by: App.tsx

**Library Layer (`src/lib/`):**
- Purpose: Pure business logic with no React dependencies
- Location: `src/lib/`
- Contains:
  - `validation.ts` — 9 check types, span-based and YAML-based checks, progressive hint escalation
  - `rootCauseEngine.ts` — case-specific evaluation rules registered in `RULES_REGISTRY`, distractor feedback generation
  - `spanTransform.ts` — converts raw OTel nanosecond spans to UI `TraceSpan` format, derives status badges (SLOW/ERR)
  - `logGenerator.ts` — synthesizes `LogEntry[]` from `TraceSpan[]` with contextual messages
  - `formatters.ts` — shared display formatters (e.g., `formatSpanMs`)
- Depends on: types only
- Used by: Hooks, components, App.tsx

**Data Layer:**
- Purpose: Static case definitions and runtime case discovery
- Location: `src/data/`, `src/cases/*/`
- Contains:
  - `caseLoader.ts` — uses Vite `import.meta.glob` to auto-discover `case.yaml` + `setup.py` at build time, sorts by `order` field
  - `cases.ts` — exports `loadCases()` result as singleton `cases` array
  - `phase2.ts` — static `Phase2Data` per case, registered in `phase2Registry`; cases without registry entry fall back to user's live spans
  - `progress.ts` — progress utility exports
- Depends on: types
- Used by: App.tsx, hooks

**Case Content:**
- Purpose: Declarative case definitions and initial Python code
- Location: `src/cases/<NNN-case-name>/`
- Contains: `case.yaml` (metadata, validations, root cause options), `setup.py` (starter Python code)
- Depends on: nothing (consumed by caseLoader at build time)
- Used by: `caseLoader.ts`

**Types Layer:**
- Purpose: Shared TypeScript interfaces with no runtime code
- Location: `src/types.ts`, `src/types/phase2.ts`, `src/types/progress.ts`
- Contains: `Case`, `ValidationRule`, `ValidationResult` (in `src/types.ts`); `TraceSpan`, `LogEntry`, `Phase2Data`, `RootCauseOption` (in `src/types/phase2.ts`); `CaseProgress`, `CaseStatus` (in `src/types/progress.ts`)
- Depends on: nothing
- Used by: all layers

**Worker Layer:**
- Purpose: Executes Python in a sandboxed Web Worker thread using Pyodide WASM
- Location: `src/workers/python.worker.ts`, `src/workers/python/setup_telemetry.py`
- Contains:
  - Worker: handles `init` (loads Pyodide from CDN, installs OTel packages via micropip, runs setup script) and `run` (executes user code)
  - Setup script: injects `JSStdout` (redirects `sys.stdout` → `postMessage`) and `JSSpanExporter` (ships spans to JS via `postMessage`)
- Depends on: Pyodide CDN (`cdn.jsdelivr.net/pyodide/v0.29.3/full/`), `opentelemetry-api`, `opentelemetry-sdk` (installed via micropip)
- Used by: `useCodeRunner.ts`

## Data Flow

**Phase 1 — Python Case Validation:**

1. User writes Python in `CodeEditor` → `code` state in `App.tsx`
2. User clicks "Validate" → `handleValidate()` in `App.tsx`
3. `useCodeRunner.runCode(code)` posts `{type:'run', code, id: runId}` to Web Worker
4. Worker runs `pyodide.runPythonAsync(code)`; `JSSpanExporter.export()` calls `js.postMessage({type:'telemetry', span})`
5. `useCodeRunner` collects `telemetry` messages into `collectedSpans[]`; `stdout` messages into `collectedLines[]`
6. On `{type:'success', id: runId}`, promise resolves with `{result, spans: collectedSpans}`
7. App calls `validateSpans(rules, {spans, attemptHistory})` from `src/lib/validation.ts`
8. `ValidationResult[]` set in state → `ValidationPanel` renders pass/fail with progressive hints
9. All rules pass → `appPhase` transitions to `'investigation'`, progress persisted

**Phase 1 — YAML Config Case (003-the-collector):**

1. `currentCase.type === 'yaml-config'` detected in `handleValidate()`
2. No Web Worker invoked; calls `validateYaml(rules, {yamlContent: code, attemptHistory})`
3. `checkYamlKeyExists` parses YAML via `js-yaml` and traverses dot-notation paths

**Phase 2 — Investigation:**

1. `usePhase2Data(spans, caseId)` checks `phase2Registry[caseId]` for static pre-built data
2. If found: merges user's live span attributes into static synthetic spans via `mergeUserAttributes` (static attributes take precedence)
3. If not found: transforms user's raw spans with `spanTransform.ts` + `logGenerator.ts`
4. `InvestigationView` receives `Phase2Data` (spans, logs, narrative, rootCauseOptions)
5. User navigates: Traces tab (`TraceViewer`) → Logs tab (`LogViewer`) → Root Cause tab (`RootCauseSelector`)
6. Tabs use `display:none` (not conditional rendering) to preserve component state across tab switches
7. User submits root cause guess → `evaluateGuess(guessId, data, caseId)` in `rootCauseEngine.ts`
8. Engine calls `RootCauseRule.evaluate(data)` for the guessed option; returns contextual `EvaluationResult`
9. Correct → `handleCaseSolved()` → `appPhase = 'solved'`, next case unlocked in progress

**Worker Message Protocol:**
- Host → Worker: `init` (with `setupScript`), `run` (with `code` + `id`)
- Worker → Host: `loading-stage`, `ready`, `error` (no id = init failure; with id = run failure), `success`, `stdout`, `telemetry`
- Full protocol: `docs/worker-protocol.md`

**Persistence Flow:**

1. `useAcademyPersistence` loads `PersistedState` from `localStorage['telemetry-academy']` on mount
2. Schema version (2) checked; mismatch clears storage and uses initial values
3. Any state change triggers debounced (300ms) write to localStorage
4. `isLoaded` flag gates initial render to prevent flash of uninitialized state

**State Management:**
- All application state in `App.tsx` as `useState` hooks
- No external state library (no Redux, Zustand, or Context API)
- Cross-component communication via props and callback props
- `InvestigationView` holds local tab/filter state; `logFilter` lifted to parent for persistence across tab switches
- Panel layout persisted via `react-resizable-panels` `useDefaultLayout` (separate localStorage keys)

## Key Abstractions

**`ValidationCheckType` (9 types):**
- Purpose: Declarative rule types for Phase 1 validation
- Examples: `src/lib/validation.ts`
- Pattern: `span_exists`, `attribute_exists`, `attribute_value`, `span_count`, `status_ok`, `status_error`, `telemetry_flowing`, `error_handling`, `yaml_key_exists`

**`RootCauseRule`:**
- Purpose: Per-case rules with `evaluate(data)`, `explainCorrect(data)`, `explainIncorrect(data, guessId)` methods that produce data-driven contextual feedback
- Examples: `helloSpanRules`, `autoMagicRules`, `collectorRules` in `src/lib/rootCauseEngine.ts`
- Pattern: Registered in `RULES_REGISTRY[caseId]`; `evaluate()` returns boolean; feedback strings reference actual span attribute values

**`Phase2Data`:**
- Purpose: Normalized data bundle for the investigation view
- Examples: `src/types/phase2.ts`, `src/data/phase2.ts`
- Pattern: Static data in `phase2Registry`; cases without registry entry fall back to user's live spans transformed by `usePhase2Data`

**`Case` (YAML-defined):**
- Purpose: A complete learning scenario — both phases in one declarative file
- Examples: `src/cases/001-hello-span/case.yaml`
- Pattern: `type` field controls validation path (`python` default | `yaml-config` for YAML cases); `order` field controls sequence

**`JSSpanExporter` (Python class in worker):**
- Purpose: Bridges Python OTel spans from WASM into JS
- Examples: `src/workers/python/setup_telemetry.py`
- Pattern: Subclasses `SpanExporter`; `export()` serializes spans to JSON and sends via `js.postMessage`

## Entry Points

**Browser Entry:**
- Location: `src/main.tsx`
- Triggers: Browser loads `index.html` → Vite serves bundle
- Responsibilities: Renders `<App />` inside React `StrictMode` with `wouter` `Router`

**App Component:**
- Location: `src/App.tsx`
- Triggers: React renders on mount and URL changes
- Responsibilities: Route matching (`/` → `HomePage`, `/case/:id` → workspace), all game state, phase transition logic

**Web Worker:**
- Location: `src/workers/python.worker.ts`
- Triggers: `useCodeRunner` calls `new Worker(new URL('../workers/python.worker.ts', import.meta.url), {type:'module'})` on mount
- Responsibilities: Receives `init` → loads Pyodide → installs OTel via micropip → runs setup script; receives `run` → executes user Python → streams `stdout` + `telemetry` back

**Case Loader:**
- Location: `src/data/caseLoader.ts`
- Triggers: `import.meta.glob` evaluated eagerly at Vite build time
- Responsibilities: Auto-discovers all `src/cases/*/case.yaml` and `setup.py`, merges into `Case[]`, sorts by `order` field

## Error Handling

**Strategy:** Fail gracefully with visible user feedback; never throw to the UI unhandled

**Patterns:**
- Worker init failure: `initError` state in `useCodeRunner` → displayed in `OutputPanel`
- Worker run failure: `runCode` promise rejects → `workerError` state in App → displayed in `OutputPanel`
- Worker timeout (5s): worker terminated and re-initialized, promise rejected with timeout error message
- Validation failures: `validateSpans` / `validateYaml` return `{passed: false, message}` — never throw
- Invalid YAML: `yaml.load` wrapped in `try/catch` in `checkYamlKeyExists`; returns `false`
- `localStorage` errors: `try/catch` in `useAcademyPersistence`; `QuotaExceededError` logged as warning
- Span transformation errors: `usePhase2Data` returns `{data: null, error: string, hasData: false}` on exception
- Root cause evaluation: `try/catch` in `evaluateGuess`; returns generic error `EvaluationResult` on failure
- `ErrorBoundary` component wraps the main content area (`src/components/ErrorBoundary.tsx`)

## Cross-Cutting Concerns

**Logging:** `console.error` / `console.warn` for internal errors; no structured logging library
**Validation:** Declarative rules in YAML, evaluated by pure functions in `src/lib/validation.ts`
**Authentication:** None — fully anonymous, no accounts, no server
**Responsiveness:** `md` breakpoint (768px); desktop uses resizable panels (`react-resizable-panels`); mobile uses tab-based layout; `display:none` preserves component state across tab switches
**Code Splitting:** `CodeEditor` lazy-loaded via `React.lazy()` to reduce initial bundle (Monaco editor is heavy)

---

*Architecture analysis: 2026-03-13*
