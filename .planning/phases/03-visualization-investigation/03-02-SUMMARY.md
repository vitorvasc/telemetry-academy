---
phase: 03-visualization-investigation
plan: 02
subsystem: visualization

requires:
  - phase: 03-01
    provides: usePhase2Data hook with span transformation

provides:
  - Synthetic log generation from span data
  - LogViewer with trace correlation and persistent filters
  - Filter persistence across tab switches using display:none pattern

affects:
  - 03-03 (Root Cause Engine needs log data)

tech-stack:
  added:
    - src/lib/logGenerator.ts
  patterns:
    - Controlled/uncontrolled component pattern for filter state
    - display:none for tab state persistence

key-files:
  created:
    - src/lib/logGenerator.ts
  modified:
    - src/hooks/usePhase2Data.ts
    - src/components/LogViewer.tsx
    - src/components/InvestigationView.tsx
    - src/types.ts

key-decisions:
  - "Used controlled/uncontrolled pattern for LogViewer filter to support both standalone and integrated use"
  - "Used display:none instead of conditional rendering to preserve component state across tab switches"
  - "Added RootCauseOption type to src/types.ts to fix missing type reference"

requirements-completed:
  - VIS-03

duration: 4min
completed: 2026-03-03T21:23:16Z
---

# Phase 03 Plan 02: Synthetic Log Generation Summary

**Synthetic log generation system that creates realistic log entries from span data with trace correlation and persistent filters.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-03T21:19:14Z
- **Completed:** 2026-03-03T21:23:16Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

1. **Synthetic Log Generation Library** - Created `src/lib/logGenerator.ts` that generates 2-4 logs per span (start, optional warning/error, end) with contextual messages based on span attributes
2. **Log Data Integration** - Integrated log generation into `usePhase2Data` hook so logs are dynamically generated from span data
3. **Filter Persistence** - Implemented filter persistence across tab switches using `display:none` pattern and lifted state
4. **Trace Correlation** - Blue correlation bar highlights logs matching the current trace_id

## Task Commits

Each task was committed atomically:

1. **Task 1: Create synthetic log generation library** - `e7ff590` (feat)
2. **Task 2: Integrate log generation into usePhase2Data hook** - `c8ccd09` (feat)
3. **Task 3: Implement filter persistence and trace correlation** - `8dddc98` (feat)

**Plan metadata:** docs commit to follow

## Files Created/Modified

- `src/lib/logGenerator.ts` (new) - Synthetic log generation from span data
- `src/hooks/usePhase2Data.ts` - Integrated log generation into data transformation
- `src/components/LogViewer.tsx` - Added controlled filter props for persistence
- `src/components/InvestigationView.tsx` - Lifted filter state, use display:none for tabs
- `src/types.ts` - Added RootCauseOption interface

## Decisions Made

1. **Controlled/Uncontrolled Pattern**: LogViewer supports both controlled (via props) and uncontrolled (internal state) filter modes. This allows it to work standalone (internal state) or integrated with persistence (controlled).

2. **display:none for Tab Persistence**: Instead of conditional rendering (`activeTab === 'logs' && <LogViewer />`), we use `display: none` to keep the component mounted. This preserves filter state, scroll position, and any internal component state when switching tabs.

3. **Timestamp Format**: Used HH:MM:SS.mmm string format for log timestamps - matches the Phase2Data format and is simpler for display than Date objects.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing RootCauseOption type**
- **Found during:** Task 2 (Integrate log generation)
- **Issue:** `usePhase2Data.ts` referenced `caseDef?.phase2?.rootCauseOptions` but this property didn't exist on `Phase2Config` type
- **Fix:** Added `RootCauseOption` interface and `rootCauseOptions?: RootCauseOption[]` to `Phase2Config` in `src/types.ts`
- **Files modified:** `src/types.ts`
- **Verification:** TypeScript build passes
- **Committed in:** c8ccd09 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor type fix required to proceed with compilation. No impact on plan scope.

## Issues Encountered

None - plan executed smoothly after type fix.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Log generation complete and integrated
- LogViewer ready with filter persistence
- Trace correlation working (blue bar)
- Ready for Plan 03-03: Root Cause Engine (which needs log data and root cause options)

---
*Phase: 03-visualization-investigation*
*Completed: 2026-03-03*
