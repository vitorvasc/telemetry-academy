# Telemetry Academy — Project Instructions

## What This Is

A gamified, browser-based OTel learning platform. Users instrument blind systems
(Phase 1) then investigate synthetic incidents (Phase 2) using the telemetry they created.
Client-side Python execution via Pyodide (WASM) — no backend required.

## Development Workflow (CRITICAL)

All work follows this cycle:

1. Research → `.planning/XX-YY-RESEARCH.md`
2. Context gathering → `.planning/XX-YY-CONTEXT.md` (decisions, gray areas)
3. Plan → `.planning/XX-YY-PLAN.md` (tasks + acceptance criteria + wave breakdown)
4. Execute → commit per task: `feat(XX-YY): description`
5. Verify → `.planning/XX-YY-VERIFICATION.md` (gates next phase)

**Phase scope is FIXED once CONTEXT.md is approved.** New ideas go in
DEFERRED IDEAS section of CONTEXT.md, not the current phase.

## Key Architecture

- Python runs in `src/workers/python.worker.ts` (Pyodide Web Worker)
- Custom OTel exporter bridges spans to JS via postMessage
- Validation engine: `src/lib/validation.ts` — 8 check types:
  `span_exists`, `attribute_exists`, `attribute_value`, `span_count`,
  `status_ok`, `status_error`, `telemetry_flowing`, `error_handling`
- Cases: YAML in `src/cases/*/case.yaml`, auto-discovered by `src/data/caseLoader.ts`
- Phase 2 data: `src/data/phase2.ts` (traces, logs, root cause rules)
- Root cause evaluation: `src/lib/rootCauseEngine.ts` (rules-based, not static text)
- Persistence: `src/hooks/useAcademyPersistence.ts` (localStorage, versioned key)

## Code Patterns

### State Resets

- Clear validation results when code changes OR traceId changes
- Use `display:none` (not conditional rendering) to preserve component state across tabs
- `useEffect` watches traceId to clear `evaluationResult`

### Validation Rules

- Rules are declarative JSON (not regex/AST)
- Progressive hints: `hintMessage` at 1-2 attempts, `guidedMessage` at 3+
- Each root cause distractor has `specificHint` + `explanation`
- Rules must reference real span attribute names from `phase2.ts` data

### Pyodide Patterns

- Always set 5s timeout in Web Worker to prevent infinite loops
- Custom exporter: `opentelemetry.sdk.trace.export.SpanExporter` subclass
- PostMessage protocol: `{type: 'spans', data: serializedSpans}`

### Responsive Design

- Mobile breakpoint: `md` (768px)
- Sidebar: hidden on mobile → drawer with backdrop for iOS tap-to-close
- Trace waterfall: horizontal scroll with collapsible columns
- Code editor: full-width on mobile

## Commit Conventions

- `docs(phase-XX)` — Planning docs (RESEARCH, CONTEXT, PLAN, VERIFICATION)
- `feat(XX-YY)` — Implementation matching a PLAN.md task
- `fix(XX-YY)` — Bug fix from UAT
- `chore` — Non-feature changes (deps, config)

## Case Authoring Checklist

When creating a new case:

1. `src/cases/<id>/case.yaml` — metadata, phase1 config, validation rules
2. `src/cases/<id>/setup.py` — partial instrumentation starter code
3. `src/data/phase2.ts` — add traces, logs, rootCauseOptions, evaluationRules
4. Verify: each `type:` value in validation rules exists in `ValidationCheckType`
5. Verify: each root cause rule references a real span attribute from the phase2 traces
6. Verify: `caseLoader.ts` auto-discovers the new directory (check console on dev startup)

## Current Phase: 4 (Content & Polish)

9 cases planned, 2 complete (`hello-span-001`, `auto-magic-002`).
See `.planning/ROADMAP.md` for full scope and `.planning/STATE.md` for current state.
