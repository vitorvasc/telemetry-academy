---
phase: quick-04
plan: 01
subsystem: layout
tags: [ui, layout, investigation, resizable-panels]
dependency_graph:
  requires: []
  provides: [investigation-split-layout]
  affects: [src/App.tsx]
tech_stack:
  added: []
  patterns: [react-resizable-panels split layout, shared panel persistence key]
key_files:
  created: []
  modified:
    - src/App.tsx
decisions:
  - "Reuse ta-panel-main / mainGroupRef / mainLayout so panel split size is shared between instrumentation and investigation phases"
  - "Omit onStartInvestigation prop on InstructionsPanel — user is already in investigation"
  - "Mobile branch (flex sm:hidden) keeps InvestigationView full-width with no InstructionsPanel, matching original behaviour"
metrics:
  duration: "3 min"
  completed: "2026-03-10"
---

# Quick Task 04: Keep InstructionsPanel Visible in Investigation Summary

**One-liner:** Added 25/75 resizable split layout to investigation phase so users can reference case context while investigating, reusing the existing panel persistence key.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add InstructionsPanel to investigation phase layout | 2611d92 | src/App.tsx |

## What Was Built

The investigation phase previously replaced the entire content area with a full-width `InvestigationView`, hiding the case description and Phase 1 hints. Now:

- **Desktop (sm+):** A horizontal `Group` with `mainGroupRef` / `mainLayout` (shared with instrumentation) renders `InstructionsPanel` on the left (25% default, 15–45% range, scrollable) and `InvestigationView` on the right (75% default, 40% min), separated by a draggable `Separator`.
- **Mobile (< sm):** A `flex sm:hidden` div renders `InvestigationView` full-width, matching the prior behaviour.

The no-telemetry-data fallback is preserved in both branches.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `src/App.tsx` modified: confirmed
- Commit 2611d92 exists: confirmed
- `npx tsc --noEmit`: no errors
