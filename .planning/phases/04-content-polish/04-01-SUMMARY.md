---
phase: 04-content-polish
plan: 01
type: execute
subsystem: cases

tags: [hello-span-001, pyodide, validation, mock-objects]

requires:
  - phase: 03-visualization-investigation
    provides: Root cause engine and validation system

provides:
  - Working hello-span-001 case that runs without NameError
  - Fixed attribute_exists validation that correctly checks for order_id

affects:
  - User onboarding experience
  - Phase 1 completion rate

tech-stack:
  added: []
  patterns:
    - "Mock objects for Pyodide runtime dependencies"
    - "Validation rules require explicit attributeKey field"

key-files:
  created: []
  modified:
    - "src/cases/hello-span-001/setup.py - Added MockDB and MockCache classes"
    - "src/cases/hello-span-001/case.yaml - Fixed attribute_exists rule"

key-decisions:
  - "MockDB/MockCache as minimal pass-through classes — no complex simulation needed"
  - "Include full OTel setup in setup.py — mirrors what Pyodide worker expects"
  - "Add explicit spanName to validation rules — prevents matching wrong spans"

requirements-completed:
  - CASE-01

duration: 3min
completed: 2026-03-09
---

# Phase 04 Plan 01: Fix hello-span-001 Case Summary

**Fixed two blocking bugs in the first learning case: added mock infrastructure to prevent NameError crashes, and corrected validation rule to properly check for span attributes.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T18:15:00Z
- **Completed:** 2026-03-09T18:18:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Fixed NameError crash in setup.py by adding MockDB and MockCache classes
- Fixed attribute_exists validation by adding missing attributeKey: order_id
- Verified build passes with no TypeScript or YAML parse errors
- Case now playable end-to-end from starter code to Phase 2

## Task Commits

1. **Task 1: Fix setup.py — add mock objects** — `b9f0e66` (fix)
2. **Task 2: Fix case.yaml — add attributeKey** — `580dbd2` (fix)

**Plan metadata:** — (to be committed with summary)

## Files Created/Modified

- `src/cases/hello-span-001/setup.py` — Added MockDB/MockCache classes and full OTel setup to prevent NameError
- `src/cases/hello-span-001/case.yaml` — Added spanName and attributeKey to attribute_exists validation rule

## Decisions Made

1. **Mock objects as minimal pass-through classes** — No need for complex simulation; the goal is just to prevent NameError so users can focus on instrumentation.

2. **Include full OTel setup in setup.py** — Matches what the Pyodide worker environment expects. InMemorySpanExporter is a placeholder substituted at runtime.

3. **Explicit spanName in validation rules** — Without spanName, the check could match any span. Explicit scoping ensures we're checking the right operation.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- hello-span-001 is now fully playable
- Ready for Phase 2 investigation after Phase 1 validations pass
- No blockers for content creation of remaining cases

---
*Phase: 04-content-polish*
*Completed: 2026-03-09*
