---
phase: 03-visualization-investigation
plan: 03
subsystem: investigation

tags: [root-cause, engine, rules, feedback, phase2]

requires:
  - phase: 03-visualization-investigation
    provides: Log generation system (03-02)
    
provides:
  - Rules-based root cause evaluation engine
  - Attribute-specific feedback generation
  - Dynamic guess evaluation with contextual hints
  - State reset on new telemetry data
  - Integration between engine and RootCauseSelector UI
  
affects:
  - 03-visualization-investigation (next plan - data flow optimization)
  - Phase 4 content authoring (case-specific rules)

tech-stack:
  added: []
  patterns:
    - Rules-based evaluation engine with inspect functions
    - Dynamic feedback generation from span attributes
    - State synchronization via useEffect dependency tracking

key-files:
  created:
    - src/lib/rootCauseEngine.ts - Rules-based evaluation engine
  modified:
    - src/data/cases.ts - Added rootCauseOptions per case
    - src/hooks/usePhase2Data.ts - Extract options from case definitions
    - src/components/InvestigationView.tsx - Integrate engine evaluation
    - src/components/RootCauseSelector.tsx - Display dynamic feedback
    - src/App.tsx - Pass currentCaseId prop

key-decisions:
  - Use rules-based engine over static explanations for contextual feedback
  - Reference exact span attribute values in explanations (e.g., db.connection_pool.wait_ms=4750)
  - Reset evaluation state on traceId change to prevent stale feedback
  - Provide targeted hints for incorrect guesses based on what user missed
  - Support both engine-driven and static fallback for backwards compatibility

patterns-established:
  - "EvaluationResult interface: { correct: boolean; explanation: string; hint?: string }"
  - "RootCauseRule pattern: evaluate() + explainCorrect() + explainIncorrect()"
  - "State reset pattern: useEffect watching traceId to clear previous evaluations"

requirements-completed: [LOOP-03]

duration: 6min
completed: 2026-03-03
---

# Phase 03 Plan 03: Root Cause Engine Summary

**Rules-based root cause evaluation engine with attribute-specific feedback generation and dynamic state management for the investigation phase.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-03T21:26:20Z
- **Completed:** 2026-03-03T21:32:08Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Created Root Cause Engine with rules-based evaluation system that inspects actual span attributes
- Implemented case-specific rules for hello-span-001 (connection pool diagnosis) with attribute-aware explanations
- Added 4 helper functions for span inspection (findSlowestSpan, findSpanWithAttribute, getPoolWaitMs, etc.)
- Updated case definitions to include root cause options with correct answers and static fallbacks
- Integrated engine with InvestigationView and RootCauseSelector for dynamic feedback display
- Implemented state reset behavior: evaluation clears automatically when user re-runs code (traceId change)
- Added targeted hints for incorrect guesses to guide users toward the correct diagnosis

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Root Cause Engine** - `8e6919a` (feat)
2. **Task 2: Update cases with root cause configurations** - `89ee6cb` (feat)
3. **Task 3: Integrate engine with UI and handle state reset** - `f91fccc` (feat)

**Plan metadata:** `[TBD after final commit]` (docs)

## Files Created/Modified

- `src/lib/rootCauseEngine.ts` - Rules-based evaluation engine with hello-span-001 and auto-magic-002 rules
- `src/data/cases.ts` - Added rootCauseOptions arrays for both cases
- `src/hooks/usePhase2Data.ts` - Extract rootCauseOptions from case definitions instead of hardcoded import
- `src/components/InvestigationView.tsx` - Added currentCaseId prop, evaluation state, and handleGuessSubmit
- `src/components/RootCauseSelector.tsx` - Added evaluationResult/onSubmitGuess props, dynamic feedback display
- `src/App.tsx` - Pass currentCaseId to InvestigationView

## Decisions Made

1. **Rules-based engine over static explanations** - Provides contextual feedback that references actual span attribute values (e.g., "db.connection_pool.wait_ms=4750") rather than generic text. This teaches users to interpret real observability data.

2. **State reset on traceId change** - useEffect watches traceId and clears evaluationResult, ensuring users don't see stale feedback after re-running code. This addresses the common pitfall of Root Cause Feedback Staleness noted in 03-RESEARCH.md.

3. **Targeted hints for incorrect guesses** - Each distractor option gets a specific hint guiding the user toward what to look for (e.g., "Look at db.connection_pool.wait_ms — is the time spent waiting or querying?").

4. **Backwards compatibility fallback** - RootCauseSelector still supports static option.correct when onSubmitGuess is not provided, allowing gradual migration.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None significant. TypeScript unused variable warnings were fixed inline during development.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Root Cause Engine is fully functional and integrated
- Ready for Phase 4 content authoring (additional case-specific rules)
- The engine architecture supports easy addition of new cases via RULES_REGISTRY
- Auto-magic-002 rules are placeholders and need proper implementation with real HTTP error scenarios

---
*Phase: 03-visualization-investigation*
*Completed: 2026-03-03*
