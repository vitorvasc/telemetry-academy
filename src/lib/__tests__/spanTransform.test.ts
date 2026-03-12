import { describe, it, expect } from 'vitest';
import {
  deriveStatus,
  calculateDepth,
  normalizeAttributes,
  transformSpans,
  getTraceId,
  getTotalDurationMs,
} from '../spanTransform';

// ============================================================================
// Helpers
// ============================================================================

const MS_TO_NS = 1_000_000;

interface SpanInit {
  name?: string;
  spanId?: string;
  traceId?: string;
  parentId?: string;
  startMs?: number;
  durationMs?: number;
  attributes?: Record<string, unknown>;
  statusCode?: string;
}

function makeRawSpan({
  name = 'test-span',
  spanId = 'span-abc',
  traceId = 'trace-xyz',
  parentId,
  startMs = 1000,
  durationMs = 50,
  attributes = {},
  statusCode,
}: SpanInit = {}) {
  const startNs = startMs * MS_TO_NS;
  const endNs = (startMs + durationMs) * MS_TO_NS;
  return {
    name,
    context: { span_id: spanId, trace_id: traceId },
    parent_id: parentId,
    start_time: startNs,
    end_time: endNs,
    attributes,
    status: statusCode ? { status_code: statusCode } : undefined,
  };
}

// ============================================================================
// deriveStatus
// ============================================================================

describe('deriveStatus', () => {
  it('returns "error" when status_code is ERROR', () => {
    const span = makeRawSpan({ statusCode: 'ERROR', durationMs: 10 });
    expect(deriveStatus(span)).toBe('error');
  });

  it('error takes precedence over slow duration', () => {
    const span = makeRawSpan({ statusCode: 'ERROR', durationMs: 500 });
    expect(deriveStatus(span)).toBe('error');
  });

  it('returns "warning" when duration exceeds 100ms', () => {
    const span = makeRawSpan({ durationMs: 101 });
    expect(deriveStatus(span)).toBe('warning');
  });

  it('returns "warning" at exactly 101ms (above threshold)', () => {
    const span = makeRawSpan({ durationMs: 101 });
    expect(deriveStatus(span)).toBe('warning');
  });

  it('returns "ok" when duration is exactly 100ms (at threshold)', () => {
    const span = makeRawSpan({ durationMs: 100 });
    expect(deriveStatus(span)).toBe('ok');
  });

  it('returns "ok" for fast spans with no error status', () => {
    const span = makeRawSpan({ durationMs: 10 });
    expect(deriveStatus(span)).toBe('ok');
  });

  it('returns "ok" for spans with OK status', () => {
    const span = makeRawSpan({ statusCode: 'OK', durationMs: 10 });
    expect(deriveStatus(span)).toBe('ok');
  });

  it('returns "ok" for spans with no status at all', () => {
    const span = makeRawSpan({ durationMs: 10 }); // no status
    expect(deriveStatus(span)).toBe('ok');
  });
});

// ============================================================================
// calculateDepth
// ============================================================================

