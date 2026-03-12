import { describe, it, expect } from 'vitest';
import {
  validateSpans,
  validateYaml,
  checkSpanExists,
  checkAttributeExists,
  checkAttributeValue,
  checkSpanCount,
  checkStatus,
} from '../validation';
import type { SpanValidationRule, ValidationContext, YamlValidationContext } from '../validation';
import type { RawOTelSpan } from '../../hooks/usePhase2Data';

// ============================================================================
// Test Fixtures
// ============================================================================

const makeSpan = (
  name: string,
  attributes: Record<string, unknown> = {},
  statusCode?: string
): RawOTelSpan => ({
  name,
  context: { span_id: `span-${name}`, trace_id: 'trace-abc' },
  start_time: 1_000_000_000,
  end_time: 2_000_000_000,
  attributes,
  status: statusCode ? { status_code: statusCode } : undefined,
});

const makeRule = (
  type: SpanValidationRule['type'],
  overrides: Partial<SpanValidationRule> = {}
): SpanValidationRule => ({
  type,
  description: `rule-${type}`,
  successMessage: 'success',
  errorMessage: 'error',
  hintMessage: 'hint',
  guidedMessage: 'guided',
  ...overrides,
});

const makeContext = (
  spans: RawOTelSpan[],
  attemptHistory: Record<string, number> = {}
): ValidationContext => ({ spans, attemptHistory });

// ============================================================================
// checkSpanExists
// ============================================================================

describe('checkSpanExists', () => {
  it('returns false for empty spans array', () => {
    expect(checkSpanExists([])).toBe(false);
  });

  it('returns true when spans exist and no name filter', () => {
    expect(checkSpanExists([makeSpan('process_order')])).toBe(true);
  });

  it('returns true when a span with the given name exists', () => {
    expect(checkSpanExists([makeSpan('process_order'), makeSpan('db.query')], 'db.query')).toBe(true);
  });

  it('returns false when no span matches the given name', () => {
    expect(checkSpanExists([makeSpan('process_order')], 'missing_span')).toBe(false);
  });
});

// ============================================================================
// checkAttributeExists
// ============================================================================

describe('checkAttributeExists', () => {
  it('returns false for empty spans array', () => {
    expect(checkAttributeExists([], undefined, 'order_id')).toBe(false);
  });

  it('returns false when attributeKey is not provided', () => {
    expect(checkAttributeExists([makeSpan('process_order', { order_id: '123' })], undefined, undefined)).toBe(false);
  });

  it('returns true when attribute exists on any span (no spanName filter)', () => {
    const spans = [makeSpan('process_order', { order_id: 'ord_001' })];
    expect(checkAttributeExists(spans, undefined, 'order_id')).toBe(true);
  });

  it('returns true when attribute exists on the named span', () => {
    const spans = [
      makeSpan('process_order', { order_id: 'ord_001' }),
      makeSpan('db.query', { 'db.system': 'postgresql' }),
    ];
    expect(checkAttributeExists(spans, 'process_order', 'order_id')).toBe(true);
  });

  it('returns false when attribute exists on a different span than specified', () => {
    const spans = [
      makeSpan('process_order', {}),
      makeSpan('db.query', { order_id: 'ord_001' }),
    ];
    expect(checkAttributeExists(spans, 'process_order', 'order_id')).toBe(false);
  });

  it('returns false when attribute is missing entirely', () => {
    const spans = [makeSpan('process_order', { 'http.method': 'POST' })];
    expect(checkAttributeExists(spans, 'process_order', 'order_id')).toBe(false);
  });
});

// ============================================================================
// checkAttributeValue
// ============================================================================

describe('checkAttributeValue', () => {
  it('returns false for empty spans array', () => {
    expect(checkAttributeValue([], 'process_order', 'order_id', 'ord_001')).toBe(false);
  });

  it('returns false when attributeKey is not provided', () => {
    const spans = [makeSpan('process_order', { order_id: 'ord_001' })];
    expect(checkAttributeValue(spans, undefined, undefined, 'ord_001')).toBe(false);
  });

  it('returns false when attributeValue is undefined', () => {
    const spans = [makeSpan('process_order', { order_id: 'ord_001' })];
    expect(checkAttributeValue(spans, undefined, 'order_id', undefined)).toBe(false);
  });

  it('returns true when attribute value matches on named span', () => {
    const spans = [makeSpan('process_order', { order_id: 'ord_001' })];
    expect(checkAttributeValue(spans, 'process_order', 'order_id', 'ord_001')).toBe(true);
  });

  it('returns false when attribute value does not match', () => {
    const spans = [makeSpan('process_order', { order_id: 'ord_999' })];
    expect(checkAttributeValue(spans, 'process_order', 'order_id', 'ord_001')).toBe(false);
  });

  it('returns true when attribute value matches on any span (no spanName filter)', () => {
    const spans = [makeSpan('db.query', { 'db.system': 'postgresql' })];
    expect(checkAttributeValue(spans, undefined, 'db.system', 'postgresql')).toBe(true);
  });
});

