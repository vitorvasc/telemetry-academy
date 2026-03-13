---
phase: 06-plan-and-implement-final-case-list
plan: "07"
subsystem: content
tags: [case-authoring, phase2-data, root-cause-rules, capstone, loop-fix]
dependency_graph:
  requires: [06-06]
  provides: [case-009-complete, loop-05-verified]
  affects: [src/cases, src/data/phase2.ts, src/lib/rootCauseEngine.ts]
tech_stack:
  added: []
  patterns: [concept-first-case-structure, cascading-failure-scenario, rules-based-root-cause]
key_files:
  created:
    - src/cases/009-the-perfect-storm/case.yaml
    - src/cases/009-the-perfect-storm/setup.py
  modified:
    - src/data/phase2.ts
    - src/lib/rootCauseEngine.ts
    - public/sitemap.xml
decisions:
  - "Case 009 uses cascading failure scenario to synthesize all 8 prior concepts into one diagnostic challenge"
  - "3-service trace (auth/inventory/payment) with inventory.cache_hit=false as primary trigger makes cascade chain readable from span attributes"
  - "LOOP-05 all 6 criteria were already correctly implemented — no changes needed"
metrics:
  duration: 6 min
  completed_date: "2026-03-13"
  tasks_completed: 3
  files_changed: 5
---

# Phase 06 Plan 07: The Perfect Storm (Case 009) Summary

Authored the capstone case "The Perfect Storm" from scratch — a 3-service cascading failure scenario that synthesizes all 8 prior OTel concepts. Also verified LOOP-05 (CaseSolvedScreen) and confirmed all 6 criteria were already implemented correctly.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Author case.yaml and setup.py | 91ed1af | src/cases/009-the-perfect-storm/case.yaml, src/cases/009-the-perfect-storm/setup.py |
| 2 | Add Phase 2 data and root cause rules | 86da3f5 | src/data/phase2.ts, src/lib/rootCauseEngine.ts, public/sitemap.xml |
| 3 | Verify LOOP-05 CaseSolvedScreen | (no changes needed) | src/components/CaseSolvedScreen.tsx, src/App.tsx |

## What Was Built

### Case 009: The Perfect Storm

**case.yaml** — Expert difficulty capstone with:
- 6 concepts: cascading_failure, multi_signal, context_propagation, baggage, spans, distributed_tracing
- 5 validation rules: 3x span_exists (checkout.process, auth.validate, inventory.check) + 2x attribute_exists (inventory.cache_hit, auth.connection_pool.wait_ms)
- 4 root cause options; option b (inventory cache stale) is correct
- Concept-first description spanning 6 sections covering all prior cases

**setup.py** — 55-line multi-service boilerplate with:
- Three service functions: process_checkout, validate_auth, check_inventory, charge_payment
- Baggage + context propagation boilerplate shown (not a gap)
- TODO gaps: 3 spans + 2 diagnostic attributes
- MockAuth, MockInventory, MockPayment pass-through classes

**phase2.ts** — Cascade trace with 4 spans:
- checkout.process (8400ms, error) → auth.validate (3250ms, ok, pool_waiting=47) → inventory.check (12ms, ok, cache_hit=false) → payment.charge (45ms, error, rejection_reason=out_of_stock)
- 4 correlated logs from 3 services
- Key diagnostic: inventory.cached_stock=0 vs inventory.actual_stock=142 (1 day stale cache)

**rootCauseEngine.ts** — 4 rules for case 009:
- Rule a: always false; explains payment.rejection_reason=out_of_stock ≠ timeout
- Rule b (correct): evaluates `inventory.cache_hit === 'false'`; explains full cascade chain with data-driven attributes
- Rule c: always false; explains auth.connection_pool.wait_ms=3200 is a symptom not the trigger
- Rule d: always false; explains single inventory.check span in trace disproves double-validation

### LOOP-05 Verification

All 6 CaseSolvedScreen criteria were confirmed correct — no changes needed:

1. `CaseSolvedScreen` renders when `appPhase === 'solved'` — YES (App.tsx line 497)
2. Attempts stat: `progress.attempts` rendered as "Attempts" with color coding — YES (CaseSolvedScreen.tsx line 79)
3. Time stat: `durationMs = timeSolvedMs - timeStartedMs` computed and rendered — YES (lines 31-33, 85)
4. Star scoring: `getScore(attempts, durationMs)` → 1-3 stars rendered with animation — YES (getScore function + Star icons)
5. "What you learned": `solvedCase.concepts` mapped to list items — YES (lines 110-116)
6. "Review Investigation" button: `onReview` → `setShowReviewModal(true)` → ReviewModal — YES (App.tsx line 350)

## Test Results

All 180 tests pass. No TypeScript errors (`tsc --noEmit` clean).

## Deviations from Plan

**1. [Rule 1 - Bug] ESLint escape character in template literal**
- **Found during:** Task 2 commit
- **Issue:** `it\'s` inside a template literal is an unnecessary escape character
- **Fix:** Changed `it\'s` to `it's` (unescaped apostrophe is valid in template literals)
- **Files modified:** src/lib/rootCauseEngine.ts (line 712)
- **Commit:** 86da3f5 (fixed inline before commit)

## Self-Check: PASSED

Files verified:
- src/cases/009-the-perfect-storm/case.yaml — FOUND
- src/cases/009-the-perfect-storm/setup.py — FOUND
- phase2Registry entry for 009-the-perfect-storm — FOUND in src/data/phase2.ts
- RULES_REGISTRY entry for 009-the-perfect-storm — FOUND in src/lib/rootCauseEngine.ts
- sitemap.xml case 009 URL — FOUND

Commits verified:
- 91ed1af — FOUND (case 009 case.yaml + setup.py)
- 86da3f5 — FOUND (phase2 data + root cause rules)
