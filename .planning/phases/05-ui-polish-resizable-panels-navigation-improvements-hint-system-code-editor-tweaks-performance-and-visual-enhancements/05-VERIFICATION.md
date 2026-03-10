---
phase: 05-ui-polish-resizable-panels-navigation-improvements-hint-system-code-editor-tweaks-performance-and-visual-enhancements
verified: 2026-03-10T14:00:00Z
status: human_needed
score: 26/26 must-haves verified
re_verification:
  previous_status: gaps_found (UAT revealed 4 failures after initial static pass)
  previous_score: 22/22 static, 4/12 UAT tests failed
  gaps_closed:
    - "Panel size props converted from bare numbers to string percentages — instructions panel no longer capped at ~45px"
    - "Reset button restores default panel proportions (blocked by same pixel-cap root cause, now fixed)"
    - "Hints/tips section visible in Instructions panel at default proportions (width no longer crushed)"
    - "Word wrap preference persists across page reloads via ta-editor-wordwrap localStorage key"
  gaps_remaining: []
  regressions: []
gaps: []
human_verification:
  - test: "Drag the vertical handle between Instructions and Editor panels on desktop"
    expected: "Instructions panel resizes freely between ~15% and ~45% of viewport width; sizes persist after page reload; reset button snaps panels back to 25/75 split"
    why_human: "Previously failed UAT (tests 1, 3, 4); plan 06 fix must be confirmed in browser — drag mechanics and pixel-accurate layout cannot be verified statically"
  - test: "Toggle word wrap on, then reload the page"
    expected: "Wrap button appears active (sky highlight) after reload; toggle off and reload — button is inactive"
    why_human: "Previously failed UAT (test 8); plan 07 adds localStorage persistence — requires browser confirmation"
  - test: "Press Cmd+Enter (Mac) or Ctrl+Enter (Win/Linux) in the code editor"
    expected: "Check Code validation fires without clicking the button"
    why_human: "Monaco keyboard shortcut registration requires runtime execution"
  - test: "Click A- and A+ buttons multiple times, then reload"
    expected: "Font size adjusts immediately; same size restored after reload"
    why_human: "localStorage persistence requires live browser session"
  - test: "Open the app on a mobile viewport; tap the case name header"
    expected: "Bottom sheet opens listing all cases; tapping available case switches and closes; tapping backdrop closes without switching"
    why_human: "UAT test 11 was skipped — untested; sm:hidden breakpoint and touch events require browser"
  - test: "Let Pyodide initialize on cold start; watch the Check Code button text"
    expected: "Button cycles through 'Loading Python runtime (1/3)', 'Installing packages (2/3)', 'Setting up sandbox (3/3)', then 'Check Code'"
    why_human: "Worker postMessage timing depends on network and Pyodide CDN"
  - test: "Navigate to the homepage; inspect network tab for Monaco bundle"
    expected: "CodeEditor chunk is absent from homepage; only loads when entering a case"
    why_human: "Lazy-loading split-point behavior requires browser Network tab inspection"
---

# Phase 05: UI Polish — Re-Verification Report

**Phase Goal:** The app feels professional and usable — users can resize panels to their preference, hints are always discoverable, switching cases on mobile is possible, and Pyodide loading is clearly communicated.
**Verified:** 2026-03-10T14:00:00Z
**Status:** human_needed
**Re-verification:** Yes — after UAT gap closure (plans 05-06 and 05-07)

## Re-verification Context

The initial static verification (2026-03-10T10:05:00Z) reported 22/22 truths verified. Subsequent UAT identified 4 failures:

| UAT Test | Result | Root Cause |
|----------|--------|------------|
| Test 1: Drag resize instructions panel | FAILED | `react-resizable-panels` v4 treats bare numbers as pixels; `maxSize={45}` capped panel at 45px |
| Test 3: Reset button restores proportions | FAILED | Same pixel-cap root cause blocked layout from changing |
| Test 4: Hints visible in Instructions panel | FAILED | Consequence of test 1 — panel was only ~45px wide |
| Test 8: Word wrap preference persists | FAILED | No localStorage read/write for word wrap (only font size had persistence) |

