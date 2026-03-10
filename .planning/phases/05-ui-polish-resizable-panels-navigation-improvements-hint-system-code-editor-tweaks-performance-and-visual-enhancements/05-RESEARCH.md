# Phase 5: UI Polish — Research

**Researched:** 2026-03-10
**Domain:** React UI polish — resizable panels, Monaco editor, mobile UX, Pyodide loading, localStorage persistence
**Confidence:** HIGH

## Summary

Phase 5 is a pure polish phase with no new learning features. All five work areas are well-understood and map directly to existing code:

1. **Resizable panels** — `react-resizable-panels` v4.7.2 wraps the existing `PanelGroup`/`Panel`/`PanelResizeHandle` component tree in `App.tsx`. The library's `autoSaveId` prop provides automatic localStorage persistence with no custom code needed.

2. **Hint system improvements** — `InstructionsPanel.tsx` already has the toggle state. Removing it (always visible) and adding an amber callout for guided messages in `ValidationPanel.tsx` are single-file changes.

3. **Navigation / case progress** — `CaseSelector.tsx` already has all four status values (`locked`, `available`, `in-progress`, `solved`). Adding a mini progress indicator per tab requires rendering a phase-aware icon. The mobile drawer reuses the `WelcomeModal` backdrop + card pattern from `WelcomeModal.tsx`.

4. **Code editor tweaks** — `CodeEditor.tsx` already accepts `options` on the Monaco `Editor` component. Font size state and word wrap toggle require adding two props and two small toolbar controls. The Cmd/Ctrl+Enter shortcut uses Monaco's `addCommand` API on the `editorDidMount` callback.

5. **Performance** — Pyodide loading stages need a new message type from the worker (`{ type: 'loading-stage', stage: number, label: string }`). Monaco lazy load uses `React.lazy` + `Suspense` wrapping `CodeEditor`, which is only rendered on the case route.

**Primary recommendation:** Install `react-resizable-panels` as the only new dependency. All other work is refactoring existing components.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Resizable Panels**
- Mechanism: Drag handles between panels (not collapse toggles only) — use `react-resizable-panels` library
- Resizable splits (all three):
  1. Instructions vs Editor (main left-right vertical split)
  2. Code editor vs Validation+Output row (top-bottom horizontal split in right column)
  3. Validation vs Output (left-right split inside the bottom row)
- Persistence: Save panel sizes to localStorage — user's custom splits persist across reloads
- Reset to defaults: A small reset icon near the drag handle lets users restore default sizes

**Hint System**
- Strategy: Improve visibility of existing hints — no new hint panel or separate hint mode
- Hints in InstructionsPanel: Make hints always visible (expanded by default) — remove the hidden toggle
- Hint availability signal: When a new hint unlocks after failed attempts, the failing validation check row shows a Lightbulb icon as a visual indicator (no toast/notification)
- Visual differentiation: Regular hints (1-2 attempts) use subtle grey text. Guided messages (3+ attempts) use an amber/yellow callout box — escalating urgency is visually communicated

**Navigation Improvements**
- Case progress visibility (primary focus): Each case tab in CaseSelector shows a mini progress indicator (filled circle = solved, half-circle = phase 1 done, empty = available, lock = locked)
- Mobile case switching: Add a bottom sheet/drawer on mobile for case switching — currently impossible to switch cases on mobile without navigating back to HomePage
- Mobile drawer trigger: Accessible from the case name header on mobile (the existing `flex-1 min-w-0 sm:hidden` div)

**Code Editor Tweaks**
- Font size control: +/- control in the editor toolbar for user-adjustable font size
- Word wrap toggle: Toggle in editor toolbar; default off for Python, default on for YAML (The Collector case)
- Keyboard shortcut: Cmd/Ctrl+Enter triggers "Check Code" without clicking the button
- Better defaults: Hide minimap, disable scrollBeyondLastLine, enable smooth scrolling, consistent tab size — no UI control needed, just fix Monaco config

**Performance**
- Pyodide loading: Show a progress indicator with loading stage labels (e.g., "Loading Python runtime... (1/3)") rather than just "Loading Python..." on the button
- Lazy-load Monaco: Load Monaco editor only when user navigates to a case, not on HomePage
- Case switching: Ensure code/state save and restore on case switch is non-blocking
- Claude's Discretion: Other performance wins identified during implementation

