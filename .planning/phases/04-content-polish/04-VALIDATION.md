---
phase: 4
slug: content-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + @testing-library/react |
| **Config file** | vite.config.ts |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run && npm run build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test -- --run && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | CASE-01 | manual | run code in browser, check validation passes | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | CASE-01 | manual | verify phase2 data appears in investigation | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | CASE-01 | build | `npm run build` | ✅ | ⬜ pending |
| 04-02-01 | 02 | 1 | CASE-02 | manual | run auto-magic case end-to-end | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | CASE-02 | unit | `npm run test -- --run` (yaml validation) | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 1 | CASE-03 | manual | yaml editor validates collector config | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | LOOP-05 | manual | solve case → solved screen appears | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 2 | LOOP-05 | manual | review modal opens with trace summary | ❌ W0 | ⬜ pending |
| 04-03-03 | 03 | 2 | CASE-01..03 | build | `npm run build` (TypeScript clean) | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/validation.yaml.test.ts` — unit tests for `yaml_key_exists` validation type
- [ ] `src/__tests__/caseSolvedScreen.test.tsx` — smoke test CaseSolvedScreen renders with mock props

*Existing vitest infrastructure covers build verification.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| hello-span-001 runs in Pyodide, spans captured | CASE-01 | Requires live browser + WASM | Open case, paste solution, click Run, watch validation checks pass |
| auto-magic-002 urllib instrumentation works | CASE-02 | Pyodide micropip install required | Open case, run setup code, verify HTTP spans appear |
| The Collector YAML validation works | CASE-03 | YAML editor interaction | Open case, edit collector.yaml, click Validate, check checks pass |
| Case Solved screen appears after correct root cause | LOOP-05 | Requires full game state | Play case to completion, select correct root cause, verify screen appears |
| Welcome modal shows on first visit | LOOP-05 | localStorage first-visit state | Clear localStorage, reload, verify modal appears |
| Mobile layout renders correctly | — | Requires device/devtools | Open in Chrome devtools mobile mode, verify no layout breaks |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
