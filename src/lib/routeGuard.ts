import type { CaseProgress } from '../types/progress'

/**
 * Resolves which case a `/case/:id` route may show.
 * Returns `requestedId` when it is not locked, otherwise the highest-ordered
 * unlocked case id, or `null` when nothing is unlocked (send home).
 * `progress` must be in case order.
 */
export function resolveGuardedCase(
  progress: CaseProgress[],
  requestedId: string
): string | null {
  const requested = progress.find(p => p.caseId === requestedId)
  if (requested?.status !== 'locked') return requestedId
  for (let i = progress.length - 1; i >= 0; i--) {
    if (progress[i].status !== 'locked') return progress[i].caseId
  }
  return null
}