### Claude's Discretion
- Exact drag handle visual design (width, color, hover state)
- Panel size min/max constraints (prevent panels from becoming unusably small)
- localStorage key for panel sizes (separate from case progress key)
- Pyodide loading stage count and labels
- Bottom sheet component design (reuse existing modal pattern or new component)
- Exact font size range (min/max) for editor font control
- Animation/transition details for hint callouts

### Deferred Ideas (OUT OF SCOPE)
- Keyboard navigation shortcuts between cases/phases (power user feature)
- Case list sidebar replacing the tab row (bigger rework)
- Preloading Pyodide on app startup (background preload optimization)
</user_constraints>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-resizable-panels | ^4.7.2 | Drag-resize panel splits with persistence | Purpose-built, maintained by bvaughn; `autoSaveId` handles localStorage automatically |

### Supporting (already in project)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| @monaco-editor/react | ^4.7.0 | Code editor | Already installed; `React.lazy` wraps the component |
| lucide-react | ^0.575.0 | Icons (Lightbulb, RotateCcw, etc.) | Already installed; use existing icons |
| tailwindcss | ^4.2.1 | Styling handles, callouts, mobile drawer | Already installed |

### No New Libraries Needed
Everything besides `react-resizable-panels` is handled by the existing stack.

**Installation:**
```bash
npm install react-resizable-panels
```

---

## Architecture Patterns

### Recommended Structure Changes
```
src/
├── App.tsx                         # Replace hardcoded w-80/h-56 with Panel components
├── components/
│   ├── CodeEditor.tsx              # Add fontSize, wordWrap, onRunShortcut props
│   ├── InstructionsPanel.tsx       # Remove showHints toggle, always render hints
│   ├── ValidationPanel.tsx         # Add Lightbulb indicator, amber callout for guided
│   ├── CaseSelector.tsx            # Add phase-aware mini progress indicator per tab
│   └── MobileCaseDrawer.tsx        # New component — bottom sheet for mobile switching
├── hooks/
│   └── usePanelSizes.ts            # New hook — manages panel size localStorage persistence
└── workers/
    └── python.worker.ts            # Add postMessage progress stages during loadPyodide
```

### Pattern 1: react-resizable-panels Three-Split Layout

**What:** Replace fixed `w-80` (instructions) and `h-56` (bottom row) with `PanelGroup` + `Panel` + `PanelResizeHandle`.
**When to use:** All three panel splits on the desktop instrumentation view.

```typescript
// Source: https://github.com/bvaughn/react-resizable-panels
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

// Split 1: Instructions (left) | right-column (right) — horizontal
<PanelGroup direction="horizontal" autoSaveId="main-split">
  <Panel defaultSize={25} minSize={15} maxSize={45}>
    <InstructionsPanel ... />
  </Panel>
  <PanelResizeHandle className="w-1 bg-slate-700 hover:bg-sky-500 transition-colors cursor-col-resize" />

  {/* Split 2: editor (top) | bottom-row (bottom) — vertical */}
  <Panel>
    <PanelGroup direction="vertical" autoSaveId="right-split">
      <Panel defaultSize={70} minSize={30}>
        <CodeEditor ... />
      </Panel>
      <PanelResizeHandle className="h-1 bg-slate-700 hover:bg-sky-500 transition-colors cursor-row-resize" />

      {/* Split 3: Validation | Output — horizontal */}
      <Panel defaultSize={30} minSize={15}>
        <PanelGroup direction="horizontal" autoSaveId="bottom-split">
          <Panel defaultSize={50} minSize={20}>
            <ValidationPanel ... />
          </Panel>
          <PanelResizeHandle className="w-1 bg-slate-700 hover:bg-sky-500 transition-colors cursor-col-resize" />
          <Panel defaultSize={50} minSize={20}>
            <OutputPanel ... />
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  </Panel>
</PanelGroup>
```

**Key constraint:** `Panel` elements must be **direct children** of their parent `PanelGroup`. Nesting `PanelGroup` inside a `Panel` is the correct pattern for nested splits.

### Pattern 2: autoSaveId for localStorage Persistence

**What:** `PanelGroup` built-in `autoSaveId` saves layout to `localStorage` automatically on each resize.
**When to use:** All three `PanelGroup` instances.

