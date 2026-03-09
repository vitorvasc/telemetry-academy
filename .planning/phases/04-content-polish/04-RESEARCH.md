# Phase 4: Content & Polish - Research

**Researched:** 2026-03-09
**Domain:** Case authoring, WASM execution, validation extension, React state wiring, UX polish
**Confidence:** HIGH

## Summary

Phase 4 delivers three working, end-to-end learning scenarios. The code infrastructure is already in place — the planner's job is mostly content authoring and wiring, not building new systems. Two cases have YAML and setup.py stubs but lack real execution-ready content (hello-span-001 has correct Phase 1 but stub Phase 2 root cause engine rules; auto-magic-002 has minimal Phase 1 validation, a non-executable setup.py, and placeholder root cause engine rules). The Collector (CASE-03) is entirely absent and requires both YAML authoring and a new `yaml_key_exists` validation type.

The CaseSolvedScreen component is fully built and already imported in App.tsx, with `appPhase === 'solved'` already triggering it. The "Review Investigation" button wiring (`reviewInvestigation` function) works but doesn't open a modal — it simply sets `appPhase` back to `'investigation'`. The CONTEXT.md decision says it should open a modal instead. This requires a new `ReviewModal` component and state wire-up.

`js-yaml` is available as a transitive dependency (via `@modyfi/vite-plugin-yaml@1.1.1`) and can be imported directly without adding to `package.json`. Monaco Editor already supports `language='yaml'` natively — no configuration required. The Python worker lacks a 5s execution timeout on the `run` message (only kills on timeout via `setTimeout` in `useCodeRunner.ts`) — this is acceptable as-is.

**Primary recommendation:** Execute in 3 plans: (04-01) fix hello-span-001 Phase 1 + Phase 2; (04-02) author auto-magic-002 fully + author the-collector-003 + add yaml_key_exists; (04-03) wire ReviewModal + polish (loading states, empty states, mobile, onboarding).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**"The Collector" Case (CASE-03)**
- Concepts taught: OTel Collector configuration — pipeline setup (receivers, processors, exporters), plus head/tail sampling configuration, and resource attributes (service.name, deployment.environment)
- Exercise format: YAML editor — user edits a `collector.yaml` in Monaco (reuses existing code editor component, no new UI needed)
- Validation approach: Parse YAML with js-yaml in JS, check for specific keys/values — e.g., `tail_sampling` in processors, `otlp` in exporters, `service.name` resource attribute set. Clean and deterministic; extend existing ValidationCheckType system with a new `yaml_key_exists` or similar type
- Phase 2 incident: Misconfigured sampling drops critical traces — the collector is sampling too aggressively, dropping error spans. User sees gaps in trace coverage and investigates to find the tail_sampling rule is misconfigured (sampling_percentage too low or wrong rules matching errors)

**Case Solved Screen**
- Trigger: Appears after user selects the correct root cause in Phase 2 (the natural end-of-case moment)
- Layout: Replaces the right panel (Validation/Investigation area). Left panel (code editor + instructions) stays visible — user can still review their code
- "Review Investigation" button: Opens a modal with a trace summary (key spans + correct root cause explanation). Does NOT navigate away from the solved screen
- "Next Case" button: Navigates to the next case (already exists in component)

**auto-magic-002 Phase 2 Data**
- Trace structure: HTTP chain with error span — root span `GET /orders`, child `http.client` span calling external payment API, that child has ERROR status with `http.status_code=500`. Fast (~200ms) but fails. Makes the error obvious in the waterfall
- Logs: HTTP error + retry entries — `"Calling payment API..."`, `"Payment API returned 500"`, `"Retrying (attempt 2/3)"`, `"Max retries exceeded"`. Matches http.client span. Teaches log-trace correlation
- Incident narrative: "Checkout is failing for 30% of users. Support tickets are flooding in. Your auto-instrumented traces are live — time to find out why."

