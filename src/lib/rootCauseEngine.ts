import type { Phase2Data, TraceSpan } from '../types/phase2';

/**
 * Result of evaluating a user's root cause guess
 */
export interface EvaluationResult {
  correct: boolean;
  explanation: string;
  hint?: string;
}

/**
 * Rule that evaluates whether a specific root cause option is correct
 * and provides contextual feedback
 */
export interface RootCauseRule {
  id: string;
  label: string;
  /**
   * Evaluate whether this root cause applies to the given data
   */
  evaluate: (data: Phase2Data) => boolean;
  /**
   * Generate explanation when this is the correct answer
   */
  explainCorrect: (data: Phase2Data) => string;
  /**
   * Generate explanation when user guesses this but it's incorrect
   */
  explainIncorrect: (data: Phase2Data, guessId: string) => string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find the span with the longest duration
 */
export function findSlowestSpan(data: Phase2Data): TraceSpan | null {
  if (!data.spans || data.spans.length === 0) return null;
  return data.spans.reduce((slowest, span) => 
    span.durationMs > slowest.durationMs ? span : slowest
  );
}

/**
 * Find first span containing a specific attribute
 */
export function findSpanWithAttribute(
  data: Phase2Data, 
  attr: string
): TraceSpan | null {
  return data.spans.find(span => attr in span.attributes) || null;
}

/**
 * Safely extract db.connection_pool.wait_ms from a span
 */
export function getPoolWaitMs(span: TraceSpan | null): number | null {
  if (!span) return null;
  const value = span.attributes['db.connection_pool.wait_ms'];
  if (value === undefined) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Get the db.query span's actual execution time (duration minus wait)
 */
export function getQueryExecutionTime(span: TraceSpan | null): number | null {
  if (!span) return null;
  const waitMs = getPoolWaitMs(span) || 0;
  return span.durationMs - waitMs;
}

/**
 * Find the cache.invalidate span
 */
export function findCacheSpan(data: Phase2Data): TraceSpan | null {
  return data.spans.find(span => span.name === 'cache.invalidate') || null;
}

/**
 * Find the db.query span
 */
export function findDbQuerySpan(data: Phase2Data): TraceSpan | null {
  return data.spans.find(span => span.name === 'db.query') || null;
}

/**
 * Format milliseconds for display
 */
export function formatDuration(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${Math.round(ms)}ms`;
}

/**
 * Calculate percentage of total time
 */
export function calculatePercentage(partMs: number, totalMs: number): string {
  return `${Math.round((partMs / totalMs) * 100)}%`;
}

// ============================================================================
// Case-Specific Rules
// ============================================================================

/**
 * Hello Span (001-hello-span) case rules
 * 
 * Scenario: Order processing is slow (5s) due to DB connection pool exhaustion
 */
const helloSpanRules: RootCauseRule[] = [
  // Option A: Missing index (distractor)
  {
    id: 'a',
    label: 'Missing index on the orders table — the UPDATE query does a full table scan',
    evaluate: () => false, // Never correct for this case
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const dbSpan = findDbQuerySpan(data);
      const waitMs = getPoolWaitMs(dbSpan);
      const execTime = getQueryExecutionTime(dbSpan);
      
      if (waitMs && execTime !== null) {
        const waitPercent = calculatePercentage(waitMs, dbSpan!.durationMs);
        return `Not quite. The trace shows db.connection_pool.wait_ms=${waitMs}, meaning ${formatDuration(waitMs)} (${waitPercent}) were spent waiting for a connection — not executing the query itself. The query only took ${formatDuration(execTime)} once it got a connection. A missing index would slow the query execution, but the data shows the bottleneck is connection wait time, not query time.`;
      }
      
      return 'Not quite. The trace shows significant time spent waiting for a database connection, not executing the query itself. A missing index would slow query execution, but the bottleneck is elsewhere.';
    },
  },
  
  // Option B: Connection pool too small (correct answer)
  {
    id: 'b',
    label: 'DB connection pool is too small — all 5 connections are in use, new requests queue up',
    evaluate: (data: Phase2Data) => {
      const dbSpan = findDbQuerySpan(data);
      const waitMs = getPoolWaitMs(dbSpan);
      // Consider it correct if there's significant pool wait time
      return waitMs !== null && waitMs > 1000;
    },
    explainCorrect: (data: Phase2Data) => {
      const dbSpan = findDbQuerySpan(data);
      const waitMs = getPoolWaitMs(dbSpan);
      const totalMs = data.totalDurationMs;
      
      if (waitMs) {
        const waitPercent = calculatePercentage(waitMs, totalMs);
        return `✓ Exactly! The span attribute db.connection_pool.wait_ms=${waitMs} shows ${formatDuration(waitMs)} spent waiting for a connection — that's ${waitPercent} of the total ${formatDuration(totalMs)} latency. Look at the logs too: "pool_size=5, waiting=12" — 12 requests queued for only 5 connections. The fix: increase pool_size or reduce connection hold time.`;
      }
      
      return '✓ Exactly! The trace shows significant time spent waiting for a database connection, indicating the pool is exhausted. Check the logs for pool_size and waiting count confirmation.';
    },
    explainIncorrect: () => '',
  },
  
  // Option C: Cache is slow (distractor)
  {
    id: 'c',
    label: 'The external cache is slow — Redis is adding latency to every request',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const cacheSpan = findCacheSpan(data);
      const dbSpan = findDbQuerySpan(data);
      
      if (cacheSpan) {
        return `Not quite. The cache.invalidate span took only ${formatDuration(cacheSpan.durationMs)} — that's totally normal for a cache operation. Compare that to db.query at ${formatDuration(dbSpan?.durationMs || 0)}. The culprit is clearly the database operation, not the cache.`;
      }
      
      return 'Not quite. The cache operations in the trace complete very quickly. The slow operation is the database query, not the cache.';
    },
  },
  
  // Option D: CPU-bound (distractor)
  {
    id: 'd',
    label: 'The order-service is CPU-bound — too many concurrent requests overwhelming the process',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const dbSpan = findDbQuerySpan(data);
      const waitMs = getPoolWaitMs(dbSpan);
      
      if (waitMs) {
        return `No. If it were CPU-bound, you'd see spans showing active computation time, not waiting. The span shows db.connection_pool.wait_ms=${waitMs}, which is blocking I/O wait time — the thread is idle, waiting for the database. That's the opposite of CPU-bound.`;
      }
      
      return 'No. If it were CPU-bound, you\'d see spans showing active computation time. The trace shows blocking I/O wait — the thread is idle, waiting for external resources. That\'s the opposite of CPU-bound.';
    },
  },
];