```typescript
// autoSaveId automatically serializes/restores layout — no custom code needed.
// Use a key that does NOT conflict with the existing 'telemetry-academy' key.
<PanelGroup direction="horizontal" autoSaveId="ta-panel-main">
```

Recommended keys: `ta-panel-main`, `ta-panel-right`, `ta-panel-bottom`.

### Pattern 3: Panel Reset to Defaults

**What:** A small icon button adjacent to a resize handle clears the `autoSaveId` localStorage entry and calls `PanelGroup.setLayout(defaultLayout)` via an imperative ref.
**When to use:** One reset button for the main split is sufficient; place it in the header or near the handle.

```typescript
// Source: react-resizable-panels README — imperative panel API
import { type ImperativePanelGroupHandle } from 'react-resizable-panels';

const groupRef = useRef<ImperativePanelGroupHandle>(null);

const resetLayout = () => {
  groupRef.current?.setLayout([25, 75]); // default sizes
};

<PanelGroup ref={groupRef} direction="horizontal" autoSaveId="ta-panel-main">
```

### Pattern 4: Pyodide Loading Stage Messages

**What:** The worker posts `{ type: 'loading-stage', stage: 1, total: 3, label: '...' }` messages during init. `useCodeRunner` surfaces a `loadingStage` string.
**When to use:** Between each `await` in the `python.worker.ts` `init` block.

```typescript
// In python.worker.ts
self.postMessage({ type: 'loading-stage', stage: 1, total: 3, label: 'Loading Python runtime' });
pyodide = await loadPyodide({ indexURL: '...' });

self.postMessage({ type: 'loading-stage', stage: 2, total: 3, label: 'Installing packages' });
await pyodide.loadPackage('micropip');
// ...
self.postMessage({ type: 'loading-stage', stage: 3, total: 3, label: 'Setting up sandbox' });
await pyodide.runPythonAsync(setupScript);
```

```typescript
// In useCodeRunner.ts — handle the new message type
if (type === 'loading-stage') {
  setLoadingLabel(`${event.data.label} (${event.data.stage}/${event.data.total})`);
  return;
}
```

### Pattern 5: Monaco Lazy Load with React.lazy

**What:** Wrap `CodeEditor` in `React.lazy` so Monaco's large bundle does not load on `HomePage`.
**When to use:** The import of `CodeEditor` in `App.tsx`.

```typescript
// In App.tsx
import React, { lazy, Suspense } from 'react';
const CodeEditor = lazy(() => import('./components/CodeEditor'));

// Wrap usage in Suspense — the fallback only shows during code-split chunk download
<Suspense fallback={<div className="flex-1 bg-slate-800 rounded-lg animate-pulse" />}>
  <CodeEditor value={code} onChange={setCode} language="python" />
</Suspense>
```

**Caveat:** The `@monaco-editor/react` library itself also loads Monaco JS files via its own loader asynchronously. `React.lazy` defers the initial bundle chunk; the Monaco asset files load when the component first mounts. This is a meaningful first-load improvement for the `HomePage` route.

### Pattern 6: Monaco Editor Keyboard Shortcut

**What:** Register Cmd/Ctrl+Enter to trigger "Check Code" without clicking the button.
**When to use:** In the `handleEditorDidMount` callback in `CodeEditor.tsx`.

```typescript
// Source: Monaco editor addCommand API
const handleEditorDidMount: OnMount = (editor, monaco) => {
  editorRef.current = editor;

  // Cmd+Enter (Mac) and Ctrl+Enter (Win/Linux)
  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
    () => {
      onRunShortcut?.();
    }
  );
  // ... existing ResizeObserver setup
};
```

The `onRunShortcut` prop is threaded from `App.tsx` → `CodeEditor`, where it calls `handleValidate`.

### Pattern 7: Amber Callout for Guided Hints

**What:** When `result.attemptsOnThisRule >= 3` and the result has `guidedMessage`, render an amber callout box below the validation row, not just text color change.
**When to use:** In `ValidationPanel.tsx`, inside the `results.map()`.

```typescript
// Already: isGuided = result.attemptsOnThisRule >= 3
// Add: render guidedMessage in an amber callout block when isGuided
{!result.passed && isGuided && result.guidedMessage && (
  <div className="mt-2 px-3 py-2 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 animate-slide-in">
    {result.guidedMessage}
  </div>
)}
```

