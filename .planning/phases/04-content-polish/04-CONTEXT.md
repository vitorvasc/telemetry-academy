# Phase 4: Content & Polish - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Three complete, playable OTel learning scenarios working end-to-end: real WASM execution for hello-span-001 and auto-magic-002, authoring the-collector-003, wiring CaseSolvedScreen, and final polish. Users can instrument, investigate, and reach a Case Solved screen for all three cases.

</domain>

<decisions>
## Implementation Decisions

### "The Collector" Case (CASE-03)

- **Concepts taught**: OTel Collector configuration — pipeline setup (receivers, processors, exporters), plus head/tail sampling configuration, and resource attributes (service.name, deployment.environment)
- **Exercise format**: YAML editor — user edits a `collector.yaml` in Monaco (reuses existing code editor component, no new UI needed)
- **Validation approach**: Parse YAML with js-yaml in JS, check for specific keys/values — e.g., `tail_sampling` in processors, `otlp` in exporters, `service.name` resource attribute set. Clean and deterministic; extend existing ValidationCheckType system with a new `yaml_key_exists` or similar type
- **Phase 2 incident**: Misconfigured sampling drops critical traces — the collector is sampling too aggressively, dropping error spans. User sees gaps in trace coverage and investigates to find the tail_sampling rule is misconfigured (sampling_percentage too low or wrong rules matching errors)

### Case Solved Screen

- **Trigger**: Appears after user selects the correct root cause in Phase 2 (the natural end-of-case moment)
- **Layout**: Replaces the right panel (Validation/Investigation area). Left panel (code editor + instructions) stays visible — user can still review their code
- **"Review Investigation" button**: Opens a modal with a trace summary (key spans + correct root cause explanation). Does NOT navigate away from the solved screen
- **"Next Case" button**: Navigates to the next case (already exists in component)

### auto-magic-002 Phase 2 Data

- **Trace structure**: HTTP chain with error span — root span `GET /orders`, child `http.client` span calling external payment API, that child has ERROR status with `http.status_code=500`. Fast (~200ms) but fails. Makes the error obvious in the waterfall
- **Logs**: HTTP error + retry entries — `"Calling payment API..."`, `"Payment API returned 500"`, `"Retrying (attempt 2/3)"`, `"Max retries exceeded"`. Matches http.client span. Teaches log-trace correlation
- **Incident narrative**: "Checkout is failing for 30% of users. Support tickets are flooding in. Your auto-instrumented traces are live — time to find out why."

### Polish Scope (04-03)

Priority order: cases complete → loading states → mobile → onboarding

- **Loading/transition states**: Pyodide init spinner, code-running state, validation staggered reveal. Audit existing states, fix gaps
- **Empty & error states**: "Run your code in Phase 1 to generate telemetry data" instructional prompt in Phase 2 before any code runs; error message if Web Worker crashes
- **Mobile layout fixes**: Drawer nav, horizontal scroll on trace waterfall, tab navigation on small screens (carried forward from Phase 3 "Claude's discretion" items)
- **Onboarding / first-run UX**: All three tiers — (1) improve HomePage (difficulty labels, case descriptions), (2) welcome modal on first visit explaining instrument → investigate loop, (3) inline tooltips in the editor on first case

### Claude's Discretion

- Exact yaml_key_exists validation type naming and implementation details
- The Collector case starter YAML content
- Modal design for "Review Investigation" summary
- Welcome modal copy and step count
- Tooltip placement and trigger conditions (first-visit vs always)
- Specific span attribute names for auto-magic and collector Phase 2 traces

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CaseSolvedScreen` (src/components/CaseSolvedScreen.tsx): Fully built — stars, stats, "What you learned", Next Case / Review Investigation buttons. Needs wiring into App.tsx
- `CodeEditor` (src/components/CodeEditor.tsx): Monaco editor — can be reused for YAML editing in The Collector by changing language to 'yaml'
- `src/cases/hello-span-001/case.yaml` + `src/cases/auto-magic-002/case.yaml`: Both have phase1 validations; auto-magic needs Phase 2 trace/log data added to phase2.ts
- `src/data/phase2.ts`: Contains `helloSpanPhase2` — same structure needed for `autoMagicPhase2` and `collectorPhase2`
- `ValidationPanel` (src/components/ValidationPanel.tsx): Existing validation UI — would display YAML check results too

### Established Patterns
- Case data: `src/cases/*/case.yaml` auto-discovered by `caseLoader.ts` — new case directory + case.yaml is all that's needed
- Phase 2 data: typed `Phase2Data` in `src/types/phase2.ts` — add new entries to `phase2.ts`
- Validation types: 8 existing check types in `src/lib/validation.ts` — new `yaml_key_exists` type would follow same pattern
- Progressive hints: hintMessage (1-2 attempts), guidedMessage (3+) — apply to YAML validation rules too

### Integration Points
- `CaseSolvedScreen` trigger: `RootCauseSelector` correct answer → propagate event up to App.tsx → swap right panel to CaseSolvedScreen
- Review modal: new modal component or reuse existing pattern within CaseSolvedScreen
- YAML validation: `src/workers/python.worker.ts` won't run for The Collector (no Python) — validation runs directly on YAML string in the main thread
- Mobile responsive: Phase 3 left responsive choices to Claude's discretion — make those concrete decisions here during 04-03

</code_context>

<specifics>
## Specific Ideas

- The Collector case difficulty: 3rd case, should feel meaningfully harder than auto-magic — YAML + concepts around pipeline configuration and sampling feels like a natural step up
- auto-magic incident: "Checkout is failing for 30% of users" — relatable, real-world stakes
- Onboarding: all three tiers (HomePage improvements + welcome modal + inline tooltips) — ship as much as fits in 04-03 polish plan

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-content-polish*
*Context gathered: 2026-03-09*
