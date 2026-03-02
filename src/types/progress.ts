export type CaseStatus = 'locked' | 'available' | 'in-progress' | 'solved';

export interface CaseProgress {
  caseId: string;
  status: CaseStatus;
  phase: 'instrumentation' | 'investigation' | 'complete';
  attempts: number;
  timeStartedMs?: number;
  timeSolvedMs?: number;
}

export interface PersistedState {
  version: number;
  progress: CaseProgress[];
  caseCode: Record<string, string>;
  attemptHistory: Record<string, Record<string, number>>; // caseId -> rule -> count
  timestamp: number;
}
