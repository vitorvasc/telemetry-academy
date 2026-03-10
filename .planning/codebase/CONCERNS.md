# Codebase Concerns

**Analysis Date:** 2026-03-10

## Tech Debt

**`any` types throughout validation pipeline:**
- Issue: `spans: any[]` and `attributeValue?: any` in validation functions suppress type safety at the most critical path
- Files: `src/lib/validation.ts` (lines 18, 31, 71, 130, 147, 169, 172, 191, 203, 259), `src/types.ts` (line 42)
- Impact: Type errors in span data from the Python worker are silently tolerated; new validation rules can pass wrong attribute types undetected
- Fix approach: Define a `RawSpan` interface matching the OTel JSON output from `setup_telemetry.py`, then type the validation inputs against it

**`any` type on Pyodide instance:**
- Issue: `let pyodide: any = null` loses all Pyodide API type information
- Files: `src/workers/python.worker.ts` (line 4)
- Impact: No autocomplete or safety for Pyodide calls; breaking API changes go unnoticed until runtime
- Fix approach: Install `@types/pyodide` or create a local declaration file with the relevant method signatures

**`(currentCase as any).type` cast repeated in App.tsx:**
- Issue: The `Case` type declares `type?: 'python' | 'yaml-config'` but `App.tsx` still casts through `any` in three places (lines 136, 456, 457) rather than using the typed field directly
- Files: `src/App.tsx`
- Impact: Type narrowing is bypassed; refactors to `Case.type` won't catch these callsites
- Fix approach: Remove `as any` casts — `currentCase.type` is already typed on the `Case` interface

**`caseLoader.ts` spread of unvalidated YAML:**
- Issue: `buildCase` spreads raw YAML data (`...yamlData`) directly into a `Case` object without runtime validation
- Files: `src/data/caseLoader.ts` (line 29)
- Impact: A malformed `case.yaml` silently produces a partial `Case` object that crashes at runtime in unexpected places; errors surface far from the source
- Fix approach: Add a Zod (or manual) schema validation step in `buildCase` that throws with a descriptive message on schema violations

**`js-yaml` is an undeclared production dependency:**
- Issue: `js-yaml` is used in `src/lib/validation.ts` but only listed under `@types/js-yaml` in `devDependencies`, not as a runtime dependency in `package.json`
- Files: `src/lib/validation.ts` (line 1), `package.json`
- Impact: Works in dev because `js-yaml` is a transitive dependency of `@modyfi/vite-plugin-yaml`, but this is fragile — updating the YAML plugin could remove it; a production build on a clean install may fail
- Fix approach: Add `"js-yaml": "^4.1.0"` to `dependencies` in `package.json`

**Duplicate `RawOTelSpan` interface definition:**
- Issue: `RawOTelSpan` is defined identically in both `src/lib/spanTransform.ts` (line 7) and `src/hooks/usePhase2Data.ts` (line 10)
- Files: `src/lib/spanTransform.ts`, `src/hooks/usePhase2Data.ts`
- Impact: Any change to the OTel span schema requires two edits; definitions can drift silently
- Fix approach: Export `RawOTelSpan` from `src/lib/spanTransform.ts` and import it in `usePhase2Data.ts`

**Duplicate `TraceSpan` and `LogEntry` type definitions:**
- Issue: `TraceSpan` and `LogEntry` exist in both `src/types.ts` and `src/types/phase2.ts` with different shapes (`duration` vs `durationMs`, `timestamp: number` vs `timestamp: string`)
- Files: `src/types.ts`, `src/types/phase2.ts`
- Impact: Components that import from the wrong type file may silently use incorrect field names; `TraceViewer` uses `phase2.ts` shapes while the types in `src/types.ts` are stale
- Fix approach: Deprecate the overlapping types in `src/types.ts` and consolidate in `src/types/phase2.ts`

## Known Bugs

**TraceViewer hard-coded default open span:**
- Symptoms: TraceViewer always opens `span-002` on mount (`useState<string | null>('span-002')`)
- Files: `src/components/TraceViewer.tsx` (line 36)
- Trigger: Any case whose spans don't include `span-002` (all future cases) silently renders with no drawer open and the default state is wrong
- Workaround: Users can click a span to open it; the bug is cosmetic but shows hello-span-001 bias

**TraceViewer warning hint hard-coded to `db.connection_pool.wait_ms`:**
- Symptoms: The "abnormally high" warning hint at line 153 always references `db.connection_pool.wait_ms` regardless of which span or case is displayed
- Files: `src/components/TraceViewer.tsx` (line 153)
- Trigger: Any future case with a `warning` status span that is not DB-related shows a misleading hint about connection pool configuration
- Workaround: None until the hint is made generic or span-attribute-aware

**`getHintForGuess` in rootCauseEngine is hard-coded to hello-span-001 option IDs:**
- Symptoms: `getHintForGuess` at line 327 uses `switch (guessId)` with option IDs `a`, `c`, `d` referencing DB/cache attributes specific to hello-span-001
- Files: `src/lib/rootCauseEngine.ts` (lines 327-338)
- Trigger: Any other case that has options `a`, `c`, or `d` receives hello-span-001-specific hints, which may be wrong or confusing
- Workaround: The function is only called on incorrect guesses and the hint is secondary to `explainIncorrect`; low severity until more cases are added

