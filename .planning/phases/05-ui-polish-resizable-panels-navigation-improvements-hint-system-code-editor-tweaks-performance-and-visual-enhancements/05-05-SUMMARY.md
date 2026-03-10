---
phase: 05-ui-polish-resizable-panels-navigation-improvements-hint-system-code-editor-tweaks-performance-and-visual-enhancements
plan: "05"
subsystem: ui
tags: [pyodide, web-worker, react-lazy, suspense, monaco, performance, loading-stages]

# Dependency graph
requires:
  - phase: 05-04
    provides: navigation improvements and mobile drawer built in prior plan

provides:
  - Pyodide init progress visible via 3-stage postMessage protocol
  - loadingLabel surfaced from useCodeRunner hook to ValidationPanel
  - Monaco CodeEditor lazy-loaded as separate JS chunk (not in homepage bundle)

affects: [useCodeRunner, ValidationPanel, App.tsx, python.worker.ts]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "loading-stage postMessage: worker posts { type, stage, total, label } before each async await"
    - "React.lazy with named export re-mapping: lazy(() => import(...).then(m => ({ default: m.Named })))"
    - "Tight Suspense placement: Suspense wraps only the lazy component, not the surrounding Panel"

key-files:
  created: []
  modified:
    - src/workers/python.worker.ts
    - src/hooks/useCodeRunner.ts
    - src/components/ValidationPanel.tsx
    - src/App.tsx
    - src/workers/python.worker.test.ts

key-decisions:
  - "loading-stage handled in initWorker onmessage (not runCode messageHandler) — fires during init before runCode is called"
  - "loadingLabel cleared to '' on 'ready' message — label does not persist after init completes"
  - "Suspense skeleton uses animate-pulse bg-slate-800 to match editor background (avoids jarring white flash)"
  - "CodeEditor named export remapped to default via .then(m => ({ default: m.CodeEditor })) for React.lazy compatibility"

patterns-established:
  - "loading-stage postMessage pattern: post before each await in worker init, handle in initWorker onmessage"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-03-10
---

# Phase 05 Plan 05: Performance Improvements — Pyodide Loading Stages + Monaco Lazy Load Summary

**Pyodide init shows 3 progressive stage labels ("Loading Python runtime (1/3)" etc.) and Monaco CodeEditor deferred as separate lazy-loaded JS chunk to reduce homepage bundle**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-10T12:57:56Z
- **Completed:** 2026-03-10T13:00:13Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Worker posts `{ type: 'loading-stage', stage, total, label }` before each of 3 init awaits (runtime, packages, sandbox)
- `useCodeRunner` handles `loading-stage` in `initWorker` onmessage, surfaces `loadingLabel` string to consumers
- `ValidationPanel` displays the live stage label on the Check Code button when worker is not yet ready
- `CodeEditor` converted to `React.lazy` with named-export remapping — Monaco ships as a separate 16.82 kB chunk, not in the main bundle

## Task Commits

Each task was committed atomically:

1. **Task 1: Add loading stage messages to python.worker.ts and surface in useCodeRunner** - `494d93c` (feat)
2. **Task 2: Show loading stages in ValidationPanel and lazy-load Monaco in App.tsx** - `c1e5fa6` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified

- `src/workers/python.worker.ts` — Added 3 `loading-stage` postMessage calls in the `init` handler before each major await
- `src/hooks/useCodeRunner.ts` — Added `loadingLabel` state, `loading-stage` handling in initWorker, returned from hook
- `src/components/ValidationPanel.tsx` — Added optional `loadingLabel` prop; button text shows stage label or fallback "Loading Python..."
- `src/App.tsx` — Replaced static CodeEditor import with `React.lazy`, added `Suspense` wrappers on desktop and mobile, passed `loadingLabel` to both ValidationPanel usages
- `src/workers/python.worker.test.ts` — Added explanatory comment about loading-stage manual verification scope

## Decisions Made

- `loading-stage` is handled in the `initWorker` onmessage handler, not in `runCode`'s messageHandler — the stages fire during initialization before `runCode` is ever called
- `loadingLabel` is cleared to `''` on the `'ready'` message so the label does not persist after init completes
- CodeEditor uses `.then(m => ({ default: m.CodeEditor }))` to remap the named export to the default export format required by `React.lazy`
- Suspense fallback is a `bg-slate-800 animate-pulse` div (dark background matches editor, avoids white flash)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 5 plan 05 is the final plan in Phase 5. All 5 plans complete:
- 05-01: Resizable panels (react-resizable-panels v4)
- 05-02: Always-visible hints in InstructionsPanel
- 05-03: Code editor tweaks (font size, word wrap, keyboard shortcut)
- 05-04: Navigation improvements (progress indicators, mobile case drawer)
- 05-05: Performance improvements (Pyodide loading stages, Monaco lazy load)

No blockers. Build clean. All tests pass.

## Self-Check

Verified files exist:
- `src/workers/python.worker.ts` — contains `loading-stage`
- `src/hooks/useCodeRunner.ts` — contains `loadingLabel`
- `src/components/ValidationPanel.tsx` — contains `loadingLabel`
- `src/App.tsx` — contains `React.lazy`

Commits verified:
- `494d93c` — Task 1
- `c1e5fa6` — Task 2

## Self-Check: PASSED

---
*Phase: 05-ui-polish*
*Completed: 2026-03-10*
