---
phase: quick-002
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/workers/python.worker.ts
  - vite.config.ts
  - package.json
  - src/workers/python.worker.test.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "Running Python code in the worker no longer throws DataCloneError"
    - "Worker postMessage result is always a plain JS value (null, string, number, or plain object)"
    - "Unit tests catch non-serializable result regression"
  artifacts:
    - path: "src/workers/python.worker.ts"
      provides: "Fixed worker that serializes Pyodide result before postMessage"
      contains: "toJs"
    - path: "src/workers/python.worker.test.ts"
      provides: "Unit tests for worker message handling logic"
      exports: ["describe", "it", "expect"]
  key_links:
    - from: "src/workers/python.worker.ts"
      to: "useCodeRunner.ts"
      via: "postMessage({ type: 'success', id, result })"
      pattern: "result.*toJs|serializeResult"
---

<objective>
Fix DataCloneError in the Pyodide Web Worker by serializing the Python execution
result to a plain JS value before calling postMessage. Add Vitest unit tests to
catch this class of regression going forward.

Purpose: The worker currently posts `result` from `pyodide.runPythonAsync(code)`
directly. This is a PyProxy (Pyodide Proxy object) that the structured clone
algorithm cannot serialize, causing DataCloneError. Users see a broken Run button
with no useful error feedback.

Output: Fixed worker + Vitest test suite covering the worker's message protocol.
</objective>

<execution_context>
@/Users/vasconcellos/.claude/get-shit-done/workflows/execute-plan.md
@/Users/vasconcellos/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md

Key files:
- src/workers/python.worker.ts — the broken worker (result is a PyProxy)
- src/workers/python/setup_telemetry.py — Python side (posts spans as JSON strings, fine)
- src/hooks/useCodeRunner.ts — consumer of worker messages

Root cause: Line 35 of python.worker.ts:
  self.postMessage({ type: 'success', id, result });
`result` from `pyodide.runPythonAsync()` is a Pyodide PyProxy. PyProxy objects
are not structured-cloneable. Fix: call `result?.toJs?.({ dict_converter: Object.fromEntries }) ?? null`
to convert to a plain JS value, then destroy the proxy to avoid memory leaks.

The `toJs` method on PyProxy converts Python objects to plain JS equivalents:
- Python None → null
- Python dict → plain JS object (with dict_converter option)
- Python list → JS array
- Python str/int/float → primitive

