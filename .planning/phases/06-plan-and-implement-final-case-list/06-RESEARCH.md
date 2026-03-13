# Phase 6: Plan and Implement Final Case List - Research

**Researched:** 2026-03-13
**Domain:** OpenTelemetry case content authoring — 9 cases covering the full OTel curriculum
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **9-case comprehensive library** — Full OTel zero-to-hero journey. Every major OTel concept gets its own case.
- **All 3 existing cases rewritten from scratch** — Current implementations were built as mocks; treat them as starting points, not sacred. Rewrite for concept clarity and learning path cohesion.
- **Final case list** (to be refined by planner):
  1. Hello, Span — manual instrumentation, spans, attributes (rewrite)
  2. Auto-magic — auto-instrumentation, zero-code agents (rewrite)
  3. The Collector — OTel Collector pipeline config (rewrite)
  4. Broken Context — context propagation between services
  5. The Baggage — baggage attributes and correlation
  6. Metrics Meet Traces — multi-signal correlation (metrics + traces)
  7. Log Detective — structured logging with trace_id correlation
  8. Sampling Sleuth — head vs tail sampling strategies
  9. The Perfect Storm — capstone: cascading failure, full-system instrumentation and investigation
- **Concept-first, inline teaching** — Each case's Phase 1 instructions explain the OTel concept: what it is, why it matters in production, then the exercise. No prior OTel knowledge assumed for case 1.
- **Progressive difficulty** — Cases build on each other; concepts from earlier cases assumed known in later ones.
- **No external links required** — Concept explanation is self-contained in the instructions panel.
- **Quality bar** — Each case must be a complete learning unit: concept explanation + hands-on exercise + realistic Phase 2 incident + validated root cause analysis. Phase 2 data must be realistic and tied to Phase 1 concept. Root cause options must reference real span attributes (not generic text).

### Claude's Discretion

- Final case ordering and whether any cases are reordered from the concept.md list
- Implementation batch sequencing (which cases to author first, wave breakdown)
- Case 9 (The Perfect Storm) scope — may need a larger implementation effort than other cases
- Specific incident narratives for cases 4-9
- Exact Phase 2 trace/span attribute names and values for new cases
- Whether any cases beyond 9 are added (researcher may identify gaps)

### Deferred Ideas (OUT OF SCOPE)

- Cases beyond 9 (Go/Java language variants, additional advanced cases) — future milestone
- Multi-language support (EXP-LANG from v2 requirements) — not this phase
- Metrics Viewer tab (EXP-03) — not this phase
</user_constraints>

---

## Summary

Phase 6 is pure content authoring — no app infrastructure changes. The deliverable is 9 complete, polished OTel learning cases. Three existing cases (001-hello-span, 002-auto-magic, 003-the-collector) need rewrites for concept clarity, and 6 new cases need to be authored from scratch covering context propagation, baggage, metrics+traces, structured logging, sampling, and a capstone.

The core authoring workflow is already well-established and codified in `.claude/skills/new-case/SKILL.md` and the `case-content-author` agent. Each case requires exactly 4 artifacts: `src/cases/NNN-slug/case.yaml`, `src/cases/NNN-slug/setup.py`, an entry in `src/data/phase2.ts`, and a `RootCauseRule[]` registered in `src/lib/rootCauseEngine.ts`. Auto-discovery via `caseLoader.ts` means no wiring is needed.

The critical constraint is the Pyodide WASM sandbox: only `opentelemetry-api` and `opentelemetry-sdk` are pre-installed. Additional packages (like `opentelemetry-instrumentation-urllib`) must be installed via `micropip` at the top of `setup.py`. All OTel Python APIs used in exercises must be pure-Python (no C extensions). Context propagation, baggage, metrics, and logging APIs are all available in `opentelemetry-api` + `opentelemetry-sdk` and are pure Python, so all 9 cases are feasible.

**Primary recommendation:** Author cases in waves of 2-3, validate each case with the `validate-case` skill before moving to the next wave, and use the `case-content-author` agent for the research + first-draft of each new case. The Perfect Storm (case 9) should be authored last and given extra scope due to multi-concept complexity.

---

## Standard Stack

### Core (Already In Place)

