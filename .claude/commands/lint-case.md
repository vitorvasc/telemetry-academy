---
description: Lint a case YAML against the validation engine's known check types
allowed-tools: Bash, Read, Glob
---

# Case YAML Linter

Validate that a case's YAML rules are compatible with the validation engine.

## Usage

Run with: `/lint-case <case-id>`

If no case ID provided, lint all cases in `src/cases/`.

## Linting Steps

### 1. Get Valid Check Types

Read `src/lib/validation.ts` and extract the `ValidationCheckType` union:

```bash
grep -A 10 "ValidationCheckType" src/lib/validation.ts
```

Valid types as of current implementation:
`span_exists`, `attribute_exists`, `attribute_value`, `span_count`,
`status_ok`, `status_error`, `telemetry_flowing`, `error_handling`

### 2. Read Case YAML(s)

For the specified case:
```bash
cat src/cases/<case-id>/case.yaml
```

Or for all cases:
```bash
find src/cases -name "case.yaml" | sort
```

### 3. Extract and Check Each Validation Rule

For each item in `phase1.validations`:

**Rule: type field**
- Must be present
- Must be one of the valid `ValidationCheckType` values (case-sensitive)
- ERROR if missing or invalid

**Rule: required fields by type**
- `attribute_exists`: needs `attributeKey`
- `attribute_value`: needs `attributeKey` AND `attributeValue`
- `span_count`: needs `minCount`
- `span_exists`: `spanName` is optional but recommended
- ERROR if required field missing

**Rule: message fields**
- `description` — required
- `successMessage` — required
- `errorMessage` — required
- `hintMessage` — optional but strongly recommended
- `guidedMessage` — optional but strongly recommended
- WARN if `hintMessage` or `guidedMessage` missing

**Rule: message format conventions**
- `hintMessage` should start with `💡`
- `guidedMessage` should start with `📖`
- WARN if convention not followed

**Rule: root cause options**
- Exactly 1 option must have `correct: true`
- Each option must have `id`, `label`, `correct`, `explanation`
- ERROR if 0 or 2+ correct options
- ERROR if any option missing required fields

### 4. Report Results

```
LINT REPORT: <case-id>
======================

phase1.validations:
  [0] type=span_exists         ✓ VALID
  [1] type=attribute_exists    ✓ VALID — has attributeKey
  [2] type=attribute_valu      ✗ ERROR: invalid type (did you mean 'attribute_value'?)
  [3] type=span_count          ✓ VALID — has minCount=2
  [4] type=telemetry_flowing   ⚠ WARN: missing hintMessage

phase2.rootCauseOptions:
  [a] correct=false  ✓
  [b] correct=true   ✓
  [c] correct=false  ✓
  [d] correct=false  ✓
  Total correct: 1   ✓

SUMMARY
-------
Errors:   1 (must fix)
Warnings: 1 (should fix)

ERRORS:
  validations[2].type: 'attribute_valu' is not a valid ValidationCheckType
  Valid types: span_exists, attribute_exists, attribute_value, span_count,
               status_ok, status_error, telemetry_flowing, error_handling
```

Exit with error message if any ERRORs found.
Exit cleanly with summary if only WARNings or all PASS.
