---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 05-06-PLAN.md — Panel size props from bare numbers to string percentages
last_updated: "2026-03-10T13:43:25.381Z"
last_activity: "2026-03-10 - Completed quick task 002: Fix DataCloneError in python.worker.ts, add Vitest unit tests"
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 20
  completed_plans: 20
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-26)

**Core value:** The only interactive platform that teaches the full OpenTelemetry workflow (instrument → collect → correlate → diagnose) through realistic, hands-on incident investigation, mirroring real SRE workflows.
**Current focus:** Phase 1: WASM Engine & Telemetry Bridge

## Current Position

Phase: 4 of 4 (Content & Polish)
Plan: 4 of 3 in current phase (all plans complete)
Status: In Progress
Last activity: 2026-03-10 - Completed quick task 5: fix markdown rendering in InstructionsPanel

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 6 min
- Total execution time: 0.2 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 2 | 12m | 6m |
| 2 | 5 | 26m | 5.2m |
| 3 | 3 | 16m | 5.3m |
| 4 | 3 | 31m | 10.3m |

**Recent Trend:**
- Last 5 plans: 01-01, 01-02
- Trend: Stable

*Updated after each plan completion*
| Phase 01 P01 | 5 min | 3 tasks | 4 files |
| Phase 01 P02 | 7 min | 3 tasks | 4 files |
| Phase 02-validation-core-loop P01 | 2 min | 3 tasks | 3 files |
| Phase 02-validation-core-loop P03 | 12 min | 3 tasks | 3 files |
| Phase 02-validation-core-loop P02 | 4min | 3 tasks | 2 files |
| Phase 02-validation-core-loop P04 | 3min | 2 tasks | 1 files |
| Phase 02-validation-core-loop P05 | 5min | 3 tasks | 1 files |
| Phase 03-visualization-investigation P02 | 4min | 3 tasks | 5 files |
| Phase 03-visualization-investigation P01 | 6 min | 3 tasks | 3 files |
| Phase 03-visualization-investigation P03 | 6min | 3 tasks | 6 files |
| Phase 04-content-polish P01 | 3 min | 2 tasks | 2 files |
| Phase 04-content-polish P02 | 18 min | 3 tasks | 9 files |
| Phase 04-content-polish P03 | 10min | 4 tasks | 7 files |
| Phase 05 P01 | 5 | 2 tasks | 4 files |
| Phase 05 P02 | 8 | 2 tasks | 3 files |
| Phase 05 P03 | 4 | 2 tasks | 2 files |
| Phase 05 P04 | 4 | 2 tasks | 4 files |
| Phase 05 P05 | 3 | 2 tasks | 5 files |
| Phase 05 P07 | 3 | 1 tasks | 1 files |
| Phase 05 P06 | 3 | 1 tasks | 1 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Phase 1]: Use Pyodide and Web Workers to sandbox Python execution
- [Phase 2]: Validate JSON spans instead of parsing AST
- [Phase 02-validation-core-loop]: Native TypeScript over Zod for validation (no external dependency)
- [Phase 02-validation-core-loop]: Progressive messages escalate after 3 attempts (1-2: hint, 3+: guided)
- [Phase 02-validation-core-loop]: Use ReturnType<typeof setTimeout> instead of NodeJS.Timeout for browser compatibility
- [Phase 02-validation-core-loop]: Pass isWorkerReady separately from isValidating to distinguish worker init from code execution
- [Phase 02-validation-core-loop]: Amber styling for guided messages (3+ attempts) to distinguish from errors
- [Phase 02-validation-core-loop]: telemetry_flowing reuses checkSpanExists for consistent span name matching
- [Phase 02-validation-core-loop]: error_handling checks both status code and error attributes for comprehensive coverage
- [Phase 03-visualization-investigation]: Use controlled/uncontrolled pattern for LogViewer filter to support both standalone and integrated use
- [Phase 03-visualization-investigation]: Use display:none instead of conditional rendering to preserve component state across tab switches
- [Phase 03-visualization-investigation]: Rules-based engine over static explanations for contextual feedback — Provides contextual feedback that references actual span attribute values (e.g., db.connection_pool.wait_ms=4750) rather than generic text. This teaches users to interpret real observability data.
- [Phase 03-visualization-investigation]: State reset on traceId change — useEffect watches traceId and clears evaluationResult, ensuring users don't see stale feedback after re-running code. This addresses the common pitfall of Root Cause Feedback Staleness.
- [Phase 03-visualization-investigation]: Targeted hints for incorrect guesses — Each distractor option gets a specific hint guiding the user toward what to look for (e.g., Look at db.connection_pool.wait_ms — is the time spent waiting or querying?).
- [Phase 04-content-polish]: Mock objects as minimal pass-through classes — No complex simulation needed - just prevent NameError so users focus on instrumentation
- [Phase 04-content-polish]: Explicit spanName in validation rules — Prevents matching wrong spans by scoping check to correct operation
- [Phase 04-content-polish]: Use .py extension for YAML content files — Works with existing import.meta.glob('*/setup.py') pattern
- [Phase 04-content-polish]: Dot-notation YAML paths — processors.tail_sampling syntax for simpler rule authoring
- [Phase 04-content-polish]: No Python worker for YAML cases — Skip worker entirely for instant validation
- [Phase 04-content-polish]: Consistent ValidationResult interface — validateYaml() returns same structure as validateSpans()
- [Phase 05-01]: react-resizable-panels v4 API: Group/Panel/Separator with useDefaultLayout hook for persistence (not v3 autoSaveId prop)
- [Phase 05-01]: setLayout in v4 takes {panelId: percentage} object — panel IDs must be stable (ta-instructions, ta-editor-group, ta-editor, ta-bottom, ta-validation, ta-output)
- [Phase 05-01]: vite.config.ts must import defineConfig from vitest/config (not vite) when test field is present
- [Phase 05-02]: Hints always visible in InstructionsPanel — progressive disclosure was hiding key information from struggling users
- [Phase 05-02]: aria-label instead of title on Lightbulb SVG — lucide-react LucideProps does not accept title prop
- [Phase 05]: Monaco addCommand API for keyboard shortcuts: OnMount handler receives (editor, monaco) to access KeyMod/KeyCode constants
- [Phase 05]: Font size persisted to localStorage key ta-editor-fontsize (10–20px range)
- [Phase 05]: defaultWordWrap prop sets initial word wrap state; YAML cases default to on, Python to off
- [Phase 05]: ProgressDot inline in CaseSelector — small enough to keep co-located, avoids extra file
- [Phase 05]: getPhaseStatus maps investigation and complete both to phase1done (amber) for consistent phase 1 completion signal
- [Phase 05]: MobileCaseDrawer sm:hidden ensures drawer never shown on tablet/desktop — no extra conditional logic needed
- [Phase 05-05]: loading-stage handled in initWorker onmessage (not runCode messageHandler) — fires during init before runCode is called
- [Phase 05-05]: CodeEditor named export remapped to default via .then(m => ({ default: m.CodeEditor })) for React.lazy compatibility
- [Phase 05]: Word wrap state uses lazy initializer reading ta-editor-wordwrap, falling back to defaultWordWrap prop when no stored value
- [Phase 05-06]: react-resizable-panels v4 Panel size props require string percentages — bare numbers are treated as pixel values (breaking change from v3)

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