**Worker timeout terminates and re-initializes silently on infinite loops:**
- Symptoms: If user code runs for >5s, the worker is terminated and re-initialized; `isRunning` is set to `false` but the timeout error is only exposed if the caller of `runCode` catches the rejection
- Files: `src/hooks/useCodeRunner.ts` (lines 73-80), `src/App.tsx` (line 165-169)
- Trigger: User code that runs an infinite loop or slow computation; in `handleValidate` the `catch` sets `workerError` but validation then proceeds against stale `spans` from a previous run
- Workaround: The previous spans remain in state and validation runs against them; user sees confusing results

**Validation runs against pre-timeout spans after execution error:**
- Symptoms: When `runCode` throws (timeout or Python error), `handleValidate` catches the error, sets `workerError`, and then calls `validateSpans` with `spans` from the previous execution
- Files: `src/App.tsx` (lines 165-198)
- Trigger: Any code execution error
- Workaround: The stale `spans` state produces wrong validation results (pass when should fail, or fail with confusing messages from prior run)

## Security Considerations

**Arbitrary Python execution in Pyodide:**
- Risk: User-submitted Python code runs with full Pyodide capabilities including `js` interop and `postMessage`; a malicious user could flood the main thread with postMessage calls or attempt DOM manipulation via the `js` bridge
- Files: `src/workers/python.worker.ts`, `src/workers/python/setup_telemetry.py`
- Current mitigation: Runs in a Web Worker (isolated thread), 5s timeout limits duration; no network access from Pyodide by default
- Recommendations: Rate-limit postMessage processing in the main thread; consider stripping the `js` module from available imports before user code runs

**localStorage stores user code without size limits:**
- Risk: User code is stored in localStorage on every keystroke (debounced 300ms); a user could store arbitrarily large strings until `QuotaExceededError`
- Files: `src/hooks/useAcademyPersistence.ts` (lines 93-113)
- Current mitigation: `QuotaExceededError` is caught and a `console.warn` is emitted, but the user receives no feedback
- Recommendations: Cap stored code at a reasonable size (e.g., 64KB per case); show a user-visible warning when quota is exceeded

## Performance Bottlenecks

**Pyodide cold start (~5-10s on first load):**
- Problem: `loadPyodide` downloads ~8MB WASM + `opentelemetry-api` + `opentelemetry-sdk` packages via CDN on first use
- Files: `src/workers/python.worker.ts` (lines 11-23)
- Cause: Pyodide loads from `cdn.jsdelivr.net`; no preloading or service worker caching
- Improvement path: Use `cache: true` (already present) which caches to IndexedDB; consider preloading Pyodide in the background immediately on app load rather than waiting for first validate click

**`Math.min(...rawSpans.map(...))` spread on large span arrays:**
- Problem: `transformSpans` and `getTotalDurationMs` use spread operator with `Math.min/max` on the full spans array
- Files: `src/lib/spanTransform.ts` (lines 144, 204-205)
- Cause: Spread into `Math.min/max` will throw `RangeError: Maximum call stack size exceeded` when spans exceed ~100k elements; unlikely in practice but not guarded
- Improvement path: Replace with `reduce` for large-array safety: `rawSpans.reduce((min, s) => Math.min(min, s.start_time), Infinity)`

**`generateLogsFromSpans` does two `Array.find` passes per log event:**
- Problem: For each log event in the output map at lines 185-190, `generateLogsFromSpans` calls `spans.find(s => event.name.startsWith(s.name))` twice — once for `spanId` and once for `service`
- Files: `src/lib/logGenerator.ts` (lines 185-190)
- Cause: No pre-built lookup; `O(n*m)` where n=log events, m=spans
- Improvement path: Build a `Map<string, TraceSpan>` by name before the output map; negligible for current span counts (<50) but will degrade with more complex cases

## Fragile Areas

**`rootCauseEngine.ts` RULES_REGISTRY is a manually maintained hard-coded map:**
- Files: `src/lib/rootCauseEngine.ts` (lines 301-305)
- Why fragile: Every new case requires adding a new entry to `RULES_REGISTRY` manually; adding a `case.yaml` without updating the registry causes `evaluateGuess` to silently return `correct: false` for all guesses
- Safe modification: Always add `[caseId]: rulesArray` to `RULES_REGISTRY` when creating new rules; document this in the case authoring checklist
- Test coverage: No tests; the registry is untested

