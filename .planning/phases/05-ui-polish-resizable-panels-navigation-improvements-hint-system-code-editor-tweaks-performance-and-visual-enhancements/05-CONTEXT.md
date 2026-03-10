# Phase 5: UI Polish - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Visual, interactive, and performance improvements to the existing app shell. No new learning features or cases — this phase makes the existing three-case app feel more professional and usable. Covers: resizable panels, hint system improvements, navigation/progress visibility, code editor tweaks, and Pyodide loading UX.

</domain>

<decisions>
## Implementation Decisions

### Resizable Panels

- **Mechanism**: Drag handles between panels (not collapse toggles only) — use `react-resizable-panels` library
- **Resizable splits** (all three):
  1. Instructions ↔ Editor (main left–right vertical split)
  2. Code editor ↔ Validation+Output row (top–bottom horizontal split in right column)
  3. Validation ↔ Output (left–right split inside the bottom row)
- **Persistence**: Save panel sizes to localStorage — user's custom splits persist across reloads
- **Reset to defaults**: A small reset icon near the drag handle lets users restore default sizes

### Hint System

- **Strategy**: Improve visibility of existing hints — no new hint panel or separate hint mode
- **Hints in InstructionsPanel**: Make hints always visible (expanded by default) — remove the hidden toggle
- **Hint availability signal**: When a new hint unlocks after failed attempts, the failing validation check row shows a Lightbulb icon as a visual indicator (no toast/notification)
- **Visual differentiation**: Regular hints (1-2 attempts) use subtle grey text. Guided messages (3+ attempts) use an amber/yellow callout box — escalating urgency is visually communicated

### Navigation Improvements

- **Case progress visibility** (primary focus): Each case tab in CaseSelector shows a mini progress indicator (filled circle = solved, half-circle = phase 1 done, empty = available, lock = locked)
- **Mobile case switching**: Add a bottom sheet/drawer on mobile for case switching — currently impossible to switch cases on mobile without navigating back to HomePage
- **Mobile drawer trigger**: Accessible from the case name header on mobile (the existing `flex-1 min-w-0 sm:hidden` div)

### Code Editor Tweaks

- **Font size control**: +/- control in the editor toolbar for user-adjustable font size
- **Word wrap toggle**: Toggle in editor toolbar; default off for Python, default on for YAML (The Collector case)
- **Keyboard shortcut**: Cmd/Ctrl+Enter triggers "Check Code" without clicking the button
- **Better defaults**: Hide minimap, disable scrollBeyondLastLine, enable smooth scrolling, consistent tab size — no UI control needed, just fix Monaco config

### Performance

- **Pyodide loading**: Show a progress indicator with loading stage labels (e.g., "Loading Python runtime... (1/3)") rather than just "Loading Python..." on the button
- **Lazy-load Monaco**: Load Monaco editor only when user navigates to a case, not on HomePage
- **Case switching**: Ensure code/state save and restore on case switch is non-blocking
- **Claude's Discretion**: Other performance wins identified during implementation

### Claude's Discretion

- Exact drag handle visual design (width, color, hover state)
- Panel size min/max constraints (prevent panels from becoming unusably small)
- localStorage key for panel sizes (separate from case progress key)
- Pyodide loading stage count and labels
- Bottom sheet component design (reuse existing modal pattern or new component)
- Exact font size range (min/max) for editor font control
- Animation/transition details for hint callouts

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `App.tsx`: Main layout — three resizable splits live here. Currently uses `w-80 flex-shrink-0`, `h-56 flex-shrink-0`, and `flex-1` for fixed splits
- `CodeEditor` (`src/components/CodeEditor.tsx`): Monaco wrapper — add font size/word wrap/keyboard shortcut props here
- `InstructionsPanel` (`src/components/InstructionsPanel.tsx`): Has `showHints` state toggle — remove toggle, make hints always visible
- `ValidationPanel` (`src/components/ValidationPanel.tsx`): Shows `hintMessage`/`guidedMessage` from validation results — add Lightbulb indicator and amber callout styling
- `CaseSelector` (`src/components/CaseSelector.tsx`): Existing locked/available/in-progress/solved icons — extend with mini progress indicator per tab
- `useAcademyPersistence` hook: Already manages localStorage — add panel size persistence here or in a new `usePanelSizes` hook
- `useCodeRunner` hook: Manages Pyodide worker init — add progress stage reporting here

### Established Patterns

- State management: `useState` in App.tsx, no global store
- localStorage: versioned key via `useAcademyPersistence` — panel sizes can use a separate key
- Animation: Tailwind `animate-slide-in` with `animationDelay` for staggered reveals
- Modal/overlay: `ReviewModal` and `WelcomeModal` pattern — reuse for mobile case drawer
- Mobile breakpoint: `sm` (640px) — `hidden sm:flex` / `flex sm:hidden`

### Integration Points

- `react-resizable-panels`: New dependency — wraps the existing panel JSX in `PanelGroup` + `Panel` + `PanelResizeHandle`
- `App.tsx` render layout: Replace hardcoded `w-80` and `h-56` with Panel components
- `CodeEditor.tsx`: Add `fontSize`, `wordWrap`, `onRunShortcut` props to Monaco options
- `CaseSelector.tsx`: Add progress indicator rendering per case tab
- Mobile drawer: New component triggered from the mobile case name header in App.tsx

</code_context>

<specifics>
## Specific Ideas

- Drag handles should feel like VS Code — thin, barely visible at rest, highlighted on hover
- The Pyodide loading stages should feel informative, not alarming — "Setting up Python sandbox (2/3)" not "Error loading..."
- Font size control should be subtle — small `A-` / `A+` buttons in the editor toolbar corner, not a prominent settings panel

</specifics>

<deferred>
## Deferred Ideas

- Keyboard navigation shortcuts between cases/phases (power user feature — could be its own phase)
- Case list sidebar replacing the tab row (bigger rework — not polish scope)
- Preloading Pyodide on app startup (background preload optimization — nice but not critical for Phase 5 scope)

</deferred>

---

*Phase: 05-ui-polish-resizable-panels-navigation-improvements-hint-system-code-editor-tweaks-performance-and-visual-enhancements*
*Context gathered: 2026-03-10*
