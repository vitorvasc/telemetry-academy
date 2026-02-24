import type { Phase2Data } from '../types/phase2';

export const helloSpanPhase2: Phase2Data = {
  traceId: 'a1b2c3d4e5f6789012345678',
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
      traceId: 'a1b2c3d4e5f6789012345678',
      spanId: 'span-001',
      service: 'order-service',
    },
    {
      timestamp: '14:32:00.041',
      level: 'warn',
      message: 'DB connection pool exhausted, waiting for available connection (pool_size=5, waiting=12)',
      traceId: 'a1b2c3d4e5f6789012345678',
      spanId: 'span-002',
      service: 'order-service',
    },
    {
      timestamp: '14:32:04.791',
      level: 'error',
      message: 'Connection pool wait exceeded 4000ms threshold',
      traceId: 'a1b2c3d4e5f6789012345678',
      spanId: 'span-002',
      service: 'order-service',
    },
    {
      timestamp: '14:32:05.001',
      level: 'info',
      message: 'DB query executed successfully after wait (rows_affected=1)',
      traceId: 'a1b2c3d4e5f6789012345678',
      spanId: 'span-002',
      service: 'order-service',
    },
    {
      timestamp: '14:32:05.201',
      level: 'info',
      message: 'Cache invalidated for order:ord_9f3k2p',
      traceId: 'a1b2c3d4e5f6789012345678',
      spanId: 'span-003',
      service: 'order-service',
    },
    {
      timestamp: '14:32:05.241',
      level: 'info',
      message: 'Order ord_9f3k2p processed successfully in 5220ms',
      traceId: 'a1b2c3d4e5f6789012345678',
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
