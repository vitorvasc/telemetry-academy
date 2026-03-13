# Testing Patterns

**Analysis Date:** 2026-03-13

## Test Framework

**Runner:**
- Vitest v4.0.18
- Config: `vite.config.ts` (inline `test` block — no separate vitest config file)
- Environment: `jsdom` (global for all tests)
- Globals: enabled (`globals: true` — no need to import `describe`/`it`/`expect` in each file, but tests do import them explicitly)

**Assertion Library:**
- Vitest built-in (`expect`)
- `@testing-library/jest-dom` v6 — imported directly in component test files with `import '@testing-library/jest-dom'`

**Run Commands:**
```bash
npm test                # vitest run (single pass)
npm run test:watch      # vitest (watch mode)
npm run test:ui         # vitest --ui (browser UI)
npm run test:coverage   # vitest run --coverage
```

**Coverage:**
- Provider: `v8`
- Reporters: `text`, `html`, `lcov`
- Excluded from coverage: `node_modules/`, `dist/`, `**/*.d.ts`, `src/data/phase2.ts`
- No minimum threshold enforced

## Test File Organization

**Location:**
- Lib/hook tests: under `__tests__/` subdirectory — `src/lib/__tests__/`, `src/hooks/__tests__/`
- Component tests: co-located with component — `src/components/CaseSelector.test.tsx`, `src/components/InstructionsPanel.test.tsx`
- Worker tests: co-located — `src/workers/python.worker.test.ts`

**Naming:**
- Pattern: `<module-name>.test.ts` / `<ComponentName>.test.tsx`
- No `.spec.` files used

**Current test inventory (180 tests, all passing):**
```
src/lib/__tests__/spanTransform.test.ts       — 35 tests
src/lib/__tests__/validation.test.ts          — 68 tests
src/lib/__tests__/rootCauseEngine.test.ts     — 40 tests
src/hooks/__tests__/useAcademyPersistence.test.ts — 19 tests
src/components/InstructionsPanel.test.tsx     — 3 tests
src/components/CaseSelector.test.tsx          — 7 tests
src/workers/python.worker.test.ts             — 8 tests
```

## Test Structure

**Suite organization with section banners:**
```typescript
import { describe, it, expect } from 'vitest';
import { functionUnderTest } from '../module';

// ============================================================================
// Test Fixtures
// ============================================================================

const makeSpan = (name: string, attributes: Record<string, unknown> = {}): RawOTelSpan => ({
  name,
  context: { span_id: `span-${name}`, trace_id: 'trace-abc' },
  start_time: 1_000_000_000,
  end_time: 2_000_000_000,
  attributes,
  status: undefined,
});

// ============================================================================
// describe block name
// ============================================================================

describe('functionUnderTest', () => {
  it('describes expected behavior', () => {
    expect(functionUnderTest(input)).toBe(expected);
  });
});
```

**Patterns:**
- Each `describe` block tests one exported function or one logical feature group
- `it` descriptions follow "verb + expected behavior" — `'returns false for empty spans array'`, `'throws when given an empty array'`
- Section banners (`// ===...===`) group `describe` blocks in larger test files
- Factory functions (`make*`) defined at file top for all fixtures

**Setup/Teardown (hooks tests):**
```typescript
beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
```

## Mocking

**Framework:** Vitest `vi` — `vi.fn()`, `vi.mock()`, `vi.useFakeTimers()`, `vi.restoreAllMocks()`

**Module-level mock (worker test):**
```typescript
// Must appear before importing the module under test
vi.mock('pyodide', () => ({ loadPyodide: vi.fn() }));

import { serializeResult } from './python.worker';
```

**Spy mock for callbacks:**
```typescript
const onSelect = vi.fn();
// ...
expect(onSelect).toHaveBeenCalledWith('case-002');
expect(onSelect).not.toHaveBeenCalled();
```

**Fake timers (debounce testing):**
```typescript
vi.useFakeTimers();
// trigger action
await act(async () => { vi.advanceTimersByTime(400); }); // advance past 300ms debounce
// assert localStorage was written
vi.useRealTimers();
```

**PyProxy duck-typing (no real Pyodide):**
```typescript
it('calls toJs on PyProxy-like object and calls destroy', () => {
  const destroy = vi.fn();
  const proxy = { toJs: () => ({ foo: 'bar' }), destroy };
  expect(serializeResult(proxy)).toEqual({ foo: 'bar' });
  expect(destroy).toHaveBeenCalledOnce();
});
```

**What to mock:**
- `pyodide` module when testing worker exports (prevents Pyodide WASM load)
- `localStorage` is provided by jsdom — no mocking needed, use `localStorage.clear()` in `beforeEach`
- Callback props: use `vi.fn()`

**What NOT to mock:**
- Pure lib functions in `src/lib/` — test them directly, no mocking
- `Phase2Data` — build minimal inline fixtures instead

## Fixtures and Factories

**Pattern:** Named `make*` factory functions defined at the top of each test file, before the first `describe` block.

**Raw OTel span factory (`spanTransform.test.ts`):**
```typescript
interface SpanInit {
  name?: string; spanId?: string; traceId?: string; parentId?: string;
  startMs?: number; durationMs?: number; attributes?: Record<string, unknown>; statusCode?: string;
}

function makeRawSpan({ name = 'test-span', spanId = 'span-abc', ... }: SpanInit = {}) {
  const startNs = startMs * MS_TO_NS;
  return { name, context: { span_id: spanId, trace_id: traceId }, parent_id: parentId,
           start_time: startNs, end_time: startNs + durationMs * MS_TO_NS, attributes, status: ... };
}
```

