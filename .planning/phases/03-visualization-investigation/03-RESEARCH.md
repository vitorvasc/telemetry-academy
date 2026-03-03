# Phase 3: Visualization & Investigation - Research

**Researched:** 2026-03-03
**Domain:** React TypeScript UI Integration & Data Transformation
**Confidence:** HIGH

## Summary

Phase 3 focuses on integrating real telemetry data from Phase 1 into existing UI components (TraceViewer, LogViewer, RootCauseSelector) and implementing the Root Cause Engine for intelligent guess feedback. The key challenge is transforming raw OpenTelemetry spans from Pyodide execution into the `Phase2Data` format expected by the visualization components.

The existing components (`TraceViewer.tsx`, `LogViewer.tsx`, `RootCauseSelector.tsx`, `InvestigationView.tsx`) are already implemented with polished UI, TypeScript types, and mock data patterns. This phase is primarily about **data integration**, not building new UI components from scratch. The main technical work involves: (1) span-to-visualization data transformation, (2) log generation/correlation from span data, (3) implementing the Root Cause Engine with attribute-specific feedback, and (4) responsive design decisions for the trace waterfall.

**Primary recommendation:** Build a data transformation layer that converts raw OTel spans into `Phase2Data`, generate synthetic logs that correlate with spans for teaching purposes, and implement the Root Cause Engine as a rules-based system that inspects span attributes to provide targeted feedback.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Trace-Log Correlation:**
- Interactive IDs: trace_id and span_id in the UI are clickable links
- Filter persistence: Tab filter state persists when switching between Traces and Logs tabs
- Pattern emphasis: Highlight correlation between slow spans (SLOW badge) and log warnings about timeouts, retries, etc.

**Data Integration:**
- Auto-populate: Phase 2 data appears automatically when Phase 1 validation passes (unlocks Investigation tab)
- Single trace: Show only the most recent run from Phase 1 code execution
- Bad data handling: Display empty state with instructional message if Phase 1 produces no/broken telemetry
- Read-only: Investigation data comes directly from Phase 1 — no editing or replay modes

**Empty/Error States:**
- No data yet: Show instructional prompt: "Run your code in Phase 1 to generate telemetry data" with visual guidance
- Zero spans: Empty state in TraceViewer: "No spans detected. Check your instrumentation in Phase 1" with link to Phase 1
- Malformed data: Silently skip malformed spans/logs, display only valid entries
- Bridge failure: Show error message in Phase 2 explaining the failure (Web Worker crash, memory limit, etc.)

### Claude's Discretion
- Span click interaction behavior
- All responsive design choices (trace waterfall, tabs, breakpoints, overlays)
- Specific empty state copy and visuals
- Error message wording and placement

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LOOP-03 | "Root Cause Engine" provides detailed, attribute-specific explanations for incorrect guesses | Requires building rules-based feedback system that inspects span attributes to generate contextual explanations |
| VIS-01 | Trace Viewer displays an interactive, Jaeger-like span waterfall timeline | Component exists — needs data integration from useCodeRunner.spans → TraceViewer props |
| VIS-02 | Trace Viewer allows expanding spans to inspect custom attributes, events, and statuses | Component exists with drawer pattern — needs attribute mapping from OTel format |
| VIS-03 | Log Viewer displays a terminal-style table with support for `trace_id` correlation | Component exists — needs synthetic log generation from spans with trace correlation |
| VIS-04 | SLOW and ERROR badges visually flag anomalous spans in the waterfall | Component exists — needs duration threshold logic (e.g., >100ms = SLOW, status=ERROR = ERR) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | UI framework | Already in project, existing components built with it |
| TypeScript | 5.9.3 | Type safety | Project standard, used throughout |
| Tailwind CSS | 4.2.1 | Styling | Already configured, components use Tailwind classes |
| Lucide React | 0.575.0 | Icons | Already in use across all components |
| Vite | 7.3.1 | Build tool | Project build system |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @monaco-editor/react | 4.7.0 | Code editing | Already in Phase 1 — not needed for Phase 3 |
| pyodide | 0.29.3 | WASM Python | Already integrated via useCodeRunner hook |

