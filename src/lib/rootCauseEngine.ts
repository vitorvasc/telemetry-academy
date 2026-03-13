import type { Phase2Data, TraceSpan } from '../types/phase2';
import { formatSpanMs } from './formatters';

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
   * Short hint shown after 1-2 incorrect attempts (optional)
   */
  specificHint?: string;
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
    specificHint: '💡 Hint: Look at db.connection_pool.wait_ms — is the time spent waiting for a connection or executing the query?',
    evaluate: () => false, // Never correct for this case
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const dbSpan = findDbQuerySpan(data);
      const waitMs = getPoolWaitMs(dbSpan);
      const execTime = getQueryExecutionTime(dbSpan);
      
      if (waitMs && execTime !== null) {
        const waitPercent = calculatePercentage(waitMs, dbSpan!.durationMs);
        return `Not quite. The trace shows db.connection_pool.wait_ms=${waitMs}, meaning ${formatSpanMs(waitMs)} (${waitPercent}) were spent waiting for a connection — not executing the query itself. The query only took ${formatSpanMs(execTime)} once it got a connection. A missing index would slow the query execution, but the data shows the bottleneck is connection wait time, not query time.`;
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
        return `✓ Exactly! The span attribute db.connection_pool.wait_ms=${waitMs} shows ${formatSpanMs(waitMs)} spent waiting for a connection — that's ${waitPercent} of the total ${formatSpanMs(totalMs)} latency. Look at the logs too: "pool_size=5, waiting=12" — 12 requests queued for only 5 connections. The fix: increase pool_size or reduce connection hold time.`;
      }
      
      return '✓ Exactly! The trace shows significant time spent waiting for a database connection, indicating the pool is exhausted. Check the logs for pool_size and waiting count confirmation.';
    },
    explainIncorrect: () => '',
  },
  
  // Option C: Cache is slow (distractor)
  {
    id: 'c',
    label: 'The external cache is slow — Redis is adding latency to every request',
    specificHint: '💡 Hint: Compare the duration of cache.invalidate to db.query in the trace. Which span is actually slow?',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const cacheSpan = findCacheSpan(data);
      const dbSpan = findDbQuerySpan(data);
      
      if (cacheSpan) {
        return `Not quite. The cache.invalidate span took only ${formatSpanMs(cacheSpan.durationMs)} — that's totally normal for a cache operation. Compare that to db.query at ${formatSpanMs(dbSpan?.durationMs || 0)}. The culprit is clearly the database operation, not the cache.`;
      }
      
      return 'Not quite. The cache operations in the trace complete very quickly. The slow operation is the database query, not the cache.';
    },
  },
  
  // Option D: CPU-bound (distractor)
  {
    id: 'd',
    label: 'The order-service is CPU-bound — too many concurrent requests overwhelming the process',
    specificHint: '💡 Hint: Look for spans showing wait time vs computation time. What does db.connection_pool.wait_ms tell you about where time is being spent?',
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
    specificHint: '💡 Hint: Look at which spans are in the trace. Are there any database spans, or is the error on an outbound HTTP call?',
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
    specificHint: '💡 Hint: Look at the error span\'s http.status_code attribute. Is this a timeout or a server-side response?',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const totalMs = data.totalDurationMs;
      return `No. The total trace duration is only ${formatSpanMs(totalMs)} — too fast for a GC issue. The error span shows http.status_code=500, which is an HTTP response from the payment service, not a timeout. GC pauses produce slow spans, not 500 errors.`;
    },
  },
  {
    id: 'd',
    label: 'Network routing issue — DNS resolution failing for the payment service',
    specificHint: '💡 Hint: A DNS failure would mean no HTTP response at all. Check the http.status_code attribute on the error span.',
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
    specificHint: '💡 Hint: Consider at what stage in the pipeline sampling vs. exporting happens. Would a wrong endpoint explain why only error traces are missing?',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: () => 'Not quite. A wrong endpoint causes export failures, but traces would still be sampled. The selective dropout of error spans points to tail_sampling, which runs before export.',
  },
  {
    id: 'c',
    label: 'Receivers not configured — no telemetry reaching the collector',
    specificHint: '💡 Hint: Some traces are getting through — just not the error ones. Would a receiver misconfiguration explain that selective pattern?',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: () => 'Not quite. Missing receivers would drop ALL traces, not just error traces. The selective gap — only errors missing — is the signature of tail_sampling filtering.',
  },
  {
    id: 'd',
    label: 'Batch processor buffer overflow — high-throughput traces queued and dropped',
    specificHint: '💡 Hint: Buffer overflow drops traces randomly under load. What kind of processor would selectively drop only error-status traces?',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: () => 'No. Buffer overflow drops traces uniformly under load. Here, only error spans are missing — that selective behavior is tail_sampling with a misconfigured error policy, not random buffer overflow.',
  },
];

