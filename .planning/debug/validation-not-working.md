---
status: resolved
trigger: "No validations are passing, even if I have the code on the editor, when I click on 'check code' it fails"
created: "2026-03-03T00:00:00Z"
updated: "2026-03-03T00:00:00Z"
---

## Current Focus

hypothesis: The 'telemetry_flowing' validation type is not implemented in the validation engine, causing it to always return false
test: Code review of validation.ts runCheck function
expecting: Confirm that 'telemetry_flowing' case is missing from switch statement
next_action: Provide findings report

## Symptoms

expected: Validations should pass when user correctly instruments code with spans and attributes
actual: All validations fail even with correct code
errors: No console errors - validations silently fail
reproduction: 
  1. Open any case in telemetry-academy
  2. Write correct instrumentation code
  3. Click "Check Code"
  4. All validations show as failed
started: Unknown - likely since 'telemetry_flowing' validation was added

## Eliminated

- hypothesis: validateSpans() not being called from App.tsx
  evidence: App.tsx lines 116-119 clearly calls validateSpans with correct parameters
  timestamp: 2026-03-03

- hypothesis: Spans not being captured by useCodeRunner
  evidence: useCodeRunner.ts lines 101-104 properly handles 'telemetry' messages and adds spans to state
  timestamp: 2026-03-03

- hypothesis: Spans not being passed to validation engine
  evidence: App.tsx line 118 passes `spans` from useCodeRunner hook to validateSpans
  timestamp: 2026-03-03

## Evidence

- timestamp: 2026-03-03
  checked: src/types.ts line 23
  found: ValidationRule.type includes 'telemetry_flowing' and 'error_handling' as valid types
  implication: The type system allows these validation types

- timestamp: 2026-03-03
  checked: src/lib/validation.ts lines 1-7
  found: ValidationCheckType only includes 'span_exists', 'attribute_exists', 'attribute_value', 'span_count', 'status_ok', 'status_error' - MISSING 'telemetry_flowing'
  implication: Type mismatch between what's defined and what's implemented

- timestamp: 2026-03-03
  checked: src/lib/validation.ts runCheck function lines 58-75
  found: Switch statement has no case for 'telemetry_flowing', falls through to default: return false
  implication: Any 'telemetry_flowing' validation will ALWAYS fail regardless of actual span data

- timestamp: 2026-03-03
  checked: src/data/cases.ts line 69
  found: First case (hello-span-001) has a validation with type: 'telemetry_flowing'
  implication: This is the PRIMARY CAUSE - the first case always has at least one failing validation

- timestamp: 2026-03-03
  checked: src/App.tsx handleValidate flow lines 96-136
  found: Validation runs immediately after runCode resolves, but spans come via async postMessage
  implication: Potential race condition where validation runs before all spans are received

## Resolution

root_cause: |
  The validation engine in src/lib/validation.ts does not implement the 'telemetry_flowing' 
  validation type. When validateSpans() encounters a rule with type 'telemetry_flowing', 
  the runCheck() function falls through to the default case which returns false, causing 
  that validation to ALWAYS fail. The first case (hello-span-001) includes this validation 
  type at line 69 of cases.ts, meaning no user can ever pass all validations for the first case.

  There is also a type mismatch: src/types.ts ValidationCheckType includes 'telemetry_flowing' 
  and 'error_handling', but src/lib/validation.ts ValidationCheckType does not.

fix: |
  1. Add 'telemetry_flowing' and 'error_handling' to ValidationCheckType in src/lib/validation.ts
  2. Implement handling for 'telemetry_flowing' in the runCheck() switch statement
  3. Optionally: Implement 'error_handling' if needed, or remove from types if not used
  4. Consider adding a race condition fix to ensure all spans are captured before validation

verification: |
  After implementing the fix:
  1. Open hello-span-001 case
  2. Write correct instrumentation code with span and order_id attribute
  3. Click "Check Code"
  4. All validations should pass

files_changed: 
  - src/lib/validation.ts: Add missing validation types and their implementations
  - src/data/cases.ts: Either fix validation rules or ensure types match implementation