**Polish Scope (04-03)**
Priority order: cases complete → loading states → mobile → onboarding
- Loading/transition states: Pyodide init spinner, code-running state, validation staggered reveal. Audit existing states, fix gaps
- Empty & error states: "Run your code in Phase 1 to generate telemetry data" instructional prompt in Phase 2 before any code runs; error message if Web Worker crashes
- Mobile layout fixes: Drawer nav, horizontal scroll on trace waterfall, tab navigation on small screens (carried forward from Phase 3 "Claude's discretion" items)
- Onboarding / first-run UX: All three tiers — (1) improve HomePage (difficulty labels, case descriptions), (2) welcome modal on first visit explaining instrument → investigate loop, (3) inline tooltips in the editor on first case

### Claude's Discretion
- Exact yaml_key_exists validation type naming and implementation details
- The Collector case starter YAML content
- Modal design for "Review Investigation" summary
- Welcome modal copy and step count
- Tooltip placement and trigger conditions (first-visit vs always)
- Specific span attribute names for auto-magic and collector Phase 2 traces

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LOOP-05 | Case Solved screen displays attempts, time, score, and "What you learned" summary | CaseSolvedScreen.tsx is fully built; App.tsx already triggers it on `appPhase === 'solved'`. The gap is "Review Investigation" should open a modal, not navigate back. Requires new ReviewModal component + state |
| CASE-01 | "Hello, Span" (Manual Instrumentation) implemented with real WASM execution | case.yaml + setup.py exist. Phase 1 validation rules look correct. Phase 2 root cause engine rules (helloSpanRules in rootCauseEngine.ts) are complete. The `setup.py` references `db.save()` and `cache.invalidate()` which don't exist — needs rewrite to be self-contained + runnable in Pyodide |
| CASE-02 | "Auto-magic" (Auto-instrumentation) fully implemented with Phase 2 data | case.yaml has minimal Phase 1 validation. setup.py references FastAPI/requests which can't run in Pyodide. Phase 2 narrative is decided but phase2.ts has no `autoMagicPhase2` entry. rootCauseEngine.ts has placeholder autoMagicRules. All of this needs to be rebuilt for real WASM execution |
| CASE-03 | "The Collector" configuration case implemented (via YAML editor or terminal sim) | No files exist yet. Requires: case directory + YAML + yaml_key_exists validation type + Phase 2 data entry + root cause engine rules |
</phase_requirements>

## Critical Pre-Planning Discoveries

### CASE-01 (hello-span-001): What's Real vs What Needs Fixing

**What works:**
- `case.yaml` Phase 1 validations are well-written and complete (3 rules: span_exists, attribute_exists, telemetry_flowing)
- Phase 2 root cause options in `case.yaml` are well-written with span-attribute references
- `helloSpanRules` in `rootCauseEngine.ts` are complete and work against real span data
- `helloSpanPhase2` in `phase2.ts` is complete with 3 spans + 6 logs + 4 root cause options

**What's broken (CASE-01 blocker):**
- `setup.py` calls `db.save(order_id)` and `cache.invalidate(f"order:{order_id}")` — these are undefined names in Pyodide. When user runs this, it crashes immediately before they can add their instrumentation.
- The `setup.py` needs to include mock `db` and `cache` objects so the code runs without errors even before the user adds spans.
- The Phase 1 validations test for `attribute_exists` on the `order_id` attribute but don't specify `attributeKey: 'order_id'` in the YAML rule — the YAML rule says only `description: "The order_id must be added as a span attribute"`. The `attributeKey` field is missing from that rule.

**Verified:** The `usePhase2Data` hook does NOT use `helloSpanPhase2` — it generates Phase 2 data from the user's live spans + pulls `rootCauseOptions` from the case YAML. So `phase2.ts` helloSpanPhase2 is essentially unused by the main flow. The `evaluateGuess` in rootCauseEngine.ts IS used, and it evaluates against the user's actual spans.

### CASE-02 (auto-magic-002): What Needs to Be Built

