---
phase: quick-06
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/TraceViewer.tsx
  - src/data/phase2.ts
  - src/App.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "All spans start collapsed in TraceViewer"
    - "Trace ID is a realistic 32-char hex string that persists for a session"
    - "Clicking the Trace ID copies it to clipboard"
    - "Investigate tab stays enabled after returning to instrumentation phase as long as code has not changed"
    - "Switching away and back to a solved/investigation case keeps the Investigate tab enabled"
  artifacts:
    - path: "src/components/TraceViewer.tsx"
      provides: "Collapsed-by-default spans, generated traceId display with copy button"
    - path: "src/data/phase2.ts"
      provides: "traceId generated at module load (realistic 32-char hex)"
    - path: "src/App.tsx"
      provides: "phaseUnlocked independent of appPhase — based only on code equality"
  key_links:
    - from: "src/data/phase2.ts"
      to: "src/components/TraceViewer.tsx"
      via: "traceId prop passed through InvestigationView"
    - from: "src/App.tsx"
      to: "phase bar button"
      via: "phaseUnlocked prop controls disabled state of Investigate tab"
---

<objective>
Fix three UX bugs in the investigation phase:
1. db.query span (span-002) opens expanded by default — should start collapsed.
2. Trace ID is a hardcoded mock string — should be a realistic generated 32-char hex ID with click-to-copy.
3. Switching back to the instrumentation tab re-locks the investigation even when code is unchanged.

Purpose: These bugs degrade the learning experience by showing irrelevant state on load, displaying an obviously fake trace ID, and frustrating phase navigation.
Output: Three targeted fixes across TraceViewer.tsx, phase2.ts, and App.tsx.
</objective>

<execution_context>
@/Users/vasconcellos/.claude/get-shit-done/workflows/execute-plan.md
@/Users/vasconcellos/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/TraceViewer.tsx
@src/data/phase2.ts
@src/App.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Collapse all spans by default and add trace ID copy button</name>
  <files>src/components/TraceViewer.tsx</files>
  <action>
Two changes in TraceViewer.tsx:

1. **Default collapsed state** — Change line 36:
   ```ts
   const [openSpan, setOpenSpan] = useState<string | null>('span-002');
   ```
   to:
   ```ts
   const [openSpan, setOpenSpan] = useState<string | null>(null);
   ```
   No span opens automatically. Users click to expand.

2. **Click-to-copy Trace ID** — Add copy-to-clipboard behavior to the Trace ID section in the meta bar. Add a `copied` state (`useState<boolean>(false)`). Wrap the trace ID display in a `<button>` that calls `navigator.clipboard.writeText(traceId)` and briefly sets `copied = true` (reset after 1500ms via `setTimeout`). Show the full 32-char traceId (not truncated, or truncated same as before but copy sends full). When copied, replace the trace ID text with "Copied!" in green. Use a `Copy` icon from lucide-react next to the text (size w-3 h-3). Button styling: `cursor-pointer hover:text-sky-300 transition-colors flex items-center gap-1`.
  </action>
  <verify>npm run build -- --mode development 2>&1 | tail -5</verify>
  <done>TraceViewer renders with all spans collapsed. Trace ID row has a copy button. Clicking it copies the full traceId to clipboard and shows "Copied!" feedback.</done>
</task>

<task type="auto">
  <name>Task 2: Generate realistic trace ID at module load</name>
  <files>src/data/phase2.ts</files>
  <action>
Replace the hardcoded mock trace ID `'a1b2c3d4e5f6789012345678'` with a generated 32-char lowercase hex string.

Add a helper at the top of the file (before `helloSpanPhase2`):
```ts
function generateTraceId(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}
```

Replace `traceId: 'a1b2c3d4e5f6789012345678'` with `traceId: generateTraceId()`.

This runs once at module load, so the trace ID is stable for the entire session but looks realistic. `crypto.getRandomValues` is available in all modern browsers and in Vitest's jsdom environment — no import needed.
  </action>
  <verify>npm run build -- --mode development 2>&1 | tail -5</verify>
  <done>phase2.ts compiles without errors. The traceId for helloSpanPhase2 is a 32-char lowercase hex string generated at module load.</done>
</task>

<task type="auto">
  <name>Task 3: Fix phaseUnlocked logic — decouple from appPhase</name>
  <files>src/App.tsx</files>
  <action>
The current logic at line 115-117:
```ts
const phaseUnlocked =
  (appPhase === 'investigation' || appPhase === 'solved') &&
  code === lastPassedCodeRef.current;
```

This makes `phaseUnlocked = false` whenever `appPhase === 'instrumentation'`, which disables the Investigate tab button — even when the code hasn't changed. Users can never return to instrumentation without losing access to investigation.

Change to:
```ts
const phaseUnlocked =
  lastPassedCodeRef.current !== null &&
  code === lastPassedCodeRef.current;
```

Remove the `appPhase` check entirely. The logic is: investigation is unlocked if the user has ever passed phase 1 for this case AND the code still matches what they passed with. Changing code re-locks (which is correct behavior). Going back to instrumentation does NOT re-lock.

No other changes needed — the phase bar button already uses `disabled={!phaseUnlocked}` and the lock icon already uses `{!phaseUnlocked && <Lock .../>}`.
  </action>
  <verify>npm run build -- --mode development 2>&1 | tail -5</verify>
  <done>After passing phase 1, clicking "1 · Instrument" tab keeps the "2 · Investigate" button enabled. Editing the code re-locks investigation. Switching to another case and back to a solved case keeps investigation enabled.</done>
</task>

</tasks>

<verification>
Run full build to confirm no TypeScript errors:
```
npm run build
```
Manual verification steps:
1. Open case 1, complete phase 1 (or use existing saved progress). Switch to Investigate tab.
2. Confirm all spans are collapsed on load.
3. Click the Trace ID — confirm "Copied!" feedback appears and clipboard contains a 32-char hex string.
4. Click "1 · Instrument" tab. Confirm "2 · Investigate" tab is still enabled (not greyed out, no lock icon).
5. Click "2 · Investigate" — confirm navigation works without requiring re-run.
6. Switch to Case 2 (instrumentation), then switch back to Case 1 — confirm investigation tab is still enabled.
</verification>

<success_criteria>
- All spans start collapsed in TraceViewer (no auto-open)
- Trace ID is a realistic 32-char hex value (not 'a1b2c3d4e5f6789012345678')
- Clicking Trace ID copies to clipboard with visual feedback
- Investigate tab stays enabled after returning to instrumentation (code unchanged)
- Editing code re-locks investigation (existing behavior preserved)
- npm run build passes with no errors
</success_criteria>

<output>
After completion, create `.planning/quick/6-1-when-in-the-investigation-phase-on-cas/6-SUMMARY.md`
</output>
