import type { Phase2Data } from '../types/phase2'

/**
 * Registry mapping case IDs to their static Phase 2 investigation data.
 * Cases not present here will show "No Telemetry Data" in Phase 2.
 */
export const phase2Registry: Record<string, Phase2Data> = {}

function generateTraceId(): string {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
}

// Populated at bottom of file after constants are defined
const helloSpanTraceId = generateTraceId()

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
        order_id: 'ord_9f3k2p',
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
      message:
        'DB connection pool exhausted, waiting for available connection (pool_size=5, waiting=12)',
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
      label:
        'Missing index on the orders table — the UPDATE query does a full table scan',
      correct: false,
      explanation:
        'Not quite. The trace shows db.connection_pool.wait_ms=4750, meaning 4.75 seconds were spent waiting for a connection — not executing the query itself. A missing index would slow the query, but the query barely ran.',
    },
    {
      id: 'b',
      label:
        'DB connection pool is too small — all 5 connections are in use, new requests queue up',
      correct: true,
      explanation:
        '✓ Exactly! The logs show "pool_size=5, waiting=12" — 12 requests are queued for only 5 connections. The span attribute db.connection_pool.wait_ms=4750 confirms 95% of the latency is waiting, not querying. Fix: increase pool_size or reduce connection hold time.',
    },
    {
      id: 'c',
      label:
        'The external cache is slow — Redis is adding latency to every request',
      correct: false,
      explanation:
        'Not quite. The cache.invalidate span took only 12ms — totally fine. The culprit is db.query at 4980ms, and most of that is connection pool wait time.',
    },
    {
      id: 'd',
      label:
        'The order-service is CPU-bound — too many concurrent requests overwhelming the process',
      correct: false,
      explanation:
        "No. If it were CPU-bound, you'd see spans running (not waiting). The trace clearly shows time spent in db.connection_pool.wait_ms=4750, which is blocking I/O wait — not CPU.",
    },
  ],
}

// Populate registry after constants are defined
phase2Registry['001-hello-span'] = helloSpanPhase2

// ============================================================================
// Case 004: Broken Context
// ============================================================================

const brokenContextTraceId = generateTraceId()

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
        order_id: 'ord_8821',
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
        'trace.note':
          'ORPHANED — created as root span, not child of checkout.process',
      },
    },
  ],
  logs: [
    {
      timestamp: '09:14:22.103',
      level: 'warn',
      message:
        'Received request with no traceparent header — creating new root span (service=payment-service, order=ord_8821)',
      traceId: brokenContextTraceId,
      spanId: 'span-bc-003',
      service: 'payment-service',
    },
    {
      timestamp: '09:14:22.281',
      level: 'error',
      message:
        'Payment correlation failed: order ord_8821 has no linked payment trace in checkout context',
      traceId: brokenContextTraceId,
      spanId: 'span-bc-002',
      service: 'checkout-service',
    },
    {
      timestamp: '09:14:26.153',
      level: 'error',
      message:
        'Checkout failed for order_id=ord_8821: payment status unknown — trace context was not propagated',
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
      explanation:
        'Not quite. The payment.charge span completed in 180ms — well within normal range, not a timeout. The structural problem is visible in the span attributes: trace.parent_id=null on the payment span confirms it was created as an orphan root span, disconnected from the checkout trace.',
    },
    {
      id: 'b',
      label:
        'The checkout service is not propagating trace context to payment — orders appear as disconnected orphan traces, breaking correlation',
      correct: true,
      explanation:
        '✓ Correct! The payment.charge span has trace.parent_id=null and trace.orphaned=true — it was created as a new root span instead of a child of checkout.process. Fix: call inject(carrier) before the payment call and extract(carrier) inside charge_payment to restore the parent context.',
    },
    {
      id: 'c',
      label: 'The auth service is rejecting tokens due to a clock skew issue',
      correct: false,
      explanation:
        'Not quite. There is no auth span in this trace. The checkout.process span attribute checkout.step=payment shows auth already succeeded — checkout reached the payment step before failing.',
    },
    {
      id: 'd',
      label:
        'The database is missing the order record before payment is attempted',
      correct: false,
      explanation:
        'Not quite. The checkout.process span shows checkout.step=payment, meaning the order record was found and checkout reached the payment step. The failure is in context propagation, not data lookup.',
    },
  ],
}

