# Roadmap: Telemetry Academy

## Overview

Telemetry Academy is an interactive, browser-based learning platform that teaches OpenTelemetry through a gamified two-phase loop. This roadmap covers the v1 requirements to deliver a functional MVP where users can instrument Python code in a secure browser sandbox, validate their telemetry, and investigate root causes using a realistic visualization UI.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: WASM Engine & Telemetry Bridge** - User's Python code runs in the browser and its OpenTelemetry output is captured in JavaScript.
- [ ] **Phase 2: Validation & Core Loop** - Users receive real-time validation on their code and can progress through saved cases.
- [ ] **Phase 3: Visualization & Investigation** - Users can visually analyze telemetry data to diagnose simulated incidents.
- [ ] **Phase 4: Content & Polish** - Users can play through three complete, distinct learning scenarios end-to-end.

## Phase Details

### Phase 1: WASM Engine & Telemetry Bridge
**Goal**: User Python code executes in a browser sandbox and outputs telemetry to JavaScript.
**Depends on**: Nothing (first phase)
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04
**Success Criteria** (what must be TRUE):
  1. User can run Python code containing OpenTelemetry SDK calls in the browser without freezing the UI.
  2. Code with infinite loops is terminated automatically after a timeout.
  3. Generated spans are correctly intercepted and serialized into JavaScript objects.
**Plans**: 2 plans

Plans:
- [ ] 01-01: Setup Pyodide Web Worker and Monaco Editor integration
- [ ] 01-02: Implement OTel JS Exporter and Python-to-JS telemetry bridging

### Phase 2: Validation & Core Loop
**Goal**: Users receive real-time validation on their code and can progress through saved cases.
**Depends on**: Phase 1
**Requirements**: CORE-05, LOOP-01, LOOP-02, LOOP-04
**Success Criteria** (what must be TRUE):
  1. User sees immediate pass/fail feedback for specific case requirements when running code.
  2. User can unlock the next case only after passing all current validations.
  3. User retains their completed case status after refreshing the browser page.
**Plans**: 3 plans

Plans:
- [ ] 02-01: Implement TelemetryStore and validation engine logic
- [ ] 02-02: Build Validation Panel UI and case unlocking flow
- [ ] 02-03: Implement localStorage state persistence

### Phase 3: Visualization & Investigation
**Goal**: Users can visually analyze telemetry data to diagnose simulated incidents.
**Depends on**: Phase 1
**Requirements**: LOOP-03, VIS-01, VIS-02, VIS-03, VIS-04
**Success Criteria** (what must be TRUE):
  1. User can navigate a visual trace waterfall to identify slow or erroring spans.
  2. User can click spans to inspect attributes and correlate them with logs.
  3. User can attempt to solve the case and read specific feedback on their incorrect guesses.
**Plans**: 3 plans

Plans:
- [ ] 03-01: Build Trace Viewer waterfall and span expansion UI
- [ ] 03-02: Build Log Viewer with trace correlation
- [ ] 03-03: Implement Root Cause Engine and guess feedback UI

### Phase 4: Content & Polish
**Goal**: Users can play through three complete, distinct learning scenarios end-to-end.
**Depends on**: Phase 2, Phase 3
**Requirements**: LOOP-05, CASE-01, CASE-02, CASE-03
**Success Criteria** (what must be TRUE):
  1. User can successfully instrument and solve the manual instrumentation case (CASE-01).
  2. User can complete the auto-instrumentation and configuration cases (CASE-02, CASE-03).
  3. User views a "Case Solved" summary screen outlining their performance and takeaways after each case.
**Plans**: 3 plans

Plans:
- [ ] 04-01: Author and test "Hello, Span" (CASE-01)
- [ ] 04-02: Author and test "Auto-magic" (CASE-02) and "The Collector" (CASE-03)
- [ ] 04-03: Build Case Solved summary screen and final polish

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. WASM Engine & Telemetry Bridge | 0/2 | Not started | - |
| 2. Validation & Core Loop | 0/3 | Not started | - |
| 3. Visualization & Investigation | 0/3 | Not started | - |
| 4. Content & Polish | 0/3 | Not started | - |