import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { CaseSelector } from './CaseSelector'
import type { Case } from '../types'
import type { CaseProgress } from '../types/progress'

const mockCases: Case[] = [
  {
    id: 'case-001',
    name: 'Hello Span',
    difficulty: 'rookie',
    concepts: [],
    phase1: { description: '', hints: [], validations: [], initialCode: '' },
  },
  {
    id: 'case-002',
    name: 'Auto Magic',
    difficulty: 'junior',
    concepts: [],
    phase1: { description: '', hints: [], validations: [], initialCode: '' },
  },
  {
    id: 'case-003',
    name: 'The Collector',
    difficulty: 'senior',
    concepts: [],
    phase1: { description: '', hints: [], validations: [], initialCode: '' },
  },
  {
    id: 'case-004',
    name: 'Slow DB',
    difficulty: 'staff',
    concepts: [],
    phase1: { description: '', hints: [], validations: [], initialCode: '' },
  },
]

const mkProgress = (
  id: string,
  status: CaseProgress['status'],
  phase: CaseProgress['phase']
): CaseProgress => ({ caseId: id, status, phase, attempts: 0 })

describe('CaseSelector', () => {
  it('Test 1: solved case renders a progress dot (not a lock icon)', () => {
    const progress: CaseProgress[] = [
      mkProgress('case-001', 'solved', 'complete'),
      mkProgress('case-002', 'locked', 'instrumentation'),
      mkProgress('case-003', 'locked', 'instrumentation'),
      mkProgress('case-004', 'locked', 'instrumentation'),
    ]

    render(
      <CaseSelector
        cases={mockCases}
        progress={progress}
        currentCaseId="case-001"
        onSelect={() => {}}
      />
    )

    // Solved case button should be enabled (not disabled)
    const helloSpanButton = screen.getByRole('button', { name: /Hello Span/i })
    expect(helloSpanButton).toBeEnabled()

    // Solved case should NOT have the tooltip for locked cases
    expect(helloSpanButton).not.toHaveAttribute(
      'title',
      'Complete previous case to unlock'
    )

    // Solved case should NOT render an SVG lock icon inside it
    const svgInsideSolved = helloSpanButton.querySelector('svg')
    expect(svgInsideSolved).not.toBeInTheDocument()
  })

  it('Test 2: in-progress case with phase=investigation renders an amber dot (not a sky ring)', () => {
    const progress: CaseProgress[] = [
      mkProgress('case-001', 'solved', 'complete'),
      mkProgress('case-002', 'in-progress', 'investigation'),
      mkProgress('case-003', 'locked', 'instrumentation'),
      mkProgress('case-004', 'locked', 'instrumentation'),
    ]

    const { container } = render(
      <CaseSelector
        cases={mockCases}
        progress={progress}
        currentCaseId="case-002"
        onSelect={() => {}}
      />
    )

    // In-progress + investigation → phase1done → amber dot
    // The dot is a div with no SVG child
    const autoMagicButton = screen.getByRole('button', { name: /Auto Magic/i })
    const dotDiv = autoMagicButton.querySelector('div')
    expect(dotDiv).toBeInTheDocument()
    expect(dotDiv?.tagName.toLowerCase()).toBe('div')

    // Should NOT render a sky ring (border-sky-400) for the phase1done state
    // (sky ring is only for 'active' status without phase=investigation)
    const skyRing = container.querySelector('.border-sky-400')
    // The sky ring, if present, should NOT be inside the Auto Magic button
    if (skyRing) {
      expect(autoMagicButton.contains(skyRing)).toBe(false)
    }
  })

  it('Test 3: locked case renders a lock icon and its button is disabled', () => {
    const progress: CaseProgress[] = [
      mkProgress('case-001', 'available', 'instrumentation'),
      mkProgress('case-002', 'locked', 'instrumentation'),
      mkProgress('case-003', 'locked', 'instrumentation'),
      mkProgress('case-004', 'locked', 'instrumentation'),
    ]

    render(
      <CaseSelector
        cases={mockCases}
        progress={progress}
        currentCaseId="case-001"
        onSelect={() => {}}
      />
    )

    const autoMagicButton = screen.getByRole('button', { name: /Auto Magic/i })

    // Locked button must be disabled
    expect(autoMagicButton).toBeDisabled()

    // Locked button should show the unlock tooltip
    expect(autoMagicButton).toHaveAttribute(
      'title',
      'Complete previous case to unlock'
    )

    // Locked case should render an SVG (the Lock icon from lucide-react)
    const lockIcon = autoMagicButton.querySelector('svg')
    expect(lockIcon).toBeInTheDocument()
  })

  it('Test 4: available case is enabled and renders a ring dot (not an SVG lock)', () => {
    const progress: CaseProgress[] = [
      mkProgress('case-001', 'solved', 'complete'),
      mkProgress('case-002', 'available', 'instrumentation'),
      mkProgress('case-003', 'locked', 'instrumentation'),
      mkProgress('case-004', 'locked', 'instrumentation'),
    ]

    render(
      <CaseSelector
        cases={mockCases}
        progress={progress}
        currentCaseId="case-001"
        onSelect={() => {}}
      />
    )

    const autoMagicButton = screen.getByRole('button', { name: /Auto Magic/i })

    // Available case must be enabled
    expect(autoMagicButton).toBeEnabled()

    // Available case should NOT show locked tooltip
    expect(autoMagicButton).not.toHaveAttribute(
      'title',
      'Complete previous case to unlock'
    )

    // Available case should NOT render an SVG lock icon
    const svgIcon = autoMagicButton.querySelector('svg')
    expect(svgIcon).not.toBeInTheDocument()

    // Should render a div (ring indicator), not an SVG
    const dotDiv = autoMagicButton.querySelector('div')
    expect(dotDiv).toBeInTheDocument()
    expect(dotDiv?.tagName.toLowerCase()).toBe('div')
  })

  it('renders all case names as button text', () => {
    const progress = mockCases.map(c =>
      mkProgress(c.id, 'available', 'instrumentation')
    )

    render(
      <CaseSelector
        cases={mockCases}
        progress={progress}
        currentCaseId="case-001"
        onSelect={() => {}}
      />
    )

    expect(
      screen.getByRole('button', { name: /Hello Span/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Auto Magic/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /The Collector/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Slow DB/i })).toBeInTheDocument()
  })

  it('calls onSelect with the correct case id when an available case is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const progress: CaseProgress[] = [
      mkProgress('case-001', 'solved', 'complete'),
      mkProgress('case-002', 'available', 'instrumentation'),
    ]

    render(
      <CaseSelector
        cases={mockCases.slice(0, 2)}
        progress={progress}
        currentCaseId="case-001"
        onSelect={onSelect}
      />
    )

    await user.click(screen.getByRole('button', { name: /Auto Magic/i }))
    expect(onSelect).toHaveBeenCalledWith('case-002')
  })

  it('does not call onSelect when a locked case is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const progress: CaseProgress[] = [
      mkProgress('case-001', 'available', 'instrumentation'),
      mkProgress('case-002', 'locked', 'instrumentation'),
    ]

    render(
      <CaseSelector
        cases={mockCases.slice(0, 2)}
        progress={progress}
        currentCaseId="case-001"
        onSelect={onSelect}
      />
    )

    // Locked button is disabled — userEvent will not fire click on disabled buttons
    const lockedButton = screen.getByRole('button', { name: /Auto Magic/i })
    expect(lockedButton).toBeDisabled()
    await user.click(lockedButton)
    expect(onSelect).not.toHaveBeenCalled()
  })
})
