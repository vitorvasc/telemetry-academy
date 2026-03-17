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
- Validation engine: `src/lib/validation.ts` — 9 check types:
  `span_exists`, `attribute_exists`, `attribute_value`, `span_count`,
  `status_ok`, `status_error`, `telemetry_flowing`, `error_handling`, `yaml_key_exists`
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
- Each root cause distractor has `explanation` in `rootCauseOptions` (static) and `explainIncorrect()` in `rootCauseEngine.ts` (data-driven)
- Rules must reference real span attribute names from `phase2.ts` data

### Pyodide Patterns

- Always set 5s timeout in Web Worker to prevent infinite loops
- Custom exporter: `opentelemetry.sdk.trace.export.SpanExporter` subclass
- postMessage types (worker → host): `loading-stage`, `ready`, `error`, `success`, `stdout`, `telemetry`
- postMessage types (host → worker): `init` (with `setupScript`), `run` (with `code` + `id`)
- Run messages are correlated by `id`; `error` without `id` = init failure; `error` with `id` = run failure
- See `docs/worker-protocol.md` for full protocol reference

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
3. `src/data/phase2.ts` — add `traceId`, `totalDurationMs`, `narrative`, `spans`, `logs`, `rootCauseOptions`; register in `phase2Registry`
4. `src/lib/rootCauseEngine.ts` — add `RootCauseRule[]` for the case and register in `RULES_REGISTRY`
5. Verify: each `type:` value in validation rules exists in `ValidationCheckType`
6. Verify: each root cause rule references a real span attribute from the phase2 traces
7. Verify: `caseLoader.ts` auto-discovers the new directory (check console on dev startup)

## External Dependencies & CSP

All external domains must be listed in `public/_headers` (`Content-Security-Policy`)
**and** in `scripts/check-csp.mjs` + `src/tests/csp.test.ts`. The test suite enforces this.

| Domain | Directives | Why |
|---|---|---|
| `cdn.jsdelivr.net` | `script-src`, `connect-src`, `style-src` | Pyodide WASM runtime + Monaco Editor CSS |
| `static.cloudflareinsights.com` | `script-src`, `connect-src` | Cloudflare Web Analytics (auto-injected by CF Pages) |
| `https://pypi.org` | `connect-src` | micropip fetches package metadata for opentelemetry-api/sdk |
| `https://files.pythonhosted.org` | `connect-src` | micropip downloads Python wheels at runtime |

**When adding a new external dependency:**
1. Add the domain to the correct directive(s) in `public/_headers`
2. Add the entry to `REQUIRED_DOMAINS` in both `scripts/check-csp.mjs` and `src/tests/csp.test.ts`
3. Run `npm run check:csp` to verify

## Current Phase: 4 (Content & Polish)

9 cases planned, 2 complete (`001-hello-span`, `002-auto-magic`).
See `.planning/ROADMAP.md` for full scope and `.planning/STATE.md` for current state.
