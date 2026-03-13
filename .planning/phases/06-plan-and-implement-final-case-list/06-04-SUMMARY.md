---
phase: 06-plan-and-implement-final-case-list
plan: "04"
subsystem: content
tags: [case-authoring, metrics, multi-signal, phase2-data, root-cause-rules]
dependency_graph:
  requires: [06-03]
  provides: [case-006-complete]
  affects: [src/cases, src/data/phase2.ts, src/lib/rootCauseEngine.ts]
tech_stack:
  added: []
  patterns: [metrics-api, multi-signal-correlation, indirect-validation-via-span-attribute]
key_files:
  created:
    - src/cases/006-metrics-meet-traces/case.yaml
    - src/cases/006-metrics-meet-traces/setup.py
  modified:
    - src/data/phase2.ts
    - src/lib/rootCauseEngine.ts
    - public/sitemap.xml
decisions:
  - "Indirect metric validation: validate metric usage via span attribute metrics.recorded=true, avoiding need for JS metric exporter bridge"
  - "Protobuf serialization as bottleneck: chosen because it's untraced in many codebases, teaching the metrics-vs-traces latency gap lesson concretely"
metrics:
  duration: "3 min"
  completed: "2026-03-13"
  tasks_completed: 2
  files_modified: 5
---

# Phase 06 Plan 04: Metrics Meet Traces Summary

**One-liner:** Case 006 teaching multi-signal observability — MeterProvider + histogram/counter with indirect validation via span attribute, Phase 2 diagnosing a 1310ms protobuf serialization bottleneck invisible to the handler trace.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Author case.yaml and setup.py for Metrics Meet Traces | dd5d0a2 | src/cases/006-metrics-meet-traces/case.yaml, src/cases/006-metrics-meet-traces/setup.py |
| 2 | Add Phase 2 data and root cause rules for Metrics Meet Traces | 206d13f | src/data/phase2.ts, src/lib/rootCauseEngine.ts, public/sitemap.xml |

## What Was Built

**Case 006: Metrics Meet Traces** — a complete, playable case teaching multi-signal observability:

**Phase 1 (Instrumentation):**
- Concept-first description covering: OTel Metrics API (MeterProvider, Meter, Counter, Histogram), the metrics-vs-traces distinction (metrics = what is wrong, traces = why), and a concrete production anecdote (p99=1500ms vs 220ms handler traces)
- setup.py: MeterProvider + InMemoryMetricReader already wired; two TODO gaps for counter/histogram creation and recording
- 3 validation rules: `span_exists` (checkout.handle), `attribute_exists` (metrics.recorded='true'), `telemetry_flowing`
- Indirect metric validation: user confirms metric API ran by adding `span.set_attribute('metrics.recorded', 'true')` — avoids requiring a JS-side metric exporter bridge

**Phase 2 (Investigation):**
- 3 spans: `api.request` (1580ms), `checkout.handle` (220ms at offset 25ms), `serialization.encode` (1310ms at offset 245ms)
- Key diagnostic attribute: `serialization.duration_ms=1310` and `serialization.payload_bytes=284621` on the serialization.encode span
- 3 logs: WARN showing the p99 vs handler gap, INFO with serialization details, WARN from api-gateway on SLA breach
- 4 root cause options — option 'd' correct (serialization bottleneck); distractors reference N+1 queries (no db spans), gateway overhead (only 25ms), and payment timeouts (no payment span)
- Root cause rules in RULES_REGISTRY: rule 'd' evaluates dynamically via `serialization.duration_ms` attribute presence

## Decisions Made

- **Indirect metric validation**: validate metric usage via `metrics.recorded` span attribute rather than building a JS metric exporter bridge. This keeps Phase 1 solvable with existing infrastructure while teaching the metrics API interaction.
- **Protobuf serialization bottleneck**: chosen as the Phase 2 incident because it sits between spans (not inside them), making it a canonical example of where metrics reveal what traces alone cannot — the latency source is outside the traced code path.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- FOUND: src/cases/006-metrics-meet-traces/case.yaml
- FOUND: src/cases/006-metrics-meet-traces/setup.py
- FOUND: commit dd5d0a2 (Task 1)
- FOUND: commit 206d13f (Task 2)
