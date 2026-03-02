---
phase: 02-validation-core-loop
plan: 01
subsystem: validation
tags: [validation, spans, opentelemetry, progressive-hints]

# Dependency graph
requires:
  - phase: 01-wasm-engine
    provides: useCodeRunner hook that captures real spans
provides:
  - Span validation engine (validateSpans function)
  - 6 validation check types (span_exists, attribute_exists, attribute_value, span_count, status_ok, status_error)
  - Progressive hint system (error → hint → guided after 3 attempts)
  - Extended ValidationRule and ValidationResult types
  - Case validation rules with helpful hints using emoji prefixes
affects:
  - validation-core-loop
  - cases-data

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Native TypeScript pattern matching (no Zod per RESEARCH.md decision)"
    - "Progressive escalation: errorMessage → hintMessage → guidedMessage"
    - "Case-keyed attempt tracking for persistent state across case switches"
    - "OpenTelemetry span structure awareness (span.attributes, status.status_code)"

key-files:
  created:
    - src/lib/validation.ts
  modified:
    - src/types.ts
    - src/data/cases.ts

key-decisions:
  - "Native TypeScript over Zod for validation (no external dependency)"
  - "Attempt history keyed by rule description for persistence"
  - "Progressive messages escalate after 3 attempts (1-2: hint, 3+: guided)"
  - "Emoji prefixes: 💡 for hints, 📖 for guided messages"

patterns-established:
  - "ValidationCheckType: Union type for all 6 validation types"
  - "SpanValidationRule: Interface with optional hintMessage and guidedMessage"
  - "ValidationContext: Contains spans array and attemptHistory record"
  - "selectMessage(): Progressive message selection logic"

requirements-completed:
  - LOOP-02
  - LOOP-04

# Metrics
duration: 2min
completed: 2026-03-02T23:20:40Z
---

# Phase 02 Plan 01: Validation Core Loop Summary

**Span validation engine with progressive hints that checks real captured OpenTelemetry span JSON objects against schema rules, replacing string-matching simulation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T23:18:21Z
- **Completed:** 2026-03-02T23:20:40Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Created complete span validation engine in `src/lib/validation.ts` with 6 check types
- Implemented progressive hint escalation system (error → hint → guided after 3 attempts)
- Extended ValidationRule and ValidationResult types with hint fields
- Updated all case validation rules with helpful progressive hints using 💡 and 📖 emoji prefixes
- All helper functions check actual OpenTelemetry span structure (span.attributes, status.status_code)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create span validation engine** - `24d8166` (feat)
2. **Task 2: Extend ValidationRule type with progressive hints** - `fbc0af5` (feat)
3. **Task 3: Add progressive hints to case validation rules** - `410906e` (feat)

**Plan metadata:** [PENDING - will be added in final commit]

## Files Created/Modified

- `src/lib/validation.ts` - Complete validation engine with validateSpans(), 6 check types, progressive message selection
- `src/types.ts` - Extended ValidationRule (hintMessage, guidedMessage, new check types) and ValidationResult (attemptsOnThisRule)
- `src/data/cases.ts` - Added progressive hints to hello-span-001 and auto-magic-002 validation rules

## Decisions Made

- **Native TypeScript over Zod**: Following RESEARCH.md decision, implemented validation with native TypeScript pattern matching rather than adding Zod dependency
- **Attempt history keyed by description**: Using rule description as key ensures persistence across case switches
- **3-attempt escalation threshold**: First 1-2 failures show hints, 3+ show guided messages with specific code examples
- **Emoji prefixes**: 💡 for friendly hints, 📖 for specific fix guidance - visual distinction helps users recognize escalation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Validation engine is ready to integrate with useCodeRunner
- Progressive hints are in place for all existing cases
- Types support span_count, attribute_value, status_ok, status_error checks for future use
- Ready for UI integration that displays validation results with progressive escalation

---
*Phase: 02-validation-core-loop*
*Completed: 2026-03-02*
