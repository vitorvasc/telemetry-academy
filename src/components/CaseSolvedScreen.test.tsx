import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CaseSolvedScreen } from './CaseSolvedScreen'
import type { Case } from '../types'
import type { CaseProgress } from '../types/progress'
import type { Phase2Data } from '../types/phase2'

const solvedCase: Case = {
  id: 'case-001',
  name: 'Hello Span',
  difficulty: 'rookie',
  concepts: ['manual_spans'],
  phase1: { description: '', hints: [], validations: [], initialCode: '' },
}

const progress: CaseProgress = {
  caseId: 'case-001',
  status: 'solved',
  phase: 'complete',
  attempts: 1,
  timeStartedMs: 0,
  timeSolvedMs: 60_000,
}

const phase2Data: Phase2Data = {
  traceId: 'trace-1',
  totalDurationMs: 120,
  narrative: '',
  logs: [],
  spans: [
    {
      id: 's1',
      name: 'GET /checkout',
      service: 'api',
      durationMs: 120,
      offsetMs: 0,
      status: 'error',
      attributes: {},
      depth: 0,
    },
  ],
  rootCauseOptions: [
    {
      id: 'rc-0',
      label: 'Cache miss storm',
      correct: false,
      explanation: 'Not it.',
    },
    {
      id: 'rc-1',
      label: 'Database timeout',
      correct: true,
      explanation: 'The db span exceeded its deadline.',
    },
  ],
}

describe('CaseSolvedScreen', () => {
  it('renders the investigation review inline without a modal', () => {
    render(
      <CaseSolvedScreen
        solvedCase={solvedCase}
        progress={progress}
        onNext={vi.fn()}
        phase2Data={phase2Data}
      />
    )

    expect(screen.getByText('Investigation Review')).toBeInTheDocument()
    expect(screen.getByText('GET /checkout')).toBeInTheDocument()
    expect(screen.getByText('Database timeout')).toBeInTheDocument()
    expect(screen.queryByText('Cache miss storm')).not.toBeInTheDocument()
    expect(screen.queryByText('Review Investigation')).not.toBeInTheDocument()
    expect(
      screen.queryByLabelText('Close review modal')
    ).not.toBeInTheDocument()
  })
})
