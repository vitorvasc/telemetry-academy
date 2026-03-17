export type CaseStatus = 'locked' | 'available' | 'in-progress' | 'solved'

export interface CaseProgress {
  caseId: string
  status: CaseStatus
  phase: 'instrumentation' | 'investigation' | 'complete'
  attempts: number
  timeStartedMs?: number
  timeSolvedMs?: number
}
