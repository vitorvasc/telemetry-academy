---
name: validate-case
description: |
  UAT a Telemetry Academy case end-to-end. Checks validation rule correctness,
  hint escalation, root cause rule quality, and data consistency. Use when
  testing a case before marking it complete or when UAT reveals gaps.
---

# Case Validation Workflow

You are performing UAT on a Telemetry Academy case. Work through each check
systematically and produce a pass/fail report with specific blockers.

## Input

Case ID to test (e.g., `hello-span-001`). Read these files:
- `src/cases/<id>/case.yaml`
- `src/cases/<id>/setup.py`
- `src/data/phase2.ts` (find the entry for this case ID)
- `src/lib/validation.ts` (reference for valid check types)
- `src/lib/rootCauseEngine.ts` (reference for rule evaluation)

---

## Check 1: Rule Type Validity

For each item in `phase1.validations`:

```
validations[i].type must be one of:
  span_exists | attribute_exists | attribute_value | span_count |
  status_ok | status_error | telemetry_flowing | error_handling
```

**FAIL** if any `type:` value doesn't match exactly (case-sensitive).

---

## Check 2: Required Fields Per Rule Type

| type | required fields |
|------|----------------|
| `span_exists` | `spanName` or checks any span |
| `attribute_exists` | `spanName`, `attributeKey` |
| `attribute_value` | `spanName`, `attributeKey`, `attributeValue` |
| `span_count` | `minCount` |
| `telemetry_flowing` | none extra required |
| `error_handling` | `spanName` recommended |

**FAIL** if a required field for the rule type is missing.

---

## Check 3: Message Quality

For each validation rule, verify:
- `errorMessage` includes a fix suggestion (not just "failed")
- `hintMessage` starts with `💡 Hint:` and gives specific guidance
- `guidedMessage` starts with `📖` and gives exact code/step

**WARN** if any message is generic or doesn't help a stuck user.

---

## Check 4: Progressive Hint Logic

Check that hint escalation makes sense:
- `hintMessage` = gentler nudge (what to look for)
- `guidedMessage` = nearly the answer (exact API call or line)

**FAIL** if `guidedMessage` is less specific than `hintMessage`.

---

## Check 5: Phase 2 Data Consistency

In `src/data/phase2.ts`, find the entry for this case ID and verify:

1. At least 1 trace with at least 2 spans (root + child)
2. Each span has: `spanId`, `name`, `startTime`, `duration`, `status`, `attributes`
3. At least 3 log entries with `traceId` matching a trace
4. Log `traceId` values match actual `traceId` values in traces (no orphans)
5. There is exactly 1 `correct: true` in `rootCauseOptions`

---

## Check 6: Root Cause Rule Quality

For each `rootCauseOption` in `case.yaml`:

- `explanation` must reference at least one **specific span attribute name** from
  the phase2 traces (e.g., `db.connection_pool.wait_ms=4750`, not just "the span")
- The correct option's explanation must name the specific fix, not just the symptom
- Each distractor explanation must explain WHY the data rules it out

**FAIL** if any explanation is purely generic.

---

## Check 7: Root Cause Engine Coverage

In `phase2.ts`, find `evaluationRules` for this case. Verify:

1. There is at least 1 rule for the correct option
2. Each rule references an attribute that actually exists in the traces
3. The condition logic would evaluate correctly given the trace data

---

## Check 8: setup.py Gap Quality

Read `setup.py` and verify:
- The `# TODO:` comment clearly marks what needs to be added
- The learning target is NOT already in the file (don't give away the answer)
- The boilerplate is complete (imports, tracer setup, OTLP config)
- The business logic is realistic (not a trivial hello world)

---

## Output Format

```
CASE VALIDATION REPORT: <case-id>
==================================

PHASE 1 RULES
✓ Check 1 (Rule Types): PASS
✗ Check 2 (Required Fields): FAIL
  - validations[1] type=attribute_value missing attributeValue field
✓ Check 3 (Message Quality): PASS
⚠ Check 4 (Hint Logic): WARN
  - validations[2] guidedMessage is same specificity as hintMessage

PHASE 2 DATA
✓ Check 5 (Data Consistency): PASS
✗ Check 6 (Root Cause Quality): FAIL
  - Option C explanation doesn't reference any span attributes
✓ Check 7 (Engine Coverage): PASS

SETUP.PY
✓ Check 8 (Gap Quality): PASS

SUMMARY
-------
BLOCKERS (must fix): 2
WARNINGS (should fix): 1
PASS: 5

BLOCKERS:
1. validations[1] type=attribute_value missing attributeValue field
2. Option C explanation doesn't reference any span attributes
```

Create insertion plans (e.g., `04-XX-PLAN.md`) for any blockers found.