phase2Registry['004-broken-context'] = brokenContextPhase2

// ============================================================================
// Case 005: The Baggage
// ============================================================================

const theBaggageTraceId = generateTraceId()

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
        user_id: 'usr_9921',
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
      message:
        'Rate limit exceeded for user usr_9921: applied free_tier (60 rpm) — no plan baggage received, defaulting to free tier',
      traceId: theBaggageTraceId,
      spanId: 'span-tb-002',
      service: 'rate-limiter',
    },
    {
      timestamp: '11:47:03.071',
      level: 'warn',
      message:
        'Request rejected with 429 — user usr_9921 has premium plan in DB but no baggage propagated',
      traceId: theBaggageTraceId,
      spanId: 'span-tb-001',
      service: 'api-gateway',
    },
    {
      timestamp: '11:47:03.086',
      level: 'info',
      message:
        'Token valid for usr_9921, plan=premium (from auth DB, not baggage)',
      traceId: theBaggageTraceId,
      spanId: 'span-tb-003',
      service: 'auth-service',
    },
  ],
  rootCauseOptions: [
    {
      id: 'a',
      label:
        'The rate limiter service has a bug that ignores plan-based rules entirely',
      correct: false,
      explanation:
        'Not quite. The rate_limiter.check span shows rate_limit.applied=free_tier — the plan-based logic exists and ran. The problem is baggage.user_plan=missing: the rate limiter received no tenant metadata and fell back to the free-tier default.',
    },
    {
      id: 'b',
      label:
        'The API gateway is rate-limiting all users due to a global config error',
      correct: false,
      explanation:
        'Not quite. The trace shows rate_limit.applied=free_tier was applied to this premium user specifically. A global config error would throttle all users uniformly — not selectively target premium accounts.',
    },
    {
      id: 'c',
      label:
        'The user.plan baggage was dropped at the middleware boundary — the rate limiter received no tenant metadata and defaulted to the free-tier limit',
      correct: true,
      explanation:
        "✓ Correct! The rate_limiter.check span has baggage.user_plan=missing — the rate limiter received the request with no baggage context. Without knowing the user's plan, it defaulted to free_tier at 60 rpm. The auth.validate span confirms user.plan_db=premium in the database — the plan exists, it just wasn't propagated as baggage.",
    },
    {
      id: 'd',
      label: 'The database is returning stale user plan data from a cache miss',
      correct: false,
      explanation:
        'Not quite. The auth.validate span shows user.plan_db=premium and auth.result=valid — the database lookup succeeded and returned correct data. The rate limiter never queried the database at all: it relied on baggage that was never propagated, not on stale cached data.',
    },
  ],
}

phase2Registry['005-the-baggage'] = theBaggagePhase2

// ============================================================================
// Case 006: Metrics Meet Traces
// ============================================================================

const metricsTracesTraceId = generateTraceId()