If `result` is already a JS primitive (number, string, bool, null/undefined),
`toJs` won't exist and the nullish fallback handles it safely.
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Fix python.worker.ts — serialize result before postMessage</name>
  <files>src/workers/python.worker.ts</files>
  <behavior>
    - serializeResult(null) → null
    - serializeResult(undefined) → null
    - serializeResult("hello") → "hello" (primitive passthrough)
    - serializeResult(42) → 42 (primitive passthrough)
    - serializeResult(PyProxy-like object with toJs()) → calls toJs() and returns plain value
    - serializeResult(PyProxy-like object without toJs) → returns null safely
    - After toJs(), if result has destroy(), it is called (memory management)
  </behavior>
  <action>
    Add a `serializeResult` helper function at the top of python.worker.ts
    (after the imports):

    ```typescript
    function serializeResult(result: unknown): unknown {
      if (result === null || result === undefined) return null;
      // Primitive JS values are structured-cloneable as-is
      if (typeof result !== 'object' && typeof result !== 'function') return result;
      // Pyodide PyProxy objects have a toJs() method
      if (typeof (result as any).toJs === 'function') {
        const plain = (result as any).toJs({ dict_converter: Object.fromEntries });
        // Destroy the proxy to free Python memory
        if (typeof (result as any).destroy === 'function') {
          (result as any).destroy();
        }
        return plain;
      }
      // Unknown object type — return null rather than risk DataCloneError
      return null;
    }
    ```

    Then change line 35 from:
      `self.postMessage({ type: 'success', id, result });`
    to:
      `self.postMessage({ type: 'success', id, result: serializeResult(result) });`

    This fix is safe because:
    - Primitives pass through unchanged (Python functions that return a string/number)
    - None/null Python return values become JS null (fine — useCodeRunner ignores result value)
    - PyProxy objects are converted to plain JS and the proxy is destroyed
    - Unknown types fall back to null rather than causing DataCloneError
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep -E "error|warning" | head -20</automated>
  </verify>
  <done>
    python.worker.ts compiles without TypeScript errors. serializeResult function
    is present and called on the result before postMessage.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Set up Vitest and write worker serialization unit tests</name>
  <files>
    package.json,
    vite.config.ts,
    src/workers/python.worker.test.ts
  </files>
  <behavior>
    - serializeResult(null) returns null
    - serializeResult(undefined) returns null
    - serializeResult("hello") returns "hello"
    - serializeResult(42) returns 42
    - serializeResult({ toJs: () => ({ foo: 'bar' }), destroy: vi.fn() }) returns { foo: 'bar' } and calls destroy()
    - serializeResult({ toJs: () => ({ foo: 'bar' }) }) returns { foo: 'bar' } (no destroy — no crash)
    - serializeResult({}) returns null (no toJs method → unknown object → null)
    - serializeResult(() => {}) returns null (function type → null)
  </behavior>
  <action>
    1. Install Vitest:
       ```
       npm install --save-dev vitest @vitest/ui
       ```

    2. Add test scripts to package.json scripts section:
       ```json
       "test": "vitest run",
       "test:watch": "vitest",
       "test:ui": "vitest --ui"
       ```

    3. Add Vitest config to vite.config.ts (add `test` field to defineConfig):
       ```typescript
       test: {
         environment: 'jsdom',
         globals: true,
       }
       ```
       Also add `/// <reference types="vitest" />` as first line of vite.config.ts.

    4. Create `src/workers/python.worker.test.ts`:

       The worker file can't be imported directly (it uses `self.onmessage` which
       is worker-global). Extract the testable logic by importing the serializer
       from a separate utility or test the function in isolation by copying its
       logic into the test.

       The cleanest approach: refactor `serializeResult` to be exported from
       `src/workers/python.worker.ts` so tests can import it directly:
         `export function serializeResult(result: unknown): unknown { ... }`

       Then in python.worker.test.ts:
       ```typescript
       import { describe, it, expect, vi } from 'vitest';
       import { serializeResult } from './python.worker';

       describe('serializeResult', () => {
         it('returns null for null', () => { expect(serializeResult(null)).toBe(null); });
         it('returns null for undefined', () => { expect(serializeResult(undefined)).toBe(null); });
         it('passes through string primitives', () => { expect(serializeResult('hello')).toBe('hello'); });
         it('passes through number primitives', () => { expect(serializeResult(42)).toBe(42); });
         it('calls toJs on PyProxy-like object', () => {
           const destroy = vi.fn();
           const proxy = { toJs: () => ({ foo: 'bar' }), destroy };
           expect(serializeResult(proxy)).toEqual({ foo: 'bar' });
           expect(destroy).toHaveBeenCalledOnce();
         });
         it('handles PyProxy without destroy gracefully', () => {
           const proxy = { toJs: () => [1, 2, 3] };
           expect(serializeResult(proxy)).toEqual([1, 2, 3]);
         });
         it('returns null for unknown objects (no toJs)', () => {
           expect(serializeResult({})).toBe(null);
         });
         it('returns null for functions', () => {
           expect(serializeResult(() => {})).toBe(null);
         });
       });
       ```

       Note: `self.onmessage` in python.worker.ts runs in worker global context.
       The import in the test will execute that assignment, but jsdom provides a
       stub `self`. The `serializeResult` export is what's under test — the
       `onmessage` assignment is a side effect that won't throw.

       If the import causes issues with `loadPyodide` (ESM import at top of
       worker), mock it at the top of the test file:
       ```typescript
       vi.mock('pyodide', () => ({ loadPyodide: vi.fn() }));
       ```
  </action>
  <verify>
    <automated>npm test 2>&1</automated>
  </verify>
  <done>
    `npm test` passes all 8 test cases with zero failures. Vitest is installed and
    configured. test script is in package.json.
  </done>
</task>

</tasks>

<verification>
After both tasks complete:
1. `npx tsc --noEmit` passes with no errors
2. `npm test` passes all 8 unit tests
3. Manually verify: Open dev server, navigate to a Python case, click Run — no DataCloneError in console, spans appear in the trace viewer
</verification>

<success_criteria>
- python.worker.ts posts only structured-cloneable values via postMessage
- serializeResult helper handles null/primitive/PyProxy/unknown safely
- All 8 unit tests pass under Vitest
- No TypeScript errors introduced
- DataCloneError is gone from the browser console
</success_criteria>

<output>
After completion, create `.planning/quick/2-fix-datacloneerror-in-python-worker-post/2-SUMMARY.md`
</output>