### Roadmap Evolution

- Phase 5 added: UI Polish — resizable panels, navigation improvements, hint system, code editor tweaks, performance and visual enhancements

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Fix Pyodide threading error, rename case dirs to numbered format, add case slug routing | 2026-03-10 | 16fe670 | [001-fix-pyodide-threading-rename-dirs-slug-routing](./quick/001-fix-pyodide-threading-rename-dirs-slug-routing/) |
| 002 | Fix DataCloneError in python.worker.ts — serialize PyProxy via toJs() before postMessage, add Vitest unit tests | 2026-03-10 | ca0896a | [2-fix-datacloneerror-in-python-worker-post](./quick/2-fix-datacloneerror-in-python-worker-post/) |
| 003 | UI improvements: keyboard shortcut hint on Check Code, Monaco cursor jump fix (uncontrolled defaultValue), phase switcher clarity + lock icon | 2026-03-10 | bfe89e8 | [3-ui-improvements-keyboard-shortcut-hint-o](./quick/3-ui-improvements-keyboard-shortcut-hint-o/) |
| 004 | Keep InstructionsPanel visible in investigation phase — 25/75 resizable split layout on desktop, mobile unchanged | 2026-03-10 | 2611d92 | [4-keep-instructions-panel-visible-in-inves](./quick/4-keep-instructions-panel-visible-in-inves/) |
| 005 | Fix markdown rendering in InstructionsPanel — ReactMarkdown with @tailwindcss/typography for descriptions and hints | 2026-03-10 | a54a8a5 | [5-fix-markdown-rendering-in-instructions-p](./quick/5-fix-markdown-rendering-in-instructions-p/) |
| 006 | Investigation UX: collapsed spans, realistic generated trace ID with copy button, phaseUnlocked decoupled from appPhase | 2026-03-10 | fe6f622 | [6-1-when-in-the-investigation-phase-on-cas](./quick/6-1-when-in-the-investigation-phase-on-cas/) |

## Session Continuity

Last session: 2026-03-10T14:14:00Z
Stopped at: Completed quick task 006 — Investigation phase UX bug fixes
Resume file: None