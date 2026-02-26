# Telemetry Academy

## What This Is

A gamified, browser-based learning platform that teaches OpenTelemetry (OTel) from zero to hero through a unique two-phase gameplay loop. Players first instrument a "blind" system using real OTel APIs, then investigate a simulated incident using trace, log, and metric data to find the root cause. It combines learning how to generate observability data with learning how to use it.

## Core Value

The only interactive platform that teaches the full OpenTelemetry workflow (instrument → collect → correlate → diagnose) through realistic, hands-on incident investigation, mirroring real SRE workflows.

## Requirements

### Validated

- ✓ Interactive code editor (Monaco Editor) with Python syntax support
- ✓ Split-screen layout: Code editor/Instructions (left) + Validation/Visualization (right)
- ✓ Case instructions and hints panel (collapsible)
- ✓ Validation panel with per-check feedback (✓/✗) and animated results
- ✓ Phase unlock flow (unlock Phase 2 after Phase 1 validation passes)
- ✓ Trace viewer UI (waterfall with time ruler, span attributes drawer, SLOW/ERR badges)
- ✓ Log viewer UI (terminal-style table, trace_id correlation, filter input)
- ✓ Root cause selector (multiple choice, inline explanations, attempts counter)
- ✓ Case solved screen (stars, stats, "what you learned")
- ✓ Progress state (in-memory per-case status, phase, attempts, timestamps)
- ✓ Hello, Span (Case 1) implemented with mock data

### Active

- [ ] `localStorage` persistence (save progress on refresh)
- [ ] Real code execution environment for Python scripts via WASM (Pyodide in Web Worker)
- [ ] Client-side JS Exporter bridge to intercept OpenTelemetry Python SDK data
- [ ] Case #2 (Auto-magic) Phase 2 data and logic
- [ ] Deploy to Cloudflare Pages (static frontend with real WASM telemetry)
- [ ] Case #3 (The Collector) using YAML editor or terminal simulation
- [ ] Remaining cases (4 through 9) implementation

### Out of Scope

- [Full-fledged production observability backend] — Too complex/expensive; execution and telemetry collection will happen client-side via WASM.
- [Mobile app] — Code editing and trace investigation requires a desktop screen size.
- [User accounts & leaderboards (for now)] — Keeping it simple with anonymous play and `localStorage` persistence.
- [Multi-language support (for now)] — MVP will be Python-only to prove the concept before adding Go or Java.

## Context

- Tech stack: React 19 + TypeScript + Vite + Tailwind CSS v4.
- Code editor is implemented using `@monaco-editor/react`.
- Currently, the project is a Phase 1 prototype (frontend mock) with simple string matching for validation.
- Cases are defined in a YAML-like TypeScript format containing phase descriptions, initial code, and validations.
- Target audience: Software engineers learning OTel, SREs onboarding to observability, and backend developers adding instrumentation.
- See `docs/PRD.md` and `docs/concept.md` for full product requirements and design.

## Constraints

- **Tech Stack**: Must use React 19, TypeScript, Vite, and Tailwind CSS v4 to maintain consistency.
- **Client-Side Execution**: Real code execution must run entirely in the browser (e.g., Pyodide Web Worker) to avoid heavy backend infrastructure and hosting costs.
- **Progressive Difficulty**: Cases must logically progress from simple manual instrumentation to complex cascading failures.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Using Monaco Editor | Industry standard for web-based code editing, provides robust syntax highlighting | — Pending |
| Client-Side WASM (Pyodide) | Avoids expensive backend infrastructure for code execution; allows static hosting (Cloudflare Pages) | — Pending |
| `localStorage` for MVP | Avoids auth/DB complexity while solving the critical UX issue of losing progress on refresh | — Pending |

---
*Last updated: 2026-02-26 after PRD review*