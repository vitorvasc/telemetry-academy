# Phase 2: Validation & Core Loop - Research

**Researched:** 2026-03-02
**Domain:** React TypeScript, OpenTelemetry Span Validation, localStorage Persistence
**Confidence:** HIGH

## Summary

Phase 2 implements the core learning loop: real-time span validation, linear case progression, and persistent state. The existing codebase has solid foundations with `useCodeRunner` capturing spans via postMessage, `ValidationPanel` with animated UI, and `CaseSelector` managing unlock states. The key challenge is replacing the current `simulateValidation()` function (which does string matching on code) with a real span-based validation engine that checks captured telemetry JSON objects.

The validation engine must check span patterns against actual captured spans from the Pyodide Web Worker. localStorage persistence needs schema versioning for forward compatibility. State management currently uses inline `useState` in `App.tsx`, which should be extended with persistence hooks.

**Primary recommendation:** Build a lightweight validation engine using native TypeScript pattern matching (no external validation library needed) — check captured span arrays for name/attribute patterns. Use a custom `usePersistentState` hook for localStorage with JSON schema versioning.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Validation Logic:** Schema matching against real span JSON objects — check for span patterns (name, attributes, structure), not exact values
- **Validation Runs:** Automatically after code execution — single Run action triggers execute → capture spans → validate
- **Validation Rules:** Defined inline in case data (alongside existing `phase1.validations` array pattern)
- **Progressive Error Messages:** Start with hints, escalate to guided fixes after 3 failed attempts on the same check
- **Feedback Timing:** Staggered reveal with animation delay (existing ValidationPanel slide-in pattern), spinner during execution, celebration animation on complete
- **Reset Behavior:** Reset all validation results on every Run — clean slate, no stale results; editing code clears validation results
- **Case Progression:** Strict linear unlock — case N+1 only available after case N is fully solved (both instrumentation + investigation)
- **Persistence:** Save both progress AND user's current code for each case; auto-save on every state change; schema version key for data migration; visible "Reset All Progress" button with confirmation

### Claude's Discretion
- Spinner design and animation details
- Celebration animation choice (confetti, glow, etc.)
- Exact localStorage key naming and structure
- How progressive hints scale (thresholds, wording)
- Reset button placement (settings, footer, etc.)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CORE-05 | User progress and state persist across browser reloads via `localStorage` | Implement custom hook `usePersistentState` with schema versioning; auto-save on state change |
| LOOP-01 | Case selector allows linear progression (next case unlocks upon completion) | Extend existing `handleCaseSolved()` logic; unlock next case on 'solved' status |
| LOOP-02 | Phase 1 validates JSON telemetry output, not RegEx parsing of code | Replace `simulateValidation()` with span-based engine checking captured `spans` array from `useCodeRunner` |
| LOOP-04 | Validation Panel displays real-time ✓/✗ feedback on specific telemetry requirements | Extend `ValidationPanel` props; add `isValidating` state during span capture; staggered reveal animation |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.2.0 | UI framework | Already in use, concurrent features |
| TypeScript | ~5.9.3 | Type safety | Already configured |
| Tailwind CSS | ^4.2.1 | Styling | Already in use with custom animations |
| Lucide React | ^0.575.0 | Icons | Already in use |

### Validation Engine (Custom)
Instead of adding Zod or Yup (bundle size overhead), implement a lightweight validation engine using native TypeScript:

**Rationale:**
- Validation rules are domain-specific (span name/attribute matching)
- No complex schema validation needed — just existence checks
- Keeps bundle size minimal (~0KB added)
- Simpler to maintain for OTel-specific patterns

**Installation:** No additional packages needed.

## Architecture Patterns

### Recommended Validation Engine Structure
```typescript
// src/lib/validation.ts
export interface SpanCheck {
  type: 'span_exists' | 'attribute_exists' | 'attribute_value' | 'span_count';
  spanName?: string;
  attributeKey?: string;
  attributeValue?: string | number | boolean;
  minCount?: number;
}

export interface ValidationContext {
  spans: any[];
  attemptCount: number;
}

export function validateSpans(
  checks: SpanCheck[], 
  context: ValidationContext
): ValidationResult[] {
  return checks.map(check => ({
    ...check,
    passed: runCheck(check, context.spans),
    message: getMessage(check, context, passed)
  }));
}
```

### Recommended Persistence Hook Pattern
```typescript
// src/hooks/usePersistentState.ts
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'telemetry-academy-v1';

interface PersistedState {
  version: number;
  progress: CaseProgress[];
  caseCode: Record<string, string>;
  timestamp: number;
}

export function usePersistentState<T>(
  key: string,
  initialValue: T,
  version: number
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Load with version check
  // Save with debounce (300ms)
  // Return reset function
}
```

### Progressive Hint Pattern
```typescript
// Progressive message selection based on attempt count
function getHintMessage(
  baseMessage: string,
  guidedMessage: string,
  attempts: number
): string {
  return attempts >= 3 ? guidedMessage : baseMessage;
}
```

