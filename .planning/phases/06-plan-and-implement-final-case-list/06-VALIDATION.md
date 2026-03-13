---
phase: 6
slug: plan-and-implement-final-case-list
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-13
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## QA Gate for Content Authoring

This phase is pure content authoring (YAML, Python, TypeScript data). The accepted QA gate is:

**`validate-case` skill** — the `.claude/skills/validate-case/` checklist run against each case after authoring. This covers:
- case.yaml structural correctness (all required fields, valid check types)
- setup.py under line limit with `# TODO:` gaps
- phase2.ts entry exists and is internally consistent
- rootCauseEngine.ts has matching RULES_REGISTRY entry
- Root cause rule 'b' evaluates correctly against the case's own phase2 data

**Automated unit test stubs are optional enhancements, not required for this phase.** The RESEARCH.md recommendation (line 57) explicitly endorses `validate-case` as the primary QA mechanism: *"validate each case with the validate-case skill before moving to the next wave."* Vitest unit tests for individual case validation rules add value but are not the Nyquist gate for content-authoring work.

Wave 0 is satisfied by the `validate-case` skill being available and applied after each plan wave.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (detected from `vite.config.ts`) |
| **Config file** | `vite.config.ts` (test field present) |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~15 seconds |
| **Case QA skill** | `.claude/skills/validate-case/` |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test` + run `validate-case` skill on newly authored cases
- **Before `/gsd:verify-work`:** Full suite must be green + all 9 cases pass validate-case
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 06-01-01 | 01 | 1 | CASE-01 rewrite | validate-case | `npm run test -- --run` + validate-case | ⬜ pending |
| 06-01-02 | 01 | 1 | CASE-02 rewrite | validate-case | `npm run test -- --run` + validate-case | ⬜ pending |
| 06-01-03 | 01 | 1 | CASE-03 rewrite | validate-case | `npm run test -- --run` + validate-case | ⬜ pending |
| 06-02-01 | 02 | 2 | CASE-04 new | validate-case | `npm run test -- --run` + validate-case | ⬜ pending |
| 06-02-02 | 02 | 2 | CASE-05 new | validate-case | `npm run test -- --run` + validate-case | ⬜ pending |
| 06-03-01 | 03 | 3 | CASE-06 new | validate-case | `npm run test -- --run` + validate-case | ⬜ pending |
| 06-03-02 | 03 | 3 | CASE-07 new | validate-case | `npm run test -- --run` + validate-case | ⬜ pending |
| 06-04-01 | 04 | 4 | CASE-08 new | validate-case | `npm run test -- --run` + validate-case | ⬜ pending |
| 06-04-02 | 04 | 4 | CASE-09 new | validate-case | `npm run test -- --run` + validate-case | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Status

Wave 0 is **complete** — the `validate-case` skill in `.claude/skills/validate-case/` is the established QA gate for this content-authoring phase. No new test stubs are required before execution begins.

**Optional enhancement (post-phase):** Vitest unit tests for each case's validation rules (one test file per case, verifying correct OTel output passes all checks and incorrect output fails). These would add regression coverage but are not blocking.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Browser smoke: all 9 cases load without console errors | CONTENT | Requires live Pyodide runtime in browser | `npm run dev` → click each case → run code → verify no console errors |
| Phase 2 trace waterfall renders correctly for each case | CONTENT | Visual validation of span layout | Navigate to investigation phase for each case, verify waterfall renders |
| Root cause feedback is attribute-specific (not generic) | CONTENT | Semantic quality check | Select each wrong answer, verify explanation references real span data |
| Concept-first instructions are clear | CONTENT | Readability/UX judgment | Read Phase 1 instructions for each case as a learner would |
| CaseSolvedScreen renders attempts, time, stars, concepts | LOOP-05 | Visual/functional verification | Solve any case, observe CaseSolvedScreen renders all 4 elements |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or validate-case QA gate
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 satisfied by validate-case skill availability
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