### No Additional Dependencies Required
The existing stack is sufficient for Phase 3. All visualization components are already built; this phase focuses on data transformation and integration.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── TraceViewer.tsx          # Waterfall visualization (exists)
│   ├── LogViewer.tsx            # Terminal-style logs (exists)
│   ├── RootCauseSelector.tsx    # Multiple choice + feedback (exists)
│   └── InvestigationView.tsx    # Tab container (exists)
├── hooks/
│   ├── useCodeRunner.ts         # Captures spans from Pyodide (exists)
│   └── usePhase2Data.ts         # NEW: Transform spans → Phase2Data
├── lib/
│   ├── validation.ts            # Phase 1 validation (exists)
│   └── rootCauseEngine.ts       # NEW: Generate feedback from guess + data
├── data/
│   ├── phase2.ts                # Mock data (reference pattern)
│   └── cases.ts                 # Case definitions
└── types/
    ├── phase2.ts                # TraceSpan, LogEntry, Phase2Data types
    └── index.ts                 # Case, Validation types
```

### Pattern 1: Data Transformation Layer
**What:** Transform raw OpenTelemetry spans from useCodeRunner into Phase2Data format for visualization
**When to use:** Whenever Investigation tab is opened with new telemetry data
**Example:**
```typescript
// Source: Analysis of src/hooks/useCodeRunner.ts and src/types/phase2.ts
// Raw OTel span format from worker:
interface RawSpan {
  name: string;
  context: { span_id: string; trace_id: string };
  parent_id?: string;
  start_time: number;  // Unix nanoseconds
  end_time: number;    // Unix nanoseconds
  attributes: Record<string, any>;
  status?: { status_code: string; description?: string };
  events?: Array<{ name: string; timestamp: number; attributes?: Record<string, any> }>;
}

// Transformed to Phase2 TraceSpan:
interface TraceSpan {
  id: string;
  name: string;
  service: string;
  durationMs: number;
  offsetMs: number;
  status: 'ok' | 'error' | 'warning';
  attributes: Record<string, string>;
  depth: number;
}

