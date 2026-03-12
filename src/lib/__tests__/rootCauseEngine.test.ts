import { describe, it, expect } from 'vitest';
import {
  evaluateGuess,
  createDefaultRules,
  findSlowestSpan,
  findSpanWithAttribute,
  getPoolWaitMs,
  getQueryExecutionTime,
  findCacheSpan,
  findDbQuerySpan,
  calculatePercentage,
} from '../rootCauseEngine';
import { formatSpanMs } from '../formatters';
import type { Phase2Data } from '../../types/phase2';

// ============================================================================
// Test Fixtures — mirrors the real helloSpanPhase2 data structure
// ============================================================================

const makePhase2Data = (overrides: Partial<Phase2Data> = {}): Phase2Data => ({
  traceId: 'trace-abc123',
  totalDurationMs: 5240,
  narrative: 'Test narrative',
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
      },
    },
  ],
  logs: [],
  rootCauseOptions: [],
  ...overrides,
});

const makeAutoMagicData = (): Phase2Data => ({
  traceId: 'trace-def456',
  totalDurationMs: 850,
  narrative: 'Test auto-magic narrative',
  spans: [
    {
      id: 'span-a01',
      name: 'checkout.process',
      service: 'checkout-service',
      durationMs: 850,
      offsetMs: 0,
      status: 'error',
      depth: 0,
      attributes: { 'http.method': 'POST' },
    },
    {
      id: 'span-a02',
      name: 'http.client',
      service: 'checkout-service',
      durationMs: 820,
      offsetMs: 10,
      status: 'error',
      depth: 1,
      attributes: {
        'http.status_code': '500',
        'http.url': 'https://payment-api.internal/charge',
      },
    },
  ],
  logs: [],
  rootCauseOptions: [],
});

// ============================================================================
// Helper Functions
// ============================================================================

describe('findSlowestSpan', () => {
  it('returns null for empty spans', () => {
    expect(findSlowestSpan({ ...makePhase2Data(), spans: [] })).toBeNull();
  });

  it('returns the span with the highest durationMs', () => {
    const data = makePhase2Data();
    const result = findSlowestSpan(data);
    expect(result?.name).toBe('process_order');
    expect(result?.durationMs).toBe(5240);
  });

  it('returns single span when only one exists', () => {
    const data = makePhase2Data({ spans: [{ id: 's1', name: 'only-span', service: 'svc', durationMs: 100, offsetMs: 0, status: 'ok', depth: 0, attributes: {} }] });
    expect(findSlowestSpan(data)?.name).toBe('only-span');
  });
});

describe('findSpanWithAttribute', () => {
  it('returns null when no span has the attribute', () => {
    const data = makePhase2Data();
    expect(findSpanWithAttribute(data, 'nonexistent.attr')).toBeNull();
  });

  it('returns the first span that has the attribute', () => {
    const data = makePhase2Data();
    const result = findSpanWithAttribute(data, 'db.connection_pool.wait_ms');
    expect(result?.name).toBe('db.query');
  });
});

describe('getPoolWaitMs', () => {
  it('returns null for null span', () => {
    expect(getPoolWaitMs(null)).toBeNull();
  });

  it('returns null when attribute is missing', () => {
    const data = makePhase2Data();
    const span = data.spans[0]; // process_order, no pool attribute
    expect(getPoolWaitMs(span)).toBeNull();
  });

  it('returns parsed integer for valid wait_ms value', () => {
    const data = makePhase2Data();
    const dbSpan = data.spans.find(s => s.name === 'db.query')!;
    expect(getPoolWaitMs(dbSpan)).toBe(4750);
  });
});

describe('getQueryExecutionTime', () => {
  it('returns null for null span', () => {
    expect(getQueryExecutionTime(null)).toBeNull();
  });

  it('returns durationMs minus wait_ms', () => {
    const data = makePhase2Data();
    const dbSpan = data.spans.find(s => s.name === 'db.query')!;
    // durationMs=4980, wait_ms=4750 → execution=230
    expect(getQueryExecutionTime(dbSpan)).toBe(230);
  });
});

