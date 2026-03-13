# Codebase Concerns

**Analysis Date:** 2026-03-13

## Tech Debt

**Duplicate validation type definitions:**
- Issue: `ValidationRule` / `ValidationResult` are defined in both `src/types.ts:26-47` and `src/lib/validation.ts:15-45` as `SpanValidationRule` / `ValidationResult`. The two sets are structurally identical but maintained separately. `App.tsx:243,282` casts `currentCase.phase1.validations as SpanValidationRule[]` to bridge the gap.
- Files: `src/types.ts:26-47`, `src/lib/validation.ts:15-45`, `src/App.tsx:243,282`
- Impact: Adding new validation fields requires updating both definitions; cast in App.tsx bypasses type safety.
- Fix approach: Export `SpanValidationRule` from `src/lib/validation.ts` and import it in `src/types.ts`; remove the duplicate definition.

**`phase2Registry` only contains one of three cases:**
- Issue: `src/data/phase2.ts:7,152` exports `phase2Registry` and registers only `001-hello-span`. Cases `002-auto-magic` and `003-the-collector` have root cause rules in `src/lib/rootCauseEngine.ts:307-308` and YAML `rootCauseOptions` in their `case.yaml` files, but no static Phase 2 data (curated traces/logs).
- Files: `src/data/phase2.ts:7,152`, `src/hooks/usePhase2Data.ts:140-148`
- Impact: Cases 002 and 003 fall through to the live-span fallback path in `usePhase2Data.ts:152+`. For case 003 (`yaml-config` type), `spans` is always empty and `hasPhase2Data` is always `false`, so the investigation tab permanently shows "No Telemetry Data."
- Fix approach: Author `autoMagicPhase2` and `collectorPhase2` data objects and register them in `phase2Registry`, following the `helloSpanPhase2` pattern.

**Pyodide CDN URL hardcoded with version string:**
- Issue: The Pyodide runtime loads from `https://cdn.jsdelivr.net/pyodide/v0.29.3/full/` — a hardcoded URL in the worker. The version must be kept in sync with the `pyodide` entry in `package.json` manually.
- Files: `src/workers/python.worker.ts:40-43`
- Impact: Upgrading pyodide in `package.json` without updating the URL causes silent version skew. CDN unavailability breaks all Python execution with no fallback.
- Fix approach: Generate the CDN URL at build time from the installed package version, or vendor Pyodide assets into `public/`.

**`caseLoader.ts` spreads unvalidated YAML into typed Case:**
- Issue: `buildCase()` in `src/data/caseLoader.ts:28-38` spreads raw YAML (`...yamlData`) into a `Case` cast with no runtime schema validation. Multiple `eslint-disable` comments suppress the resulting `any` type warnings.
- Files: `src/data/caseLoader.ts:14,27-29,47,61`
- Impact: A malformed `case.yaml` (missing required field, wrong type) silently produces a partial `Case` object that crashes at runtime in unexpected places, far from the source.
- Fix approach: Add schema validation in `buildCase()` with manual checks or zod; throw a descriptive error on schema violations so authoring mistakes surface at dev startup.

**`App.tsx` is a 703-line monolith:**
- Issue: `src/App.tsx` handles routing, case selection, validation orchestration, persistence, panel layout, mobile/desktop layout branching, and modal state in a single component with 15+ `useState`/`useEffect` calls. The `handleValidate` async function (lines 227-302) alone is 75 lines and owns the entire Phase 1 execution/validation flow.
- Files: `src/App.tsx`
- Impact: Difficult to reason about, test, and extend. The `eslint-disable-next-line react-hooks/purity` comment on line 232 is a signal that the component's responsibilities are too broad.
- Fix approach: Extract case orchestration (validation, phase transitions) into a `useCaseOrchestrator` hook. The `handleValidate` function and related state are the primary extraction target.

**`handleResetPanels` uses hardcoded localStorage keys:**
- Issue: `src/App.tsx:340-343` calls `localStorage.removeItem()` with hardcoded strings (`react-resizable-panels:ta-panel-main`, etc.) that must stay in sync with the panel ID strings used in `useDefaultLayout` calls on lines 130-132.
- Files: `src/App.tsx:130-132,339-344`
- Impact: Renaming panel IDs silently breaks the reset function without a type error.
- Fix approach: Derive cleanup keys from the same string constants used for panel IDs, or document the coupling explicitly.