// Transformation logic:
function transformSpans(rawSpans: RawSpan[]): TraceSpan[] {
  // 1. Calculate trace start time (min start_time)
  const traceStartNs = Math.min(...rawSpans.map(s => s.start_time));
  
  // 2. Build parent-child relationships for depth calculation
  const spanMap = new Map(rawSpans.map(s => [s.context.span_id, s]));
  const getDepth = (span: RawSpan): number => {
    if (!span.parent_id) return 0;
    const parent = spanMap.get(span.parent_id);
    return parent ? getDepth(parent) + 1 : 0;
  };
  
  // 3. Transform each span
  return rawSpans.map(span => ({
    id: span.context.span_id,
    name: span.name,
    service: span.attributes['service.name'] || 'unknown-service',
    durationMs: (span.end_time - span.start_time) / 1_000_000, // ns → ms
    offsetMs: (span.start_time - traceStartNs) / 1_000_000,
    status: deriveStatus(span), // 'ok' | 'error' | 'warning' based on status_code + duration
    attributes: flattenAttributes(span.attributes),
    depth: getDepth(span),
  }));
}
```

### Pattern 2: Synthetic Log Generation
**What:** Generate realistic log entries from span data for teaching correlation
**When to use:** When populating LogViewer with data that correlates to traces
**Example:**
```typescript
// Source: Analysis of src/data/phase2.ts mock pattern
function generateLogsFromSpans(spans: TraceSpan[], traceId: string): LogEntry[] {
  const logs: LogEntry[] = [];
  
  for (const span of spans) {
    // Entry log when span starts
    logs.push({
      timestamp: formatTimestamp(span.offsetMs),
      level: 'info',
      message: `Starting ${span.name}`,
      traceId,
      spanId: span.id,
      service: span.service,
    });
    
    // Warning log for slow spans
    if (span.status === 'warning') {
      const waitAttr = span.attributes['db.connection_pool.wait_ms'];
      if (waitAttr) {
        logs.push({
          timestamp: formatTimestamp(span.offsetMs + 10),
          level: 'warn',
          message: `DB connection pool exhausted, waiting ${waitAttr}ms`,
          traceId,
          spanId: span.id,
          service: span.service,
        });
      }
    }
    
    // Error log for error spans
    if (span.status === 'error') {
      logs.push({
        timestamp: formatTimestamp(span.offsetMs + span.durationMs - 10),
        level: 'error',
        message: span.attributes['error.message'] || 'Operation failed',
        traceId,
        spanId: span.id,
        service: span.service,
      });
    }
    
    // Success log when span ends
    logs.push({
      timestamp: formatTimestamp(span.offsetMs + span.durationMs),
      level: 'info',
      message: `Completed ${span.name} in ${span.durationMs}ms`,
      traceId,
      spanId: span.id,
      service: span.service,
    });
  }
  
  return logs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
```

### Pattern 3: Root Cause Engine Rules
**What:** Rules-based system that inspects span attributes to determine if a guess is correct and generate feedback
**When to use:** When user submits a root cause guess in RootCauseSelector
**Example:**
```typescript
// Source: Analysis of src/data/phase2.ts rootCauseOptions pattern
interface RootCauseRule {
  id: string;
  isCorrect: (data: Phase2Data) => boolean;
  generateFeedback: (data: Phase2Data, isCorrect: boolean) => string;
}

const rules: RootCauseRule[] = [
  {
    id: 'b', // Connection pool too small
    isCorrect: (data) => {
      // Check if any span has high connection pool wait time
      return data.spans.some(span => {
        const waitMs = parseInt(span.attributes['db.connection_pool.wait_ms'] || '0');
        return waitMs > 4000; // Threshold from case
      });
    },
    generateFeedback: (data, isCorrect) => {
      if (isCorrect) {
        return '✓ Exactly! The logs show "pool_size=5, waiting=12"...';
      }
      return 'Not quite. Look for db.connection_pool.wait_ms in the span attributes...';
    },
  },
  // ... other rules
];

export function evaluateGuess(guessId: string, data: Phase2Data): {
  correct: boolean;
  explanation: string;
} {
  const rule = rules.find(r => r.id === guessId);
  if (!rule) return { correct: false, explanation: 'Unknown option' };
  
  const correct = rule.isCorrect(data);
  return {
    correct,
    explanation: rule.generateFeedback(data, correct),
  };
}
```

### Pattern 4: Span-to-Log Correlation Interaction
**What:** When user clicks a span, highlight related logs; when user clicks a log, highlight related span
**When to use:** Claude's discretion per CONTEXT.md — implement based on UX best practices
**Example:**
```typescript
// Source: Analysis of component props patterns
interface CorrelationState {
  selectedSpanId: string | null;
  selectedLogIndex: number | null;
  highlightTraceId: string | null;
}

// In InvestigationView:
const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
const [highlightedLogSpanId, setHighlightedLogSpanId] = useState<string | null>(null);

// Click span → highlight its logs
const handleSpanClick = (spanId: string) => {
  setSelectedSpanId(spanId);
  setHighlightedLogSpanId(spanId); // Pass to LogViewer
  setActiveTab('logs'); // Optional: auto-switch to logs tab
};

// Click log → highlight its span
const handleLogClick = (spanId: string) => {
  setSelectedSpanId(spanId);
  setActiveTab('traces'); // Auto-switch to traces tab
};
```

### Anti-Patterns to Avoid
- **Don't parse span names with regex:** Use the `name` field directly; avoid brittle string parsing
- **Don't assume fixed attribute keys:** OTel attributes vary by instrumentation — use optional chaining
- **Don't block the UI during transformation:** Keep transformation synchronous (it's fast) but avoid async delays
- **Don't store transformed data in localStorage:** Always re-transform from source spans to avoid stale data
- **Don't hard-code case-specific logic in components:** Keep case-specific rules in the Root Cause Engine, not in the UI components

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Time formatting (ms → s/ms) | Custom formatter | `fmt()` function in TraceViewer.tsx | Already implemented, handles edge cases |
| Status color mapping | Inline ternary chains | `STATUS` constant object in TraceViewer.tsx | Single source of truth, consistent styling |
| Depth indentation math | Manual CSS calc | `span.depth * 18px` margin pattern | Already proven in TraceViewer.tsx |
| Tab state management | URL hash routing | React `useState` with localStorage persistence | Simpler, fits existing architecture |
| Log timestamp parsing | Date objects | String-based timestamps (HH:MM:SS.mmm) | Phase2Data format uses strings, simpler for display |
| Trace waterfall rendering | Canvas/WebGL | CSS-based bars with percentage widths | Existing implementation is performant for <100 spans |
| Responsive breakpoints | Custom detection | Tailwind responsive prefixes + CSS container queries | Tailwind 4 has built-in responsive utilities |

**Key insight:** The existing components handle most UI complexity already. This phase is about data plumbing, not UI invention. Reuse the existing patterns for status colors, time formatting, and depth indentation.

## Common Pitfalls

### Pitfall 1: Time Unit Confusion
**What goes wrong:** OTel timestamps are in nanoseconds, but UI displays milliseconds. Off-by-6-orders-of-magnitude bugs cause spans to appear instant or offset incorrectly.
**Why it happens:** OpenTelemetry spec uses nanoseconds for precision; JavaScript/UX typically uses milliseconds.
**How to avoid:** Always convert: `durationMs = (end_time - start_time) / 1_000_000`. Add unit suffixes to variable names (`Ms` vs `Ns`).
**Warning signs:** All spans show 0ms duration, or waterfall bars have zero width.

### Pitfall 2: Missing Parent Span Edge Case
**What goes wrong:** Child spans reference parent_id that doesn't exist in the captured data (e.g., parent was created before capture started). Depth calculation recurses infinitely or throws.
**Why it happens:** Phase 1 only captures spans created during user code execution; any pre-existing parent context is invisible.
**How to avoid:** Cap recursion depth, treat missing parents as root (depth=0). Add safety: `if (depth > 10) return 10;`.
**Warning signs:** Stack overflow errors, or all spans appearing at same indentation level.

### Pitfall 3: Attribute Type Variation
**What goes wrong:** OTel attributes can be strings, numbers, booleans, arrays. Code assumes string and crashes on `attributes[key].toString()` when value is already string, or fails on arrays.
**Why it happens:** OpenTelemetry allows typed attributes; some instrumentations use numbers for `http.status_code`, others use strings.
**How to avoid:** Normalize all attributes to strings during transformation: `String(value)`. Handle arrays by joining: `Array.isArray(v) ? v.join(', ') : String(v)`.
**Warning signs:** "Cannot read property of undefined" or "toString is not a function" errors.

### Pitfall 4: Root Cause Feedback Staleness
**What goes wrong:** User submits guess, sees feedback, then runs new code in Phase 1. Old feedback remains visible even though data changed.
**Why it happens:** RootCauseSelector maintains internal `submitted` state that's not reset when props change.
**How to avoid:** Add `useEffect` in RootCauseSelector to reset state when `options` prop changes (indicating new case/data).
**Warning signs:** Feedback from previous run persists after new code execution.

### Pitfall 5: Filter State Loss on Tab Switch
**What goes wrong:** User types filter in LogViewer, switches to Traces tab, returns to Logs — filter is cleared.
**Why it happens:** Per CONTEXT.md, filter persistence is a requirement. If LogViewer unmounts on tab switch, state is lost.
**How to avoid:** Lift filter state to InvestigationView parent, or use `display: none` instead of conditional rendering to preserve component state. Per CONTEXT.md: "Tab filter state persists when switching between Traces and Logs tabs."
**Warning signs:** User reports having to re-enter filters when switching tabs.

## Code Examples

### Data Transformation: Raw OTel Span to TraceSpan
```typescript
// Source: Derived from src/types/phase2.ts and src/hooks/useCodeRunner.ts
import type { TraceSpan } from '../types/phase2';

interface RawOTelSpan {
  name: string;
  context: { span_id: string; trace_id: string };
  parent_id?: string;
  start_time: number;
  end_time: number;
  attributes: Record<string, any>;
  status?: { status_code: string; description?: string };
}

export function transformToPhase2Data(
  rawSpans: RawOTelSpan[],
  caseId: string
): Phase2Data {
  if (!rawSpans || rawSpans.length === 0) {
    throw new Error('No spans captured');
  }

  const traceId = rawSpans[0].context.trace_id;
  const traceStartNs = Math.min(...rawSpans.map(s => s.start_time));
  const traceEndNs = Math.max(...rawSpans.map(s => s.end_time));
  
  // Build lookup for parent relationships
  const spanMap = new Map(rawSpans.map(s => [s.context.span_id, s]));
  
  const getDepth = (span: RawOTelSpan, visited = new Set()): number => {
    if (!span.parent_id) return 0;
    if (visited.has(span.context.span_id)) return 0; // Cycle protection
    visited.add(span.context.span_id);
    const parent = spanMap.get(span.parent_id);
    if (!parent) return 0;
    return getDepth(parent, visited) + 1;
  };
  
  // Determine status based on OTel status_code + duration heuristics
  const deriveStatus = (span: RawOTelSpan): 'ok' | 'error' | 'warning' => {
    const statusCode = span.status?.status_code;
    if (statusCode === 'ERROR') return 'error';
    
    const durationMs = (span.end_time - span.start_time) / 1_000_000;
    if (durationMs > 100) return 'warning'; // Threshold for "slow"
    
    return 'ok';
  };
  
  const spans: TraceSpan[] = rawSpans.map(span => ({
    id: span.context.span_id,
    name: span.name,
    service: span.attributes['service.name'] || 'unknown-service',
    durationMs: Math.round((span.end_time - span.start_time) / 1_000_000 * 100) / 100,
    offsetMs: Math.round((span.start_time - traceStartNs) / 1_000_000 * 100) / 100,
    status: deriveStatus(span),
    attributes: Object.entries(span.attributes).reduce((acc, [k, v]) => {
      acc[k] = Array.isArray(v) ? v.join(', ') : String(v);
      return acc;
    }, {} as Record<string, string>),
    depth: getDepth(span),
  }));
  
  return {
    traceId,
    totalDurationMs: Math.round((traceEndNs - traceStartNs) / 1_000_000),
    spans,
    logs: generateLogs(spans, traceId), // See synthetic log generation
    rootCauseOptions: getCaseOptions(caseId), // From case definitions
    narrative: getCaseNarrative(caseId),
  };
}
```

### Empty State Component Pattern
```typescript
// Source: Based on CONTEXT.md empty state requirements
import { AlertCircle, Play } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-data' | 'zero-spans' | 'bridge-error';
  onGoToPhase1?: () => void;
  errorMessage?: string;
}

