---
status: diagnosed
phase: 05-ui-polish-resizable-panels-navigation-improvements-hint-system-code-editor-tweaks-performance-and-visual-enhancements
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md, 05-05-SUMMARY.md]
started: 2026-03-10T13:07:07Z
updated: 2026-03-10T13:25:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Resizable Panels — Drag to Resize
expected: On desktop, the three-panel layout (instructions | code editor | validation+output) has visible drag handles between panels. Dragging a handle resizes adjacent panels in real-time. The right panel is split vertically (editor on top, validation+output on bottom), also with a drag handle.
result: issue
reported: "The left sidebar can't be resized more than 48px, it's very small. The resize for bottom components are working fine."
severity: major

### 2. Resizable Panels — Size Persistence
expected: After resizing panels, reload the page. Panels reopen at the sizes you dragged them to (not the default proportions).
result: pass

### 3. Resizable Panels — Reset Button
expected: A reset button (panel/layout icon) is visible in the desktop header. Clicking it restores the panels to default proportions (instructions ~25%, editor/validation ~75%).
result: issue
reported: "panels aren't returning to their original positions, the size doesn't change"
severity: major

### 4. Hint System — Always Visible in Instructions
expected: Open any case. In the Instructions panel, the hints/tips section is visible immediately — there is no "Show Hints" toggle button you need to click first.
result: issue
reported: "I can't see the hints/tips because the instructions panel width is too small"
severity: major

### 5. Hint System — Lightbulb on Failing Rule
expected: Run code that fails a validation rule at least once. On the failing row in the Validation panel, a lightbulb icon (amber) appears alongside the error icon, signaling a hint is available.
result: pass

### 6. Hint System — Guided Callout at 3+ Attempts
expected: Fail the same validation rule 3 or more times. An amber callout box appears below the failing rule with a more detailed guided message.
result: pass

### 7. Code Editor — Font Size Controls
expected: In the code editor toolbar, A- and A+ buttons are visible. Clicking A- decreases font size; clicking A+ increases it. The preference persists after a page reload.
result: pass

### 8. Code Editor — Word Wrap Toggle
expected: A "Wrap" toggle button is visible in the editor toolbar. Clicking it toggles word wrap on/off. For Python cases it defaults to off; for YAML cases it defaults to on.
result: issue
reported: "It not persists, should it? (font size persists but word wrap preference does not survive a reload)"
severity: minor

### 9. Code Editor — Cmd/Ctrl+Enter Shortcut
expected: With focus inside the code editor, pressing Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux) runs the validation — same as clicking the "Check Code" button.
result: pass

### 10. Navigation — Progress Dots on Case Tabs
expected: The case selector tabs show small colored progress dots. A green dot = case solved. Amber half-ring = phase 1 done (investigation started). Sky-blue ring = in progress. Slate ring = available. Lock icon = locked.
result: pass

### 11. Navigation — Mobile Case Drawer
expected: On mobile, the case name at the top is a tappable button (with a chevron icon). Tapping it opens a bottom sheet drawer listing all cases with their status. Tapping an available case switches to it and closes the drawer. Tapping the backdrop or X closes without switching.
result: skipped
reason: could not test on mobile

### 12. Performance — Pyodide Loading Stage Labels
expected: On first page load (or hard refresh), before Python is ready, the "Check Code" button shows progressive stage labels like "Loading Python runtime (1/3)", "Installing packages (2/3)", "Starting sandbox (3/3)" as the worker initializes.
result: pass

## Summary

total: 12
passed: 7
issues: 4
pending: 0
skipped: 1

## Gaps

- truth: "The instructions panel can be freely resized by dragging its handle"
  status: failed
  reason: "User reported: The left sidebar can't be resized more than 48px, it's very small. The resize for bottom components are working fine."
  severity: major
  test: 1
  root_cause: "react-resizable-panels v4 treats bare numbers as pixels, not percentages. Panel has maxSize={45} which means 45px max, not 45%. All Panel size props (defaultSize, minSize, maxSize) need string percentages like '25%' instead of bare numbers."
  artifacts:
    - path: "src/App.tsx"
      issue: "Panel id='ta-instructions' uses defaultSize={25} minSize={15} maxSize={45} — all treated as pixels in v4, must be string percentages"
  missing:
    - "Change all Panel size props to string percentages: defaultSize='25%' minSize='15%' maxSize='45%' (and same for all other Panels in the file)"
  debug_session: ""

- truth: "Clicking the reset button restores panels to default proportions"
  status: failed
  reason: "User reported: panels aren't returning to their original positions, the size doesn't change"
  severity: major
  test: 3
  root_cause: "Same pixel/percentage issue as Bug 1. The setLayout call is correct in concept (25/75 are valid 0-100 percentages for the Layout type), but the panel constraints are broken by pixel-based maxSize/minSize props causing clamping. onLayoutChanged also immediately re-persists the broken layout. Fixing Bug 1 (string percentages on Panel props) will unblock the reset button."
  artifacts:
    - path: "src/App.tsx"
      issue: "handleResetPanels at lines 270-275 — setLayout values correct but Panel constraints broken by pixel props"
  missing:
    - "Fix Panel size props to string percentages (same fix as Bug 1) — reset button setLayout will then work correctly"
  debug_session: ""

- truth: "Hints/tips section is immediately visible in the Instructions panel"
  status: failed
  reason: "User reported: I can't see the hints/tips because the instructions panel width is too small"
  severity: major
  test: 4
  root_cause: "Consequence of Bug 1 — instructions panel stuck at ~48px due to maxSize={45} being treated as 45px. Fixing Bug 1 will fix this."
  artifacts:
    - path: "src/App.tsx"
      issue: "Same root cause as test 1 — Panel pixel constraints"
  missing:
    - "Fixed by the same Panel size props fix as Bug 1"
  debug_session: ""

- truth: "Word wrap preference persists across page reloads (consistent with font size persistence)"
  status: failed
  reason: "User reported: It not persists, should it? (font size persists but word wrap preference does not survive a reload)"
  severity: minor
  test: 8
  root_cause: "No localStorage read/write for word wrap. useState is seeded from defaultWordWrap prop only. Font size uses ta-editor-fontsize key with read on init and write on change; word wrap has no equivalent."
  artifacts:
    - path: "src/components/CodeEditor.tsx"
      issue: "Line 29: useState(defaultWordWrap) — no localStorage read. Line 91: toggle click has no localStorage.setItem call."
  missing:
    - "Line 29: change to lazy initializer that reads ta-editor-wordwrap from localStorage, falls back to defaultWordWrap"
    - "Line 91: add localStorage.setItem('ta-editor-wordwrap', String(next)) in toggle handler"
  debug_session: ""
