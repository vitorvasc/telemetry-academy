export interface Case {
  id: string;
  name: string;
  difficulty: 'rookie' | 'junior' | 'senior' | 'staff';
  concepts: string[];
  phase1: Phase1Config;
  phase2?: Phase2Config;
}

export interface Phase1Config {
  description: string;
  hints: string[];
  initialCode: string;
  validations: ValidationRule[];
}

export interface Phase2Config {
  description: string;
  investigationTools: ('traces' | 'logs' | 'metrics')[];
}

export interface ValidationRule {
  type: 'span_exists' | 'attribute_exists' | 'attribute_value' | 'span_count' | 'status_ok' | 'status_error' | 'telemetry_flowing' | 'error_handling';
  description: string;
  successMessage: string;
  errorMessage: string;
  // Progressive hint messages for escalating guidance
  hintMessage?: string;
  guidedMessage?: string;
  // Optional params for specific validations
  spanName?: string;
  attributeKey?: string;
  attributeValue?: any;
  minCount?: number;
}

export interface ValidationResult extends ValidationRule {
  passed: boolean;
  message: string;
  attemptsOnThisRule: number;
}

export interface TraceSpan {
  id: string;
  name: string;
  service: string;
  duration: number;
  startTime: number;
  attributes: Record<string, string>;
  status: 'ok' | 'error';
  parentId?: string;
  children?: TraceSpan[];
}

export interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  traceId?: string;
  spanId?: string;
  service: string;
}
