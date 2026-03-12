# Adding New Cases

Cases are defined as YAML + Python files and auto-discovered at build time.
No TypeScript changes needed for most cases.

## Quick Start

1. Create a folder under `src/cases/`:
   ```
   src/cases/my-new-case-003/
   ├── case.yaml   ← content, validations, root cause options
   └── setup.py    ← initial Python code shown to the student
   ```

2. Fill in `case.yaml` (see schema below)

3. Write the initial Python code in `setup.py`

4. Add Phase 2 data to `src/data/phase2.ts` (see [Phase 2 Data](#phase-2-data))

5. Run `npm run dev` — the case appears automatically

---

## YAML Schema

```yaml
# Required fields
id: my-new-case-003          # Must match folder name
name: "My New Case"
order: 3                      # Controls display order (lower = first)
difficulty: rookie             # rookie | junior | senior | staff | expert
concepts:
  - some_concept              # Shown as tags in the UI
  - another_concept

phase1:
  description: |              # Markdown supported
    **The Situation:**
    Describe what's happening...

    **Your Mission:**
    What the student needs to do...

  hints:
    - "First hint text"
    - "Second hint text"

  # setup.py is loaded automatically — no initialCode field needed

  validations:
    - type: span_exists         # See validation types below
      description: "A span must exist"
      successMessage: "✓ Span found!"
      errorMessage: "✗ No span found."
      hintMessage: "💡 Try using start_as_current_span()"
      guidedMessage: "📖 Full guidance for 3+ failed attempts"

phase2:                        # Optional — omit to skip investigation phase
  description: |
    **Investigation Phase**
    Describe the incident to investigate...

  investigationTools:
    - traces                   # traces | logs
    - logs

  rootCauseOptions:
    - id: a
      label: "First option text"
      correct: false
      explanation: "Why this is wrong..."

    - id: b
      label: "Correct answer text"
      correct: true
      explanation: "✓ Why this is correct..."

    - id: c
      label: "Another wrong option"
      correct: false
      explanation: "Why this is wrong..."
```

---

## Validation Types

| Type | Description | Extra params |
|------|-------------|--------------|
| `span_exists` | At least one span was emitted | — |
| `attribute_exists` | A span has a specific attribute | `attributeKey: "order_id"` |
| `attribute_value` | An attribute has a specific value | `attributeKey`, `attributeValue` |
| `span_count` | At least N spans were emitted | `minCount: 3` |
| `status_ok` | A span has status OK | `spanName: "my-span"` (optional) |
| `status_error` | A span has error status | `spanName: "my-span"` (optional) |
| `telemetry_flowing` | OTel SDK is properly configured | — |
| `error_handling` | Error spans have proper attributes | — |
| `yaml_key_exists` | A key path exists in YAML config | `yamlPath: "receivers.otlp"` |

> `yaml_key_exists` is used for Collector-config cases where students edit YAML instead of Python.

---

## Phase 2 Data

Phase 2 investigation data lives in `src/data/phase2.ts`. Each case needs an entry with:

- **`traceId`** — unique trace ID string for this case's synthetic data
- **`totalDurationMs`** — total end-to-end duration in milliseconds
- **`narrative`** — markdown string describing the incident shown to the student
- **`spans`** — synthetic trace data (`TraceSpan` objects with timing, attributes, status)
- **`logs`** — correlated log entries (generated from spans or hand-crafted)
- **`rootCauseOptions`** — matching the `id` values from `case.yaml`

```typescript
// src/data/phase2.ts
export const myNewCasePhase2: Phase2Data = {
  traceId: generateTraceId(),   // use the helper already in the file
  totalDurationMs: 5200,
  narrative: `Describe the incident here. What is the student investigating?`,
  spans: [
    {
      id: 'span-001',           // unique within this case
      name: 'process_order',
      service: 'order-service',
      durationMs: 5200,         // milliseconds
      offsetMs: 0,              // start offset from trace start
      status: 'error',          // 'ok' | 'error' | 'warning'
      depth: 0,                 // nesting depth (0 = root span)
      attributes: {
        'order.id': '12345',
        'db.system': 'postgresql',
      },
    },
  ],
  logs: [...],
  rootCauseOptions: [...],  // same ids as case.yaml
};

// Register at bottom of file:
phase2Registry['my-new-case-003'] = myNewCasePhase2;
```

### Root Cause Rules

Root cause evaluation logic lives in `src/lib/rootCauseEngine.ts` — **not** in `phase2.ts`. The engine uses a `RULES_REGISTRY` keyed by case ID. To add rules for your case:

1. Define a `RootCauseRule[]` array in `rootCauseEngine.ts`
2. Add it to `RULES_REGISTRY` under your case ID

Each rule implements `evaluate(data)` → boolean, `explainCorrect(data)` → string, and `explainIncorrect(data, guessId)` → string. Rules should reference real span attribute values from your Phase 2 data so feedback is data-driven:

```typescript
// In src/lib/rootCauseEngine.ts
const myNewCaseRules: RootCauseRule[] = [
  {
    id: 'b',                  // matches rootCauseOption id
    label: 'DB connection pool is too small',
    evaluate: (data) =>
      data.spans.some(s => parseInt(s.attributes['db.connection_pool.wait_ms']) > 4000),
    explainCorrect: (data) => {
      const ms = data.spans
        .find(s => s.attributes['db.connection_pool.wait_ms'])
        ?.attributes['db.connection_pool.wait_ms'];
      return `Connection pool wait time was ${ms}ms — well above the 200ms threshold.`;
    },
    explainIncorrect: () => 'The pool wait time is within normal range.',
  },
];

// Add to RULES_REGISTRY:
const RULES_REGISTRY: Record<string, RootCauseRule[]> = {
  // ... existing cases ...
  'my-new-case-003': myNewCaseRules,
};
```

For simple cases, `evaluate: () => true` with static string explanations is fine. The `rootCauseOptions` in `case.yaml` (and `phase2.ts`) carry the static fallback `explanation` field shown in the UI; the engine's `explainCorrect`/`explainIncorrect` methods generate richer, data-driven feedback.

---

## Tips

- The `order` field controls display order in the sidebar and home page
- `difficulty` badge colors: `rookie`=green, `junior`=sky, `senior`=violet, `staff`=amber, `expert`=red
- `concepts` are shown as tags — use underscores, they're auto-formatted (`my_concept` → `my concept`)
- Progressive hints: `hintMessage` shows after 1–2 failed attempts, `guidedMessage` after 3+
- Each root cause distractor should reference real data in its explanation — generic "this is wrong" feedback is unhelpful
- Keep `setup.py` partial — show the structure, leave the key OTel calls for the student to fill in

---

## Example: Minimal Case (Phase 1 Only)

```yaml
id: trace-context-004
name: "Follow the Thread"
order: 4
difficulty: junior
concepts:
  - trace_context
  - context_propagation

phase1:
  description: |
    **The Situation:**
    Two services are communicating, but traces aren't connected.

    **Your Mission:**
    Propagate the trace context between services.

  hints:
    - "Use inject() and extract() from opentelemetry.propagate"

  validations:
    - type: span_exists
      description: "At least one span must be created"
      successMessage: "✓ Spans detected!"
      errorMessage: "✗ No spans found. Make sure your code runs."
      hintMessage: "💡 Don't forget to call the instrumented function"
      guidedMessage: "📖 Create a tracer with trace.get_tracer(__name__) first"
```

---

## Checklist Before Opening a PR

- [ ] `src/cases/<id>/case.yaml` — valid YAML, all required fields present
- [ ] `src/cases/<id>/setup.py` — partial code that runs without errors
- [ ] `src/data/phase2.ts` — entry added with `traceId`, `totalDurationMs`, `narrative`, `spans`, `logs`, `rootCauseOptions`, and registered in `phase2Registry`
- [ ] `src/lib/rootCauseEngine.ts` — `RootCauseRule[]` added and registered in `RULES_REGISTRY`
- [ ] All `type:` values in validations match a known `ValidationCheckType`
- [ ] All root cause rule `id` values match `rootCauseOptions` in `case.yaml`
- [ ] Evaluation rules reference real span attribute names from your Phase 2 data
- [ ] `npm run dev` — case appears in the sidebar, Phase 1 passes, Phase 2 solves correctly
- [ ] `npm run build` — no TypeScript errors
