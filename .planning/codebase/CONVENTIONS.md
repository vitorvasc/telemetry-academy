# Coding Conventions

**Analysis Date:** 2026-03-10

## Naming Patterns

**Files:**
- React components: PascalCase — `ValidationPanel.tsx`, `TraceViewer.tsx`, `InvestigationView.tsx`
- Hooks: camelCase prefixed with `use` — `useCodeRunner.ts`, `useAcademyPersistence.ts`, `usePhase2Data.ts`
- Libraries/utilities: camelCase — `validation.ts`, `spanTransform.ts`, `logGenerator.ts`, `rootCauseEngine.ts`
- Data modules: camelCase — `caseLoader.ts`, `cases.ts`, `phase2.ts`
- Type files: camelCase — `progress.ts`, `phase2.ts` in `src/types/`
- Worker files: `<name>.worker.ts` — `python.worker.ts`

**Functions:**
- Exported pure functions: camelCase verbs — `validateSpans`, `transformSpans`, `evaluateGuess`, `generateLogsFromSpans`
- React components: PascalCase exported as named const — `export const TraceViewer: React.FC<...>`
- Internal helpers: camelCase, unexported — `runCheck`, `selectMessage`, `filterMalformedSpans`, `createSpanStartLog`
- React hooks: camelCase with `use` prefix — `useCodeRunner`, `useAcademyPersistence`
- Event handlers in components: `handle` prefix — `handleValidate`, `handleCaseSolved`, `handleGuessSubmit`, `handleResetAll`
- Navigation helpers: `goTo` prefix — `goToCase`, `goToNext`

**Variables:**
- State variables: noun or noun phrase — `validationResults`, `investigationAttempts`, `showReviewModal`
- State setters: `set` prefix — `setValidationResults`, `setAppPhase`
- Boolean state: `is`, `has`, `show` prefixes — `isLoaded`, `hasSeenWelcome`, `showReviewModal`, `isValidating`
- Constants (module-level): `SCREAMING_SNAKE_CASE` — `STORAGE_KEY`, `SCHEMA_VERSION`, `SLOW_THRESHOLD_MS`, `MAX_DEPTH`, `RULES_REGISTRY`
- Refs: `Ref` suffix — `workerRef`, `saveTimeoutRef`, `initialLoadRef`

**Types and Interfaces:**
- Interfaces: PascalCase — `ValidationResult`, `Phase2Data`, `TraceSpan`, `RootCauseRule`
- Type aliases: PascalCase — `ValidationCheckType`, `AppPhase`, `MobileTab`, `Tab`, `CaseStatus`
- Props interfaces: Component name + `Props` — `ValidationPanelProps`, `TraceViewerProps`, `InvestigationViewProps`
- Return interfaces for hooks: Hook name + `Return` — `UseAcademyPersistenceReturn`, `Phase2DataState`

## Code Style

**Formatting:**
- No Prettier config detected — formatting is unspecified (relies on editor defaults)
- Consistent 2-space indentation throughout all `.ts` and `.tsx` files
- Single quotes for strings in TypeScript; double quotes in JSX attribute strings
- Arrow functions for callbacks and inline handlers
- `const` preferred for all variables; `let` only for reassignable variables