// ============================================================================
// checkSpanCount
// ============================================================================

describe('checkSpanCount', () => {
  it('returns false for empty spans when minCount is undefined', () => {
    expect(checkSpanCount([])).toBe(false);
  });

  it('returns true when spans exist and no minCount specified', () => {
    expect(checkSpanCount([makeSpan('a')])).toBe(true);
  });

  it('returns true when span count meets minCount', () => {
    const spans = [makeSpan('a'), makeSpan('b'), makeSpan('c')];
    expect(checkSpanCount(spans, 3)).toBe(true);
  });

  it('returns true when span count exceeds minCount', () => {
    const spans = [makeSpan('a'), makeSpan('b'), makeSpan('c')];
    expect(checkSpanCount(spans, 2)).toBe(true);
  });

  it('returns false when span count is below minCount', () => {
    const spans = [makeSpan('a'), makeSpan('b')];
    expect(checkSpanCount(spans, 5)).toBe(false);
  });
});

// ============================================================================
// checkStatus
// ============================================================================

describe('checkStatus', () => {
  it('returns false for empty spans', () => {
    expect(checkStatus([], undefined, 'OK')).toBe(false);
  });

  it('returns true when a span has the matching status_code (OK)', () => {
    const spans = [makeSpan('process_order', {}, 'OK')];
    expect(checkStatus(spans, undefined, 'OK')).toBe(true);
  });

  it('returns true when a named span has matching status_code (ERROR)', () => {
    const spans = [
      makeSpan('process_order', {}, 'OK'),
      makeSpan('db.query', {}, 'ERROR'),
    ];
    expect(checkStatus(spans, 'db.query', 'ERROR')).toBe(true);
  });

  it('returns false when named span has a different status_code', () => {
    const spans = [makeSpan('process_order', {}, 'OK')];
    expect(checkStatus(spans, 'process_order', 'ERROR')).toBe(false);
  });

  it('returns false when span has no status set', () => {
    const spans = [makeSpan('process_order')]; // no status
    expect(checkStatus(spans, undefined, 'OK')).toBe(false);
  });
});

// ============================================================================
// validateSpans — all 8 check types
// ============================================================================

