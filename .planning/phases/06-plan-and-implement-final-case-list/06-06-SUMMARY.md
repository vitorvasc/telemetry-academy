---
phase: 06-plan-and-implement-final-case-list
plan: "06"
subsystem: content
tags: [case-authoring, sampling, head-sampling, otel, phase2]
dependency_graph:
  requires: [06-05]
  provides: [008-sampling-sleuth case]
  affects: [src/cases, src/data/phase2.ts, src/lib/rootCauseEngine.ts]
tech_stack:
  added: []
  patterns: [concept-first case structure, TraceIdRatioBased sampling scenario]
key_files:
  created:
    - src/cases/008-sampling-sleuth/case.yaml
    - src/cases/008-sampling-sleuth/setup.py
  modified:
    - src/data/phase2.ts
    - src/lib/rootCauseEngine.ts
    - public/sitemap.xml
decisions:
  - sampling.rate=0.01 as primary diagnostic attribute on api.request span — unambiguous evidence
  - estimated_total_error_traces on checkout.handle span to show magnitude of invisible errors
  - collector.pipeline span to surface the OTel collector's own drop metrics
  - ALWAYS_ON sampler gap in setup.py — learner must add sampler= kwarg to TracerProvider constructor
metrics:
  duration: 4 minutes
  completed_date: "2026-03-13"
  tasks_completed: 2
  files_modified: 5
---

# Phase 06 Plan 06: Sampling Sleuth Summary

Case 008 "Sampling Sleuth" — complete, playable case teaching head-based sampling via a scenario where over-aggressive sampling (TraceIdRatioBased(0.01)) made a real error spike invisible to alerting.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Author case.yaml and setup.py | 1ff47f8 | src/cases/008-sampling-sleuth/case.yaml, setup.py |
| 2 | Add Phase 2 data and root cause rules | d6a6ca5 | src/data/phase2.ts, rootCauseEngine.ts, sitemap.xml |

## What Was Built

**Case 008: Sampling Sleuth** — A senior-difficulty case covering head-based sampling.

**Phase 1 exercise:**
- Concept-first description: what sampling is, why it's necessary, TraceIdRatioBased vs ParentBased, the danger of over-aggressive sampling
- The Situation: team set sampling to 1% to cut costs; error spike went undetected 2 hours
- Your Mission: configure TracerProvider with ALWAYS_ON sampler; add sampler.configured attribute
- 3 validation rules: span_count (>=3), attribute_exists (sampler.configured on checkout.handle), telemetry_flowing
- setup.py: TracerProvider created without sampler (the gap); 5-iteration checkout loop; TODO comments guiding learner

**Phase 2 investigation:**
- 3-span trace: api.request (sampling.rate=0.01), checkout.handle (NullPointerException, estimated_total_error_traces=4200), collector.pipeline (dropped_traces_last_hour=415800)
- 3 logs: collector warn about high drop rate, checkout-service error, api-gateway warn about invisible errors
- 4 root cause options with option A correct (sampling.rate=0.01 dropped 99% of errors)
- Root cause rules evaluate sampling.rate=0.01 on api.request span; distractors reference drop counts, error type (NullPointerException not user-specific), api.request span presence (ruling out load balancer)

## Decisions Made

- **sampling.rate=0.01 attribute on api.request span**: Primary diagnostic — unambiguous evidence visible at first glance
- **estimated_total_error_traces on checkout.handle**: Shows the magnitude of the invisible error problem (42 seen vs 4200 estimated) making the learning moment concrete
- **collector.pipeline as separate span**: Surfaces the OTel collector's own drop metrics, teaching learners to check the collector as a diagnostic point
- **ALWAYS_ON sampler gap via missing kwarg**: Learner adds `sampler=ALWAYS_ON` to TracerProvider constructor — minimal, focused change that teaches the exact production pattern

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- src/cases/008-sampling-sleuth/case.yaml: FOUND
- src/cases/008-sampling-sleuth/setup.py: FOUND
- Commit 1ff47f8 (Task 1): FOUND
- Commit d6a6ca5 (Task 2): FOUND
- phase2Registry['008-sampling-sleuth']: FOUND
- RULES_REGISTRY['008-sampling-sleuth']: FOUND
