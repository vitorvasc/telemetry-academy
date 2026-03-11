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
| `yaml_key_exists` | A key path exists in YAML config | `keyPath: "receivers.otlp"` |

> `yaml_key_exists` is used for Collector-config cases where students edit YAML instead of Python.

---

## Phase 2 Data

Phase 2 investigation data lives in `src/data/phase2.ts`. Each case needs an entry with:

- **`spans`** — synthetic trace data (`TraceSpan` objects with timing, attributes, status)
- **`logs`** — correlated log entries (generated from spans or hand-crafted)
- **`rootCauseOptions`** — matching the `id` values from `case.yaml`
- **`evaluationRules`** — logic for the root cause engine

```typescript
// src/data/phase2.ts
export const phase2Data: Record<string, Phase2Data> = {
  'my-new-case-003': {
    spans: [
      {
        traceId: '4f3a...',
        spanId: 'a1b2...',
        parentSpanId: null,
        name: 'process_order',
        startTime: 0,
        duration: 5200,   // milliseconds
        status: 'error',
        attributes: {
          'order.id': '12345',
          'db.system': 'postgresql',
        },
      },
    ],
    logs: [...],
    rootCauseOptions: [...],  // same ids as case.yaml
    evaluationRules: [...],
  },
};
```

### Root Cause Rules

The `evaluationRules` array is evaluated by `src/lib/rootCauseEngine.ts`. Each rule should reference real span attribute values from your Phase 2 data so feedback is data-driven:

```typescript
evaluationRules: [
  {
    id: 'b',                  // matches rootCauseOption id
    evaluate: (data) =>
      data.spans.some(s => s.attributes['db.connection_pool.wait_ms'] > 4000),
    explainCorrect: (data) => {
      const ms = data.spans
        .find(s => s.attributes['db.connection_pool.wait_ms'])
        ?.attributes['db.connection_pool.wait_ms'];
      return `Connection pool wait time was ${ms}ms — well above the 200ms threshold.`;
    },
    explainIncorrect: () => 'The pool wait time is within normal range.',
  },
],
```

For simple cases a static `evaluate: () => true` with plain string explanations is fine.

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
- [ ] `src/data/phase2.ts` — entry added with spans, logs, options, and rules
- [ ] All `type:` values in validations match a known `ValidationCheckType`
- [ ] All root cause rule `id` values match `rootCauseOptions` in `case.yaml`
- [ ] Evaluation rules reference real span attribute names from your Phase 2 data
- [ ] `npm run dev` — case appears in the sidebar, Phase 1 passes, Phase 2 solves correctly
- [ ] `npm run build` — no TypeScript errors