describe('validateSpans', () => {
  // span_exists
  it('span_exists: passes when a span with the given name exists', () => {
    const spans = [makeSpan('process_order')];
    const rules = [makeRule('span_exists', { spanName: 'process_order' })];
    const [result] = validateSpans(rules, makeContext(spans));
    expect(result.passed).toBe(true);
    expect(result.message).toBe('success');
  });

  it('span_exists: fails when no matching span', () => {
    const rules = [makeRule('span_exists', { spanName: 'process_order' })];
    const [result] = validateSpans(rules, makeContext([]));
    expect(result.passed).toBe(false);
  });

  // attribute_exists
  it('attribute_exists: passes when attribute exists on named span', () => {
    const spans = [makeSpan('process_order', { order_id: 'ord_001' })];
    const rules = [makeRule('attribute_exists', { spanName: 'process_order', attributeKey: 'order_id' })];
    const [result] = validateSpans(rules, makeContext(spans));
    expect(result.passed).toBe(true);
  });

  it('attribute_exists: fails when attribute is missing', () => {
    const spans = [makeSpan('process_order', {})];
    const rules = [makeRule('attribute_exists', { spanName: 'process_order', attributeKey: 'order_id' })];
    const [result] = validateSpans(rules, makeContext(spans));
    expect(result.passed).toBe(false);
  });

  // attribute_value
  it('attribute_value: passes when attribute matches expected value', () => {
    const spans = [makeSpan('process_order', { status: 'paid' })];
    const rules = [makeRule('attribute_value', { spanName: 'process_order', attributeKey: 'status', attributeValue: 'paid' })];
    const [result] = validateSpans(rules, makeContext(spans));
    expect(result.passed).toBe(true);
  });

  it('attribute_value: fails when value does not match', () => {
    const spans = [makeSpan('process_order', { status: 'pending' })];
    const rules = [makeRule('attribute_value', { spanName: 'process_order', attributeKey: 'status', attributeValue: 'paid' })];
    const [result] = validateSpans(rules, makeContext(spans));
    expect(result.passed).toBe(false);
  });

  // span_count
  it('span_count: passes when enough spans exist', () => {
    const spans = [makeSpan('a'), makeSpan('b'), makeSpan('c')];
    const rules = [makeRule('span_count', { minCount: 3 })];
    const [result] = validateSpans(rules, makeContext(spans));
    expect(result.passed).toBe(true);
  });

  it('span_count: fails when span count is below minCount', () => {
    const spans = [makeSpan('a')];
    const rules = [makeRule('span_count', { minCount: 3 })];
    const [result] = validateSpans(rules, makeContext(spans));
    expect(result.passed).toBe(false);
  });

  // status_ok
  it('status_ok: passes when named span has OK status', () => {
    const spans = [makeSpan('process_order', {}, 'OK')];
    const rules = [makeRule('status_ok', { spanName: 'process_order' })];
    const [result] = validateSpans(rules, makeContext(spans));
    expect(result.passed).toBe(true);
  });

  it('status_ok: fails when span does not have OK status', () => {
    const spans = [makeSpan('process_order', {}, 'ERROR')];
    const rules = [makeRule('status_ok', { spanName: 'process_order' })];
    const [result] = validateSpans(rules, makeContext(spans));
    expect(result.passed).toBe(false);
  });

  // status_error
  it('status_error: passes when named span has ERROR status', () => {
    const spans = [makeSpan('db.query', {}, 'ERROR')];
    const rules = [makeRule('status_error', { spanName: 'db.query' })];
    const [result] = validateSpans(rules, makeContext(spans));
    expect(result.passed).toBe(true);
  });

  it('status_error: fails when span does not have ERROR status', () => {
    const spans = [makeSpan('db.query', {}, 'OK')];
    const rules = [makeRule('status_error', { spanName: 'db.query' })];
    const [result] = validateSpans(rules, makeContext(spans));
    expect(result.passed).toBe(false);
  });

  // telemetry_flowing
  it('telemetry_flowing: passes when spans array is non-empty', () => {
    const spans = [makeSpan('process_order')];
    const rules = [makeRule('telemetry_flowing')];
    const [result] = validateSpans(rules, makeContext(spans));
    expect(result.passed).toBe(true);
  });

  it('telemetry_flowing: fails when spans array is empty', () => {
    const rules = [makeRule('telemetry_flowing')];
    const [result] = validateSpans(rules, makeContext([]));
    expect(result.passed).toBe(false);
  });

  it('telemetry_flowing: passes when named span exists', () => {
    const spans = [makeSpan('process_order')];
    const rules = [makeRule('telemetry_flowing', { spanName: 'process_order' })];
    const [result] = validateSpans(rules, makeContext(spans));
    expect(result.passed).toBe(true);
  });

  it('telemetry_flowing: fails when named span does not exist', () => {
    const spans = [makeSpan('other_span')];
    const rules = [makeRule('telemetry_flowing', { spanName: 'process_order' })];
    const [result] = validateSpans(rules, makeContext(spans));
    expect(result.passed).toBe(false);
  });

  // error_handling
  it('error_handling: passes when span has ERROR status_code', () => {
    const spans = [makeSpan('db.query', {}, 'ERROR')];
    const rules = [makeRule('error_handling')];
    const [result] = validateSpans(rules, makeContext(spans));
    expect(result.passed).toBe(true);
  });

  it('error_handling: passes when span has error.type attribute', () => {
    const spans = [makeSpan('process_order', { 'error.type': 'ValueError' })];
    const rules = [makeRule('error_handling')];
    const [result] = validateSpans(rules, makeContext(spans));
    expect(result.passed).toBe(true);
  });

  it('error_handling: passes when span has error.message attribute', () => {
    const spans = [makeSpan('process_order', { 'error.message': 'Something went wrong' })];
    const rules = [makeRule('error_handling')];
    const [result] = validateSpans(rules, makeContext(spans));
    expect(result.passed).toBe(true);
  });

  it('error_handling: fails when spans have no errors', () => {
    const spans = [makeSpan('process_order', { order_id: 'ord_001' }, 'OK')];
    const rules = [makeRule('error_handling')];
    const [result] = validateSpans(rules, makeContext(spans));
    expect(result.passed).toBe(false);
  });

  it('error_handling: fails for empty spans', () => {
    const rules = [makeRule('error_handling')];
    const [result] = validateSpans(rules, makeContext([]));
    expect(result.passed).toBe(false);
  });
});

