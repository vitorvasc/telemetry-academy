---
phase: quick-04
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [src/App.tsx]
autonomous: true
requirements: [QUICK-04]

must_haves:
  truths:
    - "Instructions panel (case name, phase 1 description, hints) is visible alongside InvestigationView on desktop"
    - "Investigation view takes the majority of horizontal space (~75%)"
    - "Instructions panel is scrollable when content overflows"
    - "Mobile layout is unaffected (investigation still full-width on small screens)"
  artifacts:
    - path: "src/App.tsx"
      provides: "Split layout for investigation phase matching instrumentation phase structure"
  key_links:
    - from: "src/App.tsx (investigation branch)"
      to: "InstructionsPanel"
      via: "left Panel in resizable Group"
      pattern: "InstructionsPanel.*investigation"
---

<objective>
Show the InstructionsPanel (case description + hints) alongside the InvestigationView when appPhase === 'investigation', using a horizontal split layout similar to the instrumentation phase.

Purpose: Users need to reference the case context (what system they're debugging, Phase 1 hints) while investigating. Currently the panel is hidden entirely on entering investigation.
Output: Desktop shows a ~25/75 split with InstructionsPanel on the left, InvestigationView on the right. Mobile stays full-width.
</objective>

<execution_context>
@/Users/vasconcellos/.claude/get-shit-done/workflows/execute-plan.md
@/Users/vasconcellos/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/App.tsx
@src/components/InstructionsPanel.tsx

<interfaces>
From src/App.tsx — investigation branch (lines 567–597):
```tsx
// Currently: full-width div wrapping InvestigationView
) : (
  <div className="flex-1 overflow-hidden">
    {hasPhase2Data && phase2Data ? (
      <InvestigationView ... />
    ) : (
      // no-data fallback ...
    )}
  </div>
)
```

InstructionsPanel props:
```tsx
interface InstructionsPanelProps {
  case: Case;
  phaseUnlocked: boolean;        // true when in investigation
  onStartInvestigation?: () => void;  // omit — already in investigation
}
```

Panel layout variables already declared at top of App:
- mainGroupRef, mainLayout (useDefaultLayout id: 'ta-panel-main')
- Panel IDs already in use: ta-instructions, ta-editor-group
- react-resizable-panels v4: Panel size props require string percentages (e.g. "25%")
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add InstructionsPanel to investigation phase layout</name>
  <files>src/App.tsx</files>
  <action>
    Replace the investigation branch (the final `else` block starting at line 567) with a two-column layout that mirrors the instrumentation desktop layout, but shows InvestigationView instead of the editor/validation panels.

    Desktop layout (hidden sm:flex):
    - Wrap in a `<>` fragment so both desktop and mobile layouts can coexist
    - Desktop: `<Group orientation="horizontal" groupRef={mainGroupRef} className="hidden sm:flex flex-1 overflow-hidden" defaultLayout={mainLayout.defaultLayout} onLayoutChanged={mainLayout.onLayoutChanged}>` — reuses the same panel persistence key as instrumentation phase so sizes are remembered
      - `<Panel id="ta-instructions" defaultSize="25%" minSize="15%" maxSize="45%" className="overflow-y-auto">` containing `<InstructionsPanel case={currentCase} phaseUnlocked={phaseUnlocked} />`
      - `<Separator className="w-1.5 bg-slate-700 hover:bg-sky-500/50 active:bg-sky-500 transition-colors cursor-col-resize flex-shrink-0" />`
      - `<Panel id="ta-investigation" defaultSize="75%" minSize="40%" className="overflow-hidden">` containing the existing hasPhase2Data conditional (InvestigationView or no-data fallback)
    - Mobile layout (`flex sm:hidden flex-1 overflow-hidden`): the existing `<div className="flex-1 overflow-hidden">` wrapping the InvestigationView / no-data fallback, unchanged

    The `onStartInvestigation` prop is NOT needed here since the user is already in investigation. Omit it.

    Do NOT change any other layout branches (instrumentation, solved). Do NOT rename or add new panel persistence keys — reuse `ta-panel-main` / `mainLayout` / `mainGroupRef` so the panel split size is shared with the instrumentation view.
  </action>
  <verify>
    <automated>cd /Users/vasconcellos/projetos/telemetry-academy && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    TypeScript compiles without errors. Investigation phase renders InstructionsPanel on the left and InvestigationView on the right on desktop (sm+). Mobile renders InvestigationView full-width as before.
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — no type errors
2. Visual check: navigate to a case in investigation phase, confirm left panel shows case name + Phase 1 description + hints
3. Confirm the Separator drag handle resizes both panels
4. Confirm mobile (narrow viewport) shows full-width InvestigationView without instructions panel
</verification>

<success_criteria>
InstructionsPanel visible alongside InvestigationView on desktop, TypeScript compiles cleanly, mobile layout unchanged.
</success_criteria>

<output>
After completion, create `.planning/quick/4-keep-instructions-panel-visible-in-inves/4-SUMMARY.md`
</output>
