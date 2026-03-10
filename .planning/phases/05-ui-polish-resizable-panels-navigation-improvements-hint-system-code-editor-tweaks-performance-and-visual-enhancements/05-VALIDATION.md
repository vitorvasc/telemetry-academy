---
phase: 5
slug: ui-polish-resizable-panels-navigation-improvements-hint-system-code-editor-tweaks-performance-and-visual-enhancements
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `vite.config.ts` (inline `test` block, `environment: jsdom`) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|----------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 0 | InstructionsPanel always-visible hints stub | unit | `npm test` | ❌ W0 | ⬜ pending |
| 5-01-02 | 01 | 0 | CaseSelector phase indicator stub | unit | `npm test` | ❌ W0 | ⬜ pending |
| 5-01-03 | 01 | 0 | python.worker loading-stage message stub | unit | `npm test` | ❌ W0 | ⬜ pending |
| 5-02-01 | 02 | 1 | Panel layout renders without crash | unit | `npm test` | ❌ W0 | ⬜ pending |
| 5-02-02 | 02 | 1 | Panel size persistence (autoSaveId) | manual | — | N/A | ⬜ pending |
| 5-03-01 | 03 | 1 | Hint always-visible (no toggle) | unit | `npm test` | ❌ W0 | ⬜ pending |
| 5-04-01 | 04 | 1 | CaseSelector phase icon renders correctly | unit | `npm test` | ❌ W0 | ⬜ pending |
| 5-05-01 | 05 | 1 | loading-stage messages emitted correctly | unit | `npm test` | ❌ W0 | ⬜ pending |
| 5-06-01 | 06 | 1 | Font size pref saved to localStorage | unit | `npm test` | ❌ W0 | ⬜ pending |
| 5-07-01 | 07 | 1 | Monaco keyboard shortcut | manual | — | N/A | ⬜ pending |
| 5-08-01 | 08 | 2 | Monaco lazy load defers bundle | manual | — | N/A | ⬜ pending |
| 5-09-01 | 09 | 2 | Mobile drawer tap-to-open | manual | — | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/InstructionsPanel.test.tsx` — stubs for always-visible hints (remove showHints toggle)
- [ ] `src/components/CaseSelector.test.tsx` — stubs for phase-aware progress indicator rendering
- [ ] `src/workers/python.worker.test.ts` — extend to cover `loading-stage` message type

*Existing test infrastructure in vite.config.ts with jsdom covers all unit tests. No framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Panel size persistence via autoSaveId | Resizable panels | Integration with DOM resize events — not practical in jsdom | Resize panel in browser, reload page, verify panel size restored |
| Monaco keyboard shortcut registration | Code editor tweaks | Requires real Monaco instance — jsdom cannot run Monaco | Open code editor, press Cmd+S/Ctrl+S, verify code runs |
| Monaco lazy load defers bundle | Performance | Requires real Vite build output analysis | Run `npm run build`, check chunk output for Monaco separate chunk |
| Mobile drawer opens on mobile case name tap | Navigation | Requires touch event simulation | Open on mobile viewport, tap case name, verify drawer opens |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
