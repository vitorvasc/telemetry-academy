# Architecture

**Analysis Date:** 2026-03-10

## Pattern Overview

**Overall:** Single-page application with two-phase learning game loop, client-side Python execution via WASM

**Key Characteristics:**
- Zero-backend: all execution and state management happens in the browser
- Python runs in a Web Worker via Pyodide (WASM), sandboxed from the main thread
- Two-phase case structure: Phase 1 (Instrumentation) → Phase 2 (Investigation)
- Cases are data-driven YAML files, auto-discovered at build time
- State lives entirely in React (`App.tsx`) and localStorage

## Layers

**Entry / Shell:**
- Purpose: Bootstraps React and renders the root `App` component
- Location: `src/main.tsx`, `index.html`
- Contains: React DOM mount, CSS imports
- Depends on: App component
- Used by: Browser

**App Orchestrator:**
- Purpose: Holds all cross-cutting state (current case, phase, progress, spans, code), routes between views, and wires hooks to components
- Location: `src/App.tsx`
- Contains: All top-level state (`useState`/`useEffect`), event handlers (`handleValidate`, `handleCaseSolved`), layout for desktop and mobile
- Depends on: All hooks, all major components, lib functions, data layer
- Used by: Browser (root render)

**Components Layer:**
- Purpose: Presentational and interactive UI, receives props from App
- Location: `src/components/`
- Contains: `CodeEditor`, `InstructionsPanel`, `ValidationPanel`, `InvestigationView`, `TraceViewer`, `LogViewer`, `RootCauseSelector`, `CaseSelector`, `HomePage`, `CaseSolvedScreen`, `ReviewModal`, `WelcomeModal`, `OutputPanel` (terminal)
- Depends on: types, lib (rootCauseEngine), lucide-react
- Used by: App.tsx

**Hooks Layer:**
- Purpose: Encapsulates stateful side effects and derived state
- Location: `src/hooks/`
- Contains:
  - `useCodeRunner.ts` — manages Web Worker lifecycle, runs Python, collects spans/stdout
  - `useAcademyPersistence.ts` — versioned localStorage read/write with debounce
  - `usePhase2Data.ts` — transforms raw OTel spans into Phase2Data; generates synthetic logs
- Depends on: lib, data, workers, types
- Used by: App.tsx

**Library Layer (lib):**
- Purpose: Pure business logic with no React dependencies
- Location: `src/lib/`
- Contains:
  - `validation.ts` — 9 check types, runs span-based and YAML-based checks, progressive hint escalation
  - `rootCauseEngine.ts` — case-specific evaluation rules, distractor feedback generation
  - `spanTransform.ts` — converts raw OTel nanosecond spans to UI `TraceSpan` format, adds status badges
  - `logGenerator.ts` — synthesizes `LogEntry[]` from `TraceSpan[]` with contextual messages
- Depends on: types only
- Used by: hooks, components

**Data Layer:**
- Purpose: Static case definitions and runtime case discovery
- Location: `src/data/`, `src/cases/*/`
- Contains:
  - `caseLoader.ts` — uses Vite `import.meta.glob` to auto-discover `case.yaml` + `setup.py` at build time
  - `cases.ts` — exports `loadCases()` result as singleton `cases` array
  - `phase2.ts` — legacy static Phase2Data for `hello-span-001` (supplemented by rootCauseEngine)
  - `progress.ts` — exports progress utility types
- Depends on: types
- Used by: App.tsx, hooks, lib

**Case Content:**
- Purpose: Declarative case definitions (metadata, validations, root cause options) and initial Python code
- Location: `src/cases/<case-id>/case.yaml`, `src/cases/<case-id>/setup.py`
- Contains: YAML schema with `id`, `name`, `order`, `difficulty`, `phase1` (validations), `phase2` (rootCauseOptions); Python starter code
- Depends on: nothing (consumed by caseLoader at build time)
- Used by: caseLoader.ts

**Types Layer:**
- Purpose: Shared TypeScript interfaces
- Location: `src/types.ts` (root types), `src/types/phase2.ts`, `src/types/progress.ts`
- Contains: `Case`, `ValidationRule`, `ValidationResult`, `TraceSpan`, `LogEntry`, `Phase2Data`, `CaseProgress`
- Depends on: nothing
- Used by: all layers

**Worker Layer:**
- Purpose: Executes Python in a sandboxed Web Worker thread using Pyodide WASM
- Location: `src/workers/python.worker.ts`, `src/workers/python/setup_telemetry.py`
- Contains:
  - Worker: handles `init` (loads Pyodide, installs OTel packages, runs setup script) and `run` (executes user code)
  - Setup script: injects `JSStdout` (redirects `sys.stdout` to postMessage) and `JSSpanExporter` (ships spans to JS via postMessage)
- Depends on: pyodide CDN, opentelemetry-api/sdk (installed via micropip)
- Used by: useCodeRunner.ts

## Data Flow

**Phase 1 — Validation Flow:**

1. User writes Python in `CodeEditor` → `code` state in `App.tsx`
2. User clicks "Validate" → `handleValidate()` in `App.tsx`
3. For Python cases: `useCodeRunner.runCode(code)` sends `{type: 'run', code}` to Web Worker
4. Web Worker runs code with Pyodide; `JSSpanExporter.export()` calls `postMessage({type: 'telemetry', span})`
5. `useCodeRunner` receives `telemetry` messages → appends to `spans` state
6. `validateSpans(rules, {spans, attemptHistory})` in `src/lib/validation.ts` evaluates rules
7. Results → `validationResults` state → rendered in `ValidationPanel`
8. All rules pass → `appPhase` transitions to `'investigation'`
9. For YAML cases (`type === 'yaml-config'`): `validateYaml(rules, {yamlContent: code})` runs instead, no worker needed

