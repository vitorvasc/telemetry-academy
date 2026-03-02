# Phase 2: Validation & Core Loop - Research

**Researched:** 2026-03-02 (Refreshed)
**Domain:** React TypeScript, OpenTelemetry Span Validation, localStorage Persistence
**Confidence:** HIGH

## Summary

Phase 2 implements the core learning loop: real-time span validation, linear case progression, and persistent state. The existing codebase has solid foundations with `useCodeRunner` capturing spans via postMessage from Pyodide WASM, `ValidationPanel` with animated UI cards, and `CaseSelector` managing unlock states. The key challenge is replacing the current `simulateValidation()` function (which does naive string matching on code) with a real span-based validation engine that checks actual captured telemetry JSON objects from the OpenTelemetry Python SDK.

The validation engine must check span patterns against real captured spans. Each span from OpenTelemetry Python's `to_json()` contains fields like `name`, `context` (span_id, trace_id), `parent_id`, `attributes` (dict), `events` (list), `status`, etc. localStorage persistence needs schema versioning for forward compatibility as the app evolves. State management currently uses inline `useState` in `App.tsx` with `updateProgress()` helper, which should be extended with persistence hooks.

**Primary recommendation:** Build a lightweight validation engine using native TypeScript pattern matching against the actual OpenTelemetry span JSON structure. Use a custom `usePersistentState` hook for localStorage with JSON schema versioning and debounced saves.

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
| CORE-05 | User progress and state persist across browser reloads via `localStorage` | Implement custom hook `usePersistentState` with schema versioning; auto-save on state change with 300ms debounce |
| LOOP-01 | Case selector allows linear progression (next case unlocks upon completion) | Extend existing `handleCaseSolved()` logic; unlock next case on 'solved' status; `CaseSelector` already shows locked/available states |
| LOOP-02 | Phase 1 validates JSON telemetry output, not RegEx parsing of code | Replace `simulateValidation()` with span-based engine checking captured `spans` array from `useCodeRunner` against actual OpenTelemetry span structure |
| LOOP-04 | Validation Panel displays real-time ✓/✗ feedback on specific telemetry requirements | Extend `ValidationPanel` props; add `isValidating` state during span capture; staggered reveal animation already exists with `animate-slide-in` class and 100ms delay |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.2.0 | UI framework | Already in use, concurrent features |
| TypeScript | ~5.9.3 | Type safety | Already configured |
| Tailwind CSS | ^4.2.1 | Styling | Already in use with custom animations |
| Lucide React | ^0.575.0 | Icons | Already in use |
| Pyodide | ^0.29.3 | Python WASM runtime | Already in use for code execution |

### Validation Engine (Custom — No External Library)
Instead of adding Zod, Yup, or AJV (bundle size overhead), implement a lightweight validation engine using native TypeScript:

**Rationale:**
- Validation rules are domain-specific (OpenTelemetry span patterns)
- No complex schema validation needed — just existence and pattern matching
- Keeps bundle size minimal (~0KB added)
- Simpler to maintain for OTel-specific patterns
- Direct control over error messages for progressive hints

**Installation:** No additional packages needed.

## Architecture Patterns

### OpenTelemetry Span Structure (Python SDK)

Based on the Python SDK's `to_json()` method, captured spans have this structure:

```typescript
interface OpenTelemetrySpan {
  name: string;                    // "process_order", "http_get", etc.
  context: {
    trace_id: string;              // Hex string
    span_id: string;               // Hex string
    trace_flags: number;
    is_remote: boolean;
  };
  parent_id?: string;              // Hex string or null
  attributes: Record<string, any>; // { "order_id": "123", "http.method": "GET" }
  events: Array<{
    name: string;
    timestamp: number;
    attributes: Record<string, any>;
  }>;
  status: {
    status_code: 'UNSET' | 'OK' | 'ERROR';
    description?: string;
  };
  start_time: number;              // Nanoseconds since epoch
  end_time: number;                // Nanoseconds since epoch
  kind: number;                    // 0=INTERNAL, 1=SERVER, 2=CLIENT, 3=PRODUCER, 4=CONSUMER
}
```

### Recommended Validation Engine Structure

