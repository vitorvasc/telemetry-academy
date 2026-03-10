---
phase: 05-ui-polish-resizable-panels-navigation-improvements-hint-system-code-editor-tweaks-performance-and-visual-enhancements
plan: "02"
subsystem: ui
tags: [react, lucide-react, testing-library, vitest, hints, validation]

# Dependency graph
requires:
  - phase: 02-validation-core-loop
    provides: "Progressive hint system with hintMessage/guidedMessage fields on ValidationResult"
provides:
  - "Always-visible hints in InstructionsPanel (no toggle required)"
  - "Lightbulb icon on failing ValidationPanel rows when hint is unlocked (attemptsOnThisRule >= 1)"
  - "Amber callout box for guided messages (attemptsOnThisRule >= 3)"
  - "Grey hint text at 1-2 attempts below description"
  - "InstructionsPanel unit tests with @testing-library/react"
affects: [ui-integration-testing, phase-verifier]

# Tech tracking
tech-stack:
  added: ["@testing-library/react", "@testing-library/jest-dom", "@testing-library/user-event"]
  patterns: ["Always-visible hints (no progressive disclosure for core help)", "Progressive visual escalation in validation feedback"]

key-files:
  created:
    - src/components/InstructionsPanel.test.tsx
  modified:
    - src/components/InstructionsPanel.tsx
    - src/components/ValidationPanel.tsx

key-decisions:
  - "Hints always visible in InstructionsPanel — progressive disclosure was hiding key information from struggling users"
  - "Lightbulb icon at attempt 1+ signals to users that a hint has unlocked without requiring them to re-read the panel"
  - "aria-label instead of title on Lightbulb SVG — lucide-react LucideProps does not accept title prop"

patterns-established:
  - "Static header for always-visible collapsible-replacement: div with flex items-center gap-2 instead of button"
  - "Icon escalation: XCircle red (0 attempts) → XCircle amber (guided, 3+), Lightbulb amber/70 alongside at 1+"
  - "Amber callout: bg-amber-500/10 border border-amber-500/30 text-amber-300 animate-slide-in"

requirements-completed: []

# Metrics
duration: 8min
completed: 2026-03-10
---

# Phase 5 Plan 02: Hint System Visibility Summary

**Always-visible hints in InstructionsPanel plus progressive validation feedback with Lightbulb signal and amber guided callout in ValidationPanel**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-10T09:44:00Z
- **Completed:** 2026-03-10T09:52:00Z
- **Tasks:** 2 (TDD + implementation)
- **Files modified:** 3 + package.json (dependency install)

## Accomplishments
- InstructionsPanel hints render immediately — removed `showHints` toggle state, `ChevronDown`/`ChevronRight` imports, and `useState`
- ValidationPanel now shows a `Lightbulb` icon alongside the `XCircle` when `attemptsOnThisRule >= 1`
- Hint text (grey, xs) appears below the description at 1-2 attempts
- Amber callout box (`guidedMessage`) appears at 3+ attempts with animation
- Added `@testing-library/react` and wrote 3 unit tests covering always-visible hints

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove InstructionsPanel hints toggle — always visible** - `f46f372` (feat + test)
2. **Task 2: Add Lightbulb indicator and amber callout to ValidationPanel** - `89c25c2` (feat)

## Files Created/Modified
- `src/components/InstructionsPanel.tsx` — Removed toggle/state, rendered hints unconditionally
- `src/components/InstructionsPanel.test.tsx` — 3 Vitest + testing-library tests
- `src/components/ValidationPanel.tsx` — Lightbulb icon + hint text + amber callout

## Decisions Made
- Used `aria-label` instead of `title` on the Lightbulb SVG because lucide-react's `LucideProps` does not expose `title` as a valid prop; TypeScript build error caught this.
- Installed `@testing-library/react` as a devDependency (was missing from project) — required for TDD task.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed @testing-library/react (missing dependency)**
- **Found during:** Task 1 (TDD setup)
- **Issue:** @testing-library/react not installed; test imports would fail
- **Fix:** `npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event`
- **Files modified:** package.json, package-lock.json
- **Verification:** Tests pass after install
- **Committed in:** f46f372 (Task 1 commit)

**2. [Rule 1 - Bug] Replaced `title` prop with `aria-label` on Lightbulb icon**
- **Found during:** Task 2 (build verification)
- **Issue:** `title` is not a valid prop on LucideProps — TypeScript error TS2322
- **Fix:** Changed `title="Hint available"` to `aria-label="Hint available"`
- **Files modified:** src/components/ValidationPanel.tsx
- **Verification:** `npm run build` exits 0
- **Committed in:** 89c25c2 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking dependency, 1 type bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None beyond the two auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Hint system polish complete; ValidationPanel now escalates visually as users make more attempts
- Phase 5 Plan 03 can proceed (next wave of UI improvements)

---
*Phase: 05-ui-polish-resizable-panels-navigation-improvements-hint-system-code-editor-tweaks-performance-and-visual-enhancements*
*Completed: 2026-03-10*