export const metricsTracesPhase2: Phase2Data = {
  traceId: metricsTracesTraceId,
  totalDurationMs: 1580,
  narrative: `Your p99 latency metric says 1500ms — but the checkout handler traces show only 220ms. Engineers are confused: where is the missing 1.3 seconds?

You have traces from the full request path. Look at ALL the spans, not just the handler.`,
  spans: [
    {
      id: 'span-mt-001',
      name: 'api.request',
      service: 'api-gateway',
      durationMs: 1580,
      offsetMs: 0,
      status: 'ok',
      depth: 0,
      attributes: {
        'http.method': 'POST',
        'http.route': '/checkout',
        'http.status_code': '200',
      },
    },
    {
      id: 'span-mt-002',
      name: 'checkout.handle',
      service: 'checkout-service',
      durationMs: 220,
      offsetMs: 25,
      status: 'ok',
      depth: 1,
      attributes: {
        order_id: 'ord_5521',
        'handler.duration_ms': '220',
      },
    },
    {
      id: 'span-mt-003',
      name: 'serialization.encode',
      service: 'checkout-service',
      durationMs: 1310,
      offsetMs: 245,
      status: 'ok',
      depth: 1,
      attributes: {
        'serialization.format': 'protobuf',
        'serialization.duration_ms': '1310',
        'serialization.payload_bytes': '284621',
        'serialization.library': 'google.protobuf (unoptimized)',
      },
    },
  ],
  logs: [
    {
      timestamp: '10:22:01.045',
      level: 'warn',
      message:
        'p99 latency=1482ms vs handler p99=218ms — gap of 1264ms unaccounted for',
      traceId: metricsTracesTraceId,
      spanId: 'span-mt-002',
      service: 'checkout-service',
    },
    {
      timestamp: '10:22:01.556',
      level: 'info',
      message:
        'Serialization complete: payload=284621 bytes, duration=1310ms (protobuf unoptimized)',
      traceId: metricsTracesTraceId,
      spanId: 'span-mt-003',
      service: 'checkout-service',
    },
    {
      timestamp: '10:22:01.625',
      level: 'warn',
      message: 'Slow request detected: checkout /checkout 1580ms (SLA=500ms)',
      traceId: metricsTracesTraceId,
      spanId: 'span-mt-001',
      service: 'api-gateway',
    },
  ],
  rootCauseOptions: [
    {
      id: 'a',
      label:
        'The checkout handler has an N+1 database query problem — repeated queries for each order item',
      correct: false,
      explanation:
        'Not quite. The checkout.handle span is only 220ms and has no child database spans. An N+1 query problem would produce multiple db.query spans. The handler is fast — look at what else runs in the same request.',
    },
    {
      id: 'b',
      label:
        'The API gateway is adding overhead from excessive middleware logging at request start',
      correct: false,
      explanation:
        'Not quite. The api.request span shows only 25ms before checkout.handle starts (offsetMs=25). That 25ms is gateway overhead — negligible. The real latency is in the serialization.encode span.',
    },
    {
      id: 'c',
      label:
        'A downstream payment service is timing out, adding retry delays before failing fast',
      correct: false,
      explanation:
        'Not quite. There is no payment span in this trace. The checkout.handle span completes with status=ok — the checkout succeeded. Retry delays would appear as failed or slow child spans.',
    },
    {
      id: 'd',
      label:
        "A large protobuf serialization step runs after the handler span closes — it's untraced in metrics but visible in the serialization.encode span",
      correct: true,
      explanation:
        '✓ Correct! The serialization.encode span ran for 1310ms with serialization.payload_bytes=284621 (278KB of protobuf data). This step is counted in the metrics p99 but outside the handler trace. Fix: optimize the serialization library or reduce payload size.',
    },
  ],
}

phase2Registry['006-metrics-meet-traces'] = metricsTracesPhase2

// ============================================================================
// Case 007: Log Detective
// ============================================================================

const logDetectiveTraceId = generateTraceId()

