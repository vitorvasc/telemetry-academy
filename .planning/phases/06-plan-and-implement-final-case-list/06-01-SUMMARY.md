---
phase: 06-plan-and-implement-final-case-list
plan: "01"
subsystem: content
tags: [case-authoring, otel, curriculum, yaml, instrumentation]

# Dependency graph
requires:
  - phase: 04-content-polish
    provides: case.yaml structure, validation rules, Phase 2 data patterns
provides:
  - Concept-first description pattern for all 9 cases to follow
  - Rewritten Hello Span, Auto-magic, and The Collector descriptions
affects: [06-02, 06-03, 06-04, 06-05, 06-06, 06-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Concept-first descriptions: What is X? -> Why it matters -> The Situation -> Your Mission -> Key Concepts -> Hints"
    - "Production anecdote in each case primer (quantified real-world example)"

key-files:
  created: []
  modified:
    - src/cases/001-hello-span/case.yaml
    - src/cases/002-auto-magic/case.yaml
    - src/cases/003-the-collector/case.yaml

key-decisions:
  - "Concept-first structure: concept -> production relevance -> exercise (no prior OTel knowledge assumed)"
  - "Production anecdotes use specific numbers (4.7s wait, 100+ libraries) to make relevance concrete"
  - "Key Concepts expanded to include foundational vocabulary (TraceProvider, Bootstrapper, Receiver, etc.)"

patterns-established:
  - "Pattern 1: Each case description opens with a 2-3 sentence conceptual primer before the exercise"
  - "Pattern 2: Production anecdote uses quantified before/after contrast (blind API vs. specific DB wait time)"
  - "Pattern 3: Key Concepts section covers the full vocabulary users need before starting, not after"

requirements-completed: [CASE-01, CASE-02, CASE-03]

# Metrics
duration: 3min
completed: 2026-03-13
---

# Phase 6 Plan 01: Concept-First Description Rewrites Summary

**Concept-first descriptions established for cases 001-003: Span primer, Auto-instrumentation primer, and OTel Collector pipeline model — the learning pattern all 9 cases now follow.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-13T14:01:44Z
- **Completed:** 2026-03-13T14:04:09Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Rewrote `001-hello-span` description with "What is a Span?" conceptual primer and quantified production anecdote (pool wait example), plus expanded Key Concepts covering TraceProvider, Context Manager
- Rewrote `002-auto-magic` description with "What is Auto-instrumentation?" primer covering 100+ library ecosystem; added Bootstrapper and Zero-code telemetry concepts
- Rewrote `003-the-collector` description with Collector overview, ASCII pipeline diagram (Receivers → Processors → Exporters), backend-swap production motivation, and full Key Concepts vocabulary (Collector, Pipeline, Receiver, Processor, Exporter, Tail Sampling, decision_wait)
- All validation rules and Phase 2 data for all 3 cases preserved bit-for-bit
- 180 tests pass with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite Hello Span and Auto-magic descriptions** - `b01ab28` (feat)
2. **Task 2: Rewrite The Collector description** - `03bc1f9` (feat)

## Files Created/Modified
- `src/cases/001-hello-span/case.yaml` - Added concept primer and expanded Key Concepts
- `src/cases/002-auto-magic/case.yaml` - Added auto-instrumentation primer and new Key Concepts
- `src/cases/003-the-collector/case.yaml` - Added Collector/pipeline primer with ASCII diagram

## Decisions Made
- Concept-first structure: concept -> why it matters in production -> exercise. No prior OTel knowledge assumed.
- Production anecdotes use specific numbers to make relevance concrete (e.g., "4.7 seconds waiting for a connection pool slot" vs generic "slow API")
- Key Concepts section now acts as a pre-flight vocabulary list rather than just a reminder

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
Commit message exceeded 72-char header limit on first attempt — shortened to comply with commitlint. No code issues.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Concept-first pattern established and ready for cases 004-009 to follow
- Cases 001-003 fully playable with no regressions
- Pattern: What is X? + production anecdote + exercise + Key Concepts vocab

---
*Phase: 06-plan-and-implement-final-case-list*
*Completed: 2026-03-13*