/**
 * Broken Context (004-broken-context) case rules
 *
 * Scenario: Checkout service calls payment service without propagating trace context.
 * The payment.charge span is an orphan root span with trace.parent_id=null and
 * trace.orphaned=true, making the two-service request uncorelatable.
 */
const brokenContextRules: RootCauseRule[] = [
  {
    id: 'a',
    label: 'Payment service is timing out due to a slow external bank API',
    specificHint: '💡 Hint: Look at the payment.charge span duration — is it actually slow?',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const paymentSpan = data.spans.find(s => s.name === 'payment.charge');
      const dur = paymentSpan?.durationMs ?? 'unknown';
      return `Not quite. The payment.charge span completed in ${dur}ms — not a timeout. The problem is structural: trace.parent_id=${paymentSpan?.attributes?.['trace.parent_id'] ?? 'null'} shows the payment span is an orphan, disconnected from the checkout trace.`;
    },
  },
  {
    id: 'b',
    label: 'The checkout service is not propagating trace context to payment — orders appear as disconnected orphan traces, breaking correlation',
    specificHint: '',
    evaluate: (data: Phase2Data) => {
      const paymentSpan = data.spans.find(s => s.name === 'payment.charge');
      return paymentSpan?.attributes?.['trace.orphaned'] === 'true';
    },
    explainCorrect: (data: Phase2Data) => {
      const paymentSpan = data.spans.find(s => s.name === 'payment.charge');
      return `✓ Correct! The payment.charge span has trace.parent_id=${paymentSpan?.attributes?.['trace.parent_id']} and trace.orphaned=${paymentSpan?.attributes?.['trace.orphaned']} — it was created as a root span instead of a child of checkout.process. Fix: call inject(carrier) before the payment call and extract(carrier) inside charge_payment.`;
    },
    explainIncorrect: () => '',
  },
  {
    id: 'c',
    label: 'The auth service is rejecting tokens due to a clock skew issue',
    specificHint: '💡 Hint: Find the auth span — what is its status?',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const authSpan = data.spans.find(s => s.name?.includes('auth'));
      return authSpan
        ? `Not quite. There is no auth error in this trace. The checkout.process span shows checkout.step=payment — auth already succeeded.`
        : `Not quite. There is no auth span in this trace at all. The checkout.process attribute checkout.step=payment confirms auth was not the failing component.`;
    },
  },
  {
    id: 'd',
    label: 'The database is missing the order record before payment is attempted',
    specificHint: '💡 Hint: Does the trace show a db.query span, and what is its status?',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const checkoutSpan = data.spans.find(s => s.name === 'checkout.process');
      const step = checkoutSpan?.attributes?.['checkout.step'] ?? 'payment';
      return `Not quite. The checkout.process span shows checkout.step=${step}, meaning the order record was found and checkout reached the payment step. The failure is in context propagation, not data lookup.`;
    },
  },
];

