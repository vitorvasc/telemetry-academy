# Testing Patterns

**Analysis Date:** 2026-03-10

## Test Framework

**Runner:**
- None configured. No `jest.config.*`, `vitest.config.*`, or test runner in `package.json` scripts.
- No test dependencies in `devDependencies` (`package.json`).

**Assertion Library:**
- None detected.

**Run Commands:**
```bash
# No test commands configured in package.json
# Current scripts: dev, build, lint, preview
```

## Current Test Coverage

**State:** Zero automated tests exist in this codebase. No `*.test.*` or `*.spec.*` files found anywhere under `src/`.

The `coverage/` directory exists at the project root but contains no meaningful content — it is likely a leftover artifact.

## Testable Units (High Value Targets)

Despite no tests existing, the codebase has clear, pure functions that are directly unit-testable:

**`src/lib/validation.ts` — Pure validation logic:**
- `validateSpans(rules, context)` — maps rules to pass/fail results
- `checkSpanExists(spans, spanName?)` — exported, pure
- `checkAttributeExists(spans, spanName?, attributeKey?)` — exported, pure
- `checkAttributeValue(spans, spanName?, attributeKey?, attributeValue?)` — exported, pure
- `checkSpanCount(spans, minCount?)` — exported, pure
- `checkStatus(spans, spanName?, statusCode?)` — exported, pure
- `validateYaml(rules, context)` — exported, pure

**`src/lib/spanTransform.ts` — Data transformation:**
- `deriveStatus(span)` — exported, pure
- `calculateDepth(span, spanMap, visited?)` — exported, handles cycles and max depth
- `normalizeAttributes(attributes)` — exported, pure
- `transformSpans(rawSpans)` — exported, throws on empty input
- `getTraceId(rawSpans)` — exported, throws on empty/missing
- `getTotalDurationMs(rawSpans)` — exported, pure

**`src/lib/rootCauseEngine.ts` — Evaluation logic:**
- `evaluateGuess(guessId, data, caseId)` — exported, deterministic
- `findSlowestSpan(data)` — exported, pure
- `findSpanWithAttribute(data, attr)` — exported, pure
- `getPoolWaitMs(span)` — exported, returns null on missing
- `formatDuration(ms)` — exported, pure

**`src/lib/logGenerator.ts` — Log synthesis:**
- `generateLogsFromSpans(spans, traceId, traceStartMs)` — exported, deterministic

## Recommended Test Setup

If tests are added, the natural choice given the Vite build system is:

**Framework:** Vitest (native Vite integration, no config needed)
```bash
npm install -D vitest @vitest/coverage-v8
```

**Config addition to `vite.config.ts`:**
```typescript
import { defineConfig } from 'vite'
// ... existing plugins ...
export default defineConfig({
  plugins: [react(), tailwindcss(), ViteYaml()],
  test: {
    environment: 'node',  // lib functions need no DOM
    coverage: { provider: 'v8' },
  },
})
```

**Suggested file placement:**
- Co-located with source: `src/lib/validation.test.ts`, `src/lib/spanTransform.test.ts`
- Follows Vite/Vitest convention; no separate `__tests__` directory needed

## Patterns for Writing Tests (When Added)

**Pure function testing pattern:**
```typescript
import { describe, it, expect } from 'vitest';
import { checkSpanExists, validateSpans } from '../validation';

describe('checkSpanExists', () => {
  it('returns false for empty spans', () => {
    expect(checkSpanExists([])).toBe(false);
  });

  it('returns true when named span is present', () => {
    const spans = [{ name: 'http.request', attributes: {}, status: {} }];
    expect(checkSpanExists(spans, 'http.request')).toBe(true);
  });
});
```

**Progressive hint escalation testing:**
```typescript
describe('validateSpans hint escalation', () => {
  it('returns errorMessage on first attempt (0 prior attempts)', () => {
    const results = validateSpans(rules, { spans: [], attemptHistory: {} });
    expect(results[0].message).toBe(rules[0].errorMessage);
  });

  it('returns hintMessage after 1-2 failed attempts', () => {
    const history = { [rules[0].description]: 1 };
    const results = validateSpans(rules, { spans: [], attemptHistory: history });
    expect(results[0].message).toBe(rules[0].hintMessage);
  });

  it('returns guidedMessage after 3+ failed attempts', () => {
    const history = { [rules[0].description]: 3 };
    const results = validateSpans(rules, { spans: [], attemptHistory: history });
    expect(results[0].message).toBe(rules[0].guidedMessage);
  });
});
```

**Error path testing (span transform):**
```typescript
import { transformSpans, getTraceId } from '../spanTransform';

describe('transformSpans', () => {
  it('throws on empty array', () => {
    expect(() => transformSpans([])).toThrow('Cannot transform empty spans array');
  });
});
```

**YAML validation testing:**
```typescript
import { validateYaml } from '../validation';

describe('validateYaml', () => {
  it('passes when yaml_key_exists finds the path', () => {
    const yaml = 'processors:\n  tail_sampling:\n    sampling_percentage: 100';
    const rules = [{ type: 'yaml_key_exists', yamlPath: 'processors.tail_sampling', ... }];
    const results = validateYaml(rules, { yamlContent: yaml, attemptHistory: {} });
    expect(results[0].passed).toBe(true);
  });

  it('returns false for invalid YAML without throwing', () => {
    const results = validateYaml(rules, { yamlContent: ':::invalid', attemptHistory: {} });
    expect(results[0].passed).toBe(false);
  });
});
```

## What to Mock

**When testing `evaluateGuess`:**
- No mocking needed — rules are pure functions taking `Phase2Data`
- Build minimal `Phase2Data` fixtures with only the attributes each rule reads

**When testing hooks (`useCodeRunner`, `useAcademyPersistence`):**
- Mock `localStorage` with `vitest`'s `vi.stubGlobal`
- Mock `Worker` global for `useCodeRunner`
- Use React Testing Library for hook tests: `renderHook`

**What NOT to mock:**
- The pure lib functions in `src/lib/` — test them directly without mocking

## Test Fixtures

**Minimal span fixture:**
```typescript
const makeSpan = (name: string, attrs = {}, status = {}) => ({
  name,
  context: { span_id: `span-${name}`, trace_id: 'trace-001' },
  start_time: 1000000000,
  end_time:   2000000000,
  attributes: attrs,
  status,
});
```

**Minimal Phase2Data fixture:**
```typescript
const makePhase2Data = (spans: TraceSpan[]): Phase2Data => ({
  traceId: 'trace-001',
  totalDurationMs: 5000,
  spans,
  logs: [],
  rootCauseOptions: [],
  narrative: 'Test narrative',
});
```

## Coverage

**Requirements:** None currently enforced (no test runner configured).

**Recommended targets when tests are added:**
- `src/lib/validation.ts` — 100% (pure functions, directly testable)
- `src/lib/spanTransform.ts` — 100% (pure functions with exported helpers)
- `src/lib/rootCauseEngine.ts` — 80%+ (case-specific rules, some branches are static)
- `src/lib/logGenerator.ts` — 80%+ (deterministic, but span attribute branching is wide)

---

*Testing analysis: 2026-03-10*
