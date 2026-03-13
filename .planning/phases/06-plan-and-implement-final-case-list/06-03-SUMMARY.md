---
phase: 06-plan-and-implement-final-case-list
plan: "03"
subsystem: content
tags: [otel, baggage, context-propagation, cross-service-correlation, case-authoring]

# Dependency graph
requires:
  - phase: 06-02
    provides: case 004-broken-context pattern for multi-service traces

provides:
  - Case 005-the-baggage: complete playable case teaching OTel Baggage propagation
  - Phase 1 exercise: baggage set/get/inject/extract with attribute annotation
  - Phase 2 investigation: premium user misrouted due to dropped user.plan baggage
  - Root cause rules: evaluate baggage.user_plan=missing on rate_limiter.check span

affects:
  - 06-04
  - 06-05
  - 06-06
  - 06-07

# Tech tracking
tech-stack:
  added: []
  patterns:
    - baggage API usage pattern (set_baggage returns new context, chain for multiple keys)
    - carrier-based cross-service baggage propagation with inject/extract
    - diagnostic attribute pattern: baggage.user_plan=missing signals dropped context

key-files:
  created:
    - src/cases/005-the-baggage/case.yaml
    - src/cases/005-the-baggage/setup.py
  modified:
    - src/data/phase2.ts
    - src/lib/rootCauseEngine.ts
    - public/sitemap.xml

key-decisions:
  - "baggage.user_plan=missing as diagnostic attribute signals absent propagation without ambiguity"
  - "auth.validate span carries user.plan_db=premium as contrasting evidence (DB is correct, baggage is missing)"
  - "setup.py shows carrier passed as parameter — user must fill in inject/extract steps"

patterns-established:
  - "Diagnostic attribute pattern: service records what it did NOT receive (baggage.user_plan=missing) to make absence visible in traces"
  - "Contrasting span pattern: auth span shows correct DB data alongside rate limiter span showing missing baggage — teaches users to compare evidence across services"

requirements-completed: [CASE-05]

# Metrics
duration: 3min
completed: 2026-03-13
---

# Phase 6 Plan 03: The Baggage Summary

**Case 005 — baggage propagation exercise where premium user.plan dropped at middleware boundary causes free-tier rate limiting for premium users**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-13T14:11:12Z
- **Completed:** 2026-03-13T14:14:22Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Authored case 005 with concept-first description covering baggage vs span attributes distinction, production anecdote, and exercise instructions
- Created 3-span Phase 2 trace with `baggage.user_plan=missing` as key diagnostic attribute on `rate_limiter.check` span, contrasted by `auth.validate` showing `user.plan_db=premium` from the database
- Implemented 4 root cause rules where option 'c' evaluates `baggage.user_plan === 'missing'` dynamically against trace data, with data-driven explanations for all distractors

## Task Commits

Each task was committed atomically:

1. **Task 1: Author case.yaml and setup.py for The Baggage** - `2c2c237` (feat)
2. **Task 2: Add Phase 2 data and root cause rules for The Baggage** - `7017b26` (feat)

## Files Created/Modified

- `src/cases/005-the-baggage/case.yaml` - Case metadata, concept description, 3 validation rules (attribute_exists on api.request and rate_limiter.check, telemetry_flowing), 4 root cause options
- `src/cases/005-the-baggage/setup.py` - 51-line scaffold with api.request and rate_limiter.check spans; baggage set/get/inject/extract gap for user to fill
- `src/data/phase2.ts` - theBaggagePhase2 with 3 spans, 3 logs, 4 root cause options; registered as phase2Registry['005-the-baggage']
- `src/lib/rootCauseEngine.ts` - theBaggageRules (4 rules, option c evaluates baggage.user_plan===missing); registered in RULES_REGISTRY
- `public/sitemap.xml` - Added case 005-the-baggage URL

## Decisions Made

- Used `baggage.user_plan=missing` as an explicit span attribute on `rate_limiter.check` to make the absence of baggage visible and queryable in traces — teaches the "record what you didn't receive" diagnostic pattern
- Added `auth.validate` span with `user.plan_db=premium` as contrasting evidence, so the trace shows: database has the right data, but baggage was never propagated — disambiguation is instructive
- setup.py passes carrier as a function parameter rather than a global, so the inject/extract flow is structurally apparent even when commented out

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — commit message body length validation required trimming long lines, resolved immediately.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Case 005 fully playable: case.yaml, setup.py, phase2.ts, rootCauseEngine.ts all consistent
- All 180 tests pass, no TypeScript errors
- Ready for plan 06-04 (next case in sequence)

---
*Phase: 06-plan-and-implement-final-case-list*
*Completed: 2026-03-13*

## Self-Check: PASSED

- FOUND: src/cases/005-the-baggage/case.yaml
- FOUND: src/cases/005-the-baggage/setup.py
- FOUND: .planning/phases/06-plan-and-implement-final-case-list/06-03-SUMMARY.md
- FOUND commit: 2c2c237 (Task 1)
- FOUND commit: 7017b26 (Task 2)