**`phase2.ts` data is entirely static and case-specific:**
- Files: `src/data/phase2.ts`
- Why fragile: The file exports `helloSpanPhase2` which is used only in the Phase 2 investigation for `hello-span-001`. The `the-collector-003` and `auto-magic-002` cases use live spans transformed by `usePhase2Data`. When Phase 2 of `the-collector-003` is entered, it falls back to the same live-span path — but the case has no Python worker path (it's `yaml-config`), so `spans` is always empty and `hasPhase2Data` is always false
- Safe modification: The `the-collector-003` case requires dedicated static Phase 2 data (like `helloSpanPhase2`) rather than depending on live span execution; entering Phase 2 for that case currently shows "No Telemetry Data"

**`useAcademyPersistence` `initialProgress` prop causes stale closure:**
- Files: `src/hooks/useAcademyPersistence.ts` (lines 46-81, 153-161)
- Why fragile: The `useEffect` for loading from localStorage and the `resetAll` callback both reference `initialProgress` from the first render. If `cases` changes (shouldn't in production, but could during hot reload), the hook holds a stale reference
- Safe modification: `initialProgress` should be treated as a stable initialization value; avoid calling `useAcademyPersistence` inside conditionals or with dynamic case lists

**Desktop layout assumes `CodeEditor` language is always `python`:**
- Files: `src/App.tsx` (line 416)
- Why fragile: The desktop `CodeEditor` at line 416 always passes `language="python"`, but the mobile layout at line 456 correctly reads `(currentCase as any).type`. If a `yaml-config` case is active on desktop, the editor will have Python syntax highlighting instead of YAML
- Safe modification: Both CodeEditor instances should derive language from `currentCase.type`

## Scaling Limits

**Case count is unbounded but `cases` array is loaded eagerly at module evaluation:**
- Current capacity: 3 cases in production, 9 planned per roadmap
- Limit: `import.meta.glob` with `{ eager: true }` loads all case YAML at build time; all cases are bundled into the main chunk. At 9 cases this is negligible, but at 50+ cases the bundle grows proportionally
- Scaling path: Switch `eager: false` and lazy-load individual case assets on demand

**localStorage schema has version 1 with no migration path:**
- Current capacity: `SCHEMA_VERSION = 1` with a hard delete on mismatch
- Limit: Any schema change (new field on `CaseProgress`, renamed key) wipes all user progress silently
- Scaling path: Implement a migration function registry before adding new persistent fields; document what schema changes are breaking vs additive

## Dependencies at Risk

**`pyodide` pinned to CDN at `v0.29.3`:**
- Risk: CDN URL is hard-coded in `python.worker.ts` (`https://cdn.jsdelivr.net/pyodide/v0.29.3/full/`); if jsDelivr CDN has outages or this version is purged, the app is broken for all users
- Impact: Complete loss of Python execution — all Phase 1 cases fail silently (worker init error)
- Migration plan: Self-host the Pyodide assets in `public/pyodide/` or pin to a GitHub release CDN with a fallback

**`@ts-expect-error` on Pyodide `cache` option:**
- Risk: `cache: true` uses a suppressed type error (`@ts-expect-error - cache option exists but types are outdated`) indicating the installed `pyodide` types are behind the runtime version
- Impact: If the `cache` option is removed or renamed in a future Pyodide version, the error is silently swallowed
- Migration plan: File types up to date with the installed package version; remove the suppression when types catch up

## Missing Critical Features

**No test suite:**
- Problem: Zero test files exist under `src/`; the validation engine, span transform, log generator, and root cause engine have no automated tests
- Blocks: Safe refactoring of validation logic; confident addition of new check types; regression detection when adding new cases
- Priority: High — `src/lib/validation.ts` and `src/lib/spanTransform.ts` are pure functions with well-defined inputs/outputs and are the highest-value targets

**No error boundary around Python worker initialization:**
- Problem: If Pyodide fails to load (network offline, CDN failure, WASM not supported), `initError` is set but the UI only shows it in `OutputPanel`; the validation button becomes permanently disabled with "Loading Python..." and there is no retry mechanism
- Files: `src/hooks/useCodeRunner.ts` (lines 43-45), `src/App.tsx` (line 430)
- Blocks: Users on slow connections or with WASM restrictions are stuck; no user-visible retry path
- Priority: Medium

## Test Coverage Gaps

**Validation engine (`src/lib/validation.ts`):**
- What's not tested: `runCheck` dispatch, `checkYamlKeyExists` dot-notation path traversal, `selectMessage` progressive hint escalation, all 8 check types
- Risk: A broken check type (`telemetry_flowing` double-checks `checkSpanExists AND spans.length > 0`, which is redundant but harmless; `yaml_key_exists` in `runCheck` always returns `false`) could ship silently

**Span transform (`src/lib/spanTransform.ts`):**
- What's not tested: `calculateDepth` cycle detection, `deriveStatus` slow threshold boundary, `normalizeAttributes` array flattening, `transformSpans` with empty/malformed inputs

**Root cause engine (`src/lib/rootCauseEngine.ts`):**
- What's not tested: `evaluateGuess` with unknown `caseId`, `RULES_REGISTRY` completeness relative to `cases`, `getHintForGuess` cross-case ID collision

**`useAcademyPersistence` (`src/hooks/useAcademyPersistence.ts`):**
- What's not tested: Schema version mismatch handling, `QuotaExceededError` path, `resetAll` clearing all state correctly, attempt history increment logic

---

*Concerns audit: 2026-03-10*
