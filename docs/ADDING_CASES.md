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

4. Run `npm run dev` — the case appears automatically!

---

## YAML Schema

```yaml
# Required
id: my-new-case-003          # Must match folder name
name: "My New Case"
order: 3                      # Controls display order (lower = first)
difficulty: rookie             # rookie | junior | senior | staff
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
    - traces                   # traces | logs | metrics
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

---

## Tips

- The `order` field controls the display order in the sidebar and home page
- `difficulty` affects the badge color: `rookie`=green, `junior`=sky, `senior`=violet, `staff`=amber
- `concepts` are shown as tags — use underscores, they're auto-formatted (`my_concept` → `my concept`)
- Progressive hints: `hintMessage` shows after 1-2 failed attempts, `guidedMessage` after 3+
- For complex root cause logic (reading real span attributes dynamically), see `src/lib/rootCauseEngine.ts`

---

## Example: Minimal Case

```yaml
id: trace-context-003
name: "Follow the Thread"
order: 3
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