### Recommended Integration Points

**File:** `src/lib/validation.ts` (NEW)
- `validateSpans()` — main validation engine
- `checkSpanExists()` — helper for span name matching
- `checkAttributeExists()` — helper for attribute matching

**File:** `src/hooks/usePersistentState.ts` (NEW)
- `usePersistentState()` — localStorage hook with versioning

**File:** `src/App.tsx` (MODIFY)
- Replace `simulateValidation()` with real span validation
- Wrap `allProgress` with persistence
- Add auto-save effect for code changes

**File:** `src/types.ts` (MODIFY)
- Extend `ValidationRule` with `attemptHints` array
- Add `ValidationAttempt` tracking type

**File:** `src/data/cases.ts` (MODIFY)
- Add `attemptHints` to validation rules for progressive guidance

### Anti-Patterns to Avoid
- **Don't parse code with RegEx:** The current `simulateValidation()` uses `code.includes()` — this should be replaced with actual span validation
- **Don't sync localStorage on every render:** Use debounce (300ms) for code changes
- **Don't store sensitive data:** Only store progress and code, no user identifiers
- **Don't mutate captured spans:** Always validate against read-only span copies

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON Schema Validation | Custom validation library | Native TypeScript pattern matching | Domain-specific needs, simpler code |
| State Persistence | raw `localStorage` API | Custom `usePersistentState` hook | Versioning, SSR safety, type safety |
| Deep Equality Checks | `JSON.stringify(a) === JSON.stringify(b)` | Specific field comparison | Span comparison only needs key fields |
| Debouncing | `setTimeout` in component | `useDebounce` hook or inline | Cleaner, reusable |

**Key insight:** localStorage access is synchronous and blocking — debounce writes to avoid jank during rapid code editing.

## Common Pitfalls

### Pitfall 1: Stale Validation Results
**What goes wrong:** Validation results persist after user edits code, causing confusion when results no longer match current code state.

**Why it happens:** State isn't cleared when `code` changes.

**How to avoid:** 
```typescript
useEffect(() => {
  setValidationResults([]); // Clear on code change
}, [code]);
```

**Warning signs:** User reports "I fixed it but still showing error" type issues.

### Pitfall 2: localStorage Quota Exceeded
**What goes wrong:** App crashes when localStorage is full (typically 5-10MB limit).

**Why it happens:** Storing too much data or not handling quota errors.

**How to avoid:** 
```typescript
try {
  localStorage.setItem(key, JSON.stringify(data));
} catch (e) {
  if (e instanceof DOMException && e.name === 'QuotaExceededError') {
    // Handle gracefully — maybe clear old data
  }
}
```

**Warning signs:** Errors in console, data not persisting.

### Pitfall 3: Schema Version Conflicts
**What goes wrong:** App loads old data format after deploy, causing runtime errors.

**Why it happens:** No version check on localStorage load.

**How to avoid:** Always include version in stored data:
```typescript
const saved = localStorage.getItem(key);
if (saved) {
  const parsed = JSON.parse(saved);
  if (parsed.version !== CURRENT_VERSION) {
    localStorage.removeItem(key); // Wipe stale data
    return initialValue;
  }
}
```

**Warning signs:** `undefined` errors accessing properties that should exist.

### Pitfall 4: Hydration Mismatch (SSR)
**What goes wrong:** React hydration errors if localStorage value differs from server render.

**Why it happens:** localStorage only exists in browser, server render uses initial state.

**How to avoid:** Only load from localStorage in `useEffect` (client-side only), not during render.

**Warning signs:** React console warnings about hydration mismatch.

## Code Examples

### Span Validation Engine
```typescript
// src/lib/validation.ts
export interface SpanValidationRule {
  type: 'span_exists' | 'attribute_exists';
  spanName?: string;
  attributeKey?: string;
  description: string;
  successMessage: string;
  errorMessage: string;
  hintMessage?: string;      // Shown on first failures
  guidedMessage?: string;    // Shown after 3+ attempts
}

export interface ValidationResult extends SpanValidationRule {
  passed: boolean;
  message: string;
  attemptsOnThisRule: number;
}

export function validateSpans(
  rules: SpanValidationRule[],
  spans: any[],
  attemptHistory: Record<string, number>
): ValidationResult[] {
  return rules.map(rule => {
    const passed = runValidationCheck(rule, spans);
    const attempts = attemptHistory[rule.description] || 0;
    
    return {
      ...rule,
      passed,
      attemptsOnThisRule: attempts,
      message: passed 
        ? rule.successMessage 
        : attempts >= 3 && rule.guidedMessage 
          ? rule.guidedMessage 
          : rule.hintMessage || rule.errorMessage
    };
  });
}

function runValidationCheck(rule: SpanValidationRule, spans: any[]): boolean {
  switch (rule.type) {
    case 'span_exists':
      return spans.some(s => s.name === rule.spanName);
    case 'attribute_exists':
      return spans.some(s => 
        s.name === rule.spanName && 
        rule.attributeKey! in (s.attributes || {})
      );
    default:
      return false;
  }
}
```