/**
 * The Baggage (005-the-baggage) case rules
 *
 * Scenario: Premium user misrouted to free-tier rate limit because user.plan
 * baggage was not propagated from the API gateway to the rate-limiter service.
 * The rate_limiter.check span has baggage.user_plan=missing as the key diagnostic attribute.
 */
const theBaggageRules: RootCauseRule[] = [
  {
    id: 'a',
    label: 'The rate limiter service has a bug that ignores plan-based rules entirely',
    specificHint: '💡 Hint: Look at the rate_limiter.check span — did plan-based logic run? What does baggage.user_plan tell you?',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const rlSpan = data.spans.find(s => s.name === 'rate_limiter.check');
      const applied = rlSpan?.attributes?.['rate_limit.applied'] ?? 'free_tier';
      const baggageVal = rlSpan?.attributes?.['baggage.user_plan'] ?? 'missing';
      return `Not quite. The rate_limiter.check span shows rate_limit.applied=${applied} — the plan-based logic exists and ran. The problem is baggage.user_plan=${baggageVal}: the rate limiter received no tenant metadata and fell back to the most restrictive default. The bug isn't in the logic — it's in what information the logic received.`;
    },
  },
  {
    id: 'b',
    label: 'The API gateway is rate-limiting all users due to a global config error',
    specificHint: '💡 Hint: Does the trace show all users being affected, or only this premium user? Check the rate_limit.applied attribute.',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const rlSpan = data.spans.find(s => s.name === 'rate_limiter.check');
      const applied = rlSpan?.attributes?.['rate_limit.applied'] ?? 'free_tier';
      return `Not quite. The rate_limit.applied=${applied} attribute shows the rate limiter applied a tier-specific policy, not a global cap. A global config error would produce identical 429s for all users. Here, premium users are singled out — because their plan metadata was never propagated as baggage.`;
    },
  },
  {
    id: 'c',
    label: 'The user.plan baggage was dropped at the middleware boundary — the rate limiter received no tenant metadata and defaulted to the free-tier limit',
    evaluate: (data: Phase2Data) => {
      const rlSpan = data.spans.find(s => s.name === 'rate_limiter.check');
      return rlSpan?.attributes?.['baggage.user_plan'] === 'missing';
    },
    explainCorrect: (data: Phase2Data) => {
      const rlSpan = data.spans.find(s => s.name === 'rate_limiter.check');
      const authSpan = data.spans.find(s => s.name === 'auth.validate');
      const baggageVal = rlSpan?.attributes?.['baggage.user_plan'] ?? 'missing';
      const planDb = authSpan?.attributes?.['user.plan_db'] ?? 'premium';
      return `✓ Correct! The rate_limiter.check span has baggage.user_plan=${baggageVal} — the rate limiter received the request with no baggage context and defaulted to free_tier. The auth.validate span confirms user.plan_db=${planDb} in the database — the plan exists, it just wasn't propagated as baggage. Fix: call baggage.set_baggage("user.plan", plan) at the API gateway and extract it in the rate limiter service.`;
    },
    explainIncorrect: () => '',
  },
  {
    id: 'd',
    label: 'The database is returning stale user plan data from a cache miss',
    specificHint: '💡 Hint: Look at the auth.validate span — what did the database return? Did the database lookup even fail?',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const authSpan = data.spans.find(s => s.name === 'auth.validate');
      const planDb = authSpan?.attributes?.['user.plan_db'] ?? 'premium';
      const authResult = authSpan?.attributes?.['auth.result'] ?? 'valid';
      return `Not quite. The auth.validate span shows user.plan_db=${planDb} and auth.result=${authResult} — the database returned the correct plan and the lookup succeeded. The rate limiter never queried the database: it relied entirely on baggage that was never propagated. Stale cache data would produce a wrong plan value, not a missing one.`;
    },
  },
];

