---
phase: 06-plan-and-implement-final-case-list
plan: "02"
subsystem: content
tags: [case-authoring, context-propagation, phase2-data, root-cause-engine]
dependency_graph:
  requires: ["06-01"]
  provides: ["004-broken-context case complete"]
  affects: [src/data/phase2.ts, src/lib/rootCauseEngine.ts, src/cases/004-broken-context]
tech_stack:
  added: []
  patterns: [concept-first case structure, W3C trace context propagation]
key_files:
  created:
    - src/cases/004-broken-context/case.yaml
    - src/cases/004-broken-context/setup.py
  modified:
    - src/data/phase2.ts
    - src/lib/rootCauseEngine.ts
    - public/sitemap.xml
decisions:
  - "Orphan span represented with trace.parent_id=null and trace.orphaned=true attributes for rule evaluation"
  - "setup.py includes carrier parameter in charge_payment signature to make the pattern visible without giving the solution away"
metrics:
  duration: 3m
  completed: "2026-03-13"
  tasks_completed: 2
  files_modified: 5
---

# Phase 06 Plan 02: Broken Context Summary

Case 004 "Broken Context" authored end-to-end — W3C context propagation teaching case with orphaned payment spans showing trace.parent_id=null as the diagnostic attribute.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Author case.yaml and setup.py for Broken Context | fffac52 | src/cases/004-broken-context/case.yaml, src/cases/004-broken-context/setup.py |
| 2 | Add Phase 2 data and root cause rules for Broken Context | e25680b | src/data/phase2.ts, src/lib/rootCauseEngine.ts, public/sitemap.xml |

## What Was Built

### Case 004 "Broken Context"

A context propagation teaching case covering W3C traceparent, inject/extract, and carrier dicts.

**Phase 1:** Users see a checkout service calling a payment service. The starter code has two `# TODO:` gaps — one to call `inject(carrier)` before the downstream call and one to call `extract(carrier)` inside the payment function. Three validation rules check: `checkout.process` span exists, `payment.charge` span exists, and `telemetry_flowing`.

**Phase 2:** Three spans show the incident — `api.request` (error), `checkout.process` (error), and an orphaned `payment.charge` with `trace.parent_id=null` and `trace.orphaned=true`. Three logs from three services narrate the failure. Root cause option b is correct and is confirmed by the `trace.orphaned=true` attribute on the payment span.

**Root cause engine:** Rule b uses `evaluate()` that checks `paymentSpan?.attributes?.['trace.orphaned'] === 'true'` — data-driven evaluation consistent with all other cases.

## Verification

- `npm run test -- --run`: 180/180 tests pass
- phase2Registry contains `004-broken-context` key
- RULES_REGISTRY contains `004-broken-context` with 4 rules, rule b evaluates true given trace data
- sitemap.xml has the case 004 URL

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] src/cases/004-broken-context/case.yaml exists
- [x] src/cases/004-broken-context/setup.py exists
- [x] src/data/phase2.ts contains `004-broken-context` registry entry
- [x] src/lib/rootCauseEngine.ts contains `RULES_REGISTRY['004-broken-context']`
- [x] public/sitemap.xml contains case 004 URL
- [x] Commits fffac52 and e25680b exist
- [x] All 180 tests pass
