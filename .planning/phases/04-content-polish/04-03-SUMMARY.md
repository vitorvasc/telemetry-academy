---
phase: 04-content-polish
plan: 03
subsystem: ui
tags: [modal, onboarding, mobile, loading-states, react]

# Dependency graph
requires:
  - phase: 04-01
    provides: hello-span-001 case working
  - phase: 04-02
    provides: auto-magic-002 and the-collector-003 cases working
provides:
  - ReviewModal component for post-case investigation review
  - WelcomeModal for first-time user onboarding
  - HomePage polish with instrument/investigate/solve teaser
  - Mobile horizontal scroll for trace waterfall
  - Verified loading/empty/error states
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Fixed overlay modals with backdrop button pattern
    - Empty-state handling for yaml-config cases
    - First-visit onboarding with localStorage persistence
    - Horizontal scroll container for mobile data tables

key-files:
  created:
    - src/components/ReviewModal.tsx - Modal showing phase2 spans + correct root cause explanation
    - src/components/WelcomeModal.tsx - First-visit welcome modal explaining the OTel learning loop
  modified:
    - src/App.tsx - showReviewModal state, reviewInvestigation fix, WelcomeModal wiring
    - src/types/progress.ts - Added hasSeenWelcome field
    - src/hooks/useAcademyPersistence.ts - Exposes hasSeenWelcome and markWelcomeSeen
    - src/components/HomePage.tsx - Added hero teaser "Instrument → Investigate → Solve"
    - src/components/TraceViewer.tsx - Added overflow-x-auto for mobile horizontal scroll

key-decisions: []

patterns-established:
  - "Modal backdrop as button element for iOS tap-to-close support"
  - "yaml-config cases show empty-state message in ReviewModal instead of failing"
  - "First-visit state persisted to localStorage with schema versioning"

requirements-completed:
  - LOOP-05
  - CASE-01
  - CASE-02
  - CASE-03

# Metrics
duration: 10min
completed: 2026-03-09
---

# Phase 04 Plan 03: Review Modal, Onboarding, and Polish Summary

**ReviewModal wired to CaseSolvedScreen, WelcomeModal for first-time onboarding, HomePage polish, mobile fixes, and verified loading/empty/error states**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-09T15:50:49Z
- **Completed:** 2026-03-09T16:00:47Z
- **Tasks:** 4
- **Files modified:** 7

## Accomplishments
- ReviewModal shows user's spans table and correct root cause explanation
- ReviewModal handles yaml-config cases with empty-state message (no live spans)
- WelcomeModal explains instrument → investigate → solve loop on first visit
- WelcomeModal persistence to localStorage with hasSeenWelcome flag
- HomePage shows "Instrument → Investigate → Solve" teaser in hero section
- Trace waterfall has horizontal scroll on mobile (overflow-x-auto)
- Verified loading states: Pyodide init spinner, code-running state, Phase 2 empty state

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire ReviewModal** - `a7093f5` (feat)
2. **Task 2: Add welcome modal + HomePage polish** - `b1010bb` (feat)
3. **Task 3: Loading/transition states** - No commit (already implemented)
4. **Task 4: Mobile layout fixes** - `36dc882` (feat)

**Plan metadata:** [pending]

## Files Created/Modified
- `src/components/ReviewModal.tsx` - New component showing spans table and root cause explanation
- `src/components/WelcomeModal.tsx` - New component with 3-step onboarding flow
- `src/App.tsx` - Added showReviewModal state, fixed reviewInvestigation, wired WelcomeModal
- `src/types/progress.ts` - Added hasSeenWelcome field to PersistedState
- `src/hooks/useAcademyPersistence.ts` - Exposes hasSeenWelcome and markWelcomeSeen
- `src/components/HomePage.tsx` - Added hero teaser for instrument/investigate/solve flow
- `src/components/TraceViewer.tsx` - Added overflow-x-auto for mobile horizontal scroll

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

All three cases (hello-span-001, auto-magic-002, the-collector-003) are now fully playable end-to-end:
- CaseSolvedScreen appears after correct root cause selection
- Review Investigation opens modal (does not navigate away)
- WelcomeModal shows on first visit and persists dismissal
- Mobile layout responsive with horizontal scroll and preserved tab state

Ready for Phase 5 or additional content cases.

---
*Phase: 04-content-polish*
*Completed: 2026-03-09*