**`RULES_REGISTRY` in rootCauseEngine is a manually maintained map:**
- Issue: `src/lib/rootCauseEngine.ts:305-309` maps case IDs to rule arrays by hand. Adding a `case.yaml` without a corresponding registry entry causes `evaluateGuess` to silently return `{ correct: false }` for all guesses with the message "Invalid selection."
- Files: `src/lib/rootCauseEngine.ts:305-309`
- Impact: New case authors may forget to register rules; there is no runtime warning or build-time check.
- Fix approach: Document this step explicitly in the case authoring checklist (CLAUDE.md already lists it as step 4). Consider adding a dev-mode assertion that verifies every loaded case has a registry entry.

---

## Known Bugs

**Case 003 (`yaml-config`) investigation phase always shows "No Telemetry Data":**
- Symptoms: Entering Phase 2 of `003-the-collector` shows the `NoTelemetryData` component because `hasPhase2Data` is always false — the case produces no live spans (no Python worker runs), and no static registry entry exists.
- Files: `src/hooks/usePhase2Data.ts:151-157`, `src/data/phase2.ts:7`
- Trigger: Navigating to Phase 2 of the YAML-config case.
- Workaround: None. The investigation phase is functionally broken for case 003.

**Validation runs against pre-error spans after execution failure:**
- Symptoms: When `runCode` throws (timeout or Python exception), `handleValidate` catches the error, sets `workerError`, and then calls `validateSpans` with the stale `runSpans` local variable (initialized to `[]` at line 266). Validation proceeds against an empty array, potentially showing misleading "no spans" errors even if previous runs succeeded.
- Files: `src/App.tsx:266-298`
- Trigger: Any code execution error — Python syntax error, runtime exception, or 5s timeout.
- Workaround: User must re-run after fixing the error. The previous span state (in `useCodeRunner`) is preserved but `runSpans` is always reset to `[]` before the try block.

**CodeEditor default filename is hardcoded to `payment_service.py`:**
- Symptoms: `src/components/CodeEditor.tsx:101` shows `{filename ?? 'payment_service.py'}` as the filename label. Cases that do not pass a `filename` prop show this default, regardless of the actual case being instrumented.
- Files: `src/components/CodeEditor.tsx:8,101`
- Trigger: Any Python case that does not override `filename` in its `CodeEditor` usage. Currently, `App.tsx` does not pass a `filename` prop for Python cases.
- Workaround: Cosmetic only. Does not affect functionality.

---

## Security Considerations

**Arbitrary Python execution in Pyodide (accepted risk):**
- Risk: User-submitted Python code runs with full Pyodide capabilities including `js` interop and `urllib` network access. A malicious or buggy script could flood the main thread with postMessage calls or make outbound network requests.
- Files: `src/workers/python.worker.ts`, `src/workers/python/setup_telemetry.py`
- Current mitigation: Runs in a Web Worker (isolated thread); 5s timeout limits execution duration; no server-side code execution.
- Recommendations: This is an accepted constraint for a client-side-only platform. Rate-limit postMessage processing in the main thread for defense in depth.

**Pyodide loaded from third-party CDN at runtime:**
- Risk: Runtime JS and Python stdlib load from `cdn.jsdelivr.net`. A CDN compromise or supply chain attack affects all users.
- Files: `src/workers/python.worker.ts:41`
- Current mitigation: Standard browser HTTPS only. No subresource integrity (SRI) check.
- Recommendations: Add SRI hash to the Pyodide CDN URL if supported, or vendor assets into the build.

**localStorage stores user code without size feedback:**
- Risk: User code is saved on every keystroke (300ms debounce). `QuotaExceededError` is caught and logged but the user receives no feedback.
- Files: `src/hooks/useAcademyPersistence.ts:113-122`
- Current mitigation: Error is caught; `console.warn` is emitted.
- Recommendations: Show a user-visible toast/banner when quota is exceeded so the user knows their progress is not being saved.

---

## Performance Bottlenecks

**Pyodide cold start (~5-15s on first load):**
- Problem: `loadPyodide` downloads ~8MB WASM + `opentelemetry-api` + `opentelemetry-sdk` packages from CDN on first use. This blocks the validation button until loading completes.
- Files: `src/workers/python.worker.ts:37-53`, `src/hooks/useCodeRunner.ts:39-80`
- Cause: Worker init is triggered when the case route mounts. No preloading while the user reads the home page.
- Improvement path: Start `initWorker` in the background from the home page while the user browses cases. The `cache: true` option (line 42) already uses IndexedDB caching for repeat visits.