describe('findCacheSpan', () => {
  it('returns null when no cache.invalidate span exists', () => {
    const data = makePhase2Data({ spans: [makePhase2Data().spans[0]] });
    expect(findCacheSpan(data)).toBeNull();
  });

  it('returns the cache.invalidate span', () => {
    const data = makePhase2Data();
    expect(findCacheSpan(data)?.name).toBe('cache.invalidate');
  });
});

describe('findDbQuerySpan', () => {
  it('returns null when no db.query span exists', () => {
    const data = makePhase2Data({ spans: [makePhase2Data().spans[0]] });
    expect(findDbQuerySpan(data)).toBeNull();
  });

  it('returns the db.query span', () => {
    const data = makePhase2Data();
    expect(findDbQuerySpan(data)?.name).toBe('db.query');
  });
});

describe('formatSpanMs', () => {
  it('formats milliseconds below 1000ms', () => {
    expect(formatSpanMs(850)).toBe('850ms');
    expect(formatSpanMs(12)).toBe('12ms');
  });

  it('formats milliseconds >= 1000 as seconds', () => {
    expect(formatSpanMs(5240)).toBe('5.24s');
    expect(formatSpanMs(1000)).toBe('1.00s');
  });
});

describe('calculatePercentage', () => {
  it('calculates percentage of total', () => {
    expect(calculatePercentage(4750, 5000)).toBe('95%');
    expect(calculatePercentage(500, 1000)).toBe('50%');
  });
});

// ============================================================================
// createDefaultRules
// ============================================================================

describe('createDefaultRules', () => {
  it('returns an empty map for an unknown case', () => {
    const rules = createDefaultRules('999-unknown-case');
    expect(rules.size).toBe(0);
  });

  it('returns 4 rules for 001-hello-span', () => {
    const rules = createDefaultRules('001-hello-span');
    expect(rules.size).toBe(4);
    expect(rules.has('a')).toBe(true);
    expect(rules.has('b')).toBe(true);
    expect(rules.has('c')).toBe(true);
    expect(rules.has('d')).toBe(true);
  });

  it('returns 4 rules for 002-auto-magic', () => {
    const rules = createDefaultRules('002-auto-magic');
    expect(rules.size).toBe(4);
  });

  it('returns 4 rules for 003-the-collector', () => {
    const rules = createDefaultRules('003-the-collector');
    expect(rules.size).toBe(4);
  });
});

// ============================================================================
// evaluateGuess — 001-hello-span
// ============================================================================

describe('evaluateGuess — 001-hello-span', () => {
  const caseId = '001-hello-span';

  it('returns correct=true for option b (connection pool exhausted)', () => {
    const data = makePhase2Data(); // has db.connection_pool.wait_ms=4750 > 1000
    const result = evaluateGuess('b', data, caseId);
    expect(result.correct).toBe(true);
    expect(result.explanation).toContain('4750');
  });

  it('returns correct=false for option a (missing index distractor)', () => {
    const data = makePhase2Data();
    const result = evaluateGuess('a', data, caseId);
    expect(result.correct).toBe(false);
    expect(result.explanation).toBeTruthy();
  });

  it('returns correct=false for option c (cache slow distractor)', () => {
    const data = makePhase2Data();
    const result = evaluateGuess('c', data, caseId);
    expect(result.correct).toBe(false);
  });

  it('returns correct=false for option d (CPU-bound distractor)', () => {
    const data = makePhase2Data();
    const result = evaluateGuess('d', data, caseId);
    expect(result.correct).toBe(false);
  });

  it('returns hint for option a (missing index)', () => {
    const data = makePhase2Data();
    const result = evaluateGuess('a', data, caseId);
    expect(result.hint).toBeDefined();
    expect(result.hint).toContain('db.connection_pool.wait_ms');
  });

  it('returns hint for option c (cache slow)', () => {
    const data = makePhase2Data();
    const result = evaluateGuess('c', data, caseId);
    expect(result.hint).toBeDefined();
  });

  it('returns no hint when correct', () => {
    const data = makePhase2Data();
    const result = evaluateGuess('b', data, caseId);
    expect(result.hint).toBeUndefined();
  });

  it('returns correct=false when pool wait_ms is low (< 1000ms)', () => {
    // Rule b requires waitMs > 1000 to be "correct"
    const dataWithLowWait = makePhase2Data({
      spans: [
        {
          id: 'span-002',
          name: 'db.query',
          service: 'order-service',
          durationMs: 500,
          offsetMs: 20,
          status: 'ok',
          depth: 1,
          attributes: { 'db.connection_pool.wait_ms': '100' },
        },
      ],
    });
    const result = evaluateGuess('b', dataWithLowWait, caseId);
    expect(result.correct).toBe(false);
  });
});