/**
 * Metrics Meet Traces (006-metrics-meet-traces) case rules
 *
 * Scenario: p99 latency spike (1500ms) caused by untraced protobuf serialization.
 * The checkout.handle span (220ms) is fast; the bottleneck is the adjacent
 * serialization.encode span (1310ms, serialization.payload_bytes=284621).
 */
const metricsTracesRules: RootCauseRule[] = [
  {
    id: 'a',
    label: 'The checkout handler has an N+1 database query problem — repeated queries for each order item',
    specificHint: '💡 Hint: Look at the checkout.handle span duration and its children. Are there any db.query child spans?',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const handlerSpan = data.spans.find(s => s.name === 'checkout.handle');
      const dur = handlerSpan?.durationMs ?? 220;
      return `Not quite. The checkout.handle span is only ${formatSpanMs(dur)} and has no child database spans. An N+1 query problem would produce multiple db.query spans adding up to large latency. Look at the other spans in the trace — especially any that run after the handler.`;
    },
  },
  {
    id: 'b',
    label: 'The API gateway is adding overhead from excessive middleware logging at request start',
    specificHint: '💡 Hint: Look at the api.request span offsetMs — how much time passes before checkout.handle starts?',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const checkoutSpan = data.spans.find(s => s.name === 'checkout.handle');
      const offset = checkoutSpan?.offsetMs ?? 25;
      return `Not quite. The gateway overhead is only ${formatSpanMs(offset)} before checkout.handle starts — negligible. The 1.3-second gap is not at the gateway. Check the serialization.encode span that runs adjacent to the handler.`;
    },
  },
  {
    id: 'c',
    label: 'A downstream payment service is timing out, adding retry delays before failing fast',
    specificHint: '💡 Hint: Does the trace contain a payment span? What is the checkout.handle span status?',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const handlerSpan = data.spans.find(s => s.name === 'checkout.handle');
      const status = handlerSpan?.status ?? 'ok';
      return `Not quite. There is no payment span in this trace. The checkout.handle span has status=${status} — the checkout succeeded. Retry delays from a timing-out service would show as failed or slow child spans.`;
    },
  },
  {
    id: 'd',
    label: 'A large protobuf serialization step runs after the handler span closes — it\'s untraced in metrics but visible in the serialization.encode span',
    evaluate: (data: Phase2Data) => {
      const serSpan = data.spans.find(s => s.name === 'serialization.encode');
      return serSpan?.attributes?.['serialization.duration_ms'] !== undefined;
    },
    explainCorrect: (data: Phase2Data) => {
      const serSpan = data.spans.find(s => s.name === 'serialization.encode');
      const durMs = serSpan?.attributes?.['serialization.duration_ms'] ?? '1310';
      const bytes = serSpan?.attributes?.['serialization.payload_bytes'] ?? '284621';
      const library = serSpan?.attributes?.['serialization.library'] ?? 'google.protobuf (unoptimized)';
      return `✓ Correct! The serialization.encode span ran for ${formatSpanMs(parseInt(durMs, 10))} encoding ${bytes} bytes of protobuf data (library: ${library}). This step is counted in the metrics p99 but sits outside the checkout.handle span — explaining the gap between the 220ms handler trace and the 1500ms metric. Fix: switch to a faster serialization library or compress the payload before encoding.`;
    },
    explainIncorrect: () => '',
  },
];

/**
 * Log Detective (007-log-detective) case rules
 *
 * Scenario: Billing charge fails for user usr_4821 after 3 retry attempts.
 * The billing.charge span has billing.attempt=3 and billing.result=insufficient_funds.
 * Correlated logs confirm the retry exhaustion with the same structured fields.
 */