/**
 * Auto-magic (002-auto-magic) case rules
 *
 * Scenario: Checkout service HTTP calls to payment API are failing.
 * HTTP client span has status=ERROR and http.status_code=500.
 */
const autoMagicRules: RootCauseRule[] = [
  {
    id: 'a',
    label: 'Payment API is returning HTTP 500 — external service is down',
    evaluate: (data: Phase2Data) => {
      return data.spans.some(span => span.status === 'error');
    },
    explainCorrect: (data: Phase2Data) => {
      const errorSpan = data.spans.find(span => span.status === 'error');
      const statusCode = errorSpan?.attributes?.['http.status_code'] || '500';
      return `✓ Exactly! The "${errorSpan?.name ?? 'http.client'}" span has status=ERROR and http.status_code=${statusCode}. The logs show retry attempts that all failed. The root cause is the downstream payment service. Fix: add a circuit breaker or fallback.`;
    },
    explainIncorrect: () => '',
  },
  {
    id: 'b',
    label: 'Database connection pool exhausted — order writes are timing out',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const errorSpan = data.spans.find(span => span.status === 'error');
      return `Not quite. There are no database spans in this trace. The error is on the "${errorSpan?.name ?? 'http.client'}" span — an outbound HTTP call to the payment API (status=ERROR). Check the span's http.status_code attribute.`;
    },
  },
  {
    id: 'c',
    label: 'Order service has a memory leak — GC pauses causing 500ms timeouts',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const totalMs = data.totalDurationMs;
      return `No. The total trace duration is only ${formatDuration(totalMs)} — too fast for a GC issue. The error span shows http.status_code=500, which is an HTTP response from the payment service, not a timeout. GC pauses produce slow spans, not 500 errors.`;
    },
  },
  {
    id: 'd',
    label: 'Network routing issue — DNS resolution failing for the payment service',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const errorSpan = data.spans.find(span => span.status === 'error');
      const statusCode = errorSpan?.attributes?.['http.status_code'];
      if (statusCode) {
        return `Not quite. A DNS failure means the connection never reaches the server — there would be no HTTP status code. But the span shows http.status_code=${statusCode}, meaning the payment API responded. The problem is inside the payment service, not the network.`;
      }
      return `Not quite. A DNS failure would show as a connection error with no HTTP status code. The error span has an HTTP status code, meaning the server was reached and responded with an error.`;
    },
  },
];