```typescript
// src/lib/validation.ts

export type ValidationCheckType = 
  | 'span_exists' 
  | 'attribute_exists' 
  | 'attribute_value'
  | 'span_count'
  | 'status_ok'
  | 'status_error';

export interface SpanValidationRule {
  type: ValidationCheckType;
  spanName?: string;           // Exact or partial match
  attributeKey?: string;       // Attribute to check for
  attributeValue?: any;        // Optional: specific value required
  minCount?: number;           // For span_count checks
  description: string;         // Human-readable description
  successMessage: string;      // Shown on pass
  errorMessage: string;        // Base error message
  hintMessage?: string;        // Friendly hint for 1-2 attempts
  guidedMessage?: string;      // Detailed guidance for 3+ attempts
}

export interface ValidationAttempt {
  ruleDescription: string;
  attempts: number;
  lastAttemptAt: number;
}

export interface ValidationContext {
  spans: any[];                                    // Captured OTel spans
  attemptHistory: Record<string, number>;          // rule -> attempt count
}

export interface ValidationResult extends SpanValidationRule {
  passed: boolean;
  message: string;
  attemptsOnThisRule: number;
}

export function validateSpans(
  rules: SpanValidationRule[],
  context: ValidationContext
): ValidationResult[] {
  return rules.map(rule => {
    const passed = runValidationCheck(rule, context.spans);
    const attempts = context.attemptHistory[rule.description] || 0;
    
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
        (!rule.spanName || s.name === rule.spanName) &&
        s.attributes && 
        rule.attributeKey! in s.attributes
      );
    
    case 'attribute_value':
      return spans.some(s =>
        (!rule.spanName || s.name === rule.spanName) &&
        s.attributes?.[rule.attributeKey!] === rule.attributeValue
      );
    
    case 'span_count':
      return spans.length >= (rule.minCount || 1);
    
    case 'status_ok':
      return spans.some(s => 
        (!rule.spanName || s.name === rule.spanName) &&
        s.status?.status_code === 'OK'
      );
    
    case 'status_error':
      return spans.some(s => 
        (!rule.spanName || s.name === rule.spanName) &&
        s.status?.status_code === 'ERROR'
      );
    
    default:
      return false;
  }
}
```

### Recommended Persistence Hook Pattern

```typescript
// src/hooks/usePersistentState.ts

import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'telemetry-academy';
const SCHEMA_VERSION = 1;

interface PersistedData {
  version: number;
  progress: CaseProgress[];
  caseCode: Record<string, string>;  // caseId -> saved code
  attemptHistory: Record<string, Record<string, number>>; // caseId -> rule -> attempts
  timestamp: number;
}

export function useAcademyPersistence(
  initialProgress: CaseProgress[],
  getInitialCode: (caseId: string) => string
) {
  const [progress, setProgress] = useState<CaseProgress[]>(initialProgress);
  const [caseCode, setCaseCode] = useState<Record<string, string>>({});
  const [attemptHistory, setAttemptHistory] = useState<Record<string, Record<string, number>>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: PersistedData = JSON.parse(saved);
        if (parsed.version === SCHEMA_VERSION) {
          setProgress(parsed.progress);
          setCaseCode(parsed.caseCode || {});
          setAttemptHistory(parsed.attemptHistory || {});
        } else {
          // Schema mismatch — wipe and start fresh
          console.log('Schema version mismatch, resetting progress');
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to load progress:', e);
    }
    setIsLoaded(true);
  }, []);
  
  // Auto-save with debounce (300ms)
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
          attemptHistory,
          timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          console.error('localStorage quota exceeded');
          // Could implement LRU eviction here
        } else {
          console.error('Failed to save progress:', e);
        }
      }
    }, 300);
    
    return () => clearTimeout(saveTimeoutRef.current);
  }, [progress, caseCode, attemptHistory, isLoaded]);
  
  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProgress(initialProgress);
    setCaseCode({});
    setAttemptHistory({});
  }, [initialProgress]);
  
  const updateAttemptHistory = useCallback((caseId: string, ruleDescription: string) => {
    setAttemptHistory(prev => ({
      ...prev,
      [caseId]: {
        ...prev[caseId],
        [ruleDescription]: (prev[caseId]?.[ruleDescription] || 0) + 1
      }
    }));
  }, []);
  
  const getAttemptCount = useCallback((caseId: string, ruleDescription: string): number => {
    return attemptHistory[caseId]?.[ruleDescription] || 0;
  }, [attemptHistory]);
  
  const getSavedCode = useCallback((caseId: string): string | undefined => {
    return caseCode[caseId];
  }, [caseCode]);
  
  const saveCode = useCallback((caseId: string, code: string) => {
    setCaseCode(prev => ({ ...prev, [caseId]: code }));
  }, []);
  
  return {
    progress,
    setProgress,
    attemptHistory,
    updateAttemptHistory,
    getAttemptCount,
    getSavedCode,
    saveCode,
    resetAll,
    isLoaded
  };
}
```