| Component | Location | Purpose |
|-----------|----------|---------|
| `case.yaml` | `src/cases/NNN-slug/` | Case metadata, Phase 1 description/validations, Phase 2 options |
| `setup.py` | `src/cases/NNN-slug/` | Partial starter code with `# TODO:` gap for user |
| `phase2.ts` | `src/data/phase2.ts` | Static investigation data: spans, logs, rootCauseOptions, narrative |
| `rootCauseEngine.ts` | `src/lib/rootCauseEngine.ts` | Dynamic rule evaluation with contextual attribute-specific feedback |
| `caseLoader.ts` | `src/data/caseLoader.ts` | Auto-discovers all `src/cases/*/case.yaml` via `import.meta.glob` |
| `validation.ts` | `src/lib/validation.ts` | 9 check types consumed by `case.yaml` validation rules |

### OTel Python Packages (Pyodide Sandbox)

Pre-installed in worker (no `micropip` needed in `setup.py`):
| Package | Purpose |
|---------|---------|
| `opentelemetry-api` | `trace`, `baggage`, `context`, `propagate`, `metrics` APIs |
| `opentelemetry-sdk` | `TracerProvider`, `MeterProvider`, `LoggerProvider`, samplers |

Must be installed via `micropip.install(...)` at top of `setup.py` when needed:
| Package | Use Case |
|---------|---------|
| `opentelemetry-instrumentation-urllib` | Case 2 (auto-magic) — already in use |
| `opentelemetry-instrumentation-requests` | Optional for cases using `requests` library |

All core OTel APIs (`baggage`, `context`, `propagate`, metrics instruments, logging SDK) are pure Python and available from the pre-installed packages.

### Validation Check Types (Exact Strings)

```
span_exists | attribute_exists | attribute_value | span_count |
status_ok | status_error | telemetry_flowing | error_handling | yaml_key_exists
```

`yaml_key_exists` is exclusive to YAML-config cases (type: `yaml-config`). All others apply to Python execution cases (type: `instrumentation`).

---

## Architecture Patterns

### Case Directory Structure

```
src/cases/
├── 001-hello-span/
│   ├── case.yaml          # id, name, order, difficulty, concepts, phase1, phase2
│   └── setup.py           # Partial instrumentation starter code
├── 002-auto-magic/
│   ├── case.yaml
│   └── setup.py
└── NNN-new-case/
    ├── case.yaml
    └── setup.py
```

Each directory is auto-discovered. No registration needed in `caseLoader.ts`.

### Pattern 1: Python Execution Case (Instrumentation)

**What:** User writes Python with OTel SDK calls. Spans are captured by the custom `JSSpanExporter` and validated against rules in `case.yaml`.

**case.yaml type field:** Omit (defaults to instrumentation) or set `type: instrumentation`

**Validation rule example:**
```yaml
validations:
  - type: attribute_exists
    spanName: process_order
    attributeKey: order_id
    description: "The order_id must be added as a span attribute"
    successMessage: "✓ Attribute order_id added"
    errorMessage: "✗ Attribute order_id not found. Use set_attribute()"
    hintMessage: "💡 Hint: Use span.set_attribute('order_id', order_id)"
    guidedMessage: "📖 Inside the span context, add: span.set_attribute('order_id', order_id)"
```

**Progressive hints:** `hintMessage` shown at 1-2 failed attempts. `guidedMessage` shown at 3+ attempts.

### Pattern 2: YAML Config Case

**What:** User edits YAML in a text editor. `yaml_key_exists` checks dot-notation paths.

**case.yaml type field:** `type: yaml-config`

**Validation rule example:**
```yaml
validations:
  - type: yaml_key_exists
    yamlPath: "processors.tail_sampling"
    description: "tail_sampling must be configured in the processors section"
    successMessage: "✓ tail_sampling processor configured"
    errorMessage: "✗ tail_sampling missing from processors."
    hintMessage: "💡 Hint: Add tail_sampling: under processors:"
    guidedMessage: "📖 Add to processors:\n  tail_sampling:\n    decision_wait: 10s"
```

The Collector (case 3) uses this pattern. It remains the only YAML case.

### Pattern 3: Multi-Service Context Propagation (In-Process Simulation)

**What:** Cases 4 (Broken Context) and 5 (Baggage) require simulating cross-service propagation. Since the sandbox is single-process, inject/extract patterns are simulated using Python dicts as carriers.

**Verified Python API (opentelemetry-api, pure Python):**
```python
from opentelemetry import trace, baggage, context
from opentelemetry.propagators.textmap import DefaultTextMapPropagator
from opentelemetry.propagate import inject, extract

# Inject current context into a carrier dict (simulates HTTP headers)
carrier = {}
inject(carrier)

# Extract context from carrier (simulates receiving service reading headers)
ctx = extract(carrier)

# Create child span in extracted context
with tracer.start_as_current_span("downstream.call", context=ctx):
    pass
```

