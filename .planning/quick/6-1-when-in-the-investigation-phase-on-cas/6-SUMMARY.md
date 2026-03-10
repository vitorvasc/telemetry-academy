---
phase: quick-06
plan: 1
subsystem: investigation-ux
tags: [trace-viewer, phase-navigation, ux-bug-fix]
dependency_graph:
  requires: []
  provides: [collapsed-spans, realistic-trace-id, persistent-phase-unlock]
  affects: [TraceViewer, phase2 data, App phase state]
tech_stack:
  added: []
  patterns: [crypto.getRandomValues for hex ID generation, decoupled UI state from app phase]
key_files:
  created: []
  modified:
    - src/components/TraceViewer.tsx
    - src/data/phase2.ts
    - src/App.tsx
decisions:
  - Span collapse: null default instead of 'span-002' — users discover spans intentionally
  - Trace ID: module-level const (not React state) — stable for entire session without extra state
  - Log traceId: updated to match generated ID — prevents mismatch between TraceViewer and LogViewer
  - phaseUnlocked: lastPassedCodeRef.current !== null check instead of appPhase check — phase is about code state not UI state
metrics:
  duration: "~2 min"
  completed: "2026-03-10"
  tasks: 3
  files: 3
---

# Quick Task 6 Summary: Investigation Phase UX Bug Fixes

**One-liner:** Three targeted UX fixes — collapsed spans on load, `crypto.getRandomValues` 32-char trace ID with copy button, and phase unlock decoupled from appPhase.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Collapse spans by default, add Trace ID copy button | 301af0e | TraceViewer.tsx |
| 2 | Generate realistic 32-char hex trace ID at module load | 763adc3 | phase2.ts |
| 3 | Decouple phaseUnlocked from appPhase | fe6f622 | App.tsx |

## Changes Made

### Task 1 — TraceViewer.tsx
- Changed `useState<string | null>('span-002')` to `useState<string | null>(null)` — no span auto-expands
- Added `copied` state (`useState<boolean>(false)`)
- Added `handleCopyTraceId` handler using `navigator.clipboard.writeText` and 1500ms reset timeout
- Wrapped Trace ID display in a `<button>` with `Copy` lucide-react icon
- Shows green "Copied!" text on click, reverts to truncated ID + copy icon after 1500ms

### Task 2 — phase2.ts
- Added `generateTraceId()` helper using `crypto.getRandomValues(new Uint8Array(16))`
- Extracted `helloSpanTraceId` constant at module scope (stable for session)
- Replaced hardcoded `'a1b2c3d4e5f6789012345678'` with `helloSpanTraceId` for both `traceId` field and all 6 log entry `traceId` fields

### Task 3 — App.tsx
- Changed `phaseUnlocked` from requiring `appPhase === 'investigation' || 'solved'` to only checking `lastPassedCodeRef.current !== null && code === lastPassedCodeRef.current`
- Investigation tab stays enabled when user clicks back to instrumentation tab
- Editing code still re-locks investigation (existing behavior preserved)
- Switching between cases: `switchCase()` already sets `lastPassedCodeRef.current` based on saved progress phase, so cross-case behavior is correct

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `src/components/TraceViewer.tsx` modified
- [x] `src/data/phase2.ts` modified
- [x] `src/App.tsx` modified
- [x] Commits 301af0e, 763adc3, fe6f622 exist
- [x] `npm run build` passes with no errors
