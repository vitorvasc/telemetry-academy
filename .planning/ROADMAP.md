# Roadmap: Telemetry Academy

## Overview

Telemetry Academy is an interactive, browser-based learning platform that teaches OpenTelemetry through a gamified two-phase loop. This roadmap covers the v1 requirements to deliver a functional MVP where users can instrument Python code in a secure browser sandbox, validate their telemetry, and investigate root causes using a realistic visualization UI.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: WASM Engine & Telemetry Bridge** - User's Python code runs in the browser and its OpenTelemetry output is captured in JavaScript.
- [x] **Phase 2: Validation & Core Loop** - Users receive real-time validation on their code and can progress through saved cases.
- [x] **Phase 3: Visualization & Investigation** - Users can visually analyze telemetry data to diagnose simulated incidents.
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
- [x] 01-01-PLAN.md — Setup Pyodide Web Worker and App Integration
- [x] 01-02-PLAN.md — Implement OTel JS Exporter and Python-to-JS telemetry bridging

### Phase 2: Validation & Core Loop
**Goal**: Users receive real-time validation on their code and can progress through saved cases.
**Depends on**: Phase 1
**Requirements**: CORE-05, LOOP-01, LOOP-02, LOOP-04
**Success Criteria** (what must be TRUE):
  1. User sees immediate pass/fail feedback for specific case requirements when running code.
  2. User can unlock the next case only after passing all current validations.
  3. User retains their completed case status after refreshing the browser page.
**Plans**: 5 plans in 2 waves

**Wave 1** (Parallel):
- [x] 02-01-PLAN.md — Implement span-based validation engine with progressive hints
- [x] 02-03-PLAN.md — Implement localStorage persistence with schema versioning, attempt history, and reset

**Wave 2** (Depends on Wave 1):
- [x] 02-02-PLAN.md — Integrate validation and persistence into UI with spinner, staggered reveal, attempt tracking, and case unlocking

**Gap Closure** (Fixes UAT blockers):
- [x] 02-04-PLAN.md — Fix validation engine: Add missing 'telemetry_flowing' and 'error_handling' validation types
- [x] 02-05-PLAN.md — Fix persistence loading: Load persisted code on mount and prevent overwrite on initial load

### Phase 3: Visualization & Investigation
**Goal**: Users can visually analyze telemetry data to diagnose simulated incidents.
**Depends on**: Phase 1
**Requirements**: LOOP-03, VIS-01, VIS-02, VIS-03, VIS-04
**Success Criteria** (what must be TRUE):
  1. User can navigate a visual trace waterfall to identify slow or erroring spans.
  2. User can click spans to inspect attributes and correlate them with logs.
  3. User can attempt to solve the case and read specific feedback on their incorrect guesses.
**Plans**: 3 plans in 2 waves

**Wave 1** (Parallel):
- [ ] 03-01-PLAN.md — Build Trace Viewer waterfall with real OTel span transformation and SLOW/ERROR badges
- [ ] 03-02-PLAN.md — Build Log Viewer with synthetic log generation and trace correlation

**Wave 2** (Depends on Wave 1):
- [ ] 03-03-PLAN.md — Implement Root Cause Engine with attribute-specific feedback and guess evaluation

### Phase 4: Content & Polish
**Goal**: Users can play through three complete, distinct learning scenarios end-to-end.
**Depends on**: Phase 2, Phase 3
**Requirements**: LOOP-05, CASE-01, CASE-02, CASE-03
**Success Criteria** (what must be TRUE):
  1. User can successfully instrument and solve the manual instrumentation case (CASE-01).
  2. User can complete the auto-instrumentation and configuration cases (CASE-02, CASE-03).
  3. User views a "Case Solved" summary screen outlining their performance and takeaways after each case.
**Plans**: 3 plans in 2 waves

**Wave 1** (Parallel):
- [x] 04-01-PLAN.md — Fix hello-span-001: add MockDB/MockCache, fix attributeKey — makes CASE-01 fully playable
- [ ] 04-02-PLAN.md — Author auto-magic-002 for Pyodide (URLLibInstrumentor) + author the-collector-003 (YAML editor + yaml_key_exists)

**Wave 2** (Depends on Wave 1):
- [ ] 04-03-PLAN.md — Wire ReviewModal for CaseSolvedScreen, add WelcomeModal, polish HomePage

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. WASM Engine & Telemetry Bridge | 2/2 | Complete | 2026-02-26 |
| 2. Validation & Core Loop | 5/5 | Complete | 2026-03-03 |
| 3. Visualization & Investigation | 3/3 | Complete | 2026-03-03 |
| 4. Content & Polish | 1/3 | In progress | 2026-03-09 |
