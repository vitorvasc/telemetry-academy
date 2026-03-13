# Coding Conventions

**Analysis Date:** 2026-03-13

## Naming Patterns

**Files:**
- React components: PascalCase `.tsx` — `CaseSelector.tsx`, `ErrorBoundary.tsx`, `ValidationPanel.tsx`, `InvestigationView.tsx`
- Hooks: camelCase prefixed with `use`, `.ts` — `useCodeRunner.ts`, `useAcademyPersistence.ts`, `usePhase2Data.ts`
- Pure lib modules: camelCase `.ts` — `validation.ts`, `spanTransform.ts`, `rootCauseEngine.ts`, `formatters.ts`
- Worker files: `<name>.worker.ts` — `python.worker.ts`
- Type-only files: camelCase in `src/types/` — `phase2.ts`, `progress.ts`
- Test files: co-located for components (`.test.tsx` adjacent to source); under `__tests__/` subdirectory for lib/hooks
- Data constants: camelCase `.ts` — `caseLoader.ts`, `phase2.ts`

**Functions:**
- React components: PascalCase named exports — `export const CaseSelector: React.FC<CaseSelectorProps>`
- Hooks: camelCase — `useCodeRunner`, `useAcademyPersistence`
- Pure utility functions: camelCase named exports — `validateSpans`, `transformSpans`, `checkSpanExists`, `evaluateGuess`
- Private module helpers: camelCase, not exported — `runCheck`, `selectMessage`, `checkYamlKeyExists`
- Test factories: camelCase with `make` prefix — `makeSpan`, `makeRule`, `makeContext`, `makePhase2Data`, `makeRawSpan`
- Event handlers in components: `handle` prefix — `handleValidate`, `handleCaseSolved`, `handleGuessSubmit`
- Navigation helpers: `goTo` prefix — `goToCase`, `goToNext`

**Variables:**
- State variables: noun or noun phrase — `validationResults`, `investigationAttempts`, `showReviewModal`
- State setters: `set` prefix — `setValidationResults`, `setAppPhase`
- Boolean state: `is`, `has`, `show` prefixes — `isLoaded`, `hasSeenWelcome`, `showReviewModal`, `isReady`
- Constants (module-level): `SCREAMING_SNAKE_CASE` — `STORAGE_KEY`, `SCHEMA_VERSION`, `SLOW_THRESHOLD_MS`, `MAX_DEPTH`, `RULES_REGISTRY`, `DIFFICULTY_COLOR`
- Refs: `Ref` suffix — `workerRef`, `saveTimeoutRef`

**Types and Interfaces:**
- Interfaces: PascalCase — `SpanValidationRule`, `ValidationContext`, `EvaluationResult`, `RootCauseRule`
- Type aliases: PascalCase — `ValidationCheckType`, `PhaseStatus`, `Language`
- Props interfaces: Component name + `Props` suffix — `CaseSelectorProps`, `ErrorBoundaryProps`, `InstructionsPanelProps`
- Return-type interfaces for hooks: Hook name + `Return` — `UseAcademyPersistenceReturn`

## Code Style

**Formatting:**
- No Prettier config — formatting relies on TypeScript strict mode and ESLint
- Consistent 2-space indentation in all `.ts` and `.tsx` files
- Single quotes for TypeScript strings; double quotes in JSX attribute values
- `const` preferred everywhere; `let` only for reassigned variables