export function InvestigationEmptyState({ type, onGoToPhase1, errorMessage }: EmptyStateProps) {
  const configs = {
    'no-data': {
      icon: Play,
      title: 'No Telemetry Data',
      message: 'Run your code in Phase 1 to generate telemetry data',
      action: { label: 'Go to Phase 1', onClick: onGoToPhase1 },
    },
    'zero-spans': {
      icon: AlertCircle,
      title: 'No Spans Detected',
      message: 'No spans detected. Check your instrumentation in Phase 1',
      action: { label: 'Review Instrumentation', onClick: onGoToPhase1 },
    },
    'bridge-error': {
      icon: AlertCircle,
      title: 'Telemetry Bridge Error',
      message: errorMessage || 'Failed to process telemetry data. Please try again.',
      action: null,
    },
  };
  
  const config = configs[type];
  const Icon = config.icon;
  
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-200 mb-2">{config.title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-6">{config.message}</p>
      {config.action && (
        <button
          onClick={config.action.onClick}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {config.action.label}
        </button>
      )}
    </div>
  );
}
```

### Root Cause Engine Implementation
```typescript
// Source: Based on src/data/phase2.ts pattern
export interface RootCauseEvaluation {
  correct: boolean;
  explanation: string;
  hint?: string;
}

export class RootCauseEngine {
  private rules: Map<string, RootCauseRule>;
  
