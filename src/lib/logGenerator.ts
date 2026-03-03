import type { TraceSpan, LogEntry } from '../types/phase2';

export interface LogEvent {
  name: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: number; // Relative ms from trace start
}

/**
 * Format timestamp as HH:MM:SS.mmm string
 */
function formatTimestamp(relativeMs: number, traceStartMs: number): string {
  const totalMs = traceStartMs + relativeMs;
  const date = new Date(totalMs);
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  const ss = date.getSeconds().toString().padStart(2, '0');
  const mmm = Math.floor(date.getMilliseconds()).toString().padStart(3, '0');
  return `${hh}:${mm}:${ss}.${mmm}`;
}

/**
 * Create a log entry for span start
 */
function createSpanStartLog(span: TraceSpan): LogEvent {
  return {
    name: `${span.name}_start`,
    level: 'info',
    message: `Starting ${span.name}`,
    timestamp: span.offsetMs + 1, // Slight offset to avoid collision
  };
}

/**
 * Create a log entry for span end
 */
function createSpanEndLog(span: TraceSpan): LogEvent {
  return {
    name: `${span.name}_end`,
    level: 'info',
    message: `Completed ${span.name} in ${span.durationMs}ms`,
    timestamp: span.offsetMs + span.durationMs - 1, // Just before end
  };
}

/**
 * Create a warning log for slow spans based on contextual attributes
 */
function createWarningLog(span: TraceSpan): LogEvent | null {
  if (span.status !== 'warning') return null;

  const attrs = span.attributes;
  let message: string | null = null;
  let timestamp = span.offsetMs + 10; // Shortly after start

  // Check for connection pool wait
  if (attrs['db.connection_pool.wait_ms']) {
    const waitMs = attrs['db.connection_pool.wait_ms'];
    message = `DB connection pool exhausted, waiting for available connection (pool_size=5, waiting=${waitMs}ms)`;
  }
  // Check for slow HTTP request
  else if (attrs['http.request.duration']) {
    const duration = parseInt(attrs['http.request.duration'], 10);
    if (duration > 100) {
      message = `Slow HTTP request detected (${duration}ms)`;
    }
  }
  // Check for cache miss
  else if (attrs['cache.miss'] === 'true' && attrs['cache.key']) {
    message = `Cache miss for key ${attrs['cache.key']}`;
  }
  // Generic warning if no specific context
  else {
    message = `Warning: ${span.name} is experiencing degraded performance`;
  }

  if (!message) return null;

  return {
    name: `${span.name}_warning`,
    level: 'warn',
    message,
    timestamp,
  };
}

/**
 * Create an error log for error spans based on error attributes
 */
function createErrorLog(span: TraceSpan): LogEvent | null {
  if (span.status !== 'error') return null;

  const attrs = span.attributes;
  let message: string | null = null;
  let timestamp = span.offsetMs + span.durationMs - 5; // Near end

  // Check for error message
  if (attrs['error.message']) {
    message = attrs['error.message'];
  }
  // Check for HTTP status code error
  else if (attrs['http.status_code']) {
    const statusCode = attrs['http.status_code'];
    message = `HTTP error ${statusCode}`;
  }
  // Check for error type
  else if (attrs['error.type']) {
    message = `Error in ${span.name}: ${attrs['error.type']}`;
  }
  // Generic error if no specific context
  else {
    message = `Error: ${span.name} failed`;
  }

  if (!message) return null;

  return {
    name: `${span.name}_error`,
    level: 'error',
    message,
    timestamp,
  };
}

/**
 * Generate synthetic logs from span data
 * 
 * Creates realistic log entries that correlate with trace spans:
 * - Each span generates start and end logs
 * - Warning spans generate contextual warning logs
 * - Error spans generate error logs with details
 * 
 * @param spans - Array of TraceSpan objects
 * @param traceId - The trace ID to associate with logs
 * @param traceStartMs - The timestamp (in ms) when the trace started
 * @returns Array of LogEntry objects sorted by timestamp
 */
export function generateLogsFromSpans(
  spans: TraceSpan[],
  traceId: string,
  traceStartMs: number
): LogEntry[] {
  // Handle empty spans array
  if (!spans || spans.length === 0) {
    return [];
  }

  // Use current time as base if traceStartMs is missing/invalid
  const baseTime = traceStartMs && !isNaN(traceStartMs) 
    ? traceStartMs 
    : Date.now();

  const logEvents: LogEvent[] = [];

  for (const span of spans) {
    // Always generate start log
    logEvents.push(createSpanStartLog(span));

    // Generate warning log for slow spans
    const warningLog = createWarningLog(span);
    if (warningLog) {
      logEvents.push(warningLog);
    }

    // Generate error log for error spans
    const errorLog = createErrorLog(span);
    if (errorLog) {
      logEvents.push(errorLog);
    }

    // Always generate end log
    logEvents.push(createSpanEndLog(span));
  }

  // Sort all logs by timestamp
  logEvents.sort((a, b) => a.timestamp - b.timestamp);

  // Convert LogEvents to LogEntries with formatted timestamps
  return logEvents.map(event => ({
    timestamp: formatTimestamp(event.timestamp, baseTime),
    level: event.level,
    message: event.message,
    traceId,
    spanId: spans.find(s => 
      event.name.startsWith(s.name)
    )?.id || 'unknown',
    service: spans.find(s => 
      event.name.startsWith(s.name)
    )?.service || 'unknown',
  }));
}