### localStorage Persistence Hook
```typescript
// src/hooks/usePersistentState.ts
import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'telemetry-academy';
const SCHEMA_VERSION = 1;

interface PersistedData {
  version: number;
  progress: CaseProgress[];
  caseCode: Record<string, string>;
  timestamp: number;
}

export function useAcademyState(
  initialProgress: CaseProgress[],
  initialCode: Record<string, string>
) {
  const [progress, setProgress] = useState<CaseProgress[]>(initialProgress);
  const [caseCode, setCaseCode] = useState<Record<string, string>>(initialCode);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: PersistedData = JSON.parse(saved);
        if (parsed.version === SCHEMA_VERSION) {
          setProgress(parsed.progress);
          setCaseCode(parsed.caseCode);
        }
      }
    } catch (e) {
      console.error('Failed to load progress:', e);
    }
    setIsLoaded(true);
  }, []);
  
  // Auto-save with debounce
  const saveTimeoutRef = useRef<number>();
  useEffect(() => {
    if (!isLoaded) return;
    
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      try {
        const data: PersistedData = {
          version: SCHEMA_VERSION,
          progress,
          caseCode,
          timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('Failed to save progress:', e);
      }
    }, 300);
    
    return () => clearTimeout(saveTimeoutRef.current);
  }, [progress, caseCode, isLoaded]);
  
  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProgress(initialProgress);
    setCaseCode(initialCode);
  }, [initialProgress, initialCode]);
  
  return { progress, setProgress, caseCode, setCaseCode, resetAll, isLoaded };
}
```

### Integration in App.tsx
```typescript
// src/App.tsx - key integration points

// Replace simulateValidation with real validation
const handleValidate = async () => {
  setIsValidating(true);
  setValidationResults([]);
  
  try {
    await runCode(code);
    // spans array is now populated from useCodeRunner
  } catch (err) {
    setWorkerError(err.message);
    setIsValidating(false);
    return;
  }
  
  // Real validation against captured spans
  const results = validateSpans(
    currentCase.phase1.validations,
    spans,
    attemptHistory
  );
  
  setValidationResults(results);
  
  // Update attempt history for progressive hints
  results.forEach(r => {
    if (!r.passed) {
      attemptHistory[r.description] = (attemptHistory[r.description] || 0) + 1;
    }
  });
  
  if (results.every(r => r.passed)) {
    setAppPhase('investigation');
    updateProgress(currentCaseId, { phase: 'investigation' });
  }
  
  setIsValidating(false);
};

// Clear validation on code edit
useEffect(() => {
  setValidationResults([]);
}, [code]);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| String matching on code | Span-based validation | Phase 2 | Validates actual telemetry output, not code syntax |
| In-memory only state | localStorage persistence | Phase 2 | User progress survives browser refresh |
| Simultaneous validation results | Staggered reveal animation | Phase 2 | Better UX, draws attention to each check |
| Single error message | Progressive hints | Phase 2 | Adaptive learning based on attempt count |

**Deprecated/outdated:**
- `simulateValidation()` function in App.tsx — replace with real span validation
- Static validation messages — replace with progressive hint system

## Open Questions

1. **Span matching strictness**
   - What we know: Need to check span name and attribute existence
   - What's unclear: Should we match partial names (e.g., "process-order" matches "process-order-handler")?
   - Recommendation: Start with exact matching, can add fuzzy matching later if needed

2. **Attempt counting granularity**
   - What we know: Need to track attempts for progressive hints
   - What's unclear: Should attempts be per-rule, per-case, or global?
   - Recommendation: Per-rule within current case session; reset when switching cases

3. **localStorage size limits**
   - What we know: Code for each case needs to be stored
   - What's unclear: How many cases before hitting 5MB limit?
   - Recommendation: With ~50 lines per case × 20 cases = ~50KB, well under limit

## Validation Architecture

> Skip this section entirely if workflow.nyquist_validation is false in .planning/config.json

**Note:** `workflow.nyquist_validation` is not enabled in this project. No existing test infrastructure detected. Testing will be manual verification during development.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** - Existing patterns in ValidationPanel.tsx, useCodeRunner.ts, types.ts, App.tsx
- **Context7** - `/colinhacks/zod` library patterns for object validation (decided against adding Zod)

### Secondary (MEDIUM confidence)
- React hooks patterns documentation (useEffect, useCallback, useRef)
- localStorage API documentation (MDN Web Docs)

### Tertiary (LOW confidence)
- None — all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, no new dependencies needed
- Architecture: HIGH - Clear integration points identified from codebase
- Pitfalls: HIGH - Common localStorage/React patterns well-documented

**Research date:** 2026-03-02
**Valid until:** 2026-06-02 (90 days for stable React patterns)