export const logDetectivePhase2: Phase2Data = {
  traceId: logDetectiveTraceId,
  totalDurationMs: 2100,
  narrative: `A billing alert fired: user_id=usr_4821 — charge failed. The API returned 402.

You have traces and correlated log lines. The structured fields on the billing.charge span are your primary evidence — find the root cause.`,
  spans: [
    {
      id: 'span-ld-001',
      name: 'api.request',
      service: 'api-gateway',
      durationMs: 2100,
      offsetMs: 0,
      status: 'error',
      depth: 0,
      attributes: {
        'http.method': 'POST',
        'http.route': '/billing/charge',
        'http.status_code': '402',
      },
    },
    {
      id: 'span-ld-002',
      name: 'billing.charge',
      service: 'billing-service',
      durationMs: 2050,
      offsetMs: 28,
      status: 'error',
      depth: 1,
      attributes: {
        user_id: 'usr_4821',
        'billing.amount': '99.00',
        'billing.currency': 'USD',
        'billing.attempt': '3',
        'billing.result': 'insufficient_funds',
      },
    },
    {
      id: 'span-ld-003',
      name: 'payment.gateway',
      service: 'payment-service',
      durationMs: 180,
      offsetMs: 35,
      status: 'ok',
      depth: 2,
      attributes: {
        'gateway.response_code': '200',
        'gateway.decline_reason': 'insufficient_funds',
        'gateway.provider': 'stripe',
      },
    },
    {
      id: 'span-ld-004',
      name: 'db.query',
      service: 'billing-service',
      durationMs: 8,
      offsetMs: 220,
      status: 'ok',
      depth: 2,
      attributes: {
        'db.operation': 'INSERT',
        'db.table': 'billing_attempts',
        'db.rows_affected': '1',
      },
    },
  ],
  logs: [
    {
      timestamp: '08:41:03.031',
      level: 'warn',
      message:
        'Retrying charge for user_id=usr_4821: insufficient_funds (attempt 1/3) — waiting 500ms',
      traceId: logDetectiveTraceId,
      spanId: 'span-ld-002',
      service: 'billing-service',
    },
    {
      timestamp: '08:41:03.561',
      level: 'warn',
      message:
        'Retrying charge for user_id=usr_4821: insufficient_funds (attempt 2/3) — waiting 500ms',
      traceId: logDetectiveTraceId,
      spanId: 'span-ld-002',
      service: 'billing-service',
    },
    {
      timestamp: '08:41:04.091',
      level: 'error',
      message:
        'billing.charge failed for user_id=usr_4821: insufficient_funds (attempt 3/3) — giving up',
      traceId: logDetectiveTraceId,
      spanId: 'span-ld-002',
      service: 'billing-service',
    },
    {
      timestamp: '08:41:04.095',
      level: 'warn',
      message:
        'Gateway decline: user_id=usr_4821, reason=insufficient_funds, gateway=stripe',
      traceId: logDetectiveTraceId,
      spanId: 'span-ld-003',
      service: 'payment-service',
    },
  ],
  rootCauseOptions: [
    {
      id: 'a',
      label:
        'The billing service is experiencing a database outage — no charge records are being written',
      correct: false,
      explanation:
        'Not quite. The db.query span completed with status=ok and db.rows_affected=1 — the charge attempt record was written successfully. A database outage would show the db.query span failing. The error is in the charge logic itself, not the database.',
    },
    {
      id: 'b',
      label:
        'User usr_4821 has insufficient funds — the charge failed after 3 retry attempts, and the correlated log reveals billing.attempt=3',
      correct: true,
      explanation:
        '✓ Correct! The billing.charge span has billing.attempt=3 and billing.result=insufficient_funds — confirming 3 failed retries for user usr_4821. The correlated log entry shows the same structured fields. This is exactly why structured span attributes and structured logs use the same field names: instant correlation, instant root cause.',
    },
    {
      id: 'c',
      label:
        'The payment gateway API returned a 503 — external service unavailable during the billing window',
      correct: false,
      explanation:
        'Not quite. The payment.gateway span shows status=ok and gateway.response_code=200. The gateway was available and responded successfully — it returned gateway.decline_reason=insufficient_funds. A 503 would show status=error on the payment.gateway span.',
    },
    {
      id: 'd',
      label:
        'A configuration error caused the billing service to charge in the wrong currency',
      correct: false,
      explanation:
        'Not quite. The billing.charge span shows billing.currency=USD consistently, and no currency conversion span exists in the trace. The decline reason is insufficient_funds — not a currency mismatch. The charge was attempted in the correct currency.',
    },
  ],
}

phase2Registry['007-log-detective'] = logDetectivePhase2

// ============================================================================
// Case 008: Sampling Sleuth
// ============================================================================

const samplingSleuthTraceId = generateTraceId()

