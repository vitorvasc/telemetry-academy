import { useMemo } from 'react';
import type { Phase2Data, RootCauseOption } from '../types/phase2';
import { transformSpans, getTraceId, getTotalDurationMs } from '../lib/spanTransform';
import { generateLogsFromSpans } from '../lib/logGenerator';
import { cases } from '../data/cases';
import { helloSpanPhase2 } from '../data/phase2';

/**
 * Raw OTel span format from the Python worker telemetry
 */
interface RawOTelSpan {
  name: string;
  context: { span_id: string; trace_id: string };
  parent_id?: string;
  start_time: number;
  end_time: number;
  attributes: Record<string, any>;
  status?: { status_code: string; description?: string };
  events?: Array<{ name: string; timestamp: number; attributes?: Record<string, any> }>;
}

/**
 * State returned by usePhase2Data hook
 */
export interface Phase2DataState {
  /** Transformed Phase2Data or null if no data/error */
  data: Phase2Data | null;
  /** Error message if transformation failed */
  error: string | null;
  /** Whether valid data exists */
  hasData: boolean;
}

/**
 * Map of case IDs to their Phase2Data (for rootCauseOptions lookup)
 */
const CASE_PHASE2_DATA: Record<string, Phase2Data> = {
  'hello-span-001': helloSpanPhase2,
};

/**
 * Filter out malformed spans before transformation
 * 
 * A span is considered malformed if:
 * - Missing context object
 * - Missing span_id in context
 * - Invalid timestamps (start_time >= end_time)
 * 
 * @param spans - Raw spans from telemetry
 * @returns Filtered array of valid spans
 */
function filterMalformedSpans(spans: RawOTelSpan[]): RawOTelSpan[] {
  return spans.filter(span => {
    // Must have context with span_id
    if (!span.context?.span_id) {
      return false;
    }
    
    // Must have valid timestamps
    if (span.start_time >= span.end_time) {
      return false;
    }
    
    // Must have required fields
    if (!span.name || typeof span.start_time !== 'number' || typeof span.end_time !== 'number') {
      return false;
    }
    
    return true;
  });
}

/**
 * Get case definition for the given caseId
 * 
 * @param caseId - Case identifier
 * @returns Case definition or null if not found
 */
function getCase(caseId: string) {
  return cases.find(c => c.id === caseId) || null;
}

/**
 * Get root cause options for a case
 * 
 * @param caseId - Case identifier
 * @returns Array of root cause options or empty array if not found
 */
function getRootCauseOptions(caseId: string): RootCauseOption[] {
  return CASE_PHASE2_DATA[caseId]?.rootCauseOptions || [];
}

/**
 * React hook to transform raw OTel spans into Phase2Data format
 * 
 * This hook performs the bridge between Phase 1 (instrumentation) and Phase 2 (investigation):
 * - Transforms raw OTel spans from the Python worker into TraceSpan format
 * - Calculates trace metadata (traceId, totalDurationMs)
 * - Retrieves case-specific data (rootCauseOptions, narrative)
 * - Handles edge cases: empty spans, malformed data, missing cases
 * 
 * @param rawSpans - Array of raw OTel spans from useCodeRunner.spans
 * @param caseId - Current case identifier
 * @returns Phase2DataState with data, error, and hasData flags
 * 
 * @example
 * ```tsx
 * const { data, error, hasData } = usePhase2Data(spans, currentCaseId);
 * 
 * if (!hasData) {
 *   return <EmptyState />;
 * }
 * 
 * return <InvestigationView data={data} />;
 * ```
 */
export function usePhase2Data(rawSpans: RawOTelSpan[], caseId: string): Phase2DataState {
  return useMemo(() => {
    // No spans = no data
    if (!rawSpans || rawSpans.length === 0) {
      return {
        data: null,
        error: null,
        hasData: false,
      };
    }
    
    try {
      // Filter out malformed spans before transformation
      const validSpans = filterMalformedSpans(rawSpans);
      
      if (validSpans.length === 0) {
        return {
          data: null,
          error: 'No valid spans found (all spans were malformed)',
          hasData: false,
        };
      }
      
      // Transform spans to TraceSpan format
      const spans = transformSpans(validSpans);
      
      // Get trace metadata
      const traceId = getTraceId(validSpans);
      const totalDurationMs = getTotalDurationMs(validSpans);
      
      // Get case definition for narrative
      const caseDef = getCase(caseId);
      
      // Generate synthetic logs from spans
      const traceStartMs = Date.now() - totalDurationMs;
      const logs = generateLogsFromSpans(spans, traceId, traceStartMs);
      
      // Build Phase2Data object
      const phase2Data: Phase2Data = {
        traceId,
        totalDurationMs,
        spans,
        logs,
        rootCauseOptions: getRootCauseOptions(caseId),
        narrative: caseDef?.phase2?.description?.trim() || 'Investigate the incident',
      };
      
      return {
        data: phase2Data,
        error: null,
        hasData: true,
      };
      
    } catch (err) {
      // Transformation failed - return error state
      const errorMessage = err instanceof Error ? err.message : 'Unknown transformation error';
      
      return {
        data: null,
        error: errorMessage,
        hasData: false,
      };
    }
  }, [rawSpans, caseId]);
}