describe('calculateDepth', () => {
  it('returns 0 for root span (no parent_id)', () => {
    const span = makeRawSpan({ spanId: 'root', parentId: undefined });
    const spanMap = new Map([[span.context.span_id, span]]);
    expect(calculateDepth(span, spanMap)).toBe(0);
  });

  it('returns 1 for a direct child of root', () => {
    const root = makeRawSpan({ spanId: 'root', parentId: undefined });
    const child = makeRawSpan({ spanId: 'child', parentId: 'root' });
    const spanMap = new Map([
      [root.context.span_id, root],
      [child.context.span_id, child],
    ]);
    expect(calculateDepth(child, spanMap)).toBe(1);
  });

  it('returns 2 for a grandchild', () => {
    const root = makeRawSpan({ spanId: 'root', parentId: undefined });
    const child = makeRawSpan({ spanId: 'child', parentId: 'root' });
    const grandchild = makeRawSpan({ spanId: 'grandchild', parentId: 'child' });
    const spanMap = new Map([
      [root.context.span_id, root],
      [child.context.span_id, child],
      [grandchild.context.span_id, grandchild],
    ]);
    expect(calculateDepth(grandchild, spanMap)).toBe(2);
  });

  it('returns 0 when parent_id references a span not in the map', () => {
    const orphan = makeRawSpan({ spanId: 'orphan', parentId: 'missing-parent' });
    const spanMap = new Map([[orphan.context.span_id, orphan]]);
    expect(calculateDepth(orphan, spanMap)).toBe(0);
  });

  it('detects direct cycle: span is its own parent', () => {
    const cycleSpan = makeRawSpan({ spanId: 'cycle', parentId: 'cycle' });
    const spanMap = new Map([[cycleSpan.context.span_id, cycleSpan]]);
    // Cycle detected: visited.has('cycle') triggers, returns 0
    const depth = calculateDepth(cycleSpan, spanMap);
    expect(depth).toBeGreaterThanOrEqual(0);
    expect(depth).toBeLessThanOrEqual(10); // must not throw or recurse infinitely
  });

  it('detects indirect cycle (A→B→A)', () => {
    const spanA = makeRawSpan({ spanId: 'A', parentId: 'B' });
    const spanB = makeRawSpan({ spanId: 'B', parentId: 'A' });
    const spanMap = new Map([
      ['A', spanA],
      ['B', spanB],
    ]);
    // Should not throw and must return a bounded value
    const depthA = calculateDepth(spanA, spanMap);
    expect(depthA).toBeGreaterThanOrEqual(0);
    expect(depthA).toBeLessThanOrEqual(10);
  });

  it('caps depth at MAX_DEPTH (10) for very deep trees', () => {
    // Build a chain of 15 spans
    const spans = Array.from({ length: 15 }, (_, i) => makeRawSpan({
      spanId: `span-${i}`,
      parentId: i === 0 ? undefined : `span-${i - 1}`,
    }));
    const spanMap = new Map(spans.map(s => [s.context.span_id, s]));
    const deepest = spans[14];
    const depth = calculateDepth(deepest, spanMap);
    expect(depth).toBe(10); // capped at MAX_DEPTH
  });
});

// ============================================================================
// normalizeAttributes
// ============================================================================

describe('normalizeAttributes', () => {
  it('converts string values as-is', () => {
    const result = normalizeAttributes({ key: 'value' });
    expect(result.key).toBe('value');
  });

  it('converts numeric values to strings', () => {
    const result = normalizeAttributes({ count: 42 });
    expect(result.count).toBe('42');
  });

  it('converts boolean values to strings', () => {
    const result = normalizeAttributes({ flag: true });
    expect(result.flag).toBe('true');
  });

  it('converts array values to comma-joined strings', () => {
    const result = normalizeAttributes({ tags: ['a', 'b', 'c'] });
    expect(result.tags).toBe('a, b, c');
  });

  it('converts null to empty string', () => {
    const result = normalizeAttributes({ nothing: null });
    expect(result.nothing).toBe('');
  });

  it('converts undefined to empty string', () => {
    const result = normalizeAttributes({ missing: undefined });
    expect(result.missing).toBe('');
  });

  it('converts objects to JSON strings', () => {
    const result = normalizeAttributes({ meta: { x: 1 } });
    expect(result.meta).toBe('{"x":1}');
  });

  it('returns empty object for empty attributes', () => {
    expect(normalizeAttributes({})).toEqual({});
  });
});

// ============================================================================
// transformSpans
// ============================================================================

