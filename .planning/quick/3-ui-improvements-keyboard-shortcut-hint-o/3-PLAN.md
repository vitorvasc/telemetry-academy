---
phase: quick-03
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/ValidationPanel.tsx
  - src/components/CodeEditor.tsx
  - src/App.tsx
autonomous: true
requirements: [QUICK-03]

must_haves:
  truths:
    - "Check Code button shows 'Cmd+Enter' on macOS and 'Ctrl+Enter' on Windows/Linux"
    - "Typing in the Monaco editor keeps the cursor at the typed position (no jump to end of file)"
    - "Phase switcher buttons (1 · Instrument / 2 · Investigate) are visually prominent and clearly labelled so users do not mistake them for a back-to-cases action"
  artifacts:
    - path: "src/components/ValidationPanel.tsx"
      provides: "Keyboard shortcut hint next to Check Code button"
    - path: "src/components/CodeEditor.tsx"
      provides: "Uncontrolled Monaco editor (defaultValue + ref) so cursor never jumps"
    - path: "src/App.tsx"
      provides: "Improved phase switcher UX"
  key_links:
    - from: "src/App.tsx"
      to: "src/components/ValidationPanel.tsx"
      via: "onValidate prop wired to handleValidate"
    - from: "src/App.tsx"
      to: "src/components/CodeEditor.tsx"
      via: "value/onChange props"
---

<objective>
Fix three UX issues in the editor/navigation area:
1. Add a keyboard shortcut hint ("⌘↵" / "Ctrl+↵") next to the Check Code button so users discover the shortcut.
2. Stop Monaco cursor from jumping to the end of file when typing — switch from fully-controlled `value` prop to uncontrolled `defaultValue` + editor ref so Monaco never re-applies the full value string on every keystroke.
3. Make the "1 · Instrument / 2 · Investigate" phase switcher more visually distinct and clearly labelled so users stop accidentally clicking the "← Cases" arrow.

Purpose: Reduce friction at the most-used interaction points of the platform.
Output: Modified ValidationPanel.tsx, CodeEditor.tsx, App.tsx.
</objective>

<execution_context>
@/Users/vasconcellos/.claude/get-shit-done/workflows/execute-plan.md
@/Users/vasconcellos/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

# Key interfaces extracted from codebase

## src/components/ValidationPanel.tsx (relevant excerpt)
```tsx
interface ValidationPanelProps {
  results: ValidationResult[];
  isValidating: boolean;
  onValidate: () => void;
  phaseUnlocked: boolean;
  onStartInvestigation?: () => void;
  isWorkerReady?: boolean;
  loadingLabel?: string;
}
// "Check Code" button is at line ~42-77. Currently shows <Play /> + "Check Code" text only.
```

## src/components/CodeEditor.tsx (relevant excerpt)
```tsx
interface CodeEditorProps {
  value: string;           // PROBLEM: controlled value causes cursor jump
  onChange: (value: string) => void;
  onRunShortcut?: () => void;
}
// Monaco <Editor value={value} onChange={(val) => onChange(val || '')} />
// Fix: switch to defaultValue + editor.getModel().setValue only when case changes externally
```

## src/App.tsx — phase switcher (lines 349-370)
```tsx
<div className="flex items-center gap-0.5 bg-slate-900 rounded-lg p-0.5 flex-shrink-0">
  <button onClick={() => setAppPhase('instrumentation')} className={...}>
    <span className="hidden sm:inline">1 · </span>Instrument
  </button>
  <button disabled={!phaseUnlocked} onClick={() => ...} className={...}>
    <span className="hidden sm:inline">2 · </span>Investigate
  </button>
</div>
// Problem: pill switcher is small and low-contrast; nearby "← Cases" button looks similar.
```