**Problems:**
- `setup.py` is not runnable in Pyodide — imports `fastapi` and `requests` which Pyodide doesn't have (or can't meaningfully install)
- The case concept is "auto-instrumentation" but auto-instrumentation doesn't work in Pyodide (no `opentelemetry-instrument` command)
- Phase 1 has only 1 validation rule (`span_exists`) — too thin
- `autoMagicRules` in `rootCauseEngine.ts` only handles options 'a' and 'b', missing 'c' and 'd'
- Phase 2 data in `phase2.ts` has no auto-magic entry — the hook generates spans from user code, so Phase 2 investigation data comes entirely from what user instruments

**Resolution path (MEDIUM confidence — requires design decision):**
Auto-magic needs to be reframed for Pyodide. The concept can still teach HTTP tracing and auto-instrumentation ideas, but the exercise must be executable in WASM. Options:
1. Reframe as "use the opentelemetry-instrumentation-urllib library manually" — micropip can install it, student calls `URLLibInstrumentor().instrument()` then makes a urllib request. This actually demonstrates auto-instrumentation of an existing library without code changes.
2. Keep the learning concept (HTTP spans are auto-generated from library calls) but make it work in Pyodide's constraints.

The CONTEXT.md locked the Phase 2 narrative/data structure but left Phase 1 execution approach open. The planner must choose a Pyodide-compatible Phase 1 approach.

### CASE-03 (the-collector-003): New Build

**Nothing exists yet.** Required:
1. `src/cases/the-collector-003/case.yaml` — YAML editor case, no Python execution
2. `src/cases/the-collector-003/setup.py` — this file would contain the initial YAML content (treated as a text stub, not Python)
3. New `yaml_key_exists` validation type in `src/lib/validation.ts` and `src/types.ts`
4. Validation runs in main thread against YAML string (no Pyodide needed)
5. Phase 2 data entry in `phase2.ts` + root cause rules in `rootCauseEngine.ts`

**Key architectural question for CASE-03:** The existing app flow always runs code through the Python worker. The Collector uses a YAML editor and validates YAML directly. This requires:
- A conditional in App.tsx: if `currentCase.type === 'yaml-config'` (or similar), skip the worker and validate YAML string directly
- OR: keep the YAML validation entirely separate from the existing `handleValidate` flow
- The `CodeEditor` component already accepts `language` prop — passing `language='yaml'` will work immediately

### CaseSolvedScreen: Almost Fully Wired

**What's already done:**
- `CaseSolvedScreen` component is fully built (stars, stats, "What you learned", buttons)
- App.tsx already imports it and renders it when `appPhase === 'solved'`
- `handleCaseSolved` already sets `appPhase` to 'solved', updates progress, unlocks next case
- `goToNext` and `reviewInvestigation` are already passed as `onNext` and `onReview`

**The gap:**
- `reviewInvestigation` currently calls `setAppPhase('investigation')` — this navigates away from the solved screen rather than opening a modal
- CONTEXT.md says: "Review Investigation" opens a modal. This needs a new `ReviewModal` component and `showReviewModal` state in App.tsx
- The modal should show: key spans from the trace + correct root cause explanation

**What the modal needs to display:**
From `phase2Data` (available in App.tsx scope): `data.spans` (key ones), the correct option explanation from `data.rootCauseOptions.find(o => o.correct)`

### js-yaml Availability

**Confirmed available** as a transitive dependency:
- `@modyfi/vite-plugin-yaml@1.1.1` depends on `js-yaml@4.1.0`
- Can import with: `import yaml from 'js-yaml'`
- Does NOT need to be added to `package.json` dependencies, but for clarity and to avoid implicit dependency issues, it SHOULD be added as an explicit dep
- Version constraint: `js-yaml@4.x` (v4 is ESM-compatible, uses `yaml.load()` not `yaml.safeLoad()`)

**Confidence:** HIGH — verified via `npm list js-yaml`

### Monaco Editor YAML Support

**Already works.** Monaco `@monaco-editor/react@4.7.0` bundles all Monaco languages including YAML. Passing `language="yaml"` to `<Editor>` gives full YAML syntax highlighting and validation immediately.