export const samplingSleuthPhase2: Phase2Data = {
  traceId: samplingSleuthTraceId,
  totalDurationMs: 890,
  narrative: `An error spike went undetected for 2 hours. No alerts fired.

Users reported 500s on /checkout — but your monitoring showed near-zero error rates.
One of the 1% of traces that made it through is sitting right here. Find out why the rest were invisible.`,
  spans: [
    {
      id: 'span-ss-001',
      name: 'api.request',
      service: 'api-gateway',
      durationMs: 890,
      offsetMs: 0,
      status: 'error',
      depth: 0,
      attributes: {
        'http.method': 'POST',
        'http.route': '/checkout',
        'http.status_code': '500',
        'sampling.rate': '0.01',
        'sampling.decision': 'sampled',
      },
    },
    {
      id: 'span-ss-002',
      name: 'checkout.handle',
      service: 'checkout-service',
      durationMs: 850,
      offsetMs: 20,
      status: 'error',
      depth: 1,
      attributes: {
        'error.type': 'NullPointerException',
        'error.source': 'inventory.check',
        sampled_error_traces_count: '42',
        estimated_total_error_traces: '4200',
      },
    },
    {
      id: 'span-ss-003',
      name: 'collector.pipeline',
      service: 'otel-collector',
      durationMs: 5,
      offsetMs: 875,
      status: 'ok',
      depth: 1,
      attributes: {
        'collector.sampler': 'TraceIdRatioBased(0.01)',
        'collector.dropped_traces_last_hour': '415800',
        'collector.sampled_traces_last_hour': '4200',
      },
    },
  ],
  logs: [
    {
      timestamp: '10:15:22.001',
      level: 'warn',
      message:
        'High drop rate: 415800 traces dropped in last hour (sampling.rate=0.01) — consider increasing ratio',
      traceId: samplingSleuthTraceId,
      spanId: 'span-ss-003',
      service: 'otel-collector',
    },
    {
      timestamp: '10:15:22.019',
      level: 'error',
      message:
        'NullPointerException in inventory.check — trace sampled but 99% of identical errors were dropped',
      traceId: samplingSleuthTraceId,
      spanId: 'span-ss-002',
      service: 'checkout-service',
    },
    {
      timestamp: '10:15:22.051',
      level: 'warn',
      message:
        'Error rate appears low (0.01%) in monitoring — actual estimated rate: 1% (99% traces dropped by sampler)',
      traceId: samplingSleuthTraceId,
      spanId: 'span-ss-001',
      service: 'api-gateway',
    },
  ],
  rootCauseOptions: [
    {
      id: 'a',
      label:
        'The TracerProvider was configured with TraceIdRatioBased(0.01) — 99% of error traces were dropped, making the error rate invisible to alerting',
      correct: true,
      explanation:
        '✓ Correct! The api.request span shows sampling.rate=0.01 — only 1% of traces reached the backend. The checkout.handle span has sampled_error_traces_count=42 and estimated_total_error_traces=4200, meaning ~4,158 error traces were silently dropped. The collector log confirms 415,800 traces dropped in the last hour. At 1% sampling, a real error rate appears 100x smaller — far below any alert threshold.',
    },
    {
      id: 'b',
      label:
        "The error spike was a false positive — the monitoring system's alert threshold was incorrectly set to 50% instead of 5%",
      correct: false,
      explanation:
        'Not quite. The alert threshold is not the problem. The collector.pipeline span shows collector.dropped_traces_last_hour=415800 — error traces never reached the backend to be counted. Even with a 0.01% alert threshold, it would never fire because 99% of error evidence was dropped by the sampler before the backend could count it.',
    },
    {
      id: 'c',
      label:
        "The application deployed a bug that causes errors only on specific user IDs — the small affected population didn't trigger volume-based alerts",
      correct: false,
      explanation:
        'Not quite. The error.type is NullPointerException in inventory.check — a code path executed for all checkout requests, not specific users. The checkout.handle span has no user_id scoping. The critical clue is sampling.rate=0.01 on the api.request span: the low apparent error count is a sampling artifact, not a small affected population.',
    },
    {
      id: 'd',
      label:
        'The load balancer is silently dropping requests, causing errors that never reach the application layer',
      correct: false,
      explanation:
        'Not quite. The api.request span is present in the trace with status=error — errors DO reach the application layer. The load balancer is functioning. The issue is that 99% of these error spans are dropped by the OTel sampler (sampling.rate=0.01) before reaching the observability backend, not by the load balancer.',
    },
  ],
}

phase2Registry['008-sampling-sleuth'] = samplingSleuthPhase2

// ============================================================================
// Case 009: The Perfect Storm
// ============================================================================

const perfectStormTraceId = generateTraceId()