### Pattern 8: Mobile Case Drawer

**What:** Bottom sheet modal triggered by tapping the mobile case name header. Lists all cases with their progress status. Reuses the `WelcomeModal` backdrop pattern.
**When to use:** New `MobileCaseDrawer.tsx` component, rendered conditionally from `App.tsx`.

```typescript
// Reuse existing backdrop pattern from WelcomeModal.tsx
<div className="fixed inset-0 z-50">
  <button className="absolute inset-0 bg-black/70" onClick={onClose} />
  <div className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 rounded-t-2xl pb-safe">
    {/* Case list */}
  </div>
</div>
```

### Anti-Patterns to Avoid

- **Putting Panel children in a wrapper div between PanelGroup and Panel**: The library requires `Panel` elements to be direct children of `PanelGroup`. Extra wrapper divs break resize calculations.
- **Using `display: flex` overrides on PanelGroup**: The library sets CSS on the root element. Trying to override `display`, `flex-direction`, or `overflow` on PanelGroup breaks layout.
- **Creating a custom localStorage key that conflicts with `autoSaveId`**: The autoSaveId prefix used by the library is `react-resizable-panels:`. Don't use this prefix for the main `telemetry-academy` key.
- **Re-initializing Pyodide on every case switch**: The `useCodeRunner` hook already keeps the worker alive across case switches. Do not restart the worker on `switchCase()`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Panel resize with localStorage | Custom mousedown drag + localStorage save | `react-resizable-panels` with `autoSaveId` | Edge cases: touch, keyboard resize (arrow keys), min/max enforcement, SSR flicker |
| Panel size persistence | Custom `usePanelSizes` hook with `onLayout` | `autoSaveId` prop on `PanelGroup` | Built-in, handles concurrent updates and SSR |
| Drag cursor management | Custom CSS cursor state | Library handles via `PanelResizeHandle` | Already manages `cursor-col-resize`/`cursor-row-resize` during drag |

**Key insight:** `react-resizable-panels` handles all the hard edge cases (touch events, keyboard resize with arrow keys, min/max enforcement) that a hand-rolled solution would miss.

---

## Common Pitfalls

### Pitfall 1: Panel Direct-Child Constraint
**What goes wrong:** Rendering a `<div>` wrapper between `<PanelGroup>` and `<Panel>` breaks resize behavior silently — panels may not resize or may jump to 0.
**Why it happens:** The library uses direct child DOM queries for layout calculation.
**How to avoid:** `Panel` elements must always be direct JSX children of `PanelGroup`. Use `PanelGroup` nesting (inside a `Panel`) for nested splits.
**Warning signs:** Panels snap to 0 or 100% on first drag.

### Pitfall 2: autoSaveId Key Collision
**What goes wrong:** Two `PanelGroup` instances with the same `autoSaveId` overwrite each other's persisted layout.
**Why it happens:** The library uses the ID as the full localStorage key.
**How to avoid:** Use distinct keys per group: `ta-panel-main`, `ta-panel-right`, `ta-panel-bottom`.
**Warning signs:** Resizing one split resets another on reload.

### Pitfall 3: Monaco onMount Signature Change
**What goes wrong:** `handleEditorDidMount` currently has signature `(editor)` — but `addCommand` needs the `monaco` namespace from the second argument.
**Why it happens:** The `OnMount` type from `@monaco-editor/react` provides `(editor, monaco)`.
**How to avoid:** Change existing `handleEditorDidMount: OnMount = (editor)` to `(editor, monaco)` and pass `monaco` to `addCommand`.
**Warning signs:** TypeScript error — `monaco is not defined`.

### Pitfall 4: Pyodide Worker Progress Stages Not Reaching React State
**What goes wrong:** The `loading-stage` message is posted during init (before `type: 'ready'`). The current `worker.onmessage` in `initWorker()` only handles `ready` and `error`. New message types during init are ignored.
**Why it happens:** The init message handler in `useCodeRunner.ts` is narrowly scoped.
**How to avoid:** Extend the `onmessage` handler inside `initWorker()` to also handle `loading-stage` type and update a `loadingLabel` state.
**Warning signs:** Loading indicator never updates during Pyodide init.

