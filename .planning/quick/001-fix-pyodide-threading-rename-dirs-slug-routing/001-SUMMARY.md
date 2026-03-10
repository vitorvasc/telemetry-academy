---
phase: quick-001
plan: 01
subsystem: cases, routing
tags: [rename, routing, wouter, caseId]
key-files:
  modified:
    - src/cases/001-hello-span/case.yaml
    - src/cases/002-auto-magic/case.yaml
    - src/cases/003-the-collector/case.yaml
    - src/data/caseLoader.ts
    - src/lib/rootCauseEngine.ts
    - src/hooks/useAcademyPersistence.ts
    - src/main.tsx
    - src/App.tsx
    - package.json
decisions:
  - "Use wouter over react-router: 1.6kB zero-dep SPA router; same hook API as react-router v6"
  - "Option A routing approach: minimal diff — derive showHome from URL, keep existing App logic intact"
  - "localStorage migration note only: dev-phase project has no real users, stale keys are acceptable"
metrics:
  duration: "2.5 min"
  completed: "2026-03-10"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 9
---

# Quick Task 001: Rename Dirs + Slug Routing — Summary

**One-liner:** Renamed case dirs to numbered-prefix format (001-hello-span, 002-auto-magic, 003-the-collector) and added wouter URL-based routing so cases load at /case/:id.

## Tasks Completed

### Task 1: Rename case directories and update all caseId references

**Commit:** `7c9987e`

**What was done:**
- `git mv` renamed all three case directories: `hello-span-001` → `001-hello-span`, `auto-magic-002` → `002-auto-magic`, `the-collector-003` → `003-the-collector` (git history preserved)
- Updated `id:` field in all three `case.yaml` files to match new directory names
- Updated `RULES_REGISTRY` keys in `rootCauseEngine.ts` from old to new caseId strings
- Updated all comments in `rootCauseEngine.ts` and `caseLoader.ts` that referenced old IDs
- Added localStorage migration note to `useAcademyPersistence.ts` (no code changes needed — comment only)

**Verification:** `npm run build` exits 0 with no TypeScript errors. `phase2.ts` confirmed clean (uses TS variable names like `helloSpanPhase2`, not caseId strings — no changes needed there).

### Task 2: Install wouter and add /case/:id slug routing

**Commit:** `92a476e`

**What was done:**
- Installed `wouter@^3.9.0`
- Wrapped `<App />` with `<Router>` in `main.tsx`
- Replaced `const [showHome, setShowHome] = useState(true)` with URL-derived boolean: `const showHome = !matchCase` (from `useRoute('/case/:id')`)
- Added `useEffect` to sync `currentCaseId` from URL params on mount/route change (handles direct URL navigation and refresh)
- `goToCase(id)` now calls `setLocation('/case/${id}')` instead of `setShowHome(false)`
- Back button now calls `setLocation('/')` instead of `setShowHome(true)`

**Routes:** `/` → HomePage, `/case/:id` → case view. Browser back/forward and bookmarking work.

### Task 3: Human verification + bug fix

**Commit:** `d95804b`

User verified in browser and found that cases appeared locked. Root cause: localStorage stored progress under old caseIds (`hello-span-001`, etc.) which no longer matched the renamed IDs (`001-hello-span`, etc.). The persistence hook loaded stale data, causing all cases to appear locked.

**Fix:** Bumped `SCHEMA_VERSION` from 1 → 2 in `useAcademyPersistence.ts`. On next load, the version mismatch triggers a clean reset — stale progress data is cleared and cases initialize fresh with the first case available.

## Deviations from Plan

**1. [Rule 1 - Bug] Removed unused `location` variable**
- **Found during:** Task 2 implementation
- **Issue:** `const [location, setLocation] = useLocation()` — `location` was unused, would cause TypeScript/lint warning
- **Fix:** Changed to `const [, setLocation] = useLocation()` (ignored first element)
- **Files modified:** `src/App.tsx`
- **Commit:** `92a476e`

## Notes

- Pyodide threading fix: Already resolved in commit `5999881` — no action taken.
- Vite SPA fallback: Not needed for `vite dev` (handled automatically). For production deploys, the hosting platform (Netlify/Vercel) handles the fallback.

## Self-Check: PASSED

- `src/cases/001-hello-span/case.yaml` — FOUND
- `src/cases/002-auto-magic/case.yaml` — FOUND
- `src/cases/003-the-collector/case.yaml` — FOUND
- Old dirs `hello-span-001`, `auto-magic-002`, `the-collector-003` — NOT PRESENT
- `rootCauseEngine.ts` RULES_REGISTRY keys: `001-hello-span`, `002-auto-magic`, `003-the-collector` — CONFIRMED
- `wouter` in package.json — CONFIRMED
- Build: exits 0 — CONFIRMED
- Task 1 commit `7c9987e` — FOUND
- Task 2 commit `92a476e` — FOUND