export const perfectStormPhase2: Phase2Data = {
  traceId: perfectStormTraceId,
  totalDurationMs: 8400,
  narrative: `Checkout is failing for all users. Every order attempt returns an error.

Three services are involved: auth, inventory, and payment. The cascade started 4 minutes ago and is getting worse. One complete trace made it through — find the root cause before retries take down auth entirely.`,
  spans: [
    {
      id: 'span-ps-001',
      name: 'checkout.process',
      service: 'checkout-orchestrator',
      durationMs: 8400,
      offsetMs: 0,
      status: 'error',
      depth: 0,
      attributes: {
        'user.tier': 'premium',
        order_id: 'ord_7732',
        'checkout.result': 'failed',
      },
    },
    {
      id: 'span-ps-002',
      name: 'auth.validate',
      service: 'auth-service',
      durationMs: 3250,
      offsetMs: 45,
      status: 'ok',
      depth: 1,
      attributes: {
        'user.id': 'usr_5521',
        'auth.result': 'valid',
        'auth.connection_pool.wait_ms': '3200',
        'auth.pool_size': '10',
        'auth.pool_waiting': '47',
      },
    },
    {
      id: 'span-ps-003',
      name: 'inventory.check',
      service: 'inventory-service',
      durationMs: 12,
      offsetMs: 3300,
      status: 'ok',
      depth: 1,
      attributes: {
        'item.id': 'item_882',
        'inventory.cache_hit': 'false',
        'inventory.cached_stock': '0',
        'inventory.actual_stock': '142',
        'inventory.cache_age_ms': '86400000',
      },
    },
    {
      id: 'span-ps-004',
      name: 'payment.charge',
      service: 'payment-service',
      durationMs: 45,
      offsetMs: 3315,
      status: 'error',
      depth: 1,
      attributes: {
        'payment.amount': '249.99',
        'payment.rejection_reason': 'out_of_stock',
        'payment.order_id': 'ord_7732',
        'payment.validated_stock': '0',
      },
    },
  ],
  logs: [
    {
      timestamp: '14:08:12.031',
      level: 'error',
      message:
        'Order ord_7732 rejected: item_882 stock=0 (from inventory cache) — payment declined',
      traceId: perfectStormTraceId,
      spanId: 'span-ps-004',
      service: 'payment-service',
    },
    {
      timestamp: '14:08:12.019',
      level: 'warn',
      message:
        'Cache miss → serving stale data: item_882 cached_stock=0, cache_age=86400000ms (1 day stale)',
      traceId: perfectStormTraceId,
      spanId: 'span-ps-003',
      service: 'inventory-service',
    },
    {
      timestamp: '14:08:11.049',
      level: 'warn',
      message:
        'Connection pool pressure: waiting=47, pool_size=10 — checkout retry storm in progress',
      traceId: perfectStormTraceId,
      spanId: 'span-ps-002',
      service: 'auth-service',
    },
    {
      timestamp: '14:08:12.041',
      level: 'error',
      message:
        'Checkout failed for usr_5521: payment rejection (out_of_stock) — retry 3/3',
      traceId: perfectStormTraceId,
      spanId: 'span-ps-001',
      service: 'checkout-orchestrator',
    },
  ],
  rootCauseOptions: [
    {
      id: 'a',
      label:
        'Payment service is rejecting orders due to a bank API timeout — all checkout attempts are timing out at the payment layer',
      correct: false,
      explanation:
        'Not quite. The payment.charge span shows payment.rejection_reason=out_of_stock — payment rejected the order because inventory reported zero stock, not because of a bank timeout. The payment span completed in 45ms. The issue is upstream in the inventory data.',
    },
    {
      id: 'b',
      label:
        "Inventory service cache is returning stale out-of-stock data — this causes payment to reject valid orders, triggering retry storms that saturate auth's connection pool",
      correct: true,
      explanation:
        '✓ Correct! The inventory.check span shows inventory.cache_hit=false, inventory.cached_stock=0, and inventory.actual_stock=142 — the cache is 86,400,000ms (1 day) stale. Payment sees stock=0 and rejects the order (payment.rejection_reason=out_of_stock). Each rejection triggers checkout retries, flooding auth. The auth.connection_pool.wait_ms=3200 with auth.pool_waiting=47 confirms 47 requests queued for 10 connections — a retry storm. Cascade: stale cache → payment rejection → retry flood → auth saturation.',
    },
    {
      id: 'c',
      label:
        'Auth service has a memory leak causing slow token validation — the cascade starts at auth and propagates to inventory and payment',
      correct: false,
      explanation:
        'Not quite. auth.connection_pool.wait_ms=3200 is a symptom of the retry storm, not the trigger. Auth token validation succeeded (auth.result=valid). The 47 queued connections (auth.pool_waiting=47) are retried checkout requests caused by payment rejections — which were caused by stale inventory cache data. The cascade starts at inventory, not auth.',
    },
    {
      id: 'd',
      label:
        'A deployment of payment-service introduced a bug that double-validates order quantities — the inventory service is being queried twice per checkout',
      correct: false,
      explanation:
        'Not quite. The trace shows a single inventory.check span at depth=1 — inventory is called exactly once per checkout. The payment rejection is from payment.rejection_reason=out_of_stock where the stock value came from a stale cache (inventory.cached_stock=0, inventory.actual_stock=142). Double-validation would produce two inventory.check spans.',
    },
  ],
}

phase2Registry['009-the-perfect-storm'] = perfectStormPhase2
