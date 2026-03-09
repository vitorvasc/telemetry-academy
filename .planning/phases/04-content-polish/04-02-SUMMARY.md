---
phase: 04-content-polish
plan: 02
subsystem: content
tags: [yaml, validation, collector, auto-instrumentation, pyodide]

requires:
  - phase: 02-validation-core-loop
    provides: validation engine foundation
  - phase: 03-visualization-investigation
    provides: root cause engine with rules-based evaluation

provides:
  - auto-magic-002 case rewritten for Pyodide with URLLibInstrumentor
  - the-collector-003 YAML-config case with yaml_key_exists validation
  - validateYaml() function for YAML-based cases
  - CodeEditor filename prop for dynamic filenames
  - YAML validation path in App.tsx bypassing Python worker

affects:
  - case-authoring
  - validation-engine
  - ui-components

tech-stack:
  added: [js-yaml, @types/js-yaml]
  patterns:
    - YAML validation bypasses Python worker for yaml-config cases
    - Dynamic filename display in CodeEditor
    - validateYaml() as sibling to validateSpans()

key-files:
  created:
    - src/cases/the-collector-003/case.yaml
    - src/cases/the-collector-003/setup.py
  modified:
    - src/cases/auto-magic-002/case.yaml
    - src/cases/auto-magic-002/setup.py
    - src/lib/rootCauseEngine.ts
    - src/lib/validation.ts
    - src/types.ts
    - src/components/CodeEditor.tsx
    - src/App.tsx

key-decisions:
  - "Use .py extension for setup.py even for YAML content to work with existing import.meta.glob pattern"
  - "yaml_key_exists uses dot-notation paths (processors.tail_sampling) for flexible YAML checking"
  - "YAML-config cases skip Python worker entirely for faster validation"
  - "validateYaml() returns ValidationResult[] for consistency with validateSpans()"

patterns-established:
  - "yaml-config case type: Case.type field determines validation path"
  - "YAML validation: No Python worker, direct YAML parsing with js-yaml"
  - "Dynamic editor filename: CodeEditor.filename prop with default fallback"

requirements-completed: [CASE-02, CASE-03]

duration: 18min
completed: 2026-03-09
---

# Phase 04-02: Auto-magic & The Collector Cases Summary

**Two complete OTel learning cases: auto-magic-002 teaches URLLib auto-instrumentation in Pyodide, the-collector-003 teaches Collector YAML configuration with deterministic validation.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-09T20:30:00Z
- **Completed:** 2026-03-09T20:48:00Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- **auto-magic-002 completely rewritten** for Pyodide compatibility with URLLibInstrumentor
- **the-collector-003 created** as first YAML-config case teaching Collector configuration
- **yaml_key_exists validation type** added with validateYaml() function
- **YAML validation path** wired in App.tsx bypassing Python worker for yaml-config cases
- **CodeEditor enhanced** with filename prop for dynamic filename display

## Task Commits

Each task was committed atomically:

1. **Task 1: Author auto-magic-002** — `58ed810` (feat)
2. **Task 2a: Build the-collector-003 + yaml_key_exists** — `3b18aec` (feat)
3. **Task 2b: Wire YAML validation path** — `db63a2d` (feat)

## Files Created/Modified

### Created
- `src/cases/the-collector-003/case.yaml` — YAML-config case metadata with 3 validation rules
- `src/cases/the-collector-003/setup.py` — Initial broken collector.yaml content

### Modified
- `src/cases/auto-magic-002/case.yaml` — Rewritten with URLLibInstrumentor focus, 3 validation rules
- `src/cases/auto-magic-002/setup.py` — Pyodide-compatible Python with micropip imports
- `src/lib/rootCauseEngine.ts` — Complete autoMagicRules (4 options), added collectorRules
- `src/lib/validation.ts` — Added yaml_key_exists type, validateYaml(), checkYamlKeyExists()
- `src/types.ts` — Added Case.type field, yaml_key_exists to ValidationRule type
- `src/components/CodeEditor.tsx` — Added filename prop with default fallback
- `src/App.tsx` — Added YAML validation branch in handleValidate(), dynamic language/filename props
- `package.json` / `package-lock.json` — Added @types/js-yaml dev dependency

## Decisions Made

1. **setup.py for YAML content**: Using `.py` extension for YAML content files to work with existing `import.meta.glob('*/setup.py')` pattern. The file content is YAML but loaded as raw text.

2. **Dot-notation YAML paths**: Using `processors.tail_sampling` syntax for yamlPath instead of nested objects for simpler rule authoring.

3. **No Python worker for YAML cases**: YAML-config cases skip the Python worker entirely, making validation instant and avoiding unnecessary Pyodide initialization.

4. **Consistent ValidationResult interface**: validateYaml() returns the same ValidationResult[] structure as validateSpans() for UI consistency.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

1. **LSP errors in setup.py files**: TypeScript language server reports errors in Python files using micropip/opentelemetry imports. These are expected — the files are executed in Pyodide, not TypeScript.

2. **js-yaml types missing**: Added `@types/js-yaml` dev dependency to resolve TypeScript import errors.

## Next Phase Readiness

- Cases 2 and 3 are complete and playable end-to-end
- Validation engine now supports both span-based and YAML-based validation
- Pattern established for future YAML-config cases (add type: yaml-config to case.yaml)
- Ready for remaining cases (04-03 through 04-09)

---
*Phase: 04-content-polish*
*Completed: 2026-03-09*
