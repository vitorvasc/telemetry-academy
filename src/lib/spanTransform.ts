import type { TraceSpan } from '../types/phase2';

/**
 * Raw OTel span format from the Python worker telemetry
 */
interface RawOTelSpan {
  name: string;
  context: { span_id: string; trace_id: string };
  parent_id?: string;
  start_time: number;      // Unix nanoseconds
  end_time: number;        // Unix nanoseconds
  attributes: Record<string, unknown>;
  status?: { status_code: string; description?: string };
  events?: Array<{ name: string; timestamp: number; attributes?: Record<string, unknown> }>;
}

/**
 * SLOW threshold in milliseconds
 * Spans exceeding this duration get a 'warning' status
 */
const SLOW_THRESHOLD_MS = 100;

/**
 * Maximum nesting depth to prevent infinite recursion on malformed data
 */
const MAX_DEPTH = 10;

/**
 * Derive the status for a span based on OTel status_code and duration
 * 
 * Rules:
 * - ERROR status_code → 'error'
 * - duration > 100ms → 'warning' (SLOW)
 * - Otherwise → 'ok'
 * 
 * @param span - Raw OTel span
 * @returns Status: 'ok' | 'error' | 'warning'
 */
export function deriveStatus(span: RawOTelSpan): 'ok' | 'error' | 'warning' {
  // ERROR status_code takes precedence
  if (span.status?.status_code === 'ERROR') {
    return 'error';
  }
  
  // Calculate duration in milliseconds
  const durationMs = (span.end_time - span.start_time) / 1_000_000;
  
  // Slow spans get warning status
  if (durationMs > SLOW_THRESHOLD_MS) {
    return 'warning';
  }
  
  return 'ok';
}

/**
 * Calculate the nesting depth of a span based on parent_id relationships
 * 
 * Rules:
 * - Root spans (no parent_id) → depth 0
 * - Child depth = parent depth + 1
 * - Cycle protection via visited Set
 * - Cap at MAX_DEPTH to prevent infinite recursion
 * - If parent not found, treat as root (depth 0)
 * 
 * @param span - Raw OTel span to calculate depth for
 * @param spanMap - Map of span_id to span for parent lookups
 * @param visited - Set of already visited span_ids (for cycle detection)
 * @returns Nesting depth (0 for root spans)
 */
export function calculateDepth(
  span: RawOTelSpan, 
  spanMap: Map<string, RawOTelSpan>,
  visited: Set<string> = new Set()
): number {
  // No parent = root span = depth 0
  if (!span.parent_id) {
    return 0;
  }
  
  // Cycle detection: if we've seen this span before, stop recursion
  if (visited.has(span.context.span_id)) {
    return 0;
  }
  
  // Add current span to visited set
  visited.add(span.context.span_id);
  
  // Look up parent span
  const parentSpan = spanMap.get(span.parent_id);
  
  // Parent not found in data = treat as root
  if (!parentSpan) {
    return 0;
  }
  
  // Calculate parent depth recursively
  const parentDepth = calculateDepth(parentSpan, spanMap, visited);
  
  // Cap depth to prevent runaway recursion on malformed data
  return Math.min(parentDepth + 1, MAX_DEPTH);
}

/**
 * Normalize OTel attributes to string values
 * 
 * Rules:
 * - Array values: join with ', '
 * - Other values: String(value)
 * - null/undefined → empty string
 * 
 * @param attributes - Raw attributes from OTel span
 * @returns Normalized attributes with all string values
 */
export function normalizeAttributes(attributes: Record<string, unknown>): Record<string, string> {
  const normalized: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(attributes)) {
    if (value === null || value === undefined) {
      normalized[key] = '';
    } else if (Array.isArray(value)) {
      normalized[key] = value.join(', ');
    } else if (typeof value === 'object') {
      normalized[key] = JSON.stringify(value);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      normalized[key] = String(value);
    }
  }
  
  return normalized;
}

/**
 * Transform raw OTel spans into TraceSpan format for visualization
 * 
 * @param rawSpans - Array of raw OTel spans from the Python worker
 * @returns Array of transformed TraceSpan objects
 * @throws Error if rawSpans is empty
 */
export function transformSpans(rawSpans: RawOTelSpan[]): TraceSpan[] {
  if (!rawSpans || rawSpans.length === 0) {
    throw new Error('Cannot transform empty spans array');
  }
  
  // Calculate trace start time for offset calculations
  const traceStartNs = Math.min(...rawSpans.map(s => s.start_time));
  
  // Build span map for parent lookups
  const spanMap = new Map<string, RawOTelSpan>();
  for (const span of rawSpans) {
    if (span.context?.span_id) {
      spanMap.set(span.context.span_id, span);
    }
  }
  
  // Transform each span
  return rawSpans.map(span => {
    const durationNs = span.end_time - span.start_time;
    const durationMs = Math.round((durationNs / 1_000_000) * 100) / 100; // Round to 2 decimals
    const offsetMs = (span.start_time - traceStartNs) / 1_000_000;
    
    return {
      id: span.context.span_id,
      name: span.name,
      service: span.attributes?.['service.name'] || 'unknown-service',
      durationMs,
      offsetMs,
      status: deriveStatus(span),
      attributes: normalizeAttributes(span.attributes || {}),
      depth: calculateDepth(span, spanMap),
    };
  });
}

/**
 * Extract the trace_id from the first span
 * 
 * @param rawSpans - Array of raw OTel spans
 * @returns Trace ID string
 * @throws Error if rawSpans is empty or first span has no trace_id
 */
export function getTraceId(rawSpans: RawOTelSpan[]): string {
  if (!rawSpans || rawSpans.length === 0) {
    throw new Error('Cannot get trace_id from empty spans array');
  }
  
  const firstSpan = rawSpans[0];
  if (!firstSpan.context?.trace_id) {
    throw new Error('First span has no trace_id');
  }
  
  return firstSpan.context.trace_id;
}

/**
 * Calculate the total duration of the trace in milliseconds
 * 
 * @param rawSpans - Array of raw OTel spans
 * @returns Total duration from first span start to last span end (in ms)
 */
export function getTotalDurationMs(rawSpans: RawOTelSpan[]): number {
  if (!rawSpans || rawSpans.length === 0) {
    return 0;
  }
  
  const traceStartNs = Math.min(...rawSpans.map(s => s.start_time));
  const traceEndNs = Math.max(...rawSpans.map(s => s.end_time));
  
  return (traceEndNs - traceStartNs) / 1_000_000;
}