Gap closure plans 06 and 07 were executed. This re-verification confirms those fixes are present in the codebase.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Instructions panel resizes freely (not capped at ~48px) | VERIFIED | `App.tsx` line 480: `defaultSize="25%" minSize="15%" maxSize="45%"` — string percentages replace bare pixels |
| 2 | All Panel size props use string percentages (v4 compatible) | VERIFIED | Lines 480, 495, 508, 515, 527: all `defaultSize`/`minSize`/`maxSize` values are quoted `"N%"` strings; no bare-number forms remain |
| 3 | Reset button restores default panel proportions | VERIFIED | `handleResetPanels` lines 270-275: clears 3 localStorage keys, calls `mainGroupRef.current?.setLayout()`; wired to `LayoutPanelLeft` button at line 384 |
| 4 | Hints/tips section visible in Instructions panel at default proportions | VERIFIED | Fixed by panel props fix — panel renders at 25% width; `InstructionsPanel.tsx` unconditionally renders hints section (no toggle) |
| 5 | Word wrap preference survives a page reload | VERIFIED | `CodeEditor.tsx` lines 29-32: lazy initializer reads `ta-editor-wordwrap`, falls back to `defaultWordWrap`; line 97: toggle writes `localStorage.setItem('ta-editor-wordwrap', String(next))` |
| 6 | User can drag the vertical handle between Instructions and Editor panels | VERIFIED (human needed) | String percentage props remove pixel cap; drag mechanics require browser confirmation |
| 7 | User can drag the horizontal handle between Editor and bottom row | VERIFIED | `Group orientation="vertical"` with `Separator` at line 507; `Panel id="ta-editor" defaultSize="70%"` and `Panel id="ta-bottom" defaultSize="30%"` |
| 8 | User can drag the handle between Validation and Output panels | VERIFIED | Inner `Group orientation="horizontal"` with `Separator` at line 526; both Panels at `defaultSize="50%"` |
| 9 | Panel sizes persist across page reloads | VERIFIED | `useDefaultLayout` at lines 104-106 with `storage: localStorage`; `onLayoutChanged` props wired to each Group |
| 10 | Hints are always visible without clicking a toggle | VERIFIED | `InstructionsPanel.tsx`: hints section rendered unconditionally; no `useState` toggle, no `ChevronDown`/`ChevronRight` |
| 11 | Failing validation with 3+ attempts shows amber guided callout | VERIFIED | `ValidationPanel.tsx` lines 147-151: `{!result.passed && isGuided && result.guidedMessage && <div className="...bg-amber-500/10 border border-amber-500/30...">}` |
| 12 | Failing validation with 1-2 attempts shows hint as grey text | VERIFIED | Lines 144-146: `{!result.passed && result.hintMessage && result.attemptsOnThisRule >= 1 && result.attemptsOnThisRule < 3 ...}` |
| 13 | Failing rule shows Lightbulb icon when hint unlocked | VERIFIED | Lines 125-127: `{!result.passed && result.attemptsOnThisRule >= 1 && <Lightbulb className="w-3.5 h-3.5 text-amber-400/70" />}` |
| 14 | Cmd/Ctrl+Enter in editor triggers Check Code | VERIFIED | `CodeEditor.tsx` lines 48-51: `editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => { onRunShortcut?.(); })` |
| 15 | A- / A+ buttons adjust font size (range 10-20), persisted | VERIFIED | Lines 34-44: `decreaseFontSize`/`increaseFontSize` with clamping; writes `ta-editor-fontsize` to localStorage |
| 16 | Word wrap toggle button works and defaults by case type | VERIFIED | Lines 93-104: toggle with sky highlight for active state; `App.tsx` passes `defaultWordWrap={(currentCase as any).type === 'yaml-config'}` |
| 17 | Monaco minimap hidden, smooth scrolling enabled | VERIFIED | `CodeEditor.tsx` lines 112-125: `minimap: { enabled: false }`, `scrollBeyondLastLine: false`, `smoothScrolling: true` |
| 18 | Case tabs show phase-aware progress dots | VERIFIED | `CaseSelector.tsx`: `getPhaseStatus` function + `ProgressDot` component, rendered per case tab |
| 19 | Tapping case name on mobile opens bottom sheet | VERIFIED | `App.tsx` lines 339-346: mobile button with `onClick={() => setShowMobileDrawer(true)}`; lines 450-458: `MobileCaseDrawer` conditional render |
| 20 | Mobile bottom sheet allows case switching without going to homepage | VERIFIED | `MobileCaseDrawer.tsx`: `handleSelect` calls `onSelect(id)` then `onClose()`; `App.tsx` line 455 wires `onSelect` to `switchCase` |
| 21 | Mobile bottom sheet closes on backdrop tap or case selection | VERIFIED | `MobileCaseDrawer.tsx`: backdrop button calls `onClose`; `handleSelect` calls `onClose()` |
| 22 | Check Code button shows stage labels during Pyodide init | VERIFIED | `python.worker.ts` lines 38, 45, 50: 3 `loading-stage` postMessages; `useCodeRunner.ts` lines 39-41: `setLoadingLabel`; `ValidationPanel.tsx` line 59: `{loadingLabel || 'Loading Python...'}` |
| 23 | Stage labels update progressively through 3 stages | VERIFIED | Worker emits stages 1, 2, 3 sequentially; hook state updates on each message |
| 24 | Monaco editor chunk is lazy-loaded | VERIFIED | `App.tsx` lines 4-6: `React.lazy(() => import('./components/CodeEditor')...)` |
| 25 | TypeScript compiles with no errors | VERIFIED | `npx tsc --noEmit` exits 0 |
| 26 | Word wrap localStorage pattern matches font size persistence pattern | VERIFIED | Both use lazy useState initializer + write-on-change; keys `ta-editor-fontsize` and `ta-editor-wordwrap` both confirmed in `CodeEditor.tsx` |