**One issue:** `CodeEditor.tsx` has a hardcoded filename: `payment_service.py`. For The Collector, the filename should be `collector.yaml`. The component needs a `filename` prop or the label needs to be dynamic.

**Confidence:** HIGH — Monaco bundles all language support by default.

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| @monaco-editor/react | 4.7.0 | Code/YAML editor | Already used |
| pyodide | 0.29.3 | Python WASM execution | Already used |
| lucide-react | 0.575.0 | Icons | Already used |
| react | 19.2.0 | UI framework | Already used |

### To Add
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| js-yaml | 4.1.0 | Parse YAML strings for validation | Transitive dep already; add explicit |

**Installation:**
```bash
npm install js-yaml
npm install --save-dev @types/js-yaml
```

## Architecture Patterns

### Existing Case Pattern
```
src/cases/<id>/
├── case.yaml     # metadata, phase1 config, phase2 root cause options
└── setup.py      # initial code shown to student (or YAML for collector case)
```

Auto-discovered by `caseLoader.ts` via `import.meta.glob`. No registration needed.

### Phase 2 Data Pattern

`usePhase2Data` hook generates Phase 2 data from user's live spans:
- `spans` → transformed by `spanTransform.ts`
- `logs` → generated by `logGenerator.ts` from spans
- `rootCauseOptions` → pulled from `case.yaml`'s `phase2.rootCauseOptions`
- Evaluation → `evaluateGuess` in `rootCauseEngine.ts` runs rules against user's actual spans

**Important:** `phase2.ts` `helloSpanPhase2` export is NOT consumed by the main investigation flow. It was likely a prototype. The real flow uses the hook + live spans.

### Validation Engine Extension Pattern (for yaml_key_exists)

Existing pattern in `src/lib/validation.ts`:
```typescript
// 1. Add to ValidationCheckType union
export type ValidationCheckType =
  | 'span_exists'
  // ... existing types ...
  | 'yaml_key_exists';   // NEW

// 2. Add to SpanValidationRule (or new YamlValidationRule interface)
// The rule needs: yamlPath (dot-notation path), expectedValue (optional)

// 3. Add case in runCheck() switch
case 'yaml_key_exists':
  return checkYamlKeyExists(context.yamlContent, rule.yamlPath, rule.expectedValue);
```

**Design decision for planner:** The existing `ValidationContext` only has `spans` and `attemptHistory`. For YAML validation, the context needs a `yamlContent?: string` field. The `validateSpans` function can be extended or a new `validateYaml` function created. Given The Collector has no spans, a separate `validateYaml` function is cleaner.

### CaseSolvedScreen + ReviewModal Wiring

**Current wiring (App.tsx lines 157-170, 185-191):**
```typescript
// handleCaseSolved already works correctly
const handleCaseSolved = () => {
  setAppPhase('solved');
  // ...
};

// reviewInvestigation needs to change from navigate-back to open-modal
const reviewInvestigation = () => {
  setAppPhase('investigation'); // WRONG — should open modal instead
};
```

**New pattern:**
```typescript
const [showReviewModal, setShowReviewModal] = useState(false);
const reviewInvestigation = () => setShowReviewModal(true);
// Pass showReviewModal + setShowReviewModal down to CaseSolvedScreen
// Or render ReviewModal at App level with phase2Data access
```

The modal needs `phase2Data` to show spans. Since `phase2Data` is in App.tsx scope, render `ReviewModal` at App level.

### The Collector Case: YAML-Mode Detection

The Collector requires a "YAML mode" where:
1. No Python worker invocation
2. Validation runs against YAML string, not spans
3. Monaco editor shows `.yaml` filename

**Pattern options:**

Option A — Case type field in YAML:
```yaml
# case.yaml
type: yaml-config   # new field
```
Then in App.tsx: `if (currentCase.type === 'yaml-config')` skip worker, run YAML validation.

Option B — Detect from validation rule types:
If all validation rules are `yaml_key_exists`, use YAML mode automatically.

