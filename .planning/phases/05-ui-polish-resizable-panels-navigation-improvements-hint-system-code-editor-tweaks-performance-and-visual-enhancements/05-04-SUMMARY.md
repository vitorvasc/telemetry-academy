---
phase: "05"
plan: "04"
subsystem: navigation
tags: [mobile, case-selector, progress-indicator, bottom-sheet]
dependency_graph:
  requires: ["05-03"]
  provides: ["phase-aware-progress-dots", "mobile-case-drawer"]
  affects: ["src/components/CaseSelector.tsx", "src/App.tsx"]
tech_stack:
  added: []
  patterns: ["bottom-sheet modal", "phase-aware status indicator", "TDD RED-GREEN"]
key_files:
  created:
    - src/components/MobileCaseDrawer.tsx
    - src/components/CaseSelector.test.tsx
  modified:
    - src/components/CaseSelector.tsx
    - src/App.tsx
decisions:
  - "ProgressDot inline component in CaseSelector — small enough to keep co-located with logic, avoids extra file"
  - "getPhaseStatus maps CaseProgress to PhaseStatus enum — investigation and complete both yield phase1done (amber)"
  - "MobileCaseDrawer uses sm:hidden — never visible on tablet/desktop, no SSR concerns"
metrics:
  duration: "4 min"
  completed_date: "2026-03-10"
  tasks_completed: 2
  files_changed: 4
---

# Phase 05 Plan 04: Navigation Improvements — Case Progress Indicators & Mobile Case Drawer Summary

**One-liner:** Phase-aware mini progress dots in CaseSelector tabs and a mobile bottom-sheet drawer for case switching without leaving the case view.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add phase-aware progress indicator to CaseSelector + unit tests (TDD) | f05a98b | CaseSelector.tsx, CaseSelector.test.tsx |
| 2 | Build MobileCaseDrawer and wire from App.tsx | c43c718 | MobileCaseDrawer.tsx, App.tsx |

## What Was Built

### Task 1: Phase-aware ProgressDot in CaseSelector

Added `getPhaseStatus(prog: CaseProgress): PhaseStatus` helper and inline `ProgressDot` component to `CaseSelector.tsx`. Replaces the previous `CheckCircle2` / `Circle` / `Lock` trio with a richer 5-state indicator:

- **solved** — green filled circle (`bg-green-400`)
- **phase1done** — amber half-ring (`bg-amber-400/60 border-amber-400`) — triggers when `phase === 'investigation'` or `'complete'`
- **active** — sky ring (`border-2 border-sky-400`) — in-progress but still in instrumentation phase
- **available** — slate ring (`border-slate-500`) — unlocked, not yet started
- **locked** — Lock SVG (`text-slate-700`)

Four unit tests cover each state using Vitest + @testing-library/react, following the TDD RED-GREEN cycle.

### Task 2: MobileCaseDrawer bottom-sheet

New `MobileCaseDrawer.tsx` component renders a fixed bottom sheet (`sm:hidden`) with:
- Semi-transparent black backdrop (`bg-black/70`) — tap to close
- Rounded-top sheet with header ("Switch Case" + X button)
- List of all cases with status icon (CheckCircle2 / Lock / ring div), name, difficulty, and "Current" badge
- Locked cases disabled; selecting an available/solved case calls `onSelect` + `onClose`

In `App.tsx`:
- Import `MobileCaseDrawer` and `ChevronDown`
- Add `showMobileDrawer` state
- Mobile case name `<div>` replaced with tappable `<button>` that shows chevron and opens drawer
- Drawer rendered conditionally alongside `ReviewModal` and `WelcomeModal`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused `screen` import from CaseSelector.test.tsx**
- **Found during:** Task 2 build verification
- **Issue:** TypeScript strict mode flagged `screen` as declared but never used (TS6133)
- **Fix:** Removed `screen` from the `@testing-library/react` import destructure
- **Files modified:** `src/components/CaseSelector.test.tsx`
- **Commit:** c43c718 (included in Task 2 commit)

## Verification

- `npm test`: 15/15 tests pass (3 files)
- `npm run build`: exits 0, no TypeScript errors

## Self-Check

- [x] `src/components/CaseSelector.tsx` — exists, contains `getPhaseStatus`
- [x] `src/components/MobileCaseDrawer.tsx` — exists, exports `MobileCaseDrawer`
- [x] `src/components/CaseSelector.test.tsx` — exists, 4 tests all passing
- [x] `src/App.tsx` — contains `showMobileDrawer`
- [x] Commit f05a98b — Task 1
- [x] Commit c43c718 — Task 2

## Self-Check: PASSED
