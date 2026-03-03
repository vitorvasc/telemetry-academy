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
 * Hello Span (hello-span-001) case rules
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
 * Auto-magic (auto-magic-002) case rules
 * 
 * Scenario: HTTP endpoint returning 500 errors
 * Placeholder for Phase 4 content authoring
 */
const autoMagicRules: RootCauseRule[] = [
  {
    id: 'a',
    label: 'External API is returning 500 errors',
    evaluate: (data: Phase2Data) => {
      // Check for HTTP client spans with error status
      return data.spans.some(span => 
        span.name?.includes('http') && 
        span.status === 'error'
      );
    },
    explainCorrect: (data: Phase2Data) => {
      const errorSpan = data.spans.find(span => 
        span.name?.includes('http') && span.status === 'error'
      );
      return `✓ Correct! The trace shows HTTP span "${errorSpan?.name}" with status=error, indicating the external API call is failing.`;
    },
    explainIncorrect: () => 'Look for HTTP spans with error status in the trace.',
  },
  {
    id: 'b',
    label: 'Database connection timeout',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: () => 'Check if there are any database spans showing errors or long wait times.',
  },
];

// ============================================================================
// Rule Registry
// ============================================================================

/**
 * Registry of rules per case
 */
const RULES_REGISTRY: Record<string, RootCauseRule[]> = {
  'hello-span-001': helloSpanRules,
  'auto-magic-002': autoMagicRules,
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
 * const result = evaluateGuess('b', phase2Data, 'hello-span-001');
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
