# Requirements: Telemetry Academy

**Defined:** 2026-02-26
**Core Value:** The only interactive platform that teaches the full OpenTelemetry workflow (instrument → collect → correlate → diagnose) through realistic, hands-on incident investigation, mirroring real SRE workflows.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core Engine & Infrastructure

- [x] **CORE-01**: User code executes securely in a Pyodide WASM Web Worker
- [x] **CORE-02**: Web Worker execution includes timeouts to prevent infinite loop freezing
- [x] **CORE-03**: Custom OpenTelemetry `SpanExporter` intercepts Pyodide telemetry output
- [x] **CORE-04**: Python OpenTelemetry spans and attributes serialize cleanly to JSON for the JS bridge
- [ ] **CORE-05**: User progress and state persist across browser reloads via `localStorage`

### Gamified Learning Loop

- [ ] **LOOP-01**: Case selector allows linear progression (next case unlocks upon completion)
- [x] **LOOP-02**: Phase 1 (Instrumentation) validates JSON telemetry output, not RegEx parsing of code
- [ ] **LOOP-03**: "Root Cause Engine" provides detailed, attribute-specific explanations for incorrect guesses
- [x] **LOOP-04**: Validation Panel displays real-time ✓/✗ feedback on specific telemetry requirements
- [ ] **LOOP-05**: Case Solved screen displays attempts, time, score, and "What you learned" summary

### Visualization (Investigation)

- [ ] **VIS-01**: Trace Viewer displays an interactive, Jaeger-like span waterfall timeline
- [ ] **VIS-02**: Trace Viewer allows expanding spans to inspect custom attributes, events, and statuses
- [ ] **VIS-03**: Log Viewer displays a terminal-style table with support for `trace_id` correlation
- [ ] **VIS-04**: SLOW and ERROR badges visually flag anomalous spans in the waterfall

### Case Content (MVP Tier)

- [ ] **CASE-01**: "Hello, Span" (Manual Instrumentation) implemented with real WASM execution
- [ ] **CASE-02**: "Auto-magic" (Auto-instrumentation) fully implemented with Phase 2 data
- [ ] **CASE-03**: "The Collector" configuration case implemented (via YAML editor or terminal sim)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Expansion Cases & Features

- **EXP-01**: Implement remaining Senior/Staff cases (Baggage, Metrics correlation, Head/Tail sampling)
- **EXP-02**: Implement Expert case ("The Perfect Storm" cascading failure)
- **EXP-03**: Metrics Viewer tab (Latency heatmaps, error rates) in Phase 2

### Multi-language & Backend

- **LANG-01**: Support Go code execution and validation
- **LANG-02**: Support Java code execution and validation
- **AUTH-01**: User authentication system for cross-device progress syncing
- **AUTH-02**: Team/Org leaderboards and dashboards

## Out of Scope

| Feature | Reason |
|---------|--------|
| Server-side Code Execution | Prohibitively expensive and introduces massive security/RCE risks. Sticking to Pyodide/WASM. |
| Production Telemetry Backend | Too heavy (Jaeger, Loki, Prometheus). Custom React components are sufficient for teaching. |
| Mobile Support | Real code editing (Monaco) and complex trace waterfalls require a desktop layout. |
| Multiplayer/Co-op modes | Learning is individual; multiplayer complicates state management significantly. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 1 | Complete |
| CORE-02 | Phase 1 | Complete |
| CORE-03 | Phase 1 | Complete |
| CORE-04 | Phase 1 | Complete |
| CORE-05 | Phase 2 | Pending |
| LOOP-01 | Phase 2 | Pending |
| LOOP-02 | Phase 2 | Complete |
| LOOP-03 | Phase 3 | Pending |
| LOOP-04 | Phase 2 | Complete |
| LOOP-05 | Phase 4 | Pending |
| VIS-01 | Phase 3 | Pending |
| VIS-02 | Phase 3 | Pending |
| VIS-03 | Phase 3 | Pending |
| VIS-04 | Phase 3 | Pending |
| CASE-01 | Phase 4 | Pending |
| CASE-02 | Phase 4 | Pending |
| CASE-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-26*
*Last updated: 2026-02-26 after initial definition*