### Pitfall 5: React.lazy Boundary Placement
**What goes wrong:** Placing the `Suspense` boundary too high (around the whole case route) causes a full-screen flash when navigating to any case.
**Why it happens:** `React.lazy` suspends the closest `Suspense` ancestor during chunk download.
**How to avoid:** Place `Suspense` tightly around just the `CodeEditor` usage, with a skeleton placeholder that matches the editor's dimensions.
**Warning signs:** Entire case layout disappears briefly on first navigation.

### Pitfall 6: Font Size State Persistence
**What goes wrong:** Font size resets to default on every page load because it is not persisted.
**Why it happens:** It is stored in local `useState` in `CodeEditor.tsx`.
**How to avoid:** Store font size preference in `localStorage` (a separate simple key like `ta-editor-fontsize`), or add it to `useAcademyPersistence`. A simple `localStorage.getItem`/`setItem` directly in the component is acceptable given its simplicity.

---

## Code Examples

### PanelGroup nested splits (full three-split layout)
```typescript
// Source: https://github.com/bvaughn/react-resizable-panels README
<PanelGroup direction="horizontal" autoSaveId="ta-panel-main">
  <Panel defaultSize={25} minSize={15} maxSize={45} className="overflow-y-auto">
    <InstructionsPanel ... />
  </Panel>
  <PanelResizeHandle className="w-1.5 bg-slate-700 hover:bg-sky-500/50 active:bg-sky-500 transition-colors cursor-col-resize flex-shrink-0" />
  <Panel>
    <PanelGroup direction="vertical" autoSaveId="ta-panel-right">
      <Panel defaultSize={70} minSize={25} className="overflow-hidden">
        <CodeEditor ... />
      </Panel>
      <PanelResizeHandle className="h-1.5 bg-slate-700 hover:bg-sky-500/50 active:bg-sky-500 transition-colors cursor-row-resize flex-shrink-0" />
      <Panel defaultSize={30} minSize={15} className="overflow-hidden">
        <PanelGroup direction="horizontal" autoSaveId="ta-panel-bottom">
          <Panel defaultSize={50} minSize={20}>
            <ValidationPanel ... />
          </Panel>
          <PanelResizeHandle className="w-1.5 bg-slate-700 hover:bg-sky-500/50 active:bg-sky-500 transition-colors cursor-col-resize flex-shrink-0" />
          <Panel defaultSize={50} minSize={20}>
            <OutputPanel ... />
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  </Panel>
</PanelGroup>
```

### Imperative reset via ref
```typescript
// Source: react-resizable-panels — ImperativePanelGroupHandle
import { type ImperativePanelGroupHandle } from 'react-resizable-panels';
const mainGroupRef = useRef<ImperativePanelGroupHandle>(null);

const handleResetPanels = () => {
  // Clear persisted values
  localStorage.removeItem('react-resizable-panels:ta-panel-main');
  localStorage.removeItem('react-resizable-panels:ta-panel-right');
  localStorage.removeItem('react-resizable-panels:ta-panel-bottom');
  // Reset to defaults
  mainGroupRef.current?.setLayout([25, 75]);
};
```

### CodeEditor with font size and word wrap props
```typescript
// CodeEditor.tsx additions
interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  filename?: string;
  onRunShortcut?: () => void;   // NEW
  defaultWordWrap?: boolean;     // NEW — true for YAML
}

// Inside component
const [fontSize, setFontSize] = useState(() => {
  return Number(localStorage.getItem('ta-editor-fontsize')) || 14;
});
const [wordWrap, setWordWrap] = useState(props.defaultWordWrap ?? false);
```

