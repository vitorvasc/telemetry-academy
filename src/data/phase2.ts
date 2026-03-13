import type { Phase2Data } from '../types/phase2';

/**
 * Registry mapping case IDs to their static Phase 2 investigation data.
 * Cases not present here will show "No Telemetry Data" in Phase 2.
 */
export const phase2Registry: Record<string, Phase2Data> = {};

function generateTraceId(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

// Populated at bottom of file after constants are defined
const helloSpanTraceId = generateTraceId();

export const helloSpanPhase2: Phase2Data = {
  traceId: helloSpanTraceId,
  totalDurationMs: 5240,
  narrative: `Orders are taking over 5 seconds to process. The on-call team is getting paged. 
Users are complaining. Time to investigate.

You have traces flowing now. Find the root cause.`,
  spans: [
    {
      id: 'span-001',
      name: 'process_order',
      service: 'order-service',
      durationMs: 5240,
      offsetMs: 0,
      status: 'ok',
      depth: 0,
      attributes: {
        'order_id': 'ord_9f3k2p',
        'http.method': 'POST',
        'http.route': '/orders',
        'http.status_code': '200',
      },
    },
    {
      id: 'span-002',
      name: 'db.query',
      service: 'order-service',
      durationMs: 4980,
      offsetMs: 20,
      status: 'warning',
      depth: 1,
      attributes: {
        'db.system': 'postgresql',
        'db.statement': 'UPDATE orders SET paid=true WHERE id=$1',
        'db.name': 'orders_db',
        'net.peer.name': 'db-primary.internal',
        'net.peer.port': '5432',
        'db.connection_pool.wait_ms': '4750',
      },
    },
    {
      id: 'span-003',
      name: 'cache.invalidate',
      service: 'order-service',
      durationMs: 12,
      offsetMs: 5200,
      status: 'ok',
      depth: 1,
      attributes: {
        'cache.system': 'redis',
        'cache.key': 'order:ord_9f3k2p',
        'net.peer.name': 'redis.internal',
      },
    },
  ],
  logs: [
    {
      timestamp: '14:32:00.021',
      level: 'info',
      message: 'Processing order ord_9f3k2p for user user_4821',
      traceId: helloSpanTraceId,
      spanId: 'span-001',
      service: 'order-service',
    },
    {
      timestamp: '14:32:00.041',
      level: 'warn',
      message: 'DB connection pool exhausted, waiting for available connection (pool_size=5, waiting=12)',
      traceId: helloSpanTraceId,
      spanId: 'span-002',
      service: 'order-service',
    },
    {
      timestamp: '14:32:04.791',
      level: 'error',
      message: 'Connection pool wait exceeded 4000ms threshold',
      traceId: helloSpanTraceId,
      spanId: 'span-002',
      service: 'order-service',
    },
    {
      timestamp: '14:32:05.001',
      level: 'info',
      message: 'DB query executed successfully after wait (rows_affected=1)',
      traceId: helloSpanTraceId,
      spanId: 'span-002',
      service: 'order-service',
    },
    {
      timestamp: '14:32:05.201',
      level: 'info',
      message: 'Cache invalidated for order:ord_9f3k2p',
      traceId: helloSpanTraceId,
      spanId: 'span-003',
      service: 'order-service',
    },
    {
      timestamp: '14:32:05.241',
      level: 'info',
      message: 'Order ord_9f3k2p processed successfully in 5220ms',
      traceId: helloSpanTraceId,
      spanId: 'span-001',
      service: 'order-service',
    },
  ],
  rootCauseOptions: [
    {
      id: 'a',
      label: 'Missing index on the orders table — the UPDATE query does a full table scan',
      correct: false,
      explanation: 'Not quite. The trace shows db.connection_pool.wait_ms=4750, meaning 4.75 seconds were spent waiting for a connection — not executing the query itself. A missing index would slow the query, but the query barely ran.',
    },
    {
      id: 'b',
      label: 'DB connection pool is too small — all 5 connections are in use, new requests queue up',
      correct: true,
      explanation: '✓ Exactly! The logs show "pool_size=5, waiting=12" — 12 requests are queued for only 5 connections. The span attribute db.connection_pool.wait_ms=4750 confirms 95% of the latency is waiting, not querying. Fix: increase pool_size or reduce connection hold time.',
    },
    {
      id: 'c',
      label: 'The external cache is slow — Redis is adding latency to every request',
      correct: false,
      explanation: 'Not quite. The cache.invalidate span took only 12ms — totally fine. The culprit is db.query at 4980ms, and most of that is connection pool wait time.',
    },
    {
      id: 'd',
      label: 'The order-service is CPU-bound — too many concurrent requests overwhelming the process',
      correct: false,
      explanation: 'No. If it were CPU-bound, you\'d see spans running (not waiting). The trace clearly shows time spent in db.connection_pool.wait_ms=4750, which is blocking I/O wait — not CPU.',
    },
  ],
};

// Populate registry after constants are defined
phase2Registry['001-hello-span'] = helloSpanPhase2;

// ============================================================================
// Case 004: Broken Context
// ============================================================================

const brokenContextTraceId = generateTraceId();

export const brokenContextPhase2: Phase2Data = {
  traceId: brokenContextTraceId,
  totalDurationMs: 4200,
  narrative: `Orders are failing and you're paged: "payment status unknown for order ord_8821."

You have traces from both checkout-service and payment-service — but they appear as two separate, disconnected traces in your observability tool. The checkout trace ends in error. The payment trace looks fine in isolation.

Find the structural root cause.`,
  spans: [
    {
      id: 'span-bc-001',
      name: 'api.request',
      service: 'api-gateway',
      durationMs: 4200,
      offsetMs: 0,
      status: 'error',
      depth: 0,
      attributes: {
        'http.method': 'POST',
        'http.route': '/checkout',
        'http.status_code': '500',
      },
    },
    {
      id: 'span-bc-002',
      name: 'checkout.process',
      service: 'checkout-service',
      durationMs: 4100,
      offsetMs: 50,
      status: 'error',
      depth: 1,
      attributes: {
        'order_id': 'ord_8821',
        'checkout.step': 'payment',
      },
    },
    {
      id: 'span-bc-003',
      name: 'payment.charge',
      service: 'payment-service',
      durationMs: 180,
      offsetMs: 0,
      status: 'ok',
      depth: 0,
      attributes: {
        'payment.amount': '129.99',
        'payment.status': 'charged',
        'trace.parent_id': 'null',
        'trace.orphaned': 'true',
        'trace.note': 'ORPHANED — created as root span, not child of checkout.process',
      },
    },
  ],
  logs: [
    {
      timestamp: '09:14:22.103',
      level: 'warn',
      message: 'Received request with no traceparent header — creating new root span (service=payment-service, order=ord_8821)',
      traceId: brokenContextTraceId,
      spanId: 'span-bc-003',
      service: 'payment-service',
    },
    {
      timestamp: '09:14:22.281',
      level: 'error',
      message: 'Payment correlation failed: order ord_8821 has no linked payment trace in checkout context',
      traceId: brokenContextTraceId,
      spanId: 'span-bc-002',
      service: 'checkout-service',
    },
    {
      timestamp: '09:14:26.153',
      level: 'error',
      message: 'Checkout failed for order_id=ord_8821: payment status unknown — trace context was not propagated',
      traceId: brokenContextTraceId,
      spanId: 'span-bc-001',
      service: 'api-gateway',
    },
  ],
  rootCauseOptions: [
    {
      id: 'a',
      label: 'Payment service is timing out due to a slow external bank API',
      correct: false,
      explanation: 'Not quite. The payment.charge span completed in 180ms — well within normal range, not a timeout. The structural problem is visible in the span attributes: trace.parent_id=null on the payment span confirms it was created as an orphan root span, disconnected from the checkout trace.',
    },
    {
      id: 'b',
      label: 'The checkout service is not propagating trace context to payment — orders appear as disconnected orphan traces, breaking correlation',
      correct: true,
      explanation: '✓ Correct! The payment.charge span has trace.parent_id=null and trace.orphaned=true — it was created as a new root span instead of a child of checkout.process. Fix: call inject(carrier) before the payment call and extract(carrier) inside charge_payment to restore the parent context.',
    },
    {
      id: 'c',
      label: 'The auth service is rejecting tokens due to a clock skew issue',
      correct: false,
      explanation: 'Not quite. There is no auth span in this trace. The checkout.process span attribute checkout.step=payment shows auth already succeeded — checkout reached the payment step before failing.',
    },
    {
      id: 'd',
      label: 'The database is missing the order record before payment is attempted',
      correct: false,
      explanation: 'Not quite. The checkout.process span shows checkout.step=payment, meaning the order record was found and checkout reached the payment step. The failure is in context propagation, not data lookup.',
    },
  ],
};

phase2Registry['004-broken-context'] = brokenContextPhase2;

// ============================================================================
// Case 005: The Baggage
// ============================================================================

const theBaggageTraceId = generateTraceId();

export const theBaggagePhase2: Phase2Data = {
  traceId: theBaggageTraceId,
  totalDurationMs: 1850,
  narrative: `Premium users are flooding your on-call queue with rate limit complaints — they're paying for 1000 rpm but getting capped at 60. Free users are unaffected.

You have traces. The rate limiter made a decision. Find out what it knew — and what it didn't.`,
  spans: [
    {
      id: 'span-tb-001',
      name: 'api.request',
      service: 'api-gateway',
      durationMs: 1850,
      offsetMs: 0,
      status: 'error',
      depth: 0,
      attributes: {
        'http.method': 'GET',
        'http.route': '/api/data',
        'user_id': 'usr_9921',
        'http.status_code': '429',
      },
    },
    {
      id: 'span-tb-002',
      name: 'rate_limiter.check',
      service: 'rate-limiter',
      durationMs: 12,
      offsetMs: 45,
      status: 'error',
      depth: 1,
      attributes: {
        'rate_limit.applied': 'free_tier',
        'rate_limit.threshold_rpm': '60',
        'rate_limit.decision': 'rejected',
        'baggage.user_plan': 'missing',
      },
    },
    {
      id: 'span-tb-003',
      name: 'auth.validate',
      service: 'auth-service',
      durationMs: 28,
      offsetMs: 58,
      status: 'ok',
      depth: 1,
      attributes: {
        'user.id': 'usr_9921',
        'user.plan_db': 'premium',
        'auth.result': 'valid',
      },
    },
  ],
  logs: [
    {
      timestamp: '11:47:03.045',
      level: 'error',
      message: 'Rate limit exceeded for user usr_9921: applied free_tier (60 rpm) — no plan baggage received, defaulting to free tier',
      traceId: theBaggageTraceId,
      spanId: 'span-tb-002',
      service: 'rate-limiter',
    },
    {
      timestamp: '11:47:03.071',
      level: 'warn',
      message: 'Request rejected with 429 — user usr_9921 has premium plan in DB but no baggage propagated',
      traceId: theBaggageTraceId,
      spanId: 'span-tb-001',
      service: 'api-gateway',
    },
    {
      timestamp: '11:47:03.086',
      level: 'info',
      message: 'Token valid for usr_9921, plan=premium (from auth DB, not baggage)',
      traceId: theBaggageTraceId,
      spanId: 'span-tb-003',
      service: 'auth-service',
    },
  ],
  rootCauseOptions: [
    {
      id: 'a',
      label: 'The rate limiter service has a bug that ignores plan-based rules entirely',
      correct: false,
      explanation: 'Not quite. The rate_limiter.check span shows rate_limit.applied=free_tier — the plan-based logic exists and ran. The problem is baggage.user_plan=missing: the rate limiter received no tenant metadata and fell back to the free-tier default.',
    },
    {
      id: 'b',
      label: 'The API gateway is rate-limiting all users due to a global config error',
      correct: false,
      explanation: 'Not quite. The trace shows rate_limit.applied=free_tier was applied to this premium user specifically. A global config error would throttle all users uniformly — not selectively target premium accounts.',
    },
    {
      id: 'c',
      label: 'The user.plan baggage was dropped at the middleware boundary — the rate limiter received no tenant metadata and defaulted to the free-tier limit',
      correct: true,
      explanation: '✓ Correct! The rate_limiter.check span has baggage.user_plan=missing — the rate limiter received the request with no baggage context. Without knowing the user\'s plan, it defaulted to free_tier at 60 rpm. The auth.validate span confirms user.plan_db=premium in the database — the plan exists, it just wasn\'t propagated as baggage.',
    },
    {
      id: 'd',
      label: 'The database is returning stale user plan data from a cache miss',
      correct: false,
      explanation: 'Not quite. The auth.validate span shows user.plan_db=premium and auth.result=valid — the database lookup succeeded and returned correct data. The rate limiter never queried the database at all: it relied on baggage that was never propagated, not on stale cached data.',
    },
  ],
};

phase2Registry['005-the-baggage'] = theBaggagePhase2;
