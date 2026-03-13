# Phase 6: Plan and Implement Final Case List - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 delivers a complete, polished 9-case OTel curriculum. This includes rewriting the 3 existing mock cases (Hello Span, Auto-magic, The Collector) and authoring 6 new cases that cover the full OTel knowledge base — from manual spans through cascading failure investigation. No new app features or infrastructure changes — this phase is entirely case content.

</domain>

<decisions>
## Implementation Decisions

### Case Scope

- **9-case comprehensive library** — Full OTel zero-to-hero journey. Every major OTel concept gets its own case.
- **All 3 existing cases rewritten from scratch** — Current implementations were built as mocks; treat them as starting points, not sacred. Rewrite for concept clarity and learning path cohesion.
- **Final case list** (from concept.md, to be refined by researcher/planner):
  1. Hello, Span — manual instrumentation, spans, attributes (rewrite)
  2. Auto-magic — auto-instrumentation, zero-code agents (rewrite)
  3. The Collector — OTel Collector pipeline config (rewrite)
  4. Broken Context — context propagation between services
  5. The Baggage — baggage attributes and correlation
  6. Metrics Meet Traces — multi-signal correlation (metrics + traces)
  7. Log Detective — structured logging with trace_id correlation
  8. Sampling Sleuth — head vs tail sampling strategies
  9. The Perfect Storm — capstone: cascading failure, full-system instrumentation and investigation

### Teaching Approach

- **Concept-first, inline teaching** — Each case's Phase 1 instructions explain the OTel concept it covers: what it is, why it matters in production, then the hands-on exercise. No prior OTel knowledge assumed for case 1; each case builds on previous.
- **Progressive difficulty** — Cases build on each other; concepts introduced in earlier cases are assumed known in later ones.
- **No external links required** — Concept explanation is self-contained in the instructions panel.

### Quality Bar

- Each case must be a complete learning unit: concept explanation + hands-on exercise + realistic Phase 2 incident + validated root cause analysis
- Phase 2 data (traces, logs, root cause options) must be realistic and tied to the concept taught in Phase 1
- Root cause options must have data-driven explanations referencing real span attributes (not generic text)

### Claude's Discretion

- Final case ordering and whether any cases are reordered from the concept.md list
- Implementation batch sequencing (which cases to author first, wave breakdown)
- Case 9 (The Perfect Storm) scope — may need a larger implementation effort than other cases
- Specific incident narratives for cases 4-9
- Exact Phase 2 trace/span attribute names and values for new cases
- Whether any cases beyond 9 are added (researcher may identify gaps)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `case-content-author` agent (`.claude/agents/case-content-author.md`): Dedicated agent for authoring cases — researches OTel concept, produces `case.yaml`, `setup.py`, `phase2.ts` entries, and `rootCauseEngine.ts` rules
- `src/cases/*/case.yaml`: Existing case structure — id, name, order, type, difficulty, concepts, phase1 (description, hints, validations), phase2 metadata
- `src/cases/*/setup.py`: Starter code with partial instrumentation for Phase 1
- `src/data/phase2.ts`: Typed `Phase2Data` — traceId, totalDurationMs, narrative, spans, logs, rootCauseOptions; registered in `phase2Registry`
- `src/lib/rootCauseEngine.ts`: `RootCauseRule[]` per case, registered in `RULES_REGISTRY` — provides contextual attribute-specific feedback
- `src/lib/validation.ts`: 9 check types: `span_exists`, `attribute_exists`, `attribute_value`, `span_count`, `status_ok`, `status_error`, `telemetry_flowing`, `error_handling`, `yaml_key_exists`
- Local skills: `/scaffold-case`, `/new-case`, `/validate-case`, `/lint-case`, `/case-status`

### Established Patterns

- Case auto-discovery: `src/data/caseLoader.ts` uses `import.meta.glob('*/case.yaml')` — adding a new directory with `case.yaml` is all that's needed for discovery
- Validation rules: declarative JSON in `case.yaml`, referencing exact check types from `validation.ts`
- Progressive hints: `hintMessage` at 1-2 attempts, `guidedMessage` at 3+ attempts in validation rules
- Phase 2 root cause: each distractor has `explanation` in `rootCauseOptions` (static) and `explainIncorrect()` in `rootCauseEngine.ts` (data-driven)
- Case type: `instrumentation` for Python execution cases, `yaml-config` for The Collector

### Integration Points

- New cases: create `src/cases/NNN-case-slug/` directory with `case.yaml` + `setup.py`
- Phase 2 data: add entry to `phase2Registry` in `src/data/phase2.ts`
- Root cause rules: add `RootCauseRule[]` and register in `RULES_REGISTRY` in `src/lib/rootCauseEngine.ts`
- Rewriting existing cases: replace files in-place — `caseLoader.ts` discovery is unchanged

</code_context>

<specifics>
## Specific Ideas

- The existing cases (1-3) were built as mocks and may have inconsistencies in narrative, difficulty ramp, and concept depth — treat the rewrite as authoring them properly for the first time
- "The Perfect Storm" (case 9) is a capstone — should feel meaningfully harder and reward learners who completed all prior cases
- Concept-first means: "What is context propagation and why does it matter?" before "Add this code to the service"

</specifics>

<deferred>
## Deferred Ideas

- Cases beyond 9 (Go/Java language variants, additional advanced cases) — future milestone
- Multi-language support (EXP-LANG from v2 requirements) — not this phase
- Metrics Viewer tab (EXP-03) — not this phase

</deferred>

---

*Phase: 06-plan-and-implement-final-case-list*
*Context gathered: 2026-03-13*