### CaseSelector phase-aware progress indicator
```typescript
// CaseSelector.tsx — determine phase status for indicator
const getPhaseStatus = (prog: CaseProgress) => {
  if (prog.status === 'solved') return 'solved';        // full circle (green)
  if (prog.phase === 'investigation') return 'phase1';  // half (amber)
  if (prog.status === 'in-progress') return 'active';   // empty ring (sky)
  if (prog.status === 'available') return 'available';  // empty ring (slate)
  return 'locked';                                       // lock icon
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed `w-80` and `h-56` in App.tsx | `react-resizable-panels` with `autoSaveId` | Phase 5 | Users can resize panels to their preference |
| "Loading Python..." single label | Stage labels: "Loading runtime (1/3)" | Phase 5 | Less confusion during Pyodide cold start |
| Hidden hints behind toggle | Always-visible hints in InstructionsPanel | Phase 5 | Users don't miss hints on first attempt |
| Monaco loaded on all routes | Monaco lazy-loaded on case route only | Phase 5 | Faster homepage load time |

**No deprecated APIs involved:** All components used (`PanelGroup`, `Panel`, `PanelResizeHandle`, Monaco `addCommand`, `React.lazy`) are current.

---

## Open Questions

1. **Panel reset icon placement**
   - What we know: CONTEXT.md says "small reset icon near the drag handle"
   - What's unclear: Which handle specifically? The main horizontal handle is the most logical location, but the handle is only 6px wide.
   - Recommendation: Place a `RotateCcw` icon button in the top-right corner of the `header` element in App.tsx (near the existing desktop reset button), with a tooltip "Reset panel sizes". Simpler than a handle-adjacent control.

2. **`autoSaveId` key prefix in library**
   - What we know: The library uses a specific localStorage key format
   - What's unclear: Whether the key format is `react-resizable-panels:{autoSaveId}` or just `{autoSaveId}`
   - Recommendation: Verify the exact key name at runtime before implementing the reset function to avoid missing the right key. Can also implement reset via `PanelGroup.setLayout()` ref only (without localStorage.removeItem) and rely on the layout call to overwrite persisted value on next resize.

3. **Monaco lazy chunk size**
   - What we know: Monaco is a large editor — typically 2-4MB
   - What's unclear: Whether Vite is already code-splitting Monaco or bundling it eagerly
   - Recommendation: Run `vite build` output analysis (or check bundle with `--report`) to confirm before and after lazy loading. The improvement may be significant.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `vite.config.ts` (inline `test` block, `environment: jsdom`) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Behavior | Test Type | Notes |
|----------|-----------|-------|
| Panel size persistence via autoSaveId | Manual/visual | Integration with DOM resize events — not practical in jsdom |
| Pyodide loading stage messages emitted correctly | Unit | Test the worker's postMessage sequence with mocked loadPyodide |
| Monaco keyboard shortcut registration | Manual | Requires real Monaco instance — jsdom cannot run it |
| Font size preference saved to localStorage | Unit | Can test the read/write logic in isolation |
| Hint always-visible in InstructionsPanel | Unit | Simple snapshot or render test — `showHints` state removed |
| CaseSelector phase indicator renders correct icon | Unit | Render with mocked progress props |
| Mobile drawer opens on mobile case name tap | Manual | Requires touch event simulation — verify in browser |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/InstructionsPanel.test.tsx` — covers always-visible hints (renders without toggle)
- [ ] `src/components/CaseSelector.test.tsx` — covers phase-aware progress indicator rendering
- [ ] `src/workers/python.worker.test.ts` — extend existing test to cover `loading-stage` message type

*(Existing test infrastructure in vite.config.ts with jsdom covers all unit tests. No framework install needed.)*

---

## Sources

### Primary (HIGH confidence)
- GitHub: https://github.com/bvaughn/react-resizable-panels — version 4.7.2, component API, direct-child constraint
- README via unpkg (react-resizable-panels@2.0.19): `autoSaveId`, `PanelGroup` props, `ImperativePanelGroupHandle`
- Direct code reading: `src/App.tsx`, `src/components/CodeEditor.tsx`, `src/components/InstructionsPanel.tsx`, `src/components/ValidationPanel.tsx`, `src/components/CaseSelector.tsx`, `src/hooks/useCodeRunner.ts`, `src/workers/python.worker.ts`

### Secondary (MEDIUM confidence)
- WebSearch (react-resizable-panels 2026): Version 4.7.2 confirmed current, `autoSaveId` built-in persistence confirmed
- React.dev official docs (React.lazy): Standard pattern for dynamic import lazy loading

### Tertiary (LOW confidence)
- WebSearch (Monaco lazy load 2025): Community pattern for `React.lazy` wrapping Monaco — confirmed works but note Monaco's own loader still fetches assets lazily after mount

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — react-resizable-panels API verified from GitHub + unpkg README; all other libraries already in project
- Architecture: HIGH — based on direct code reading of all affected files; integration points are clear
- Pitfalls: HIGH — direct-child constraint and autoSaveId key format are documented library behaviors; Monaco/Pyodide pitfalls are from direct code reading

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable libraries, nothing fast-moving)