// ============================================================================
// Progressive hint escalation
// ============================================================================

describe('progressive hint escalation', () => {
  const spans: RawOTelSpan[] = []; // failing scenario — no spans
  const rule = makeRule('span_exists', {
    description: 'test-rule',
    errorMessage: 'no spans found',
    hintMessage: 'try creating a span',
    guidedMessage: 'use tracer.start_as_current_span()',
  });

  it('returns errorMessage on first attempt (0 prior attempts)', () => {
    const [result] = validateSpans([rule], makeContext(spans, {}));
    expect(result.message).toBe('no spans found');
    expect(result.attemptsOnThisRule).toBe(0);
  });

  it('returns hintMessage at 1 prior attempt', () => {
    const [result] = validateSpans([rule], makeContext(spans, { 'test-rule': 1 }));
    expect(result.message).toBe('try creating a span');
    expect(result.attemptsOnThisRule).toBe(1);
  });

  it('returns hintMessage at 2 prior attempts', () => {
    const [result] = validateSpans([rule], makeContext(spans, { 'test-rule': 2 }));
    expect(result.message).toBe('try creating a span');
    expect(result.attemptsOnThisRule).toBe(2);
  });

  it('returns guidedMessage at 3+ prior attempts', () => {
    const [result] = validateSpans([rule], makeContext(spans, { 'test-rule': 3 }));
    expect(result.message).toBe('use tracer.start_as_current_span()');
    expect(result.attemptsOnThisRule).toBe(3);
  });

  it('returns guidedMessage at 10 prior attempts', () => {
    const [result] = validateSpans([rule], makeContext(spans, { 'test-rule': 10 }));
    expect(result.message).toBe('use tracer.start_as_current_span()');
  });

  it('returns successMessage when rule passes (regardless of attempts)', () => {
    const passingSpans = [makeSpan('process_order')];
    const ruleWithSpanName = makeRule('span_exists', {
      description: 'test-rule',
      spanName: 'process_order',
      successMessage: 'span found!',
    });
    const [result] = validateSpans([ruleWithSpanName], makeContext(passingSpans, { 'test-rule': 5 }));
    expect(result.passed).toBe(true);
    expect(result.message).toBe('span found!');
  });

  it('falls back to errorMessage when hintMessage is missing', () => {
    const ruleNoHint = makeRule('span_exists', {
      description: 'test-rule',
      errorMessage: 'fallback error',
      hintMessage: undefined,
      guidedMessage: undefined,
    });
    const [result] = validateSpans([ruleNoHint], makeContext(spans, { 'test-rule': 2 }));
    expect(result.message).toBe('fallback error');
  });

  it('falls back to hintMessage when guidedMessage is missing', () => {
    const ruleNoGuided = makeRule('span_exists', {
      description: 'test-rule',
      hintMessage: 'hint only',
      guidedMessage: undefined,
    });
    const [result] = validateSpans([ruleNoGuided], makeContext(spans, { 'test-rule': 5 }));
    expect(result.message).toBe('hint only');
  });
});

// ============================================================================
// Edge cases
// ============================================================================

describe('validateSpans edge cases', () => {
  it('returns empty array for empty rules', () => {
    const result = validateSpans([], makeContext([makeSpan('a')]));
    expect(result).toHaveLength(0);
  });

  it('handles multiple rules independently', () => {
    const spans = [makeSpan('process_order', { order_id: 'ord_001' })];
    const rules = [
      makeRule('span_exists', { description: 'rule-1', spanName: 'process_order', successMessage: 'span ok' }),
      makeRule('attribute_exists', { description: 'rule-2', spanName: 'process_order', attributeKey: 'order_id', successMessage: 'attr ok' }),
      makeRule('span_exists', { description: 'rule-3', spanName: 'missing_span', errorMessage: 'span missing' }),
    ];
    const results = validateSpans(rules, makeContext(spans));
    expect(results[0].passed).toBe(true);
    expect(results[1].passed).toBe(true);
    expect(results[2].passed).toBe(false);
  });

  it('preserves all rule fields in ValidationResult', () => {
    const spans = [makeSpan('process_order')];
    const rule = makeRule('span_exists', {
      spanName: 'process_order',
      description: 'test-rule',
      successMessage: 'ok',
    });
    const [result] = validateSpans([rule], makeContext(spans));
    expect(result.type).toBe('span_exists');
    expect(result.spanName).toBe('process_order');
    expect(result.description).toBe('test-rule');
  });

  it('yaml_key_exists always returns false from validateSpans', () => {
    const spans = [makeSpan('any')];
    const rules = [makeRule('yaml_key_exists', { yamlPath: 'processors.batch' })];
    const [result] = validateSpans(rules, makeContext(spans));
    expect(result.passed).toBe(false);
  });
});