describe('transformSpans', () => {
  it('throws when given an empty array', () => {
    expect(() => transformSpans([])).toThrow('Cannot transform empty spans array');
  });

  it('transforms a single root span correctly', () => {
    const raw = makeRawSpan({
      name: 'process_order',
      spanId: 'span-001',
      traceId: 'trace-abc',
      startMs: 1000,
      durationMs: 200,
      attributes: { 'service.name': 'order-service', order_id: 'ord_001' },
    });
    const [result] = transformSpans([raw]);
    expect(result.id).toBe('span-001');
    expect(result.name).toBe('process_order');
    expect(result.service).toBe('order-service');
    expect(result.durationMs).toBe(200);
    expect(result.offsetMs).toBe(0); // first span has offset 0
    expect(result.status).toBe('warning'); // 200ms > 100ms threshold
    expect(result.depth).toBe(0);
    expect(result.attributes['order_id']).toBe('ord_001');
  });

  it('assigns correct offsets relative to earliest span', () => {
    const root = makeRawSpan({ spanId: 'root', startMs: 1000, durationMs: 500 });
    const child = makeRawSpan({ spanId: 'child', parentId: 'root', startMs: 1100, durationMs: 100 });
    const results = transformSpans([root, child]);
    expect(results[0].offsetMs).toBe(0);    // root is the earliest
    expect(results[1].offsetMs).toBe(100);  // child starts 100ms after root
  });

  it('assigns correct depth to child spans', () => {
    const root = makeRawSpan({ spanId: 'root', startMs: 1000, durationMs: 500 });
    const child = makeRawSpan({ spanId: 'child', parentId: 'root', startMs: 1100, durationMs: 100 });
    const results = transformSpans([root, child]);
    const rootResult = results.find(s => s.id === 'root')!;
    const childResult = results.find(s => s.id === 'child')!;
    expect(rootResult.depth).toBe(0);
    expect(childResult.depth).toBe(1);
  });

  it('uses "unknown-service" when service.name attribute is missing', () => {
    const raw = makeRawSpan({ attributes: {} }); // no service.name
    const [result] = transformSpans([raw]);
    expect(result.service).toBe('unknown-service');
  });

  it('assigns "error" status to spans with ERROR status_code', () => {
    const raw = makeRawSpan({ statusCode: 'ERROR', durationMs: 10 });
    const [result] = transformSpans([raw]);
    expect(result.status).toBe('error');
  });

  it('handles a typical 3-span trace (real hello-span structure)', () => {
    const processOrder = makeRawSpan({
      name: 'process_order',
      spanId: 'span-001',
      startMs: 0,
      durationMs: 5240,
      attributes: { 'service.name': 'order-service', order_id: 'ord_9f3k2p' },
    });
    const dbQuery = makeRawSpan({
      name: 'db.query',
      spanId: 'span-002',
      parentId: 'span-001',
      startMs: 20,
      durationMs: 4980,
      attributes: { 'service.name': 'order-service', 'db.connection_pool.wait_ms': '4750' },
    });
    const cacheInvalidate = makeRawSpan({
      name: 'cache.invalidate',
      spanId: 'span-003',
      parentId: 'span-001',
      startMs: 5200,
      durationMs: 12,
      attributes: { 'service.name': 'order-service' },
    });

    const results = transformSpans([processOrder, dbQuery, cacheInvalidate]);
    expect(results).toHaveLength(3);

    const root = results.find(s => s.name === 'process_order')!;
    const db = results.find(s => s.name === 'db.query')!;
    const cache = results.find(s => s.name === 'cache.invalidate')!;

    expect(root.depth).toBe(0);
    expect(db.depth).toBe(1);
    expect(cache.depth).toBe(1);

    expect(root.status).toBe('warning'); // 5240ms > 100ms
    expect(db.status).toBe('warning');   // 4980ms > 100ms
    expect(cache.status).toBe('ok');     // 12ms <= 100ms
  });
});

// ============================================================================
// getTraceId
// ============================================================================

describe('getTraceId', () => {
  it('throws for empty array', () => {
    expect(() => getTraceId([])).toThrow('Cannot get trace_id from empty spans array');
  });

  it('returns the trace_id from the first span', () => {
    const raw = makeRawSpan({ traceId: 'trace-12345' });
    expect(getTraceId([raw])).toBe('trace-12345');
  });
});

// ============================================================================
// getTotalDurationMs
// ============================================================================

describe('getTotalDurationMs', () => {
  it('returns 0 for empty array', () => {
    expect(getTotalDurationMs([])).toBe(0);
  });

  it('returns the span duration for a single span', () => {
    const raw = makeRawSpan({ startMs: 1000, durationMs: 200 });
    expect(getTotalDurationMs([raw])).toBe(200);
  });

  it('returns total trace duration from first start to last end', () => {
    const span1 = makeRawSpan({ startMs: 0, durationMs: 100 });     // ends at 100ms
    const span2 = makeRawSpan({ startMs: 50, durationMs: 200 });    // ends at 250ms
    // total = 250ms - 0ms = 250ms
    expect(getTotalDurationMs([span1, span2])).toBe(250);
  });
});
