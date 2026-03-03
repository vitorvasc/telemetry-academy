# Phase 3: Visualization & Investigation - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can visually analyze telemetry data to diagnose simulated incidents. This phase enables the Phase 2 investigation workflow: navigating trace waterfalls, correlating spans with logs, and submitting root cause diagnoses with feedback. The UI components (TraceViewer, LogViewer, RootCauseSelector) are already implemented with mock data patterns — this phase focuses on integrating real telemetry from Phase 1 and polishing edge cases.

</domain>

<decisions>
## Implementation Decisions

### Trace-Log Correlation
- **Interactive IDs**: trace_id and span_id in the UI are clickable links
- **Filter persistence**: Tab filter state persists when switching between Traces and Logs tabs
- **Pattern emphasis**: Highlight correlation between slow spans (SLOW badge) and log warnings about timeouts, retries, etc.
- **Span click behavior**: Claude's discretion — determine what happens when user clicks a span (filter logs, highlight, or other interaction)

### Data Integration
- **Auto-populate**: Phase 2 data appears automatically when Phase 1 validation passes (unlocks Investigation tab)
- **Single trace**: Show only the most recent run from Phase 1 code execution
- **Bad data handling**: Display empty state with instructional message if Phase 1 produces no/broken telemetry
- **Read-only**: Investigation data comes directly from Phase 1 — no editing or replay modes

### Empty/Error States
- **No data yet**: Show instructional prompt: "Run your code in Phase 1 to generate telemetry data" with visual guidance
- **Zero spans**: Empty state in TraceViewer: "No spans detected. Check your instrumentation in Phase 1" with link to Phase 1
- **Malformed data**: Silently skip malformed spans/logs, display only valid entries
- **Bridge failure**: Show error message in Phase 2 explaining the failure (Web Worker crash, memory limit, etc.)

### Responsive Behavior
- **Trace waterfall adaptation**: Claude's discretion — choose practical responsive strategy (horizontal scroll, collapse columns, or vertical reorganization)
- **Tab navigation**: Claude's discretion — select appropriate mobile tab pattern
- **Split-screen breakpoint**: Claude's discretion — use sensible breakpoint for content
- **Modal/overlay behavior**: Claude's discretion — choose appropriate mobile UX for details panels

### Claude's Discretion
- Span click interaction behavior
- All responsive design choices (trace waterfall, tabs, breakpoints, overlays)
- Specific empty state copy and visuals
- Error message wording and placement

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TraceViewer` (src/components/TraceViewer.tsx): Waterfall with time ruler, span bars, status badges (OK/SLOW/ERR), attributes drawer, depth indentation
- `LogViewer` (src/components/LogViewer.tsx): Terminal-style table, filter input, trace correlation blue bar, expandable rows, timestamp/level/service columns
- `RootCauseSelector` (src/components/RootCauseSelector.tsx): Multiple choice, radio buttons, inline explanations, attempt counter, retry flow
- `InvestigationView` (src/components/InvestigationView.tsx): Tab navigation (Traces → Logs → Root Cause), incident banner, step indicators

### Established Patterns
- Tab switching: `activeTab` state with numbered step indicators
- Status styling: 'ok' | 'warning' | 'error' mapped to color classes (sky, amber, red)
- Animation: Tailwind transitions with hover states
- Data types: `TraceSpan`, `LogEntry`, `RootCauseOption` defined in `src/types/phase2.ts`
- Mock data: Currently uses static `Phase2Data` with hardcoded spans/logs

### Integration Points
- Investigation tab unlocks when Phase 1 validation passes (already implemented in `App.tsx`)
- `useCodeRunner` hook captures spans from Pyodide execution via postMessage
- Data needs to flow from `useCodeRunner.spans` → `InvestigationView` → child components
- Validation success already triggers tab unlock; need to also capture/populate Phase 2 data

</code_context>

<specifics>
## Specific Ideas

No specific references — open to standard approaches for data integration and responsive design. The existing UI components have a polished look that should be maintained.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-visualization-investigation*
*Context gathered: 2026-03-03*