  constructor() {
    this.rules = new Map();
    this.registerDefaultRules();
  }
  
  private registerDefaultRules() {
    // Rule: Connection pool too small
    this.register('b', {
      evaluate: (data) => {
        return data.spans.some(span => {
          const waitMs = parseInt(span.attributes['db.connection_pool.wait_ms'] || '0');
          return waitMs > 1000; // Significant wait time indicates pool issue
        });
      },
      explainCorrect: (data) => {
        const slowSpan = data.spans.find(s => parseInt(s.attributes['db.connection_pool.wait_ms'] || '0') > 1000);
        const waitMs = slowSpan?.attributes['db.connection_pool.wait_ms'];
        return `✓ Exactly! The span shows db.connection_pool.wait_ms=${waitMs}, meaning ${Math.round(parseInt(waitMs!) / 1000 * 100) / 100}s were spent waiting for a connection — not executing the query.`;
      },
      explainIncorrect: (data, guessId) => {
        // Provide targeted hint based on what they missed
        const hasPoolWait = data.spans.some(s => 'db.connection_pool.wait_ms' in s.attributes);
        if (hasPoolWait) {
          return 'Not quite. Look at the db.connection_pool.wait_ms attribute in the slow span — it shows significant wait time, not query execution time.';
        }
        return 'Not quite. Review the span attributes carefully — look for indicators of where time is actually being spent.';
      },
    });
    
    // Additional rules for other options...
  }
  
