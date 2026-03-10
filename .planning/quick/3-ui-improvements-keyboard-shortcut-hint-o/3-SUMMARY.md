---
phase: quick-03
plan: 1
subsystem: editor-ui
tags: [ux, monaco, keyboard-shortcuts, navigation]
dependency_graph:
  requires: []
  provides: [keyboard-shortcut-hint, uncontrolled-monaco, phase-switcher-clarity]
  affects: [src/components/ValidationPanel.tsx, src/components/CodeEditor.tsx, src/App.tsx]
tech_stack:
  added: []
  patterns: [uncontrolled-monaco-with-caseKey-reset, platform-detect-at-render-time]
key_files:
  created: []
  modified:
    - src/components/ValidationPanel.tsx
    - src/components/CodeEditor.tsx
    - src/App.tsx
decisions:
  - "Uncontrolled Monaco via defaultValue + imperative caseKey reset — eliminates cursor jumps without sacrificing case-switch reset behaviour"
  - "isMac const at component render time (not a hook) — simpler than useEffect/useState for a static platform value"
  - "latestValueRef tracks value prop so caseKey useEffect always applies current initial code without stale closures"
  - "Lock icon on Investigate button without text label — icon + title tooltip communicates lock state without widening button"
metrics:
  duration: "~2 min"
  completed: "2026-03-10"
  tasks_completed: 3
  files_changed: 3
---

# Quick Task 3: UI Improvements — Keyboard Shortcut Hint, Monaco Cursor Fix, Phase Switcher Clarity

One-liner: Platform-adaptive keyboard shortcut badge on Check Code, uncontrolled Monaco to eliminate cursor-jump-to-EOF, and visually distinct phase switcher with lock icon and prominent back button border.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add keyboard shortcut hint to Check Code button | d8f4483 | ValidationPanel.tsx |
| 2 | Fix Monaco cursor jump — uncontrolled defaultValue mode | 3d63288 | CodeEditor.tsx, App.tsx |
| 3 | Improve phase switcher UX | bfe89e8 | App.tsx |

## What Was Built

### Task 1 — Keyboard shortcut hint on Check Code button

Added a `<kbd>` badge after "Check Code" text showing `⌘↵` on macOS and `Ctrl+↵` on other platforms. Platform is detected via `navigator.platform.toUpperCase().includes('MAC')` at component render time — a plain const, not a hook. The badge is `hidden sm:inline-block` to prevent cramping on mobile. Only appears in the active (not loading, not validating, not complete) state.

### Task 2 — Monaco cursor jump fix

Root cause: `<Editor value={value} />` is a fully-controlled prop. Monaco calls `model.setValue()` internally on every re-render (e.g. after auto-save writes back to React state), resetting the cursor to end-of-file.

Fix: switched to `defaultValue={value}` (uncontrolled) so Monaco manages its own content after mount. Added `caseKey?: string` prop; a `useEffect` watching `caseKey` imperatively calls `model.setValue()` + `setPosition({ lineNumber: 1, column: 1 })` — fires only on case switch, never on keystrokes. A `latestValueRef` keeps the current value in scope for the effect to avoid stale closures. Both desktop and mobile `<CodeEditor>` instances in App.tsx now pass `caseKey={currentCaseId}`.

### Task 3 — Phase switcher UX improvements

- Back button: always-visible "Cases" label (removed `hidden sm:inline`), smaller arrow icon, `border border-slate-700` + `text-slate-500` styling to look like a secondary action, not a tab.
- Phase switcher container: `bg-slate-950` + `border border-slate-700` for stronger visual separation (was `bg-slate-900`, no border).
- Button padding: `px-3 sm:px-4 py-1.5` (was `px-2 sm:px-3 py-1`).
- Number prefix always visible: removed `hidden sm:inline` from "1 · " / "2 · " spans.
- Lock icon (`<Lock className="w-3 h-3 opacity-50" />`) displayed inside Investigate button when `!phaseUnlocked`, with `title="Complete Phase 1 to unlock"` tooltip.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- `src/components/ValidationPanel.tsx` — modified: yes
- `src/components/CodeEditor.tsx` — modified: yes
- `src/App.tsx` — modified: yes
- Commit d8f4483: exists
- Commit 3d63288: exists
- Commit bfe89e8: exists
- `npm run build` passed on all three tasks: yes

## Self-Check: PASSED
