---
phase: 06-plan-and-implement-final-case-list
plan: "05"
subsystem: content
tags: [case, structured-logging, trace-correlation, phase2, root-cause-engine]
dependency_graph:
  requires: [06-04]
  provides: [case-007-log-detective]
  affects: [src/data/phase2.ts, src/lib/rootCauseEngine.ts]
tech_stack:
  added: []
  patterns: [span-attributes-as-log-fields, indirect-logging-validation]
key_files:
  created:
    - src/cases/007-log-detective/case.yaml
    - src/cases/007-log-detective/setup.py
  modified:
    - src/data/phase2.ts
    - src/lib/rootCauseEngine.ts
    - public/sitemap.xml
decisions:
  - "Validate logging concept through span attributes (user_id + billing.attempt) — LoggingInstrumentor not available in Pyodide sandbox"
  - "billing.attempt=3 as primary diagnostic attribute — correlated log message uses identical field names to demonstrate structured correlation"
metrics:
  duration: 2 min
  completed_date: "2026-03-13"
  tasks_completed: 2
  files_changed: 5
---

# Phase 06 Plan 05: Log Detective Summary

Case 007 "Log Detective" — structured logging concept taught through span attributes on the billing.charge span (user_id + billing.attempt=3); billing failure trace with correlated logs showing insufficient_funds after 3 retry attempts.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Author case.yaml and setup.py for Log Detective | bc2ff0e | src/cases/007-log-detective/case.yaml, src/cases/007-log-detective/setup.py |
| 2 | Add Phase 2 data and root cause rules for Log Detective | f5ca1bf | src/data/phase2.ts, src/lib/rootCauseEngine.ts, public/sitemap.xml |

## What Was Built

**Case 007: Log Detective** — a senior-difficulty case teaching structured logging with trace correlation.

### case.yaml
- Concept-first description: structured logging definition, logs+traces correlation, production anecdote, situation, mission, key concepts
- 3 validation rules: `span_exists` (billing.charge), `attribute_exists` (user_id on billing.charge), `telemetry_flowing`
- All validation rules include `hintMessage` and `guidedMessage` fields
- 4 root cause options with option b (insufficient funds, 3 retries) correct
- Explanations reference specific span attributes from Phase 2 trace data

### setup.py
- 33 lines — well under 50-line limit
- Standard TracerProvider + JSSpanExporter + Resource setup
- `charge_user(user_id, amount)` with `billing.charge` span started
- 3-retry loop with logger.info/warning/error calls showing logging usage
- Two `# TODO:` gaps: `span.set_attribute("user_id", user_id)` and `span.set_attribute("billing.attempt", attempt)`
- No LoggingInstrumentor, no micropip — fully Pyodide-safe

### phase2.ts
- Trace ID: generated at runtime via `generateTraceId()`
- 4 spans: api.request (error, 2100ms), billing.charge (error, 2050ms), payment.gateway (ok, 180ms), db.query (ok, 8ms)
- Key diagnostic: `billing.attempt=3` and `billing.result=insufficient_funds` on billing.charge span
- 4 correlated log lines referencing user_id=usr_4821 (2 WARN retries, 1 ERROR final failure, 1 gateway decline)
- Registered as `phase2Registry['007-log-detective']`

### rootCauseEngine.ts
- `logDetectiveRules`: 4 rules matching the 4 root cause options
- Rule 'b' `evaluate()`: checks `billing.attempt === '3'` on billing.charge span
- `explainCorrect`: references billing.attempt, billing.result, user_id, and the correlated log message
- Distractors reference db.query status=ok (a), gateway.response_code=200 (c), billing.currency=USD (d)
- Registered in `RULES_REGISTRY['007-log-detective']`

## Verification

- `npm run test -- --run`: 180 tests passed, 0 failures
- All 4 required artifacts exist and are internally consistent
- Phase 1 validates via span attributes only (no LoggingInstrumentor)
- Phase 2 root cause 'b' correct with billing.attempt=3 as primary diagnostic
- setup.py: 33 lines, zero micropip installs

## Decisions Made

1. **Indirect logging validation via span attributes**: The `opentelemetry-instrumentation-logging` package is not available in the Pyodide sandbox. Instead of requiring students to set up a LoggerProvider + LoggingInstrumentor, the exercise validates the same structured logging concepts through `span.set_attribute()` calls that put the same key-value diagnostic fields on the span. This teaches the correlation concept (same field names in spans and logs) while staying fully Pyodide-safe.

2. **billing.attempt=3 as evaluate() check**: The root cause rule evaluates by checking this single attribute because it is the most concise and unambiguous signal: 3 retries exhausted = insufficient funds confirmed. This mirrors how real SREs read billing traces.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `src/cases/007-log-detective/case.yaml` — exists
- [x] `src/cases/007-log-detective/setup.py` — exists
- [x] `src/data/phase2.ts` — contains `007-log-detective`
- [x] `src/lib/rootCauseEngine.ts` — contains `RULES_REGISTRY['007-log-detective']`
- [x] `public/sitemap.xml` — contains `007-log-detective` URL
- [x] Task 1 commit: `bc2ff0e`
- [x] Task 2 commit: `f5ca1bf`
- [x] All 180 tests pass

## Self-Check: PASSED