  register(id: string, rule: RootCauseRule) {
    this.rules.set(id, rule);
  }
  
  evaluate(guessId: string, data: Phase2Data): RootCauseEvaluation {
    const rule = this.rules.get(guessId);
    if (!rule) {
      return { correct: false, explanation: 'Invalid selection' };
    }
    
    const correct = rule.evaluate(data);
    return {
      correct,
      explanation: correct ? rule.explainCorrect(data) : rule.explainIncorrect(data, guessId),
    };
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phase 2 uses static mock data (`PHASE2_DATA` map in App.tsx) | Transform real spans from useCodeRunner | Phase 3 | Data is dynamic and reflects actual user code execution |
| RegEx parsing of code for validation | JSON span validation (Phase 1 complete) | Phase 2 | Validation is accurate and instrumentation-agnostic |
| Custom canvas rendering for waterfall | CSS-based percentage bars | Pre-existing | Simpler, responsive, accessible |
| Manual guess feedback strings | Rules-based engine with attribute inspection | Phase 3 | Feedback is contextual and educational |

**Deprecated/outdated:**
- Static `PHASE2_DATA` mapping in App.tsx: Will be replaced by dynamic transformation
- Hard-coded mock logs: Will be generated from actual span data

## Open Questions

1. **Span Click Behavior (Claude's Discretion)**
   - What we know: CONTEXT.md specifies "Claude's discretion — determine what happens when user clicks a span"
   - What's unclear: Exact interaction pattern (filter logs, highlight, or other)
   - Recommendation: Implement span click → highlight related logs in LogViewer + auto-switch to Logs tab. This provides clear trace-log correlation and matches user expectation from tools like Jaeger.

2. **Duration Thresholds for SLOW Badge**
   - What we know: VIS-04 requires SLOW badges for anomalous spans
   - What's unclear: Exact threshold (100ms? Relative to parent?)
   - Recommendation: Use absolute threshold of >100ms for 'warning' status, plus any span with ERROR status code gets 'error' badge. This matches typical SRE expectations for "slow" operations.

3. **Responsive Waterfall Strategy**
   - What we know: CONTEXT.md specifies "Claude's discretion — choose practical responsive strategy"
   - What's unclear: Horizontal scroll vs collapse columns vs vertical reorganization
   - Recommendation: Use horizontal scroll with minimum width (min-w-[600px]) on waterfall container. Trace waterfalls are inherently horizontal; vertical reorganization loses the visual timeline metaphor. On mobile, allow pinch-zoom and scroll.

4. **Log Generation Granularity**
   - What we know: Logs need to correlate with traces per VIS-03
   - What's unclear: How many logs to generate per span (start/end only? events too?)
   - Recommendation: Generate 2-4 logs per span: (1) operation start, (2) optional warning if slow/error attributes present, (3) optional error if status=ERROR, (4) operation complete. Include OTel events as additional logs if present in span data.

## Sources

### Primary (HIGH confidence)
- `src/types/phase2.ts` - TypeScript interfaces for Phase2Data, TraceSpan, LogEntry
- `src/hooks/useCodeRunner.ts` - Span capture mechanism from Pyodide
- `src/data/phase2.ts` - Mock data pattern and RootCauseOption structure
- `src/components/TraceViewer.tsx` - Existing waterfall implementation
- `src/components/LogViewer.tsx` - Existing log table implementation
- `src/components/RootCauseSelector.tsx` - Existing guess UI with feedback pattern
- `src/components/InvestigationView.tsx` - Tab container and data flow
- `03-CONTEXT.md` - User constraints and locked decisions

### Secondary (MEDIUM confidence)
- `src/App.tsx` - Current data flow and PHASE2_DATA usage pattern
- `src/lib/validation.ts` - Span structure understanding from validation logic

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Project already uses React 19 + TypeScript + Tailwind 4
- Architecture: HIGH - Components exist, patterns are clear from source code
- Pitfalls: MEDIUM-HIGH - Based on OTel spec knowledge and common integration issues

**Research date:** 2026-03-03
**Valid until:** 2026-06-03 (90 days - stable stack, low churn risk)