**Linting:**
- ESLint via `eslint.config.js` using flat config format
- Rules: `@eslint/js` recommended + `typescript-eslint` recommended + `react-hooks` + `react-refresh`
- `@typescript-eslint/no-explicit-any` — suppressed in select files with `// eslint-disable-next-line`
- TypeScript strict mode: `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `noFallthroughCasesInSwitch: true`
- Target: ES2022, bundler module resolution, `verbatimModuleSyntax: true`

## Import Organization

**Order (observed pattern):**
1. React and external packages — `import React, { useState, useEffect } from 'react'`
2. Third-party libraries — `import { loadPyodide } from 'pyodide'`
3. Internal types (using `import type`) — `import type { Phase2Data } from '../types/phase2'`
4. Internal modules (relative paths) — `import { evaluateGuess } from '../lib/rootCauseEngine'`
5. Assets — `import setupScript from '../workers/python/setup_telemetry.py?raw'`

**Path style:**
- All relative paths — `../types/phase2`, `./TraceViewer`, `../lib/validation`
- No path aliases configured in tsconfig
- `import type` used consistently for type-only imports (`import type { Case }`)

## Error Handling

**Patterns:**
- `try/catch` with `console.error` for unexpected failures — used in persistence load, worker errors, YAML parsing
- Error state returned in hook return values — `{ data: null, error: string, hasData: false }` in `usePhase2Data`
- Graceful degradation: functions return `null`, `false`, or empty arrays on bad input rather than throwing
- Worker errors bubble through promise rejection then caught in `handleValidate` with `setWorkerError`
- `instanceof Error` check before accessing `.message` — `err instanceof Error ? err.message : 'Unknown'`
- `QuotaExceededError` named error handling in localStorage persistence (`src/hooks/useAcademyPersistence.ts`)
- YAML parse errors silently return `false` — `catch { return false; }` in `checkYamlKeyExists`

## Logging

**Framework:** `console` only (no third-party logger)

**Patterns:**
- `console.error` for unexpected failures (worker errors, localStorage failures, evaluation errors)
- `console.warn` for expected degraded states (schema version mismatch, quota exceeded)
- No `console.log` in library code — only in worker/debug contexts
- No structured logging or log levels beyond `console.*`

## Comments

**When to Comment:**
- JSDoc on all exported functions — describes params, return, throws, and includes `@example` for complex functions
- Section dividers with `// ====...====` for large files like `rootCauseEngine.ts`
- Inline comments for non-obvious logic — `// Cycle detection`, `// Cap at MAX_DEPTH`
- `@ts-expect-error` with reason when suppressing TS errors — `// @ts-expect-error - cache option exists but types are outdated`
- `// eslint-disable-next-line` with rule name when necessary

**JSDoc style (example from `src/lib/rootCauseEngine.ts`):**
```typescript
/**
 * Evaluate a user's root cause guess
 *
 * @param guessId - The ID of the option the user selected
 * @param data - The Phase2Data containing spans, logs, and metadata
 * @param caseId - The current case identifier
 * @returns EvaluationResult with correctness and contextual explanation
 *
 * @example
 * ```typescript
 * const result = evaluateGuess('b', phase2Data, 'hello-span-001');
 * ```
 */
```

## Function Design

**Size:** Functions are small and focused. Library functions (`runCheck`, `selectMessage`, `checkSpanExists`) do one thing.

**Parameters:**
- Optional parameters typed with `?` — `spanName?: string`, `attributeKey?: string`
- No default parameters in function signatures (defaults handled in body with `||`)
- Exception: hook parameters use default values — `useCodeRunner(language: Language = 'python')`

**Return Values:**
- Functions that can fail: return `null` or `false` rather than throw (except `transformSpans`, `getTraceId` which document `@throws`)
- Hooks return named object literals — `return { isReady, initError, isRunning, output, spans, runCode }`
- Components return JSX; early returns for loading/empty states before main render

## Module Design

**Exports:**
- Named exports used exclusively — no default exports except `App` (`src/App.tsx`) and `export default App`
- Each module exports only its public API; helpers are unexported

**Barrel Files:**
- `src/components/index.ts` re-exports three components: `CodeEditor`, `InstructionsPanel`, `ValidationPanel`
- No barrel for `src/lib/`, `src/hooks/`, or `src/types/` — imports go directly to module files

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

**Conditional rendering:**
- Use `display:none` (not conditional rendering) to preserve component state across tab switches — explicitly documented in `InvestigationView.tsx`
- Conditional rendering with `&&` for simple cases — `{showWelcome && <WelcomeModal />}`
- Ternary chains for multi-branch UI state

**State reset pattern (canonical):**
```typescript
// Clear validation results when code changes OR traceId changes
useEffect(() => {
  setValidationResults([]);
  setWorkerError(null);
}, [code]);

useEffect(() => {
  setEvaluationResult(null);
}, [data.traceId]);
```

**useCallback usage:**
- All functions returned from hooks are wrapped in `useCallback` — `updateAttemptHistory`, `getAttemptCount`, `saveCode`, `resetAll`

---

*Convention analysis: 2026-03-10*