**Source:** [OpenTelemetry Python Propagation docs](https://opentelemetry.io/docs/languages/python/propagation/)

### Pattern 4: Baggage API

**What:** Case 5 (The Baggage) teaches `opentelemetry.baggage` for cross-service key-value propagation.

**Verified Python API:**
```python
from opentelemetry import baggage, context

# Set baggage in parent context
ctx = baggage.set_baggage("user.plan", "premium")

# Read baggage in current or child context
plan = baggage.get_baggage("user.plan", ctx)
```

**Source:** [opentelemetry.baggage package docs](https://opentelemetry-python.readthedocs.io/en/stable/api/baggage.html)

### Pattern 5: Metrics API

**What:** Case 6 (Metrics Meet Traces) teaches creating metrics instruments alongside traces.

**Verified Python API (opentelemetry-sdk, pure Python):**
```python
from opentelemetry import metrics
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import InMemoryMetricReader

meter_provider = MeterProvider()
metrics.set_meter_provider(meter_provider)
meter = metrics.get_meter(__name__)

counter = meter.create_counter("requests.total", unit="1", description="Total requests")
counter.add(1, {"endpoint": "/checkout", "status": "ok"})

histogram = meter.create_histogram("request.duration", unit="ms")
histogram.record(142, {"endpoint": "/checkout"})
```

**Note:** Metrics in the sandbox need a custom in-process exporter (similar to `JSSpanExporter`) to bridge metric data to JS for validation. Alternatively, validation can check that spans have correlated metric-context attributes rather than validating raw metric instruments. See **Don't Hand-Roll** section.

**Source:** [opentelemetry.sdk.metrics docs](https://opentelemetry-python.readthedocs.io/en/latest/sdk/metrics.html)

### Pattern 6: Structured Logging SDK

**What:** Case 7 (Log Detective) teaches OTel structured logging with trace_id correlation.

**Verified Python API:**
```python
import logging
from opentelemetry.sdk._logs import LoggerProvider
from opentelemetry.sdk._logs.export import SimpleLogRecordProcessor, ConsoleLogExporter

# OTel logging automatically bridges Python stdlib logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info("Order processed", extra={"order_id": "42"})
# When inside a span context, trace_id is auto-injected
```

**Source:** [opentelemetry.sdk._logs docs](https://opentelemetry-python.readthedocs.io/en/stable/sdk/_logs.html)

### Pattern 7: Sampling API

**What:** Case 8 (Sampling Sleuth) teaches head-based sampling with `TraceIdRatioBased` and `ParentBasedSampler`.

**Verified Python API:**
```python
from opentelemetry.sdk.trace.sampling import TraceIdRatioBased, ParentBased

# Sample 10% of traces
sampler = TraceIdRatioBased(0.1)

# Parent-based with ratio (most production-appropriate)
sampler = ParentBased(TraceIdRatioBased(0.5))

provider = TracerProvider(sampler=sampler)
```

**Source:** [opentelemetry.sdk.trace.sampling docs](https://opentelemetry-python.readthedocs.io/en/latest/sdk/trace.sampling.html)

### Anti-Patterns to Avoid

- **Threading in Pyodide:** `Resource.create()` uses threading and fails in WASM. Always use `Resource(attributes={...})` constructor directly (already established in `setup_telemetry.py`).
- **Network calls for HTTP cases:** Network calls fail in Pyodide. Use `try/except` around any `urlopen()` call — the span is captured even if the request errors. Already established in case 002.
- **Overloading setup.py with complexity:** Keep setup.py under 50 lines. If the exercise needs multi-service simulation, simulate both "services" as function calls in the same file.
- **Generic root cause explanations:** Every explanation must name a specific span attribute and its value (e.g., `db.connection_pool.wait_ms=4750`), not generic text.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Metrics bridge to JS | Custom postMessage protocol for metrics | Validate metrics indirectly via spans OR add span events to encode metric observations | Metrics SDK reader pattern differs from spans; simpler to express metric-affecting behavior via span attributes |
| Case discovery | Manual case registry | `caseLoader.ts` `import.meta.glob` | Already works — adding directory is sufficient |
| Validation engine | New check types | Existing 9 `ValidationCheckType` values | All 9 cases can be fully validated with existing types; no new engine changes needed |
| Root cause randomness | Dynamic root cause selection | Static `phase2Registry` entries with `generateTraceId()` | Trace IDs are randomized per session; investigation data is static and authoritative |
| OTel propagation simulation | Custom carrier protocol | dict as carrier + `inject()`/`extract()` | Standard OTel API works in-process; no HTTP needed |

**Key insight:** The infrastructure is complete. Phase 6 is purely content — writing YAML, Python, and TypeScript data objects. No new components, no new check types, no new engine logic.

---

## Common Pitfalls

### Pitfall 1: Validation Rules Referencing Wrong Span Names

**What goes wrong:** `attribute_exists` rule with `spanName: "http_get"` when the auto-instrumentation generates `spanName: "HTTP GET"` (exact match, case-sensitive).
**Why it happens:** Span names from auto-instrumentation libraries follow specific conventions that differ from what you'd naturally write.
**How to avoid:** Test each case in the browser with `npm run dev` before marking it done. Check the actual `name` field in the span JSON in browser console.
**Warning signs:** Validation always fails despite correct-looking user code.

### Pitfall 2: Phase 2 Data Disconnect from Phase 1 Concept

**What goes wrong:** Case teaches baggage in Phase 1, but Phase 2 incident has nothing to do with baggage (e.g., a generic slow database query).
**Why it happens:** Phase 2 data is authored separately and loses thematic coherence.
**How to avoid:** Design Phase 2 incident first, then work backward to what Phase 1 teaches. The incident should only be diagnosable by reading the telemetry that Phase 1 teaches. Example: baggage case Phase 2 incident = a service misrouted requests because baggage tenant ID was missing.
**Warning signs:** Phase 2 explanation doesn't reference the concept from Phase 1.

### Pitfall 3: setup.py Giving Away the Answer

**What goes wrong:** The `# TODO:` is labeled with the exact API to call, or the boilerplate already does what the user needs to do.
**Why it happens:** Authors naturally want to be helpful, but excessive hints eliminate the learning.
**How to avoid:** Write the complete solution first, then remove exactly the learning target, leaving only a `# TODO:` comment and a vague hint. The user should need to look up or recall the API.
**Warning signs:** setup.py has import statements that auto-instrument or a working implementation commented out.

### Pitfall 4: Pyodide Threading Errors

**What goes wrong:** `Resource.create()`, threading-based detection, or C-extension libraries fail silently or crash the worker.
**Why it happens:** Pyodide WASM doesn't support threads; some OTel SDK functions use `threading.Thread`.
**How to avoid:** Always use `Resource(attributes={...})` not `Resource.create({...})`. Avoid `BatchSpanProcessor` (uses threads) — always use `SimpleSpanProcessor`. Never import C-extension packages (check if package has `*-abi3-*.whl` — if so, it needs a pure wheel).
**Warning signs:** Worker crashes on init with `threading` or `RuntimeError` in console.

### Pitfall 5: Root Cause Engine Missing Rules for New Cases

**What goes wrong:** New case 4-9 is registered in `phase2Registry` but not in `RULES_REGISTRY` in `rootCauseEngine.ts`. Root cause evaluation silently falls back to static `explanation` field without dynamic attribute-specific feedback.
**Why it happens:** Authors add `phase2.ts` entry but forget the engine registration step.
**How to avoid:** Always add `RootCauseRule[]` to `rootCauseEngine.ts` and register in `RULES_REGISTRY` as part of the authoring checklist (Step 6 in `new-case` skill).
**Warning signs:** Incorrect guesses show generic feedback instead of attribute-specific text.

### Pitfall 6: The Perfect Storm Scope Creep

**What goes wrong:** Case 9 becomes a sprawling multi-hour exercise that confuses instead of rewarding.
**Why it happens:** Capstone cases tempt authors to include every concept simultaneously.
**How to avoid:** The Perfect Storm should require the user to recognize 2-3 interacting problems visible in a single unified trace. Phase 1 exercise: add the telemetry that makes those problems visible. Phase 2 investigation: identify which combination of failures is the actual root cause. Keep Phase 1 under 60 lines of setup.py.

---

## Code Examples

### Complete case.yaml Structure

```yaml
# Source: existing cases at src/cases/001-hello-span/case.yaml and 002-auto-magic/case.yaml
id: 004-broken-context
name: "Broken Context"
order: 4
difficulty: intermediate
concepts:
  - context_propagation
  - trace_context

phase1:
  description: |
    **Case #4: Broken Context**

    **What is Context Propagation?**
    [Concept explanation here — 2-3 paragraphs on why it matters in production]

    **The Situation:**
    [Incident setup]

    **Your Mission:**
    [Exercise task]

    **Key Concepts:**
    - **traceparent**: W3C standard header carrying trace and span IDs

    **Hints:**
    1. [Hint 1]

  hints:
    - "[hint]"

  validations:
    - type: span_exists
      description: "..."
      successMessage: "✓ ..."
      errorMessage: "✗ ..."
      hintMessage: "💡 Hint: ..."
      guidedMessage: "📖 ..."

phase2:
  description: |
    **Investigation Phase**
    [What happened — 2-3 sentences]

  investigationTools:
    - traces
    - logs

  rootCauseOptions:
    - id: a
      label: "..."
      correct: false
      explanation: "Not quite. The span attribute X=Y shows..."
    - id: b
      label: "..."
      correct: true
      explanation: "✓ Exactly! The span attribute X=Y confirms..."
    - id: c
      label: "..."
      correct: false
      explanation: "..."
    - id: d
      label: "..."
      correct: false
      explanation: "..."
```

### Phase 2 Data Entry (phase2.ts)

```typescript
// Source: src/data/phase2.ts (existing pattern from helloSpanPhase2)
const brokenContextTraceId = generateTraceId();

export const brokenContextPhase2: Phase2Data = {
  traceId: brokenContextTraceId,
  totalDurationMs: 3200,
  narrative: `[2-3 sentence incident description]`,
  spans: [
    {
      id: 'span-001',
      name: 'api.request',
      service: 'api-gateway',
      durationMs: 3200,
      offsetMs: 0,
      status: 'error',
      depth: 0,
      attributes: {
        'http.method': 'POST',
        'http.route': '/checkout',
        'http.status_code': '500',
      },
    },
    // Child spans with diagnostic attributes...
  ],
  logs: [
    {
      timestamp: '10:15:00.021',
      level: 'error',
      message: '[realistic log line with specific values]',
      traceId: brokenContextTraceId,
      spanId: 'span-001',
      service: 'api-gateway',
    },
  ],
  rootCauseOptions: [
    // 4 options, exactly 1 with correct: true
  ],
};

phase2Registry['004-broken-context'] = brokenContextPhase2;
```

### RootCauseEngine Registration

```typescript
// Source: src/lib/rootCauseEngine.ts (existing helloSpanRules pattern)
const brokenContextRules: RootCauseRule[] = [
  {
    id: 'a',
    label: '...',
    specificHint: '💡 Hint: Look at the traceparent header value in the span attributes.',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const span = data.spans.find(s => s.name === 'downstream.call');
      const header = span?.attributes?.['http.request.header.traceparent'];
      return `Not quite. The traceparent header ${header ? `was "${header}"` : 'was missing'} — this means...`;
    },
  },
  // ... 3 more rules
];

RULES_REGISTRY['004-broken-context'] = brokenContextRules;
```

---

## Case-by-Case Design Blueprint

### Case 1 (Rewrite): Hello, Span

**Current state:** Already functional but concept explanation is thin; lacks "why does this matter in production?" framing.
**Rewrite focus:** Expand concept-first section with a compelling production anecdote. Keep the exercise identical (manual span + order_id attribute). Add 1-2 additional validation rules for depth (e.g., `status_ok`).
**Phase 2:** Keep the DB connection pool incident — it's excellent. Expand narrative.
**Difficulty:** rookie
**Files changed:** `case.yaml` only (possibly adding validation rule), rootCauseEngine rules can stay.

### Case 2 (Rewrite): Auto-magic

**Current state:** Functional. Concept explanation good but brief.
**Rewrite focus:** Deeper "why auto-instrumentation matters" — the power of zero-code telemetry, 100+ supported libraries.
**Phase 2:** Keep the payment API 500 incident.
**Difficulty:** rookie
**Files changed:** `case.yaml` concept framing, possibly a 3rd validation rule.

### Case 3 (Rewrite): The Collector

**Current state:** Functional YAML-config case with tail_sampling.
**Rewrite focus:** Add "what is the Collector and why use it?" inline concept section. The pipeline (receivers → processors → exporters) mental model needs to come before the exercise.
**Phase 2:** Keep the 1% sampling misconfiguration incident.
**Difficulty:** junior (keep)
**Files changed:** `case.yaml` description section.

### Case 4 (New): Broken Context

**Concept:** Context propagation — how trace context crosses service boundaries via W3C `traceparent` headers.
**Phase 1 exercise:** Given a two-function setup simulating two services, use `inject()` and `extract()` to propagate the trace context. Both spans must appear in the same trace.
**Validation rules:** `span_exists` (upstream span), `span_exists` (downstream span), `attribute_exists` on downstream span for `traceparent`-related field.
**Phase 2 incident:** A payment service generates orphaned traces because the checkout service forgot to propagate context. Logs show `trace_id=00000000...` (null parent). Root cause: context not extracted on the downstream side.
**Phase 2 diagnostic attribute:** `trace.parent_id = null` or orphaned span structure.
**Difficulty:** intermediate

### Case 5 (New): The Baggage

**Concept:** OTel Baggage — propagating arbitrary key-value pairs alongside trace context for correlation.
**Phase 1 exercise:** Set `user.plan` and `request.region` as baggage, propagate via carrier, and read them in a child span context to annotate spans.
**Validation rules:** `attribute_exists` for baggage-sourced attributes on child span.
**Phase 2 incident:** A SaaS platform's premium tier users get misrouted to the free-tier rate limiter because the `user.plan` baggage was dropped at a middleware boundary. The trace shows the rate limit being applied when the baggage attribute is missing.
**Phase 2 diagnostic attribute:** Missing `user.plan` attribute on service-b spans where it should have been propagated.
**Difficulty:** intermediate

### Case 6 (New): Metrics Meet Traces

**Concept:** Multi-signal correlation — combining trace spans with metric observations to see load and latency together.
**Phase 1 exercise:** Inside a traced function, record a `request.duration` histogram and a `requests.total` counter alongside the span. Both signals cover the same operation.
**Validation rules:** `span_exists` (main span), `attribute_exists` (span attribute showing metric context), `telemetry_flowing`.
**Pyodide note:** Metric validation in Phase 1 is simplified — check that spans have attributes added by the metric-aware code path (e.g., `metric.recorded=true` or `requests.total` added as span attribute). Full metric stream validation would require a metric bridge not in scope.
**Phase 2 incident:** An API latency spike shows 1500ms on the p99 histogram but individual traces look normal (200ms). Root cause: the histogram captures end-to-end client time including serialization, but spans only cover handler execution. The gap reveals a serialization bottleneck not traced.
**Phase 2 diagnostic attribute:** `serialization.duration_ms` attribute on spans showing the untraced overhead.
**Difficulty:** senior

### Case 7 (New): Log Detective

**Concept:** Structured logging with trace correlation — using `trace_id` and `span_id` fields in logs to correlate log lines with spans.
**Phase 1 exercise:** Use Python `logging` with OTel LoggingHandler so that log messages automatically include `trace_id`. Use `logger.info()` with structured `extra={}` fields.
**Validation rules:** `span_exists` (the traced operation), `attribute_exists` on span for a key log attribute (e.g., `user_id`).
**Pyodide note:** OTel logging SDK (`opentelemetry.sdk._logs`) is pure Python and available. The LoggingHandler auto-injects trace context into log records.
**Phase 2 incident:** A billing error affects 3 users. The trace shows a normal-status span but the correlated log shows `ERROR billing.charge failed: insufficient_funds` with `user_id=usr_4821`. Without trace_id on the log, the connection would be invisible.
**Phase 2 diagnostic attribute:** Log `user_id` correlating to a billing span with `billing.attempt=3`.
**Difficulty:** senior

### Case 8 (New): Sampling Sleuth

**Concept:** Head-based sampling — `TraceIdRatioBased` and `ParentBasedSampler`, the cost of over-sampling, and the danger of losing critical traces.
**Phase 1 exercise:** Configure a `TracerProvider` with `TraceIdRatioBased(0.5)` sampler. Run 10 iterations and observe that approximately half the spans appear. Then switch to `ALWAYS_ON` and observe all spans appear.
**Validation rules:** `span_count` (with `minCount: 1`) after ALWAYS_ON configuration, `attribute_exists` for sampler-indicating attribute.
**Phase 2 incident:** An error rate spike went undetected for 30 minutes because sampling was set to 1% — only 1% of error traces reached the backend. Root cause: `TraceIdRatioBased(0.01)` with no error-preserving policy. The fix: use `ParentBased` with `ALWAYS_ON` for error spans.
**Phase 2 diagnostic attribute:** `sampling.rate` attribute on collector spans = 0.01, and `sampled_traces_count` vs `total_estimated_traces`.
**Difficulty:** senior

### Case 9 (New): The Perfect Storm

**Concept:** Capstone — all signals together: spans, logs, metrics context, and baggage to diagnose a cascading failure.
**Phase 1 exercise:** Given a realistic e-commerce checkout scenario with 3 services (auth, inventory, payment), add spans to each service, propagate context, add baggage for `user.tier`, and add a metrics counter for failed checkouts. The boilerplate provides all service functions — the user adds telemetry only.
**Validation rules:** 5-6 rules covering: `span_exists` per service, `attribute_exists` for context propagation, `attribute_exists` for baggage, `telemetry_flowing`.
**Phase 2 incident:** A cascading failure: inventory service starts returning stale stock data (0 items) under load, causing the payment service to reject valid orders, triggering a retry storm that saturates the auth service connection pool. Three things are wrong simultaneously — learner must identify all three from the unified trace.
**Phase 2 root cause options:** This is the hard one — options must reflect which combination of faults is correct. Consider making it "select all that apply" pattern or a multi-part narrative.
**Phase 2 diagnostic attributes:** `inventory.cache_hit=false`, `payment.rejection_reason=out_of_stock`, `auth.connection_pool.wait_ms=3200`.
**Difficulty:** expert

---

## Rewrite vs. New Case Effort Estimate

| Case | Type | Effort | Primary Change |
|------|------|--------|----------------|
| 001-hello-span | Rewrite | S (small) | `case.yaml` description expansion only |
| 002-auto-magic | Rewrite | S (small) | `case.yaml` description expansion only |
| 003-the-collector | Rewrite | S (small) | `case.yaml` description + concept primer |
| 004-broken-context | New | M (medium) | All 4 artifacts from scratch |
| 005-the-baggage | New | M (medium) | All 4 artifacts from scratch |
| 006-metrics-meet-traces | New | M (medium) | All 4 artifacts + metrics validation design |
| 007-log-detective | New | M (medium) | All 4 artifacts from scratch |
| 008-sampling-sleuth | New | M (medium) | All 4 artifacts from scratch |
| 009-the-perfect-storm | New | L (large) | All 4 artifacts, 5-6 validations, multi-span Phase 2 |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Static root cause explanations | Dynamic `rootCauseEngine.ts` rules with attribute interpolation | Phase 3 | Contextual feedback referencing real data values |
| YAML cases require file reads | `yaml_key_exists` validation type, dot-notation paths | Phase 4 | Collector case fully functional |
| Fixed panel layout | `react-resizable-panels` v4 with `useDefaultLayout` | Phase 5 | Users can resize to prefer code/instructions |
| Mock cases without concept primers | Concept-first teaching (Phase 6 goal) | Phase 6 | Learning-first, exercise-second flow |

**Deprecated/outdated:**
- `Resource.create({...})`: Threading issues in Pyodide. Use `Resource(attributes={...})` directly.
- `BatchSpanProcessor`: Threading-based, broken in WASM. Always use `SimpleSpanProcessor`.
- `autoSaveId` prop on Panel: react-resizable-panels v3 API. Use `useDefaultLayout` hook (v4).

---

## Open Questions

1. **Metrics bridge feasibility**
   - What we know: Metrics SDK (`opentelemetry-sdk`) is pure Python. `MeterProvider` and instruments work in Pyodide.
   - What's unclear: Is a `JSMetricExporter` bridge needed (similar to `JSSpanExporter`) to capture metric data for validation? Or is indirect validation (checking span attributes for metric-sourced values) sufficient for the teaching goal?
   - Recommendation: Use indirect validation for Phase 6 — validate that spans contain attributes proving the user interacted with the metrics API (`metric.counter.name` as a span attribute). Full metric bridge is deferred.

2. **The Perfect Storm multi-select**
   - What we know: Current root cause UI has 4 options, 1 correct. Perfect Storm logically has 3 simultaneous root causes.
   - What's unclear: Does the UI support multi-select evaluation? (Not researched — check `RootCausePanel` component.)
   - Recommendation: Frame Case 9's root cause as "which service is the PRIMARY trigger in the cascading failure?" to fit the single-answer model, with the investigation narrative explaining all three layers.

3. **Case ordering for difficulty ramp**
   - What we know: Cases 4-8 have roughly the same difficulty (intermediate/senior).
   - What's unclear: Should sampling (case 8) come before logs (case 7)? Sampling is a more operational concept; logs may be more approachable.
   - Recommendation: Keep proposed order (propagation → baggage → metrics → logs → sampling) — each concept requires the previous (you need traces before you can correlate logs; you need correlated data before sampling trade-offs make sense).

---

## Validation Architecture

> `workflow.nyquist_validation` key is absent from `.planning/config.json` — treated as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (detected from `vite.config.ts`) |
| Config file | `vite.config.ts` (test field present) |
| Quick run command | `npm run test -- --run` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

Phase 6 is entirely case content (YAML + Python + TypeScript data). Automated test coverage applies to:

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| CASE-04 | Case 4 validation rules evaluate correctly | unit | `npm run test -- --run` (validate-case skill checks) | ❌ Wave 0 |
| CASE-05 | Case 5 validation rules evaluate correctly | unit | `npm run test -- --run` | ❌ Wave 0 |
| CASE-06 | Case 6 validation rules evaluate correctly | unit | `npm run test -- --run` | ❌ Wave 0 |
| CASE-07 | Case 7 validation rules evaluate correctly | unit | `npm run test -- --run` | ❌ Wave 0 |
| CASE-08 | Case 8 validation rules evaluate correctly | unit | `npm run test -- --run` | ❌ Wave 0 |
| CASE-09 | Case 9 validation rules evaluate correctly | unit | `npm run test -- --run` | ❌ Wave 0 |
| CONTENT | Browser smoke test: all 9 cases load without console errors | manual | `npm run dev` + browser load | manual-only |

**Note:** The primary validation mechanism for case content is the `validate-case` skill (checklist-based, manual + code inspection) plus live browser testing. Automated unit tests exist for validation engine correctness but not for case-specific content quality.

### Sampling Rate

- **Per case authored:** Run `validate-case` skill checklist (manual)
- **Per wave merge:** `npm run test -- --run` (verify no regressions)
- **Phase gate:** All 9 cases pass `validate-case` checklist + browser smoke test before `/gsd:verify-work`

### Wave 0 Gaps

- None for test infrastructure — existing Vitest setup covers validation engine.
- Case-specific unit tests are optional; `validate-case` skill is the primary QA gate.

---

## Sources

### Primary (HIGH confidence)

- Existing codebase — `src/cases/`, `src/data/phase2.ts`, `src/lib/rootCauseEngine.ts`, `src/lib/validation.ts`, `.claude/skills/new-case/SKILL.md`, `.claude/skills/validate-case/SKILL.md` — authoritative project patterns
- [opentelemetry.baggage docs](https://opentelemetry-python.readthedocs.io/en/stable/api/baggage.html) — baggage API
- [opentelemetry.sdk.trace.sampling docs](https://opentelemetry-python.readthedocs.io/en/latest/sdk/trace.sampling.html) — TraceIdRatioBased, ParentBased
- [opentelemetry.sdk.metrics docs](https://opentelemetry-python.readthedocs.io/en/latest/sdk/metrics.html) — MeterProvider, Counter, Histogram
- [opentelemetry.sdk._logs docs](https://opentelemetry-python.readthedocs.io/en/stable/sdk/_logs.html) — LoggerProvider, LogRecordProcessor
- [OpenTelemetry Python Propagation docs](https://opentelemetry.io/docs/languages/python/propagation/) — inject/extract pattern

### Secondary (MEDIUM confidence)

- [PyPI opentelemetry-api](https://pypi.org/project/opentelemetry-api/) — confirmed pure Python wheel (`py3-none-any.whl`), micropip-installable
- [OTel Python baggage example](https://opentelemetry.io/docs/concepts/signals/baggage/) — verified set_baggage/get_baggage API shape
- [OTel sampling strategies](https://uptrace.dev/get/opentelemetry-python/sampling) — ParentBased + TraceIdRatioBased pattern

### Tertiary (LOW confidence)

- Metrics bridge approach (indirect validation via span attributes) — inferred from Pyodide constraints, not directly verified with a working prototype.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all patterns are established in existing working cases
- Architecture: HIGH — authoring workflow is codified in skills, all 4 artifacts per case are proven
- OTel API shapes: HIGH — verified against official Python docs
- Pyodide feasibility: MEDIUM — baggage/context/sampling verified pure-Python; metrics bridge approach is inferred
- Case content design: MEDIUM — incident narratives and diagnostic attributes are designed based on OTel knowledge, need live browser validation

**Research date:** 2026-03-13
**Valid until:** 2026-06-13 (OTel Python API is stable; Pyodide version pinned at 0.29.3)