**Linting:**
- ESLint flat config at `eslint.config.js`
- Extends: `@eslint/js` recommended, `typescript-eslint` recommended (type-checked), `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `eslint-plugin-react-x`, `eslint-plugin-react-dom`
- Key rules enforced as errors:
  - `@typescript-eslint/no-floating-promises` — all async calls must be awaited or explicitly handled
  - `@typescript-eslint/no-misused-promises` — async callbacks not assignable to void contexts
  - `@typescript-eslint/consistent-type-imports` — `import type` mandatory for type-only imports
  - `@typescript-eslint/switch-exhaustiveness-check` — switch on union types must cover all cases
  - `no-console: warn` — every `console.*` call requires an inline `eslint-disable-next-line` comment
- Separate override for `*.worker.ts` files: unsafe rules (`no-unsafe-assignment`, `no-unsafe-call`, `no-unsafe-member-access`, `no-unsafe-return`) relaxed for Pyodide (no types available)
- Separate override for test files: same unsafe rules relaxed for `@testing-library` internals

**TypeScript Strictness:**
- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- `noPropertyAccessFromIndexSignature: true` — bracket notation required for index-typed objects
- `verbatimModuleSyntax: true` — `import type` is not optional, enforced by compiler
- `noFallthroughCasesInSwitch: true`, `erasableSyntaxOnly: true`
- `skipLibCheck: true` required for Pyodide (documented in `tsconfig.app.json`)

## Import Organization

**Order (consistent throughout codebase):**
1. React and third-party packages — `import React from 'react'`, `import { useState } from 'react'`
2. Type-only third-party imports — `import type { ... } from '...'`
3. Internal module imports (relative) — `import { validateSpans } from '../lib/validation'`
4. Type-only internal imports — `import type { Case } from '../types'`
5. Asset imports — `import setupScript from '../workers/python/setup_telemetry.py?raw'`

**Path style:**
- All relative paths — no `@/` or similar aliases configured in `tsconfig.app.json`
- `import type` enforced by both `verbatimModuleSyntax` and `@typescript-eslint/consistent-type-imports`

## Error Handling

**Patterns:**
- Functions that require valid input: throw `Error` with descriptive message — `throw new Error('Cannot transform empty spans array')`
- Boolean-returning validation functions: return `false` on invalid input, never throw
- Hooks: `try/catch` blocks in `useEffect`, log with `console.error` (suppressed inline), fall back to initial state
- Worker errors: distinguished by `id` field — init errors have no `id`, run errors carry `id`; pattern documented in `docs/worker-protocol.md`
- YAML parse failures: `catch { return false }` — invalid YAML silently treated as failed check
- `QuotaExceededError` named handling in `src/hooks/useAcademyPersistence.ts`
- `instanceof Error` check before accessing `.message` — `err instanceof Error ? err.message : 'Unknown'`
- React error boundary: `src/components/ErrorBoundary.tsx` — class component wrapping UI subtrees; logs via `console.error` in `componentDidCatch`

## Logging

**Framework:** `console` only (no third-party logger)

**Pattern:**
```typescript
// eslint-disable-next-line no-console
console.error('Worker initialization error:', error);
```
- Every `console.*` call is suppressed with a preceding `eslint-disable-next-line no-console` comment
- `console.error` for unexpected failures (worker errors, localStorage failures, evaluation errors)
- `console.warn` for expected degraded states (schema version mismatch, quota exceeded)
- No `console.log` in library code

## Comments

**When to Comment:**
- JSDoc block on every exported function in lib modules — `src/lib/spanTransform.ts`, `src/lib/rootCauseEngine.ts`, `src/lib/validation.ts`
- Section dividers with `// ====...====` banners to group large files — used in test files and `rootCauseEngine.ts`
- Inline comments for non-obvious logic — `// Cycle detection`, `// ERROR status_code takes precedence`
- `@ts-expect-error` with explanation for necessary TS suppression — `// @ts-expect-error - cache option exists but types are outdated`
- `// eslint-disable-next-line <rule>` immediately before each suppressed line (never block-level disables)

**JSDoc style:**
```typescript
/**
 * Brief description of what the function does.
 *
 * Rules:
 * - Bullet describing logic
 *
 * @param paramName - Description
 * @returns Description
 * @throws Error if condition
 */
export function myFunction(...): ReturnType { ... }
```

## Function Design

**Size:** Functions stay focused on a single concern. Helpers extracted when logic is reused or independently testable (`runCheck`, `selectMessage` extracted from `validateSpans`).

**Parameters:**
- Optional parameters typed with `?:` — `spanName?: string`, `attributeKey?: string`
- Defaults handled in function body with `||` or `??`, not in parameter signature
- Exception: hook parameters use inline defaults — `useCodeRunner(language: Language = 'python')`

**Return Values:**
- Functions that can fail on missing/invalid data: return `null` or `false` (documented in JSDoc)
- Functions that must have valid input to be meaningful: throw `Error` with descriptive message
- Hooks return named object literal — `return { isReady, initError, isRunning, output, spans, runCode, loadingLabel }`
- Components: early returns for loading/error/empty states before main render

## Module Design

**Exports:**
- Named exports only throughout; no default exports except `App` (`src/App.tsx`) and `main.tsx`
- Public API exported; module-private helpers are unexported

**Barrel Files:**
- `src/components/index.ts` re-exports select components: `CodeEditor`, `InstructionsPanel`, `ValidationPanel`
- No barrels at `src/lib/`, `src/hooks/`, or `src/types/` — import directly from module file

## React Patterns

**Component definition:**
```typescript
export const ComponentName: React.FC<ComponentNameProps> = ({ prop1, prop2 }) => {
  // hooks first
  // derived state
  // handlers
  // return JSX
};
```

**Visibility toggle:** `display:none` (Tailwind class toggling) preferred over conditional rendering when component must preserve state across tab switches — documented in `src/components/InvestigationView.tsx`

**State reset pattern (canonical):**
```typescript
// Clear validation results when code changes
useEffect(() => {
  setValidationResults([]);
  setWorkerError(null);
}, [code]);

// Clear evaluation result when traceId changes
useEffect(() => {
  setEvaluationResult(null);
}, [data.traceId]);
```

**`useCallback` usage:** All functions returned from hooks are wrapped in `useCallback` with explicit dependency arrays — `updateAttemptHistory`, `getAttemptCount`, `saveCode`, `resetAll`, `runCode`, `initWorker`

**Intentional `setState` in `useEffect`:** Suppressed with `// eslint-disable-next-line react-hooks/set-state-in-effect` where one-time initialization requires it (e.g., loading from localStorage on mount)

---

*Convention analysis: 2026-03-13*