Option A is more explicit and clearer. The `Case` type in `types.ts` gets an optional `type?: 'python' | 'yaml-config'` field.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML parsing | Custom parser | js-yaml | Handles edge cases, anchors, multi-doc |
| YAML syntax highlighting | Custom editor mode | Monaco language='yaml' | Already bundled, zero config |
| Modal backdrop/close | Custom implementation | Tailwind + React state | Simple enough inline |
| Span data generation | New Phase 2 data format | Extend existing `Phase2Data` type | Already typed, understood by all components |

## Common Pitfalls

### Pitfall 1: hello-span-001 setup.py References Undefined Names
**What goes wrong:** `db.save(order_id)` and `cache.invalidate(...)` crash immediately in Pyodide.
**Why it happens:** The setup.py was authored as pseudo-code illustrating the scenario, not as runnable code.
**How to avoid:** Add minimal mock objects at the top of setup.py: `class MockDB: def save(self, id): pass` etc.
**Warning signs:** User gets a `NameError: name 'db' is not defined` on first run.

### Pitfall 2: auto-magic-002 Concept vs Pyodide Reality
**What goes wrong:** `fastapi` and `requests` can't be auto-instrumented in Pyodide environment.
**Why it happens:** The case was designed for real CLI execution, not WASM.
**How to avoid:** Reframe Phase 1 to use `urllib.request` (stdlib, available in Pyodide) + `opentelemetry-instrumentation-urllib` (installable via micropip). User calls `URLLibInstrumentor().instrument()` — this demonstrates the core concept (zero-code instrumentation of an existing library) in a Pyodide-compatible way.
**Warning signs:** `ModuleNotFoundError: No module named 'fastapi'` on run.

### Pitfall 3: YAML Validation Needs a Different Context
**What goes wrong:** Passing YAML content through the existing `validateSpans(rules, { spans, attemptHistory })` API fails because `spans` is empty for The Collector.
**Why it happens:** The validation engine was designed for span-based checks only.
**How to avoid:** Create `validateYaml(rules, { yamlContent, attemptHistory })` as a sibling function. Keep span and YAML validation separate. The Collector's `handleValidate` calls `validateYaml` instead of the Python worker + `validateSpans`.

### Pitfall 4: CodeEditor Filename is Hardcoded
**What goes wrong:** The Collector shows `payment_service.py` as the filename instead of `collector.yaml`.
**Why it happens:** `CodeEditor.tsx` has `<span>payment_service.py</span>` hardcoded.
**How to avoid:** Add a `filename?: string` prop to `CodeEditor`, defaulting to `'payment_service.py'`. The Collector passes `filename="collector.yaml"`.

### Pitfall 5: ReviewModal Needs phase2Data Access
**What goes wrong:** If ReviewModal is placed inside CaseSolvedScreen, it can't access `phase2Data`.
**Why it happens:** `phase2Data` lives in App.tsx scope, not inside CaseSolvedScreen.
**How to avoid:** Render ReviewModal at App.tsx level, conditionally shown by `showReviewModal` state. Pass `phase2Data` and the correct root cause explanation to it.

### Pitfall 6: attributeKey Missing from hello-span-001 attribute_exists Rule
**What goes wrong:** The `attribute_exists` validation for `order_id` in `case.yaml` doesn't specify `attributeKey: 'order_id'`. The `checkAttributeExists` function requires `attributeKey` to be non-null to return true.
**Why it happens:** The YAML rule omits the required `attributeKey` field.
**How to avoid:** Add `attributeKey: 'order_id'` to that validation rule in `case.yaml`.

### Pitfall 7: WelcomeModal First-Visit State
**What goes wrong:** Welcome modal shows on every visit if persisted state isn't checked.
**Why it happens:** No "seen welcome" flag in persisted state.
**How to avoid:** Add `hasSeenWelcome: boolean` to `PersistedState` in `types/progress.ts`. Check this in App.tsx to conditionally show the modal.

## Code Examples