**`Math.min/max` with spread operator on span arrays:**
- Problem: `src/lib/spanTransform.ts:134,194` uses `Math.min(...rawSpans.map(...))` and `Math.max(...)`. The spread operator has a JS engine call stack size limit (~65k elements). For pathologically large span payloads, this throws a `RangeError`.
- Files: `src/lib/spanTransform.ts:134,194`
- Cause: Spread shorthand instead of `reduce`.
- Improvement path: Replace with `rawSpans.reduce((min, s) => Math.min(min, s.start_time), Infinity)`.

**`generateLogsFromSpans` does O(n×m) span lookups:**
- Problem: `src/lib/logGenerator.ts:181` calls `spans.find(s => event.name.startsWith(s.name))` for every log event in the output map. For n log events and m spans, this is O(n×m).
- Files: `src/lib/logGenerator.ts:181-189`
- Cause: No pre-built lookup map.
- Improvement path: Build a `Map<string, TraceSpan>` by span name before the map; negligible for current span counts (<50) but degrades with complex cases.

---

## Fragile Areas

**Worker timeout recovery leaves `isRunning` in inconsistent state:**
- Files: `src/hooks/useCodeRunner.ts:97-105`
- Why fragile: The timeout handler at line 102 calls `setIsRunning(false)` then `initWorker()`. However, the `messageHandler` listener was added to the old (now-terminated) worker. The new worker from `initWorker()` does not have this listener. If the new worker fails immediately during init, there is no `success/error` handler to clean up the promise — it leaks.
- Safe modification: Add a `workerRef.current?.removeEventListener('message', messageHandler)` call in the timeout handler before termination, and ensure the promise is always settled.
- Test coverage: Worker timeout recovery path is not tested in `src/workers/python.worker.test.ts`.

**`RootCauseSelector` maintains duplicate `attempts` counter:**
- Files: `src/components/RootCauseSelector.tsx:23`
- Why fragile: The component tracks `attempts` locally (line 23) and fires `onAttempt` to increment the parent's `investigationAttempts` in `App.tsx`. On component remount (case switch), the local counter resets to 0 while the parent's counter survives. The displayed "Solved in N attempts" uses the local counter; the persisted count uses the parent's counter.
- Safe modification: Remove the local `attempts` state; receive the current attempt count as a prop from `App.tsx`.
- Test coverage: No component tests for `RootCauseSelector`.

**`checkYamlKeyExists` silently treats parse errors as "key not found":**
- Files: `src/lib/validation.ts:250-274`
- Why fragile: The catch block on line 271 swallows all YAML parse errors and returns `false`. Users who write invalid YAML see all validation checks fail with their normal error messages — no indication the YAML itself is broken.
- Safe modification: Distinguish parse errors from key-not-found; surface a distinct validation state (e.g., a banner saying "YAML parse error: …") when `yaml.load` throws.
- Test coverage: `src/lib/__tests__/validation.test.ts` tests valid paths; invalid YAML returns `false` is tested but user-message surfacing is not.

**`yaml_key_exists` always returns `false` in `runCheck` (span path):**
- Files: `src/lib/validation.ts:98-99`
- Why fragile: `runCheck` has a case for `yaml_key_exists` that explicitly returns `false` (line 99). This is correct because YAML validation is handled by `validateYaml`. However, if a YAML case is ever misconfigured to call `validateSpans` instead of `validateYaml`, all YAML checks silently fail with no error or warning.
- Safe modification: Change the `yaml_key_exists` branch in `runCheck` to throw an `Error('yaml_key_exists must be evaluated with validateYaml, not validateSpans')` in development mode.

**`useAcademyPersistence` `initialProgress` captured at mount:**
- Files: `src/hooks/useAcademyPersistence.ts:90,168`
- Why fragile: The load `useEffect` and `resetAll` both reference `initialProgress` from the first render. `INITIAL_PROGRESS` in `App.tsx:64` is module-level and stable. However, `resetAll` restores to this captured value. If cases are ever loaded asynchronously, a stale `initialProgress` could silently omit new cases from the reset state.
- Safe modification: Memoize `INITIAL_PROGRESS` with `useMemo` keyed on `cases` at the call site.

---

## Missing Critical Features