## Back button (lines 318-325)
```tsx
<button onClick={() => setLocation('/')} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 ...">
  <ArrowLeft className="w-3.5 h-3.5" />
  <span className="hidden sm:inline">Cases</span>
</button>
```
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add keyboard shortcut hint to Check Code button</name>
  <files>src/components/ValidationPanel.tsx</files>
  <action>
In ValidationPanel.tsx, add a keyboard shortcut badge next to the "Check Code" text (only when the button is in its active, non-loading, non-complete state).

Platform detection: `const isMac = navigator.platform.toUpperCase().includes('MAC')` — derive at component render time (not a hook, just a const).

Inside the button's active branch (the `else` branch that currently renders `<Play />` + "Check Code"):
- Keep existing `<Play className="w-4 h-4" />` and "Check Code" text
- After the text, add a `<kbd>` element showing the shortcut:
  ```tsx
  <kbd className="ml-1 text-[10px] font-mono opacity-60 hidden sm:inline-block px-1 py-0.5 bg-white/10 rounded border border-white/20">
    {isMac ? '⌘↵' : 'Ctrl+↵'}
  </kbd>
  ```
- `hidden sm:inline-block` hides it on mobile to avoid cramping the small button.
- Keep the button's existing disabled/loading/complete states exactly as they are — only modify the active "Check Code" branch.
  </action>
  <verify>
    Run `npm run build` — must complete with no TypeScript errors.
    Visually: the Check Code button shows ⌘↵ (Mac) or Ctrl+↵ (other) as a subtle badge.
  </verify>
  <done>Check Code button shows platform-appropriate shortcut hint on desktop. No regressions in loading/validating/complete states.</done>
</task>

<task type="auto">
  <name>Task 2: Fix Monaco cursor jump by switching to uncontrolled mode</name>
  <files>src/components/CodeEditor.tsx</files>
  <action>
The root cause: `<Editor value={value} />` is a fully-controlled prop. Every time the parent re-renders (e.g. after auto-save writes back to state), Monaco calls `model.setValue()` internally, resetting the cursor to end-of-file.

Fix: switch to uncontrolled mode using `defaultValue` + imperative sync only when the case switches externally.

Changes to CodeEditor.tsx:

1. Change prop name in the interface from `value` to `initialValue` (or keep `value` as prop name but pass it as `defaultValue` to Monaco — use `defaultValue` to Monaco, keep the external prop as `value` for backwards-compat with App.tsx so no App.tsx changes needed for this task).

2. Add a `caseKey` prop (optional `string`) to CodeEditor interface. App.tsx will pass `currentCaseId` as `caseKey`. When `caseKey` changes, imperatively call `editor.getModel()?.setValue(value)` and reset cursor to line 1.

3. In the Monaco `<Editor>` component:
   - Change `value={value}` to `defaultValue={value}`
   - Keep `onChange={(val) => onChange(val || '')}` unchanged

4. Add a `useEffect` watching `caseKey` (and a ref for the latest `value` prop):
   ```tsx
   const latestValueRef = useRef(value);
   latestValueRef.current = value;

   useEffect(() => {
     if (editorRef.current) {
       const model = editorRef.current.getModel();
       if (model) {
         model.setValue(latestValueRef.current);
         editorRef.current.setPosition({ lineNumber: 1, column: 1 });
       }
     }
   }, [caseKey]);
   ```
   This fires only on actual case switch, NOT on every keystroke.

5. Update `CodeEditorProps` interface:
   ```tsx
   interface CodeEditorProps {
     value: string;
     onChange: (value: string) => void;
     language?: string;
     filename?: string;
     onRunShortcut?: () => void;
     defaultWordWrap?: boolean;
     caseKey?: string;   // add this
   }
   ```

6. In App.tsx: pass `caseKey={currentCaseId}` to both `<CodeEditor>` instances (desktop Panel and mobile tab). No other App.tsx changes needed for this task.