// ============================================================================
// validateYaml — yaml_key_exists
// ============================================================================

describe('validateYaml', () => {
  const makeYamlContext = (yamlContent: string, attemptHistory: Record<string, number> = {}): YamlValidationContext => ({
    yamlContent,
    attemptHistory,
  });

  const yamlContent = `
receivers:
  otlp:
    protocols:
      grpc:

processors:
  batch: {}
  tail_sampling:
    decision_wait: 10s
    sampling_percentage: 1

exporters:
  otlp:
    endpoint: http://collector:4317

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [tail_sampling, batch]
      exporters: [otlp]
`;

  it('passes when a top-level key path exists', () => {
    const rules = [makeRule('yaml_key_exists', { description: 'r1', yamlPath: 'receivers' })];
    const [result] = validateYaml(rules, makeYamlContext(yamlContent));
    expect(result.passed).toBe(true);
  });

  it('passes when a nested key path exists', () => {
    const rules = [makeRule('yaml_key_exists', { description: 'r1', yamlPath: 'processors.tail_sampling' })];
    const [result] = validateYaml(rules, makeYamlContext(yamlContent));
    expect(result.passed).toBe(true);
  });

  it('fails when a nested key path does not exist', () => {
    const rules = [makeRule('yaml_key_exists', { description: 'r1', yamlPath: 'processors.memory_limiter' })];
    const [result] = validateYaml(rules, makeYamlContext(yamlContent));
    expect(result.passed).toBe(false);
  });

  it('passes when key exists and expectedValue matches', () => {
    const rules = [makeRule('yaml_key_exists', {
      description: 'r1',
      yamlPath: 'processors.tail_sampling.sampling_percentage',
      expectedValue: '1',
    })];
    const [result] = validateYaml(rules, makeYamlContext(yamlContent));
    expect(result.passed).toBe(true);
  });

  it('fails when key exists but expectedValue does not match', () => {
    const rules = [makeRule('yaml_key_exists', {
      description: 'r1',
      yamlPath: 'processors.tail_sampling.sampling_percentage',
      expectedValue: '100',
    })];
    const [result] = validateYaml(rules, makeYamlContext(yamlContent));
    expect(result.passed).toBe(false);
  });

  it('fails for invalid YAML', () => {
    const rules = [makeRule('yaml_key_exists', { description: 'r1', yamlPath: 'processors' })];
    const [result] = validateYaml(rules, makeYamlContext('{ invalid yaml :::'));
    // Invalid YAML → treated as failed
    expect(result.passed).toBe(false);
  });

  it('fails when yamlPath is not provided', () => {
    const rules = [makeRule('yaml_key_exists', { description: 'r1', yamlPath: undefined })];
    const [result] = validateYaml(rules, makeYamlContext(yamlContent));
    expect(result.passed).toBe(false);
  });

  it('applies progressive hints for yaml rules too', () => {
    const rules = [makeRule('yaml_key_exists', {
      description: 'missing-key-rule',
      yamlPath: 'processors.memory_limiter',
      errorMessage: 'key not found',
      hintMessage: 'add memory_limiter',
    })];
    const [result] = validateYaml(rules, makeYamlContext(yamlContent, { 'missing-key-rule': 1 }));
    expect(result.passed).toBe(false);
    expect(result.message).toBe('add memory_limiter');
  });

  it('non-yaml_key_exists rules always fail in validateYaml', () => {
    const rules = [makeRule('span_exists', { description: 'r1', spanName: 'process_order' })];
    const [result] = validateYaml(rules, makeYamlContext(yamlContent));
    expect(result.passed).toBe(false);
  });
});