**Score:** 26/26 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/App.tsx` | All Panel size props as string percentages; `handleResetPanels`; mobile drawer state | VERIFIED | Lines 480-527: all 5 Panels use `"N%"` strings; lines 270-275: reset handler wired to button at line 384; line 72: `showMobileDrawer` state |
| `src/components/CodeEditor.tsx` | `ta-editor-wordwrap` lazy init + setItem in toggle | VERIFIED | Lines 29-32: lazy initializer reads key; line 97: setItem in toggle onClick |
| `src/components/InstructionsPanel.tsx` | Always-visible hints (no toggle) | VERIFIED | Unconditional render, no toggle state |
| `src/components/ValidationPanel.tsx` | Guided callout, hint text, lightbulb, loading label | VERIFIED | All four features present and wired |
| `src/components/MobileCaseDrawer.tsx` | Bottom sheet with backdrop and case list | VERIFIED | Full implementation with onSelect/onClose props |
| `src/components/CaseSelector.tsx` | Phase-aware progress dots | VERIFIED | `getPhaseStatus` + `ProgressDot` wired per case tab |
| `src/workers/python.worker.ts` | 3 loading-stage postMessages | VERIFIED | Lines 38, 45, 50 emit stages sequentially |
| `src/hooks/useCodeRunner.ts` | `loadingLabel` state surfaced | VERIFIED | State declared, updated on messages, returned from hook |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `App.tsx Panel id="ta-instructions"` | `react-resizable-panels` v4 | `defaultSize="25%"` string percentage | WIRED | Line 480: pixel cap eliminated by string percentages |
| `handleResetPanels` | `mainGroupRef` | `setLayout({ 'ta-instructions': 25, 'ta-editor-group': 75 })` | WIRED | Lines 270-275; `LayoutPanelLeft` button at line 384 calls it |
| `CodeEditor.tsx wordWrap useState` | `localStorage ta-editor-wordwrap` | Lazy initializer + setItem in toggle | WIRED | Lines 29-32 (read) and line 97 (write) — both present |
| `App.tsx` | `MobileCaseDrawer` | `showMobileDrawer` state + tap handler | WIRED | Lines 341, 450-458 |
| `CodeEditor.tsx addCommand` | `onRunShortcut` prop | `CtrlCmd | Enter` keyboard shortcut | WIRED | Lines 48-51 |
| `python.worker.ts` | `useCodeRunner.ts` | `postMessage { type: 'loading-stage' }` | WIRED | Worker lines 38, 45, 50; hook lines 39-41 |
| `useCodeRunner.ts loadingLabel` | `ValidationPanel.tsx` | Passed as prop via `App.tsx` | WIRED | Hook line 132; App.tsx line 74 destructures; lines 520, 573 pass to both ValidationPanel instances |

### Requirements Coverage

No requirement IDs were declared in any PLAN.md frontmatter for this phase (all plans list `requirements: []`). No REQUIREMENTS.md cross-reference is applicable.

### Anti-Patterns Found

None detected. Scanned all files modified in plans 01-07:

- No TODO/FIXME/HACK/PLACEHOLDER comments in modified files
- No empty implementations or stub handlers
- No console.log-only event handlers

TypeScript: 0 errors (`npx tsc --noEmit` exits 0).

### Human Verification Required

#### 1. Resizable Panel Drag — UAT Re-test (Previously Failed: Tests 1, 3, 4)

**Test:** On desktop, drag the vertical handle between the Instructions and Editor panels.
**Expected:** Instructions panel resizes freely to at least 40-45% of viewport width (no longer capped at ~45px). Drag bottom panels too. Reload — sizes persist. Click reset button (panel icon in header) — snaps back to 25/75.
**Why human:** Plan 06 converted all Panel size props to string percentages (pixel cap eliminated), but drag mechanics and visual layout require browser confirmation.

#### 2. Word Wrap Persistence — UAT Re-test (Previously Failed: Test 8)

**Test:** Open a case. Toggle word wrap on (Wrap button shows sky highlight). Reload the page.
**Expected:** Wrap button is still active after reload. Toggle off, reload — button is inactive.
**Why human:** Plan 07 added `ta-editor-wordwrap` read/write; static check confirms both sides are wired, but persistence requires a live browser session.

#### 3. Cmd/Ctrl+Enter Keyboard Shortcut

**Test:** Click inside the code editor, press Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux).
**Expected:** Validation runs identically to clicking "Check Code".
**Why human:** Monaco keyboard shortcut registration requires a running Monaco instance.

#### 4. Font Size Persistence

**Test:** Click A+ three times (font becomes 17), then reload.
**Expected:** Font size is still 17 after reload.
**Why human:** localStorage persistence requires a live browser session.

#### 5. Mobile Case Drawer — UAT Skipped (Test 11)

**Test:** On mobile viewport (or DevTools mobile mode), navigate to a case. Tap the case name header.
**Expected:** Bottom sheet slides up listing all cases. Tapping an available case switches to it and closes the sheet. Tapping the backdrop closes without switching.
**Why human:** UAT test 11 was skipped — untested. `sm:hidden` breakpoint and touch events require browser testing.

#### 6. Pyodide Progressive Loading Stages

**Test:** Hard-refresh the app; watch the Check Code button text during initialization.
**Expected:** Cycles "Loading Python runtime (1/3)" → "Installing packages (2/3)" → "Setting up sandbox (3/3)" → "Check Code".
**Why human:** Worker postMessage timing depends on network latency and Pyodide CDN.

#### 7. Monaco Lazy Loading

**Test:** Open the homepage; inspect the browser's Network tab for JS chunks.
**Expected:** The `CodeEditor-*.js` chunk is absent on the homepage and only loads when entering a case.
**Why human:** Lazy-loading split-point behavior requires browser Network tab inspection.

### Gaps Summary

No gaps remain in the codebase. All 4 UAT failures have been resolved by gap closure plans 06 and 07:

- **Tests 1, 3, 4** (panel resize, reset button, hints visibility): Root cause was `react-resizable-panels` v4 treating bare numbers as pixels. Plan 06 converted all 5 Panel elements in `App.tsx` to string percentages (`"25%"`, `"15%"`, etc.). No bare-number Panel size props remain in the file.

- **Test 8** (word wrap persistence): Root cause was missing localStorage read/write. Plan 07 added a lazy `useState` initializer reading `ta-editor-wordwrap` (falling back to `defaultWordWrap`) and `setItem` in the toggle handler. Both sides of the persistence contract are present in `CodeEditor.tsx`.

Status is `human_needed` — not `passed` — because 2 previously-failed UAT tests (1, 3, 4 and 8) still require browser re-confirmation, and 1 UAT test (11, mobile drawer) was skipped and remains untested in a real browser.

---

_Verified: 2026-03-10T14:00:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification after UAT gap closure (plans 05-06 and 05-07)_