### Progressive Hint Pattern

```typescript
// Progressive message selection based on attempt count
function getHintMessage(
  rule: SpanValidationRule,
  attempts: number
): string {
  if (attempts === 0) {
    return rule.errorMessage;
  } else if (attempts < 3) {
    return rule.hintMessage || rule.errorMessage;
  } else {
    return rule.guidedMessage || rule.hintMessage || rule.errorMessage;
  }
}
```

### Recommended Integration Points

**File:** `src/lib/validation.ts` (NEW)
- `validateSpans()` — main validation engine
- `runValidationCheck()` — helper for each check type
- `SpanValidationRule` type — extends existing ValidationRule

**File:** `src/hooks/useAcademyPersistence.ts` (NEW)
- `useAcademyPersistence()` — localStorage hook with versioning
- Handles schema migration, debounced saves, quota errors

**File:** `src/App.tsx` (MODIFY)
- Replace `simulateValidation()` with real span validation
- Wrap `allProgress` with persistence hook
- Add auto-save effect for code changes
- Clear validation results when code changes
- Add attempt tracking for progressive hints

**File:** `src/types.ts` (MODIFY)
- Extend `ValidationRule` with `hintMessage` and `guidedMessage`
- Add `ValidationAttempt` tracking type

**File:** `src/data/cases.ts` (MODIFY)
- Add `hintMessage` and `guidedMessage` to validation rules
- Example span names and attribute keys for each case

### Anti-Patterns to Avoid

- **Don't parse code with RegEx or string matching:** The current `simulateValidation()` uses `code.includes()` — this should be replaced with actual span validation
- **Don't sync localStorage on every render:** Use debounce (300ms) for code changes
- **Don't store sensitive data:** Only store progress and code, no user identifiers
- **Don't mutate captured spans:** Always validate against read-only span copies
- **Don't block the main thread:** localStorage access is synchronous — debounce writes

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON Schema Validation | Custom validation library | Native TypeScript pattern matching | Domain-specific needs, simpler code |
| State Persistence | raw `localStorage` API | Custom `useAcademyPersistence` hook | Versioning, SSR safety, type safety, debouncing |
| Deep Equality Checks | `JSON.stringify(a) === JSON.stringify(b)` | Specific field comparison | Span comparison only needs key fields |
| Debouncing | `setTimeout` in component | `useRef` + `useEffect` cleanup | Cleaner, prevents memory leaks |

**Key insight:** localStorage access is synchronous and blocking — debounce writes to avoid jank during rapid code editing. The 5-10MB quota limit is sufficient for this use case (~50 lines per case × 50 cases = ~125KB).

## Common Pitfalls

### Pitfall 1: Stale Validation Results
**What goes wrong:** Validation results persist after user edits code, causing confusion when results no longer match current code state.

**Why it happens:** State isn't cleared when `code` changes.

**How to avoid:** 
```typescript
useEffect(() => {
  setValidationResults([]); // Clear on code change
  setWorkerError(null);
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
    // Handle gracefully — clear old data or notify user
    console.error('Storage quota exceeded');
  }
}
```

**Warning signs:** Errors in console, data not persisting, app becomes unresponsive.

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

**Warning signs:** `undefined` errors accessing properties that should exist, type errors.

### Pitfall 4: Hydration Mismatch (SSR)
**What goes wrong:** React hydration errors if localStorage value differs from server render.

**Why it happens:** localStorage only exists in browser, server render uses initial state.

**How to avoid:** Only load from localStorage in `useEffect` (client-side only), not during render. Use `isLoaded` flag to prevent rendering before load completes.

**Warning signs:** React console warnings about hydration mismatch, flickering UI.

### Pitfall 5: Attempt Count Reset on Case Switch
**What goes wrong:** Progressive hint system doesn't work because attempt counts reset when switching cases.

**Why it happens:** Attempt history is stored in component state, not persisted.

