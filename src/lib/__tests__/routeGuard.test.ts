import { describe, it, expect } from 'vitest'
import { resolveGuardedCase } from '../routeGuard'
import type { CaseProgress, CaseStatus } from '../../types/progress'

function progressOf(statuses: CaseStatus[]): CaseProgress[] {
  return statuses.map((status, i) => ({
    caseId: `00${i + 1}`,
    status,
    phase: 'instrumentation',
    attempts: 0,
  }))
}

describe('resolveGuardedCase', () => {
  it('allows unlocked cases through unchanged', () => {
    const progress = progressOf(['solved', 'available', 'locked'])
    expect(resolveGuardedCase(progress, '001')).toBe('001')
    expect(resolveGuardedCase(progress, '002')).toBe('002')
  })

  it('redirects a locked case to the highest-ordered unlocked case', () => {
    const progress = progressOf(['solved', 'in-progress', 'locked', 'locked'])
    expect(resolveGuardedCase(progress, '004')).toBe('002')
  })

  it('returns null when every case is locked', () => {
    expect(
      resolveGuardedCase(progressOf(['locked', 'locked']), '002')
    ).toBeNull()
  })

  it('does not touch ids missing from progress', () => {
    expect(resolveGuardedCase(progressOf(['available']), 'nope')).toBe('nope')
  })
})