// ============================================================================
// evaluateGuess — 002-auto-magic
// ============================================================================

describe('evaluateGuess — 002-auto-magic', () => {
  const caseId = '002-auto-magic';

  it('returns correct=true for option a when any span has status=error', () => {
    const data = makeAutoMagicData();
    const result = evaluateGuess('a', data, caseId);
    expect(result.correct).toBe(true);
    expect(result.explanation).toContain('500');
  });

  it('returns correct=false for option b (DB pool distractor)', () => {
    const data = makeAutoMagicData();
    const result = evaluateGuess('b', data, caseId);
    expect(result.correct).toBe(false);
    // Engine references the first error span name (checkout.process in our fixture)
    expect(result.explanation).toContain('checkout.process');
  });

  it('returns correct=false for option c (memory leak distractor)', () => {
    const data = makeAutoMagicData();
    const result = evaluateGuess('c', data, caseId);
    expect(result.correct).toBe(false);
  });

  it('returns correct=false for option d (DNS distractor)', () => {
    const data = makeAutoMagicData();
    const result = evaluateGuess('d', data, caseId);
    expect(result.correct).toBe(false);
    // Generic fallback when the first error span has no http.status_code
    expect(result.explanation).toContain('DNS');
  });

  it('returns correct=false for option d (DNS distractor) with http.status_code on error span', () => {
    // Make the first error span also carry http.status_code so the engine uses the specific message
    const data: Phase2Data = {
      ...makeAutoMagicData(),
      spans: [
        {
          id: 'span-a01',
          name: 'http.client',
          service: 'checkout-service',
          durationMs: 820,
          offsetMs: 10,
          status: 'error',
          depth: 0,
          attributes: {
            'http.status_code': '500',
            'http.url': 'https://payment-api.internal/charge',
          },
        },
      ],
    };
    const result = evaluateGuess('d', data, caseId);
    expect(result.correct).toBe(false);
    expect(result.explanation).toContain('500');
  });
});

// ============================================================================
// evaluateGuess — 003-the-collector
// ============================================================================

describe('evaluateGuess — 003-the-collector', () => {
  const caseId = '003-the-collector';
  // Collector is YAML-based — evaluate() always returns static true/false
  const anyData = makePhase2Data();

  it('returns correct=true for option a (tail_sampling)', () => {
    const result = evaluateGuess('a', anyData, caseId);
    expect(result.correct).toBe(true);
    expect(result.explanation).toContain('tail_sampling');
  });

  it('returns correct=false for option b (wrong endpoint)', () => {
    const result = evaluateGuess('b', anyData, caseId);
    expect(result.correct).toBe(false);
    expect(result.explanation).toContain('tail_sampling');
  });

  it('returns correct=false for option c (receivers not configured)', () => {
    const result = evaluateGuess('c', anyData, caseId);
    expect(result.correct).toBe(false);
  });

  it('returns correct=false for option d (buffer overflow)', () => {
    const result = evaluateGuess('d', anyData, caseId);
    expect(result.correct).toBe(false);
  });
});

// ============================================================================
// evaluateGuess — edge cases
// ============================================================================

describe('evaluateGuess — edge cases', () => {
  it('returns error result for invalid guessId', () => {
    const data = makePhase2Data();
    const result = evaluateGuess('z', data, '001-hello-span');
    expect(result.correct).toBe(false);
    expect(result.explanation).toContain('Invalid selection');
  });

  it('returns error result for unknown caseId (no rules)', () => {
    const data = makePhase2Data();
    // Unknown case produces empty rules map, so any guessId is invalid
    const result = evaluateGuess('a', data, 'unknown-case-999');
    expect(result.correct).toBe(false);
    expect(result.explanation).toContain('Invalid selection');
  });
});