**How to avoid:** Store attempt history in localStorage alongside progress, keyed by case ID.

**Warning signs:** User sees same hint messages after switching away and back, hint system feels inconsistent.

## Code Examples

### Complete Integration in App.tsx

```typescript
// src/App.tsx - key integration points

import { validateSpans, SpanValidationRule } from './lib/validation';
import { useAcademyPersistence } from './hooks/useAcademyPersistence';

function App() {
  // Replace useState with persistence hook
  const {
    progress: allProgress,
    setProgress: setAllProgress,
    getAttemptCount,
    updateAttemptHistory,
    getSavedCode,
    saveCode,
    resetAll,
    isLoaded
  } = useAcademyPersistence(
    initProgress(cases),
    (caseId) => cases.find(c => c.id === caseId)?.phase1.initialCode || ''
  );
  
  const [currentCaseId, setCurrentCaseId] = useState(cases[0].id);
  const currentCase = cases.find(c => c.id === currentCaseId) ?? cases[0];
  
  // Initialize code from saved state
  const [code, setCode] = useState(() => {
    const saved = getSavedCode(currentCaseId);
    return saved || currentCase.phase1.initialCode;
  });
  
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  
  const { isReady, initError, isRunning, output, spans, runCode } = useCodeRunner('python');
  
  // Clear validation when code changes
  useEffect(() => {
    setValidationResults([]);
    setWorkerError(null);
  }, [code]);
  
  // Auto-save code changes
  useEffect(() => {
    saveCode(currentCaseId, code);
  }, [code, currentCaseId, saveCode]);
  
  // Real validation handler
  const handleValidate = async () => {
    setIsValidating(true);
    setValidationResults([]);
    setWorkerError(null);
    
    // Mark in-progress
    updateProgress(currentCaseId, { 
      status: 'in-progress', 
      timeStartedMs: Date.now() 
    });
    
    try {
      await runCode(code);
    } catch (err: any) {
      setWorkerError(err.message || 'Unknown execution error');
      setIsValidating(false);
      return;
    }
    
    // Get attempt history for current case
    const attemptHistory: Record<string, number> = {};
    currentCase.phase1.validations.forEach(rule => {
      attemptHistory[rule.description] = getAttemptCount(currentCaseId, rule.description);
    });
    
    // Real span validation
    const results = validateSpans(
      currentCase.phase1.validations as SpanValidationRule[],
      { spans, attemptHistory }
    );
    
    setValidationResults(results);
    
    // Update attempt counts for failed rules
    results.forEach(r => {
      if (!r.passed) {
        updateAttemptHistory(currentCaseId, r.description);
      }
    });
    
    if (results.every(r => r.passed)) {
      setAppPhase('investigation');
      updateProgress(currentCaseId, { phase: 'investigation' });
    }
    
    setIsValidating(false);
  };
  
  // Don't render until persisted state is loaded
  if (!isLoaded) {
    return <div className="h-screen bg-slate-900 flex items-center justify-center text-white">
      Loading...
    </div>;
  }
  
  // ... rest of component
}
```

### Updated Case Data with Progressive Hints

```typescript
// src/data/cases.ts

export const cases: Case[] = [
  {
    id: 'hello-span-001',
    // ... other fields
    phase1: {
      // ... description, hints, initialCode
      validations: [
        {
          type: 'span_exists',
          spanName: 'process_order',  // The actual span name to check for
          description: 'A span must be created around the process_order function',
          successMessage: '✓ Span "process_order" created successfully',
          errorMessage: '✗ No span named "process_order" found',
          hintMessage: '💡 Hint: Use tracer.start_as_current_span("process_order")',
          guidedMessage: '📖 Use: with tracer.start_as_current_span("process_order") as span:',
        },
        {
          type: 'attribute_exists',
          spanName: 'process_order',
          attributeKey: 'order_id',
          description: 'The order_id must be added as a span attribute',
          successMessage: '✓ Attribute order_id added to span',
          errorMessage: '✗ Attribute order_id not found on process_order span',
          hintMessage: '💡 Hint: Use span.set_attribute("order_id", order_id)',
          guidedMessage: '📖 Inside the span context, add: span.set_attribute("order_id", order_id)',
        },
        {
          type: 'telemetry_flowing',
          description: 'Telemetry must be properly configured and flowing',
          successMessage: '✓ Telemetry is flowing! Phase 1 complete.',
          errorMessage: '✗ No telemetry spans captured',
          hintMessage: '💡 Make sure your span covers the database operations',
          guidedMessage: '📖 Ensure the "with" block wraps all the function logic',
        },
      ],
    },
  },
];
```

