# Feature Research

**Domain:** Gamified OpenTelemetry Education Platform
**Researched:** 2026-02-26
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Interactive Code Editor** | Core mechanic. Users need a realistic environment to write instrumentation code. | MEDIUM | Must support syntax highlighting (Monaco Editor) and basic auto-complete. |
| **Instant Validation & Feedback** | Gamification requires immediate feedback on actions to keep players in the flow state. | HIGH | Needs to check both syntax and correct OTel API usage. |
| **Progressive Disclosure (Cases)** | Learning requires a structured difficulty curve (Rookie to Expert). | LOW | Sequential case unlocking mechanism. |
| **Scenario Narratives** | Context gives meaning to the code. A "crime" or "incident" makes it engaging. | LOW | Markdown-based mission briefs. |
| **Hint System** | Players will get stuck. A dead end leads to immediate churn. | LOW | Collapsible, progressive hints (vague to specific). |
| **Persistence (Save State)** | Losing progress on browser refresh is a critical UX failure. | LOW | `localStorage` for MVP is sufficient. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Two-Phase Loop (Instrument + Investigate)** | Uniquely teaches both generating *and* consuming telemetry (nobody else does this). | HIGH | Requires building both a code runner and a realistic observability UI. |
| **Client-Side WASM Execution** | Zero backend infrastructure cost while still running real Python code. | HIGH | Use Pyodide to intercept OTel SDK calls directly in the browser. |
| **Realistic Observability UI** | Trains users on actual tools (trace waterfalls, log correlation) rather than abstract game mechanics. | MEDIUM | Custom components mimicking Jaeger/Tempo and Loki. |
| **Explainable Root Cause Engine** | Educational value in failure: wrong answers cite specific span attributes/logs explaining *why* they are wrong. | MEDIUM | Multiple-choice options mapped to specific data points in the trace. |
| **Signal Correlation** | Teaching the most powerful OTel concept: logs mapped to traces via `trace_id`. | MEDIUM | Log viewer must filter by the currently selected span's trace ID. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Server-Side Code Execution** | "Real" containerized environments feel more authentic. | Heavy infrastructure costs, slow cold starts, security risks (RCE). | **Client-Side WASM (Pyodide)** runs code locally with zero infra cost. |
| **Full Production OTel Backend** | Running real Jaeger/Loki instances per user. | Too expensive and complex to orchestrate for thousands of concurrent learners. | **Mocked or Client-Side Telemetry** stored in memory and visualized with custom UI components. |
| **RPG Graphics/Avatars** | Gamification often implies "video game" aesthetics. | Distracts from the educational goal. Users need to learn the actual SRE interfaces. | **Professional "Detective" UI** that closely mirrors real-world dev tools. |
| **Multi-Language Support (MVP)** | OTel is polyglot; teams use Go, Java, TS. | Drastically increases case authoring burden and execution complexity. | **Python-Only MVP** to validate the learning loop before expanding. |
| **Multiplayer / Team Mode** | "Train your whole eng team together." | Synchronization, auth, and state management make MVP impossible to ship quickly. | **Solo, Anonymous Play** focused on individual upskilling. |

## Feature Dependencies

```
[Interactive Code Editor]
    └──requires──> [Scenario Narratives]
    └──requires──> [Client-Side WASM Execution]
                       └──requires──> [Instant Validation & Feedback]

[Two-Phase Loop (Instrument + Investigate)]
    └──requires──> [Instant Validation & Feedback] (to unlock Phase 2)
    └──requires──> [Realistic Observability UI]
                       └──requires──> [Signal Correlation]
                       └──requires──> [Explainable Root Cause Engine]

[Progressive Disclosure (Cases)]
    └──requires──> [Persistence (Save State)]
```

### Dependency Notes

- **[Client-Side WASM Execution] requires [Instant Validation & Feedback]:** Running the code is useless unless we can intercept the OTel data and validate if it matches the case requirements.
- **[Two-Phase Loop] requires [Instant Validation & Feedback]:** Phase 2 (Investigation) cannot unlock until the Phase 1 validation checks definitively pass.
- **[Realistic Observability UI] requires [Signal Correlation]:** The UI's primary educational value is showing how traces and logs interact; without correlation, it's just raw data.
- **[Progressive Disclosure] requires [Persistence]:** You cannot have a multi-case unlocking system if progress is lost every time the user closes the tab.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] **Interactive Code Editor** — Core input mechanism (Monaco).
- [x] **Scenario Narratives** — Context for the cases.
- [x] **Realistic Observability UI** — Trace waterfall and log viewer.
- [ ] **Persistence (Save State)** — `localStorage` progress tracking.
- [ ] **Client-Side WASM Execution** — Pyodide running real Python OTel code.
- [ ] **Instant Validation & Feedback** — Checking WASM output against case rules.
- [ ] **Three Rookie Cases** — Enough content to prove the learning loop.

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **Metrics Integration** — Adding the third signal (metrics) to Phase 2.
- [ ] **YAML Config Editor** — For "The Collector" case (Phase 1 variant).
- [ ] **Remaining 6 Cases** — Expanding to Junior, Senior, and Staff difficulty.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Multi-Language Support** — Adding Go and Java code runners.
- [ ] **User Accounts & Leaderboards** — Org-level tracking and competition.
- [ ] **Case Authoring Tool** — Allowing the community to build their own cases.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Interactive Code Editor | HIGH | LOW (Done) | P1 |
| Realistic Observability UI | HIGH | MEDIUM (Mostly Done) | P1 |
| Persistence (Save State) | HIGH | LOW | P1 |
| Client-Side WASM Execution | HIGH | HIGH | P1 |
| Explainable Root Cause Engine | HIGH | LOW | P1 |
| YAML Config Editor | MEDIUM | MEDIUM | P2 |
| Metrics Integration | MEDIUM | MEDIUM | P2 |
| Multi-Language Support | HIGH | HIGH | P3 |
| User Accounts | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | SQLPD (SQL Police Dept) | Quest World (Grafana) | Telemetry Academy |
|---------|-------------------------|-----------------------|-------------------|
| **Core Interface** | Real SQL Editor | Text-based MUD + Dashboards | Real Code Editor + Real UI |
| **Educational Scope** | Querying data | Consuming data (Dashboards) | Generating AND Consuming data |
| **Feedback Loop** | Query results table | Text responses | Validation checks + Root Cause UI |
| **Execution** | Server-side DB queries | Backend Python script | Client-side WASM (Zero-infra) |
| **Progression** | Linear cases + Rank test | Linear story | Linear cases (Rookie to Expert) |

## Sources

- Project Context (`.planning/PROJECT.md`)
- Concept & PRD (`docs/PRD.md`, `docs/concept.md`)
- SQLPD Platform Analysis (`sqlpd.com`)
- Grafana Quest World Analysis (`github.com/grafana/adventure`)

---
*Feature research for: Gamified OpenTelemetry Education Platform*
*Researched: 2026-02-26*