### js-yaml YAML Parsing (for yaml_key_exists validation)
```typescript
// Source: js-yaml v4 official API (verified)
import yaml from 'js-yaml';

function checkYamlKeyExists(
  yamlContent: string,
  path: string,  // dot-notation: 'processors.tail_sampling'
  expectedValue?: string
): boolean {
  try {
    const doc = yaml.load(yamlContent) as Record<string, any>;
    if (!doc) return false;

    const keys = path.split('.');
    let current: any = doc;
    for (const key of keys) {
      if (current === null || typeof current !== 'object' || !(key in current)) {
        return false;
      }
      current = current[key];
    }

    if (expectedValue !== undefined) {
      return String(current) === String(expectedValue);
    }
    return true;
  } catch {
    return false; // Invalid YAML
  }
}
```

### CaseSolvedScreen ReviewModal Pattern
```typescript
// App.tsx additions
const [showReviewModal, setShowReviewModal] = useState(false);

// In reviewInvestigation:
const reviewInvestigation = () => setShowReviewModal(true);

// In render, after CaseSolvedScreen:
{showReviewModal && phase2Data && (
  <ReviewModal
    spans={phase2Data.spans}
    correctOption={phase2Data.rootCauseOptions.find(o => o.correct) ?? null}
    onClose={() => setShowReviewModal(false)}
  />
)}
```

### auto-magic-002 Pyodide-Compatible Phase 1 Pattern
```python
# setup.py concept — urllib instrumentation (Pyodide-compatible)
from opentelemetry import trace
from opentelemetry.instrumentation.urllib import URLLibInstrumentor

# TODO: Instrument urllib so HTTP spans are auto-generated
# Hint: URLLibInstrumentor().instrument()

import urllib.request

def checkout(user_id):
    # This HTTP call should auto-generate spans when instrumented
    with urllib.request.urlopen(f"https://payments.internal/charge/{user_id}") as resp:
        return resp.read()
```

### YAML Mode Case Type Detection
```typescript
// src/types.ts addition
export interface Case {
  id: string;
  name: string;
  type?: 'python' | 'yaml-config';  // defaults to 'python'
  // ...rest unchanged
}

// App.tsx: YAML validation path
const handleValidate = async () => {
  if (currentCase.type === 'yaml-config') {
    // Validate YAML directly, no worker
    const results = validateYaml(
      currentCase.phase1.validations as YamlValidationRule[],
      { yamlContent: code, attemptHistory: currentAttemptHistory }
    );
    // ...same result handling
    return;
  }
  // ...existing Python worker path
};
```