### Reset Progress UI

```typescript
// Component for reset button with confirmation

const ResetProgressButton: React.FC<{ onReset: () => void }> = ({ onReset }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  
  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Are you sure?</span>
        <button
          onClick={() => {
            onReset();
            setShowConfirm(false);
          }}
          className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded"
        >
          Yes, Reset
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded"
        >
          Cancel
        </button>
      </div>
    );
  }
  
  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="text-xs text-slate-500 hover:text-red-400 transition-colors"
    >
      Reset All Progress
    </button>
  );
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| String matching on code (`code.includes()`) | Span-based validation against real OTel JSON | Phase 2 | Validates actual telemetry output, not code syntax; more accurate |
| In-memory only state | localStorage persistence with schema versioning | Phase 2 | User progress survives browser refresh; forward-compatible |
| Simultaneous validation results | Staggered reveal animation | Phase 2 | Better UX, draws attention to each check |
| Single error message | Progressive hints (3-tier) | Phase 2 | Adaptive learning based on attempt count |
| Manual validate button only | Auto-validate after run | Phase 2 | Seamless workflow, immediate feedback |

**Deprecated/outdated:**
- `simulateValidation()` function in App.tsx — replace with `validateSpans()` from `src/lib/validation.ts`
- Static validation messages — replace with progressive hint system (error → hint → guided)
- In-memory attempt tracking — replace with persisted attempt history per case

## Open Questions

1. **Span name matching strictness**
   - What we know: Need to check span name existence
   - What's unclear: Should we match partial names (e.g., "process-order" matches "process-order-handler")?
   - Recommendation: Start with exact matching, can add fuzzy/prefix matching later if needed

2. **Attribute value validation depth**
   - What we know: Need to check attribute existence
   - What's unclear: How complex should value matching be? (exact equality, type checking, regex?)
   - Recommendation: Start with exact equality for primitives, add type checking later

3. **localStorage size limits with large code**
   - What we know: Code for each case needs to be stored
   - What's unclear: What if users write very long code?
   - Recommendation: With ~50-100 lines per case × 20 cases = ~100KB, well under 5MB limit

4. **Attempt counting reset strategy**
   - What we know: Need to track attempts for progressive hints
   - What's unclear: Should attempts reset on successful validation of a rule?
   - Recommendation: Yes — reset to 0 when rule passes, so hints start fresh if they break it again

## Validation Architecture

> Skip this section entirely if workflow.nyquist_validation is false in .planning/config.json

**Note:** `workflow.nyquist_validation` is not enabled in this project. Testing will be manual verification during development.

However, for future testing considerations:

### Testable Validation Functions
The validation engine (`src/lib/validation.ts`) should be designed for unit testing:

```typescript
// Testable pure functions
export function checkSpanExists(spans: any[], spanName: string): boolean;
export function checkAttributeExists(spans: any[], spanName: string | undefined, attributeKey: string): boolean;
export function validateSpans(rules: SpanValidationRule[], context: ValidationContext): ValidationResult[];
```

These functions have no side effects and can be tested with mock span data.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** — Existing patterns in ValidationPanel.tsx, useCodeRunner.ts, types.ts, App.tsx, CaseSelector.tsx
- **OpenTelemetry Python SDK** — Span structure from `to_json()` method via setup_telemetry.py analysis
- **Pyodide Web Worker** — Message passing pattern for span capture via python.worker.ts

### Secondary (MEDIUM confidence)
- React hooks patterns documentation (useEffect, useCallback, useRef cleanup)
- localStorage API documentation (MDN Web Docs — quota limits, error handling)

### Tertiary (LOW confidence)
- None — all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All libraries already in use, no new dependencies needed
- Architecture: HIGH — Clear integration points identified from codebase, existing patterns to follow
- Pitfalls: HIGH — Common localStorage/React patterns well-documented and verified
- Span structure: HIGH — Based on actual OpenTelemetry Python SDK behavior

**Research date:** 2026-03-02
**Valid until:** 2026-06-02 (90 days for stable React patterns)
**Last refreshed:** 2026-03-02 (forced re-research)