const logDetectiveRules: RootCauseRule[] = [
  {
    id: 'a',
    label: 'The billing service is experiencing a database outage — no charge records are being written',
    specificHint: '💡 Hint: Look at the db.query span — what is its status and how many rows were affected?',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const dbSpan = data.spans.find(s => s.name === 'db.query');
      const status = dbSpan?.status ?? 'ok';
      const rows = dbSpan?.attributes?.['db.rows_affected'] ?? '1';
      return `Not quite. The db.query span has status=${status} and db.rows_affected=${rows} — the charge attempt record was written successfully. A database outage would show the db.query span failing. Look at the billing.charge span attributes for the actual diagnostic signal.`;
    },
  },
  {
    id: 'b',
    label: 'User usr_4821 has insufficient funds — the charge failed after 3 retry attempts, and the correlated log reveals billing.attempt=3',
    evaluate: (data: Phase2Data) => {
      const billingSpan = data.spans.find(s => s.name === 'billing.charge');
      return billingSpan?.attributes?.['billing.attempt'] === '3';
    },
    explainCorrect: (data: Phase2Data) => {
      const billingSpan = data.spans.find(s => s.name === 'billing.charge');
      const attempt = billingSpan?.attributes?.['billing.attempt'] ?? '3';
      const result = billingSpan?.attributes?.['billing.result'] ?? 'insufficient_funds';
      const userId = billingSpan?.attributes?.['user_id'] ?? 'usr_4821';
      return `✓ Correct! The billing.charge span has billing.attempt=${attempt} and billing.result=${result} — ${userId} exhausted all retry attempts. The correlated log confirms: "billing.charge failed for user_id=${userId}: ${result} (attempt 3/3) — giving up." Structured span attributes and structured log fields use the same names so you can pivot between them instantly for root cause analysis.`;
    },
    explainIncorrect: () => '',
  },
  {
    id: 'c',
    label: 'The payment gateway API returned a 503 — external service unavailable during the billing window',
    specificHint: '💡 Hint: Look at the payment.gateway span — what is its status and gateway.response_code?',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const gwSpan = data.spans.find(s => s.name === 'payment.gateway');
      const status = gwSpan?.status ?? 'ok';
      const code = gwSpan?.attributes?.['gateway.response_code'] ?? '200';
      const reason = gwSpan?.attributes?.['gateway.decline_reason'] ?? 'insufficient_funds';
      return `Not quite. The payment.gateway span shows status=${status} and gateway.response_code=${code} — the gateway was reachable and responded. It even provided a specific decline reason: gateway.decline_reason=${reason}. A 503 (service unavailable) would show status=error on the payment.gateway span.`;
    },
  },
  {
    id: 'd',
    label: 'A configuration error caused the billing service to charge in the wrong currency',
    specificHint: '💡 Hint: Check the billing.currency attribute on the billing.charge span. Is the currency the problem?',
    evaluate: () => false,
    explainCorrect: () => '',
    explainIncorrect: (data: Phase2Data) => {
      const billingSpan = data.spans.find(s => s.name === 'billing.charge');
      const currency = billingSpan?.attributes?.['billing.currency'] ?? 'USD';
      const result = billingSpan?.attributes?.['billing.result'] ?? 'insufficient_funds';
      return `Not quite. The billing.charge span shows billing.currency=${currency} — the currency is consistent and there is no currency conversion span in the trace. The billing.result=${result} attribute confirms the charge was declined for a funds reason, not a currency mismatch.`;
    },
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
  '004-broken-context': brokenContextRules,
  '005-the-baggage': theBaggageRules,
  '006-metrics-meet-traces': metricsTracesRules,
  '007-log-detective': logDetectiveRules,
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
 * Get a hint for an incorrect guess by delegating to the rule's own specificHint
 */
function getHintForGuess(rule: RootCauseRule): string | undefined {
  return rule.specificHint;
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
      hint: isCorrect ? undefined : getHintForGuess(rule),
    };
  } catch (error) {
    // Graceful degradation if evaluation fails
    // eslint-disable-next-line no-console
    console.error('Error evaluating guess:', error);
    return {
      correct: false,
      explanation: 'Unable to evaluate guess. Please try again.',
    };
  }
}