/**
 * The Collector (003-the-collector) case rules
 *
 * Scenario: tail_sampling misconfigured (sampling_percentage=1%) drops all error spans.
 * The-collector-003 is a YAML-config case — no live spans from user code.
 * evaluate() uses static logic (always true for 'a') since there are no user spans.
 */
const collectorRules: RootCauseRule[] = [
  {
    id: 'a',
    label: 'tail_sampling sampling_percentage too low — dropping 99% of traces including all errors',
    evaluate: () => true, // Always correct for this case (YAML-based, no live spans)
    explainCorrect: () => '✓ Correct! The tail_sampling processor had sampling_percentage=1, dropping 99% of traces. Error spans — which should always be kept — were sampled out. Fix: use a policy that explicitly keeps ERROR status spans.',
    explainIncorrect: () => '',
  },
  {
    id: 'b',
    label: 'OTLP exporter endpoint misconfigured — traces sent to wrong address',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: () => 'Not quite. A wrong endpoint causes export failures, but traces would still be sampled. The selective dropout of error spans points to tail_sampling, which runs before export.',
  },
  {
    id: 'c',
    label: 'Receivers not configured — no telemetry reaching the collector',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: () => 'Not quite. Missing receivers would drop ALL traces, not just error traces. The selective gap — only errors missing — is the signature of tail_sampling filtering.',
  },
  {
    id: 'd',
    label: 'Batch processor buffer overflow — high-throughput traces queued and dropped',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: () => 'No. Buffer overflow drops traces uniformly under load. Here, only error spans are missing — that selective behavior is tail_sampling with a misconfigured error policy, not random buffer overflow.',
  },
];

// ============================================================================
// Rule Registry
// ============================================================================

/**
 * Registry of rules per case
 */
const RULES_REGISTRY: Record<string, RootCauseRule[]> = {
  '001-hello-span': helloSpanRules,
  '002-auto-magic': autoMagicRules,
  '003-the-collector': collectorRules,
};

/**
 * Create default rules for a case
 * 
 * @param caseId - The case identifier
 * @returns Map of rule ID to RootCauseRule
 */
export function createDefaultRules(caseId: string): Map<string, RootCauseRule> {
  const rules = new Map<string, RootCauseRule>();
  const caseRules = RULES_REGISTRY[caseId] || [];
  
  for (const rule of caseRules) {
    rules.set(rule.id, rule);
  }
  
  return rules;
}

/**
 * Get a hint for an incorrect guess
 */
function getHintForGuess(guessId: string, _data: Phase2Data): string | undefined {
  switch (guessId) {
    case 'a': // Missing index
      return '💡 Hint: Look at db.connection_pool.wait_ms — is the time spent waiting or querying?';
    case 'c': // Cache is slow
      return '💡 Hint: Compare the duration of cache.invalidate to db.query. Which is longer?';
    case 'd': // CPU-bound
      return '💡 Hint: Look for spans showing wait time vs computation time. What does db.connection_pool.wait_ms indicate?';
    default:
      return undefined;
  }
}

// ============================================================================
// Main Evaluation Function
// ============================================================================

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
 * const result = evaluateGuess('b', phase2Data, '001-hello-span');
 * // result = {
 * //   correct: true,
 * //   explanation: '✓ Exactly! The span shows db.connection_pool.wait_ms=4750...'
 * // }
 * ```
 */
export function evaluateGuess(
  guessId: string,
  data: Phase2Data,
  caseId: string
): EvaluationResult {
  const rules = createDefaultRules(caseId);
  const rule = rules.get(guessId);
  
  if (!rule) {
    return {
      correct: false,
      explanation: 'Invalid selection. Please choose a valid option.',
    };
  }
  
  try {
    const isCorrect = rule.evaluate(data);
    
    return {
      correct: isCorrect,
      explanation: isCorrect
        ? rule.explainCorrect(data)
        : rule.explainIncorrect(data, guessId),
      hint: isCorrect ? undefined : getHintForGuess(guessId, data),
    };
  } catch (error) {
    // Graceful degradation if evaluation fails
    console.error('Error evaluating guess:', error);
    return {
      correct: false,
      explanation: 'Unable to evaluate guess. Please try again.',
    };
  }
}