**Phase 2 — Investigation Flow:**

1. `usePhase2Data(spans, caseId)` transforms raw worker spans via `spanTransform.ts` + `logGenerator.ts`
2. `InvestigationView` receives `Phase2Data` (spans, logs, narrative, rootCauseOptions)
3. User navigates Traces tab (`TraceViewer`) → Logs tab (`LogViewer`) → Root Cause tab (`RootCauseSelector`)
4. User submits a root cause guess → `evaluateGuess(guessId, data, caseId)` in `rootCauseEngine.ts`
5. Engine runs case-specific `RootCauseRule.evaluate(data)` → returns `EvaluationResult` with contextual explanation
6. If correct → `handleCaseSolved()` → `appPhase = 'solved'`, next case unlocked in progress

**Persistence Flow:**

1. `useAcademyPersistence` loads `PersistedState` from `localStorage['telemetry-academy']` on mount
2. Schema version checked; mismatch clears storage
3. Any state change (progress, code, attempts) triggers debounced (300ms) write back to localStorage
4. `isLoaded` flag gates initial render to prevent flash of uninitialized state

**State Management:**
- All application state lives in `App.tsx` as `useState` hooks
- No external state library (no Redux, Zustand, Context)
- Cross-component communication via props and callback props
- `InvestigationView` holds local tab state; filter state lifted to parent to survive tab switches

## Key Abstractions

**Case:**
- Purpose: A self-contained learning scenario with Phase 1 instrumentation tasks and Phase 2 investigation
- Examples: `src/cases/hello-span-001/case.yaml`, `src/cases/auto-magic-002/case.yaml`
- Pattern: YAML defines all content; `caseLoader.ts` merges YAML + Python file into typed `Case` object

**ValidationRule / SpanValidationRule:**
- Purpose: Declarative check specification for Phase 1; engine evaluates rule type against captured spans
- Examples: `src/types.ts` (ValidationRule), `src/lib/validation.ts` (SpanValidationRule)
- Pattern: `type` field dispatches to a specific check function; `hintMessage`/`guidedMessage` provide escalating feedback

**RootCauseRule:**
- Purpose: Per-case logic for evaluating a Phase 2 root cause guess, with data-driven explanations
- Examples: `helloSpanRules`, `autoMagicRules`, `collectorRules` all in `src/lib/rootCauseEngine.ts`
- Pattern: `evaluate(data)` returns boolean; `explainCorrect(data)` / `explainIncorrect(data, guessId)` return feedback strings that reference actual span attribute values

**JSSpanExporter:**
- Purpose: Python-side OTel exporter that bridges span data from WASM into JS
- Examples: `src/workers/python/setup_telemetry.py`
- Pattern: Subclasses `SpanExporter`; `export()` serializes spans to JSON, sends via `js.postMessage`

**Phase2Data:**
- Purpose: Normalized data bundle passed to Phase 2 UI; contains spans, logs, root cause options, narrative
- Examples: `src/types/phase2.ts`
- Pattern: Assembled by `usePhase2Data` hook from raw OTel spans + case definition

## Entry Points

**Browser Entry:**
- Location: `src/main.tsx`
- Triggers: Browser loads `index.html` → Vite bundles `main.tsx`
- Responsibilities: Renders `<App />` inside React `StrictMode`

**App Component:**
- Location: `src/App.tsx`
- Triggers: React renders on mount
- Responsibilities: Initializes all hooks, loads case list, restores persisted state, renders current view (Home, Instrumentation, Investigation, Solved)

**Web Worker:**
- Location: `src/workers/python.worker.ts`
- Triggers: `useCodeRunner` creates `new Worker(...)` on mount
- Responsibilities: Receives `init` message → loads Pyodide → installs OTel → runs setup script; receives `run` message → executes user Python → streams stdout/spans back

**Case Loader:**
- Location: `src/data/caseLoader.ts`
- Triggers: `import { cases } from './data/cases'` at module load (build-time glob)
- Responsibilities: Discovers all `src/cases/*/case.yaml` and `setup.py` files, merges them into `Case[]`, sorts by `order` field

## Error Handling

**Strategy:** Fail gracefully with visible user feedback; never crash the app

**Patterns:**
- Worker errors: caught in `useCodeRunner.runCode`, rejected promise → `workerError` state → displayed in `OutputPanel`
- Worker timeout: 5000ms timeout terminates and re-creates worker, rejects with timeout message
- Validation failures: validation functions return `{passed: false, message}` — never throw
- localStorage errors: `try/catch` in `useAcademyPersistence`; `QuotaExceededError` logged as warning, others as error
- Span transformation errors: `usePhase2Data` returns `{data: null, error: string, hasData: false}` on any exception
- Root cause evaluation errors: `try/catch` in `evaluateGuess`; returns generic error `EvaluationResult`
- Invalid YAML: `yaml.load` wrapped in `try/catch` in `checkYamlKeyExists`; returns `false` (fails the check)

## Cross-Cutting Concerns

**Logging:** `console.error` / `console.warn` for internal errors; no structured logging library
**Validation:** Declarative rules in YAML, evaluated by pure functions in `src/lib/validation.ts`
**Authentication:** None — fully anonymous, no accounts
**Responsiveness:** `App.tsx` implements dual desktop/mobile layouts; `md` (768px) breakpoint; `display:none` used to preserve component state across mobile tab switches

---

*Architecture analysis: 2026-03-10*