**Phase 2 static data missing for cases 002 and 003:**
- Problem: `phase2Registry` has only one entry. Case 002 (`auto-magic`) falls through to the live-span path with no curated incident scenario. Case 003 (`the-collector`) has no spans at all, so investigation is completely inaccessible.
- Blocks: End-to-end playability of two of the three shipped cases.
- Priority: Critical.

**No retry mechanism when Pyodide fails to initialize:**
- Problem: If Pyodide fails to load (network offline, CDN outage, WASM not supported), `initError` is set and the "Check Code" button permanently shows "Loading Python…" in a disabled state. There is no retry button or user-visible error recovery.
- Files: `src/hooks/useCodeRunner.ts:58-67`, `src/App.tsx:566`
- Blocks: Users with transient network issues are stuck without a page reload.
- Priority: Medium.

**No error boundaries around individual investigation tabs:**
- Problem: A single `ErrorBoundary` wraps the entire content area in `src/App.tsx:496`. A rendering error in `TraceViewer` or `LogViewer` forces a full page reload, losing all in-memory state.
- Files: `src/App.tsx:496,683`, `src/components/ErrorBoundary.tsx`
- Blocks: Graceful per-tab error recovery.
- Priority: Low.

---

## Test Coverage Gaps

**`RootCauseSelector` component — no tests:**
- What's not tested: Selection state, submission flow, retry behavior, evaluation result display, fallback to static `option.correct`, attempt counter.
- Files: `src/components/RootCauseSelector.tsx`
- Risk: Regressions in the core Phase 2 interaction surface only in manual testing.
- Priority: High.

**Worker timeout recovery path — no test:**
- What's not tested: 5s timeout fires, worker terminates, `initWorker` re-called, `isRunning` resets, promise rejects with timeout message.
- Files: `src/hooks/useCodeRunner.ts:97-105`
- Risk: UI could get stuck in a non-interactive "running" state after a timeout, with no automated detection.
- Priority: High.

**`caseLoader.ts` — no tests:**
- What's not tested: `buildCase` with missing YAML fields, case ordering by `order` field, missing `setup.py` fallback to empty string.
- Files: `src/data/caseLoader.ts`
- Risk: Malformed case authoring causes silent runtime errors with no dev-time feedback.
- Priority: Medium.

**`usePhase2Data` fallback path — no tests:**
- What's not tested: The live-span transformation path when `phase2Registry[caseId]` is undefined — including `filterMalformedSpans`, `mergeUserAttributes`, and `generateLogsFromSpans` integration.
- Files: `src/hooks/usePhase2Data.ts:151-212`
- Risk: Edge cases in user span data (zero-duration spans, missing attributes) produce a broken investigation view silently.
- Priority: Medium.

**`ValidationPanel` component — no tests:**
- What's not tested: Progressive hint display logic (amber styling at 3+ attempts), phase unlock banner, disabled states for worker loading vs. phase complete.
- Files: `src/components/ValidationPanel.tsx`
- Risk: Visual regression in validation feedback UI goes undetected.
- Priority: Low.

---

## Scaling Limits

**localStorage stores all case code in a single JSON blob:**
- Current capacity: `PersistedState.caseCode` stores all case code as a single `Record<string, string>`. At 9 planned cases with 200-400 lines each, the blob is ~50-100KB — well within limits.
- Limit: `localStorage.setItem` throws `QuotaExceededError` at ~5-10MB per origin. The error is caught silently.
- Scaling path: At 9 cases, no action needed. Above ~50 cases, consider per-case keys to allow selective eviction.

**All case YAML loaded eagerly at build time:**
- Current capacity: 3 cases; 9 planned.
- Limit: `import.meta.glob` with `{ eager: true }` in `src/data/caseLoader.ts:15` bundles all case assets into the main chunk. At 9 cases this is negligible.
- Scaling path: Switch to `eager: false` and lazy-load individual cases on demand if case count grows beyond ~30.

---

## Dependencies at Risk

**`pyodide` pinned to CDN at `v0.29.3` with `@ts-expect-error`:**
- Risk: The `cache: true` option is suppressed with `@ts-expect-error` (line 42) because pyodide's type definitions lag the runtime. If the option is renamed or removed in a future release, the error is silently lost.
- Impact: `cache: true` is a significant performance optimization for repeat visits. Silent breakage would cause full re-downloads on every page load.
- Migration plan: Remove the suppression comment when types catch up; track the pyodide changelog for `cache` option status.

---

*Concerns audit: 2026-03-13*
