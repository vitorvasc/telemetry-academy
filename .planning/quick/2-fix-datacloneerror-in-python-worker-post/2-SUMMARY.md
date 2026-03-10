---
phase: quick-002
plan: "01"
subsystem: workers
tags: [bug-fix, pyodide, worker, testing, vitest]
dependency_graph:
  requires: []
  provides: [serialized-worker-result, vitest-unit-tests]
  affects: [src/workers/python.worker.ts, src/hooks/useCodeRunner.ts]
tech_stack:
  added: [vitest, "@vitest/ui", jsdom]
  patterns: [PyProxy serialization, TDD, Vitest with jsdom]
key_files:
  created:
    - src/workers/python.worker.test.ts
  modified:
    - src/workers/python.worker.ts
    - vite.config.ts
    - package.json
decisions:
  - Export serializeResult from worker for testability
  - Use jsdom environment for Vitest (worker uses self global)
  - Fall back to null for unknown object types (safe over DataCloneError)
  - Call destroy() after toJs() to prevent Pyodide memory leaks
metrics:
  duration: "~2 min"
  completed: "2026-03-10T10:02:40Z"
  tasks_completed: 2
  files_changed: 4
---

# Quick Task 2: Fix DataCloneError in Python Worker postMessage Summary

**One-liner:** Serialize Pyodide PyProxy to plain JS via toJs() before postMessage, plus 8 Vitest unit tests guarding against regression.

## What Was Built

Fixed `src/workers/python.worker.ts` to convert the result from `pyodide.runPythonAsync()` to a structured-cloneable plain JS value before passing it to `postMessage`. Added `serializeResult()` as an exported helper to enable unit testing.

Installed Vitest with jsdom and wrote 8 unit tests covering all edge cases of the serialization function.

## Root Cause

`pyodide.runPythonAsync(code)` returns a Pyodide PyProxy object. PyProxy objects are not structured-cloneable (they wrap CPython objects behind a JS Proxy). Calling `self.postMessage({ ..., result })` with a PyProxy caused a `DataCloneError`, silently breaking the Run button.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix python.worker.ts — serialize result before postMessage | 7279483 | src/workers/python.worker.ts |
| 2 | Set up Vitest and write worker serialization unit tests | ca0896a | package.json, vite.config.ts, src/workers/python.worker.test.ts |

## Decisions Made

- **Export `serializeResult`:** Exporting the function from `python.worker.ts` allows tests to import it directly without needing to mock the entire worker runtime. This is cleaner than copying the logic into the test file.
- **jsdom environment:** Required by Vitest to provide the `self` global that `python.worker.ts` assigns `onmessage` to. Without it the import would fail.
- **Null fallback for unknown objects:** When an object lacks `toJs()`, returning `null` is safe — `useCodeRunner.ts` ignores the result value and only watches span output via `postMessage({ type: 'spans', ... })`.
- **`destroy()` after `toJs()`:** Pyodide recommends calling `destroy()` on PyProxy objects when done to free the associated CPython object from the WASM heap.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Missing Dependency] jsdom not installed for Vitest**
- **Found during:** Task 2
- **Issue:** `npm test` failed with `Cannot find package 'jsdom'` when Vitest tried to set up the jsdom environment
- **Fix:** Ran `npm install --save-dev jsdom`
- **Files modified:** package.json, package-lock.json
- **Commit:** ca0896a (included in Task 2 commit)

## Verification

- `npx tsc --noEmit` — passes, no errors
- `npm test` — 8/8 tests pass
- Browser verification: Navigate to a Python case, click Run — no DataCloneError in console, spans appear in trace viewer

## Self-Check: PASSED

All files present and all commits verified:
- FOUND: src/workers/python.worker.ts
- FOUND: src/workers/python.worker.test.ts
- FOUND: .planning/quick/2-fix-datacloneerror-in-python-worker-post/2-SUMMARY.md
- FOUND commit: 7279483 (Task 1)
- FOUND commit: ca0896a (Task 2)