### Welcome Modal First-Visit Pattern
```typescript
// PersistedState gets new field
export interface PersistedState {
  version: number;
  progress: CaseProgress[];
  caseCode: Record<string, string>;
  attemptHistory: Record<string, Record<string, number>>;
  hasSeenWelcome: boolean;  // NEW
  timestamp: number;
}

// App.tsx
const [showWelcome, setShowWelcome] = useState(false);

useEffect(() => {
  if (isLoaded && !hasSeenWelcome) {
    setShowWelcome(true);
  }
}, [isLoaded, hasSeenWelcome]);
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| Hardcoded phase2 data (helloSpanPhase2 in phase2.ts) | Dynamic from live user spans via usePhase2Data hook | phase2.ts exports are essentially unused by the main flow |
| Static root cause explanations | Rules-based engine (rootCauseEngine.ts) with attribute-specific feedback | Feedback references actual user span values |

**Note on phase2.ts:** The file currently exports `helloSpanPhase2` which is never consumed by the investigation flow. The hook generates Phase 2 data dynamically from user spans. This file can be repurposed to hold STATIC Phase 2 data for cases where Phase 1 produces predetermined traces (or removed). For auto-magic and the-collector, the data structure that actually matters is: `rootCauseOptions` in `case.yaml` (for option labels/explanations) and rules in `rootCauseEngine.ts` (for evaluation logic).

## Open Questions

1. **auto-magic Phase 1 approach**
   - What we know: `opentelemetry-instrumentation-urllib` is installable via micropip; `urllib.request` is available in Pyodide stdlib
   - What's unclear: Whether `URLLibInstrumentor().instrument()` works correctly in Pyodide's sandboxed environment (no actual HTTP calls go out)
   - Recommendation: The validation only checks for span existence — if URLLibInstrumentor generates spans when `urlopen` is called (even if the request fails), it will pass. The planner should include a "test Pyodide compatibility" sub-task in 04-02.

2. **The Collector Phase 1 — no Python execution, no worker**
   - What we know: App.tsx currently always initializes the Python worker on mount regardless of case type
   - What's unclear: Is there any issue initializing the worker for The Collector even though it's not used?
   - Recommendation: The worker initialization is harmless (it runs in background). The simpler fix is just to add the YAML validation path in `handleValidate` based on `currentCase.type`. No need to prevent worker init.

3. **ReviewModal trace summary content**
   - What we know: `phase2Data.spans` contains user's actual spans (from their Phase 1 code), not the curated narrative spans
   - What's unclear: Should the modal show the user's actual spans or a curated summary?
   - Recommendation: Show the user's actual spans (it reinforces what they instrumented) + the correct root cause explanation text. Simple, no new data needed.

## Validation Architecture

> config.json does not have `workflow.nyquist_validation` key — treating as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test config files, no test directories |
| Config file | None |
| Quick run command | `npm run build` (TypeScript type check as proxy) |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LOOP-05 | CaseSolvedScreen renders with stats + triggers on correct guess | manual-only | `npm run build` (type safety) | ❌ Wave 0 — no test infra |
| CASE-01 | hello-span-001 Phase 1 validates correctly in Pyodide | manual-only | `npm run build` | ❌ |
| CASE-02 | auto-magic-002 Phase 1 validates correctly in Pyodide | manual-only | `npm run build` | ❌ |
| CASE-03 | the-collector-003 YAML validation checks work | manual-only | `npm run build` | ❌ |

**Justification for manual-only:** This project has no test infrastructure at all (no vitest, jest, or any test runner). All cases have browser-runtime dependencies (Pyodide WASM, Monaco editor) that can't be tested in Node.js without significant setup. The effective test is `npm run build` for type safety + manual browser verification.

### Wave 0 Gaps
- No test infrastructure exists. Given the Pyodide/Monaco/WASM dependencies, adding unit tests would require significant mocking infrastructure. This is out of scope for Phase 4.
- Effective gate: `npm run build` passes (TypeScript + Vite compilation) before any plan is marked complete.

## Sources

### Primary (HIGH confidence)
- Direct codebase read — `src/lib/validation.ts`, `src/types.ts`, `src/App.tsx`, `src/components/CaseSolvedScreen.tsx`, `src/components/CodeEditor.tsx`, `src/workers/python.worker.ts`, `src/hooks/useCodeRunner.ts`, `src/hooks/usePhase2Data.ts`, `src/lib/rootCauseEngine.ts`, `src/data/phase2.ts`
- `package.json` — verified dependencies
- `npm list js-yaml` — confirmed js-yaml@4.1.0 available as transitive dep

### Secondary (MEDIUM confidence)
- Monaco Editor docs: `language='yaml'` supported natively in all Monaco bundles
- js-yaml v4 API: `yaml.load()` returns parsed object; `yaml.safeLoad()` was removed in v4

### Tertiary (LOW confidence)
- `opentelemetry-instrumentation-urllib` Pyodide compatibility: assumed based on it being pure Python with no C extensions, but not verified by running in Pyodide

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json and npm list
- Architecture patterns: HIGH — verified from direct codebase reads
- CASE-01 issues: HIGH — verified by reading setup.py and validation.ts checkAttributeExists source
- CASE-02 Pyodide approach: MEDIUM — design direction is clear but Pyodide compat not verified
- CASE-03 architecture: HIGH — clear extension of existing patterns
- CaseSolvedScreen wiring: HIGH — App.tsx and CaseSolvedScreen.tsx both fully read
- Pitfalls: HIGH — identified from actual source code analysis, not guesses

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable codebase, 30-day window)