**Validation rule factory (`validation.test.ts`):**
```typescript
const makeRule = (type: SpanValidationRule['type'], overrides: Partial<SpanValidationRule> = {}): SpanValidationRule => ({
  type,
  description: `rule-${type}`,
  successMessage: 'success',
  errorMessage: 'error',
  hintMessage: 'hint',
  guidedMessage: 'guided',
  ...overrides,
});
```

**Phase2Data factory (`rootCauseEngine.test.ts`):**
```typescript
const makePhase2Data = (overrides: Partial<Phase2Data> = {}): Phase2Data => ({
  traceId: 'trace-abc123',
  totalDurationMs: 5240,
  narrative: 'Test narrative',
  spans: [ /* realistic span array with attributes */ ],
  logs: [],
  rootCauseOptions: [],
  ...overrides,
});
```

**Fixture location:** Inline at top of each test file — no shared fixture file.

**localStorage seeding (`useAcademyPersistence.test.ts`):**
```typescript
function seedLocalStorage(overrides: Record<string, unknown> = {}) {
  const state = { version: SCHEMA_VERSION, progress: initialProgress, caseCode: {...}, ...overrides };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
```

## Coverage

**Requirements:** No minimum threshold enforced in `vite.config.ts`.

**View coverage:**
```bash
npm run test:coverage   # generates text + html + lcov reports
```

**Current coverage state:** All 180 tests pass. Key modules covered:
- `src/lib/validation.ts` — comprehensive (68 tests covering all 9 check types + hint escalation + edge cases)
- `src/lib/spanTransform.ts` — comprehensive (35 tests including cycle detection and depth capping)
- `src/lib/rootCauseEngine.ts` — comprehensive (40 tests covering helper functions + all 3 cases + edge cases)
- `src/hooks/useAcademyPersistence.ts` — comprehensive hook coverage with localStorage lifecycle, schema migration, debounce, and bad data
- `src/components/CaseSelector.tsx` — behavior tests (7 tests: locked/unlocked/solved/available states, click handling)
- `src/components/InstructionsPanel.tsx` — render tests (3 tests)
- `src/workers/python.worker.ts` — unit tests on exported `serializeResult` function only; postMessage emission requires full Web Worker environment (not tested)

**Uncovered areas:**
- `src/App.tsx` — no tests (complex integration of all hooks/components)
- `src/hooks/useCodeRunner.ts` — no tests (requires Web Worker + Pyodide)
- `src/hooks/usePhase2Data.ts` — no tests
- `src/lib/logGenerator.ts` — no tests
- Most component render/interaction paths beyond CaseSelector and InstructionsPanel

## Test Types

**Unit Tests:**
- Scope: Single exported function or module
- Location: `src/lib/__tests__/`, `src/hooks/__tests__/`, co-located worker tests
- No network, no DOM interaction (except jsdom localStorage), no external dependencies

**Component Tests (React Testing Library):**
- Scope: Single component rendered in isolation
- Libraries: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`
- Location: Co-located with component files
- Interaction pattern: `userEvent.setup()` + `await user.click(element)`

**Integration/E2E Tests:**
- Not present in the codebase

## Common Patterns

**Async hook testing:**
```typescript
import { renderHook, act } from '@testing-library/react';

it('loads seeded progress from localStorage', async () => {
  seedLocalStorage();
  const { result } = renderHook(() => useAcademyPersistence(initialProgress));
  await act(async () => {}); // flush useEffect
  expect(result.current.isLoaded).toBe(true);
});

// Synchronous state mutations:
act(() => { result.current.saveCode('001-hello-span', 'code here'); });
```

**Error/throw testing:**
```typescript
it('throws when given an empty array', () => {
  expect(() => transformSpans([])).toThrow('Cannot transform empty spans array');
});
```

**Component render + query:**
```typescript
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

render(<CaseSelector cases={mockCases} progress={progress} currentCaseId="case-001" onSelect={() => {}} />);
expect(screen.getByRole('button', { name: /Hello Span/i })).toBeEnabled();
expect(screen.getByRole('button', { name: /Auto Magic/i })).toBeDisabled();
```

**User interaction testing:**
```typescript
const user = userEvent.setup();
const onSelect = vi.fn();
render(<CaseSelector ... onSelect={onSelect} />);
await user.click(screen.getByRole('button', { name: /Auto Magic/i }));
expect(onSelect).toHaveBeenCalledWith('case-002');
```

**Boundary/edge case grouping (separate `describe` block):**
```typescript
describe('validateSpans edge cases', () => {
  it('returns empty array for empty rules', () => { ... });
  it('handles multiple rules independently', () => { ... });
  it('yaml_key_exists always returns false from validateSpans', () => { ... });
});
```

## Git Hooks

**pre-commit:** `npx lint-staged` — runs `eslint --fix` on staged `*.ts` / `*.tsx` files (configured in `package.json` under `lint-staged`)

**commit-msg:** `npx commitlint --edit $1` — enforces Conventional Commits format (`@commitlint/config-conventional`)

Tests are not run on commit — they must be run manually or in CI.

---

*Testing analysis: 2026-03-13*
