---
created: 2026-02-24
updated: 2026-02-24
project: Telemetry Academy
status: draft
authors: [Vitor Vasconcellos, Lumen]
---

# Telemetry Academy — Product Requirements Document

> **Tagline:** Learn OpenTelemetry by instrumenting real systems and investigating real incidents.

---

## 1. Overview

**Telemetry Academy** is a gamified, browser-based learning platform that teaches OpenTelemetry (OTel) from zero to hero through a unique two-phase gameplay loop:

1. **Phase 1 — Instrumentation:** The player receives a broken, "blind" system with no telemetry. They must instrument it using real OTel APIs and concepts.
2. **Phase 2 — Investigation:** Once telemetry flows, the player investigates a simulated incident using trace, log, and metric data — and must identify the root cause.

The format is inspired by [SQLPD](https://sqlpd.com) and [SDPD](https://sdpd.live), but uniquely combines *learning how to generate observability data* with *learning how to use it*.

---

## 2. Problem Statement

OpenTelemetry is the industry standard for observability instrumentation, but it has a steep learning curve. Existing resources (docs, videos, blog posts) are passive. The only interactive alternative — [Quest World by Grafana](https://github.com/grafana/adventure) — teaches tool usage through an adventure narrative, not incident investigation skills.

There is no platform that teaches the **full OTel workflow**: instrument → collect → correlate → diagnose.

---

## 3. Target Audience

### Primary
- **Software engineers** learning OTel for the first time
- **SRE / Platform engineers** onboarding to observability practices
- **Backend developers** adding instrumentation to existing services

### Secondary
- **Engineering managers** evaluating OTel maturity at their org
- **Educators / bootcamp instructors** looking for hands-on OTel exercises
- **OpenTelemetry contributors** who want a community learning resource

> ⚠️ **OPEN QUESTION (O1):** Is this primarily a solo learning tool or a team/org tool (e.g., "train your whole eng team")? The answer affects pricing, auth, and dashboard features.

---

## 4. Core Gameplay Loop

```
┌──────────────────────────────────────────────────────────────┐
│  SELECT CASE                                                 │
│  (Case Selector — sequential, locked until previous solved)  │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  PHASE 1: INSTRUMENTATION                                    │
│  • Read the scenario narrative                               │
│  • Edit code in Monaco Editor (Python / Go / Java)          │
│  • Validation checks (pass/fail per requirement)             │
│  • Unlock Phase 2 when all checks pass                       │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  PHASE 2: INVESTIGATION                                      │
│  • Trace waterfall viewer (Jaeger-like)                      │
│  • Log viewer (terminal-style, trace_id correlation)         │
│  • Multiple-choice root cause analysis                       │
│  • Feedback per attempt (wrong answer explains why)          │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  CASE SOLVED                                                 │
│  • Stars (1–3) based on attempts + time                      │
│  • "What you learned" summary                                │
│  • Next case unlocked                                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Case Progression

### Defined Cases (9 total)

| # | Name | OTel Concept | Difficulty | Status |
|---|------|-------------|------------|--------|
| 1 | Hello, Span | Manual instrumentation | Rookie | ✅ Implemented |
| 2 | Auto-magic | Auto-instrumentation | Rookie | 🟡 Stub (no Phase 2 data) |
| 3 | The Collector | Collector pipeline config | Junior | ❌ Not started |
| 4 | Broken Context | Context propagation | Junior | ❌ Not started |
| 5 | The Baggage | Baggage attributes | Senior | ❌ Not started |
| 6 | Metrics Meet Traces | Signal correlation | Senior | ❌ Not started |
| 7 | Log Detective | Structured logging + trace_id | Staff | ❌ Not started |
| 8 | Sampling Sleuth | Head/tail sampling | Staff | ❌ Not started |
| 9 | The Perfect Storm | Cascading failure (everything) | Expert | ❌ Not started |

> ⚠️ **OPEN QUESTION (O2):** Should all 9 cases be available at launch, or should we launch with 3 (Rookie tier) and release the rest progressively? Progressive release creates urgency but may feel incomplete.

> ⚠️ **OPEN QUESTION (O3):** Case #3 (The Collector) is fundamentally different — it's about YAML config, not code. Should Phase 1 use a YAML editor instead of Monaco + Python? Or a terminal simulation?

---

## 6. Features

### 6.1 Implemented (MVP Frontend)

| Feature | Description |
|---------|-------------|
| Case Selector | Sequential navigation, lock/unlock, status badges |
| Phase switcher | Header pills to toggle between Phase 1 / Phase 2 |
| Monaco Editor | Python syntax highlighting, pre-filled starter code |
| Instructions Panel | Markdown narrative, hints (collapsible), OTel doc links |
| Validation Panel | Per-check feedback (✓/✗), animated results |
| Trace Viewer | Waterfall with time ruler, span attributes drawer, SLOW/ERR badges |
| Log Viewer | Terminal-style table, trace_id correlation, filter input |
| Root Cause Selector | Multiple choice, inline explanations, attempts counter |
| Case Solved Screen | Stars, stats (attempts, time, score), "What you learned", Next button |
| Progress State | In-memory per-case status, phase, attempts, timestamps |

### 6.2 Not Implemented (Planned)

| Feature | Priority | Notes |
|---------|----------|-------|
| `localStorage` persistence | High | Progress lost on refresh — critical for UX |
| Multi-language support (Go, Java) | Medium | MVP is Python-only |
| Real code execution | High | Currently mock string-matching validation |
| Real trace/log backend | Medium | Currently mock data, not generated by player code |
| Metrics tab in Phase 2 | Medium | Designed but not built |
| User accounts + leaderboard | Low | Requires backend |
| Case authoring format (YAML) | Medium | Cases defined in TypeScript today |
| Keyboard shortcuts | Low | Power user feature |

---

## 7. Technical Architecture

### Current State (MVP Frontend)

```
React 19 + TypeScript + Vite
Tailwind CSS v4
Monaco Editor (@monaco-editor/react)
Lucide React (icons)

All data: mocked in TypeScript files
No backend
No persistence (in-memory only)
```

### Target Architecture (production)

```
Frontend: React + TypeScript + Vite (current)
Backend: Go (API + case runner)
Code Sandbox: WASM or lightweight container
Telemetry Backend: Jaeger + Loki + Prometheus (real OTel stack)
Auth: TBD (see O4)
Persistence: PostgreSQL
Hosting: TBD (see O5)
```

> ⚠️ **OPEN QUESTION (O4):** Does this need user accounts at all? Options:
> - **No auth:** Anonymous play, `localStorage` only. Simple. No leaderboard.
> - **Optional auth:** Play anonymously, sign in to save progress and appear on leaderboard.
> - **Required auth:** Necessary for team/org features.

> ⚠️ **OPEN QUESTION (O5):** Hosting model?
> - **Static frontend only:** Cloudflare Pages. Free. Works for MVP but mocks stay as mocks.
> - **Full stack:** Go backend + DB. Enables real validation and real traces. More complex.
> - **Hybrid:** Static frontend with real telemetry via embedded sandbox (e.g., WebContainers).

> ⚠️ **OPEN QUESTION (O6):** Real code execution vs. smart mocks. The current mock validation (string matching) teaches the *concept* but doesn't validate *correctness*. Options:
> - **Keep mocks:** Faster to ship, less infra. Educational value is in the concepts, not the execution.
> - **WASM sandbox:** Run Python/Go in-browser via Pyodide / TinyGo. No backend needed.
> - **Server-side runner:** Containerized code execution. Most flexible but heavy infra.

---

## 8. User Experience Principles

1. **Learn by doing, not reading.** Every concept introduced in Phase 1 is applied in Phase 2.
2. **Failure is educational.** Wrong answers in Phase 2 show exactly why they're wrong.
3. **Real tools, real data.** UI should feel like Jaeger / Grafana / Loki, not a toy.
4. **Progressive difficulty.** Rookie cases are achievable in < 10 min. Expert cases may take 30+.
5. **No dead ends.** Hints available at every step. Players should never be stuck without recourse.

---

## 9. Content Design Guidelines

### Phase 1 (Instrumentation)
- Starter code must compile / be syntactically valid (just missing instrumentation)
- TODOs must be specific enough to hint the correct API
- Validation checks must be deterministic and explainable
- Each case should have ≥ 3 hints, ordered from vague to specific

### Phase 2 (Investigation)
- Trace data must tell a coherent story
- The correct root cause must be *discoverable* from the data, not guessable
- Wrong answers must be plausible (not obviously wrong)
- Log entries must correlate with trace spans via `trace_id`
- Each answer explanation must cite specific span attributes or log lines

---

## 10. Open Questions Summary

| ID | Question | Blocking? | Who decides |
|----|----------|-----------|-------------|
| O1 | Solo tool vs. team/org tool? | Yes (scope) | Vitor |
| O2 | Launch with 3 cases or all 9? | Yes (scope) | Vitor |
| O3 | YAML editor for Collector case? | No (future) | Vitor + design |
| O4 | Auth model (none / optional / required)? | Yes (architecture) | Vitor |
| O5 | Hosting model (static / full stack / hybrid)? | Yes (next step) | Vitor |
| O6 | Real code execution vs. smart mocks? | Yes (architecture) | Vitor |
| O7 | Language support: Python only or multi-language from day 1? | No (can add later) | Vitor |
| O8 | Is this a personal/side project or OpenTelemetry community resource? | Yes (scope + branding) | Vitor |
| O9 | Monetization? Free, freemium (like SQLPD), or fully open source? | No (not now) | Vitor |

---

## 11. Name & Branding

### Current Recommendation
**Telemetry Academy** — professional, educational, broadly applicable.

### Alternatives Considered
| Name | Verdict |
|------|---------|
| O11Y Detective | Good tagline/sub-brand, not ideal as primary |
| Signal Sleuth | Memorable, but niche |
| Observability Dojo | Strong, but martial-arts feel may not fit |
| Span & Solve | Fun, but too informal |
| Root Cause Academy | Clear outcome, less about the journey |
| OpenTelemetry Quest | Too similar to Grafana's existing "Quest World" |

> ⚠️ **OPEN QUESTION (O10):** Final name decision. Telemetry Academy is the working title — confirm or pick an alternative before any public launch.

---

## 12. Competitive Landscape

| Product | Type | OTel Focus | Investigation | Instrumentation |
|---------|------|------------|---------------|-----------------|
| **Telemetry Academy** | Game | ✅ Native | ✅ | ✅ |
| SQLPD / SDPD | Game | ❌ | ✅ | ❌ |
| Quest World (Grafana) | Game | ✅ | Partial | ❌ |
| OTel Demo (CNCF) | Reference app | ✅ | ❌ | ❌ |
| OTel Docs / Sandbox | Docs | ✅ | ❌ | ✅ |

**Unique position:** The only product that teaches both sides of OTel — generating data *and* using it.

---

## 13. Success Metrics (TBD)

> ⚠️ **OPEN QUESTION (O11):** What does success look like?
> Suggestions (pending Vitor's input):
> - GitHub stars (if open source)
> - Monthly active players
> - Case completion rate (% who finish at least 3 cases)
> - Time-to-first-case-solved (< 15 min = good onboarding)
> - NPS / qualitative feedback from OTel community

---

## 14. Current Repository

- **Location:** `~/telemetry-academy` (local, not yet on GitHub)
- **Concept doc:** `~/lumen/memory/docs/telemetry-academy/concept.md`
- **Stack:** React 19 + TypeScript + Vite + Tailwind v4 + Monaco Editor

---

## 15. Immediate Next Steps (when we resume)

1. **Answer open questions O1, O2, O4, O5** — these define what we build next
2. **Deploy to Cloudflare Pages** — get a public URL to share and test on mobile
3. **`localStorage` persistence** — critical UX fix before sharing with anyone
4. **Add Phase 2 data for Case #2** — so the second case is fully playable
5. **Create GitHub repo** — public or private (depends on O8)

---

*Document written 2026-02-24. Resume session: 2026-02-25.*