Do NOT change the external prop name `value` — App.tsx must continue to pass `value={code}` without modification beyond adding `caseKey`.
  </action>
  <verify>
    `npm run build` passes with no errors.
    Manual test: open a case, type `span.set_attribute('value', 'test')` anywhere in the middle of the file — cursor stays on that line. Switch to another case — editor resets to line 1 with new initial code.
  </verify>
  <done>Typing in the editor no longer causes cursor to jump. Switching cases resets editor to initial code at line 1. Auto-save and parent re-renders do not disturb cursor position.</done>
</task>

<task type="auto">
  <name>Task 3: Improve phase switcher UX to prevent accidental Cases navigation</name>
  <files>src/App.tsx</files>
  <action>
Two problems: (a) the phase switcher pill is visually small and blends with surrounding elements; (b) the "← Cases" back button looks similar to a phase tab and is close to the switcher.

Changes in App.tsx:

**Back button — make it clearly secondary:**
- Add explicit label text always visible (remove `hidden sm:inline` from the "Cases" span):
  ```tsx
  <button onClick={() => setLocation('/')} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 px-2 py-1 rounded hover:bg-slate-700/50 border border-slate-700">
    <ArrowLeft className="w-3 h-3" />
    <span>Cases</span>
  </button>
  ```
  The `border border-slate-700` makes it look like a subtle "back" button, not a tab.

**Phase switcher — larger, labelled, with visual lock indicator:**
- Increase padding: `px-3 sm:px-4 py-1.5` (was `px-2 sm:px-3 py-1`)
- Show numbers always (remove `hidden sm:inline` from "1 · " / "2 · " spans)
- Add a lock icon next to "Investigate" when not unlocked yet:
  ```tsx
  import { Lock } from 'lucide-react'; // Lock is already available (lucide-react)
  ```
  In the Investigate button, when `!phaseUnlocked`, render:
  ```tsx
  <Lock className="w-3 h-3 opacity-50" />
  ```
  before the label text, and add `title="Complete Phase 1 to unlock"`.
- Wrap the switcher in a slightly more prominent container:
  ```tsx
  <div className="flex items-center gap-0.5 bg-slate-950 rounded-lg p-0.5 border border-slate-700 flex-shrink-0">
  ```
  (was `bg-slate-900`, no border — adding `border-slate-700` and `bg-slate-950` gives more visual separation)

**Separator between back button and phase switcher:**
The existing `<div className="hidden sm:block w-px h-6 bg-slate-700 flex-shrink-0" />` separator already separates the CaseSelector from what's after it. No change needed there.

Make sure `Lock` is imported from lucide-react alongside existing imports in the import line at the top.

Do NOT rearrange the header layout order. Do NOT change CaseSelector, difficulty badge, or reset button behaviour.
  </action>
  <verify>
    `npm run build` passes with no errors.
    Visually:
    - "← Cases" back button has a visible border, clearly distinct from the phase pill
    - Phase switcher is slightly larger with "1 · Instrument" and "2 · Investigate" always showing the number prefix
    - Investigate button shows a lock icon when phase 1 not yet complete
  </verify>
  <done>Phase switcher is visually distinct from the Cases back button. Users can clearly see they are switching between phases, not navigating away. Lock icon signals when Investigate is not yet available.</done>
</task>

</tasks>

<verification>
After all three tasks:

1. `npm run build` exits 0 with no TypeScript errors.
2. Check Code button shows platform shortcut hint (⌘↵ on Mac, Ctrl+↵ elsewhere).
3. Typing in Monaco keeps cursor on the typed line — no jump to EOF.
4. Phase switcher is visually distinct from the Cases back button.
5. Lock icon appears on Investigate button when phase 1 is incomplete.
</verification>

<success_criteria>
- Build passes clean.
- All three UX improvements are visible without regressions to validation flow, case switching, or keyboard shortcut functionality.
</success_criteria>

<output>
After completion, create `.planning/quick/3-ui-improvements-keyboard-shortcut-hint-o/3-SUMMARY.md` following the summary template.
</output>
