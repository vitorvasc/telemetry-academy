export interface TraceSpan {
  id: string;
  name: string;
  service: string;
  durationMs: number;
  offsetMs: number;
  status: 'ok' | 'error' | 'warning';
  attributes: Record<string, string>;
  depth: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  traceId: string;
  spanId: string;
  service: string;
}

export interface RootCauseOption {
  id: string;
  label: string;
  correct: boolean;
  explanation: string;
}

export interface Phase2Data {
  traceId: string;
  totalDurationMs: number;
  spans: TraceSpan[];
  logs: LogEntry[];
  rootCauseOptions: RootCauseOption[];
  narrative: string;
}
