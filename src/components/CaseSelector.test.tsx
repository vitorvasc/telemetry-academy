import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CaseSelector } from './CaseSelector';
import type { Case } from '../types';
import type { CaseProgress } from '../types/progress';

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
];

const mkProgress = (
  id: string,
  status: CaseProgress['status'],
  phase: CaseProgress['phase']
): CaseProgress => ({ caseId: id, status, phase, attempts: 0 });

describe('CaseSelector', () => {
  it('Test 1: solved case renders a green filled circle (not a lock icon)', () => {
    const progress: CaseProgress[] = [
      mkProgress('case-001', 'solved', 'complete'),
      mkProgress('case-002', 'locked', 'instrumentation'),
      mkProgress('case-003', 'locked', 'instrumentation'),
      mkProgress('case-004', 'locked', 'instrumentation'),
    ];

    const { container } = render(
      <CaseSelector
        cases={mockCases}
        progress={progress}
        currentCaseId="case-001"
        onSelect={() => {}}
      />
    );

    // Green filled circle: bg-green-400 class on a div (not a lock icon svg)
    const greenDot = container.querySelector('.bg-green-400');
    expect(greenDot).toBeInTheDocument();
    // Should NOT render a Lock SVG for the solved case
    // The lock icon from lucide has aria role or specific structure — check no lock class for first button
    const firstButton = container.querySelectorAll('button')[0];
    // Lock icon uses w-2.5 h-2.5 with text-slate-700, but green solved should be a div not an svg in the lock position
    expect(firstButton?.querySelector('.bg-green-400')).toBeInTheDocument();
  });

  it('Test 2: in-progress case with phase=investigation renders amber indicator (not sky ring)', () => {
    const progress: CaseProgress[] = [
      mkProgress('case-001', 'solved', 'complete'),
      mkProgress('case-002', 'in-progress', 'investigation'),
      mkProgress('case-003', 'locked', 'instrumentation'),
      mkProgress('case-004', 'locked', 'instrumentation'),
    ];

    const { container } = render(
      <CaseSelector
        cases={mockCases}
        progress={progress}
        currentCaseId="case-002"
        onSelect={() => {}}
      />
    );

    // Amber indicator: bg-amber-400/60 and border-amber-400 classes
    const amberDot = container.querySelector('.bg-amber-400\\/60');
    expect(amberDot).toBeInTheDocument();
    // Should NOT render a sky-ring (border-sky-400) for this case
    const secondButton = container.querySelectorAll('button')[1];
    expect(secondButton?.querySelector('.border-sky-400')).not.toBeInTheDocument();
  });

  it('Test 3: locked case renders a lock icon', () => {
    const progress: CaseProgress[] = [
      mkProgress('case-001', 'available', 'instrumentation'),
      mkProgress('case-002', 'locked', 'instrumentation'),
      mkProgress('case-003', 'locked', 'instrumentation'),
      mkProgress('case-004', 'locked', 'instrumentation'),
    ];

    const { container } = render(
      <CaseSelector
        cases={mockCases}
        progress={progress}
        currentCaseId="case-001"
        onSelect={() => {}}
      />
    );

    // Locked case: Lock icon has text-slate-700 class
    const lockedButtons = container.querySelectorAll('button');
    const secondButton = lockedButtons[1]; // case-002 is locked
    // Lock SVG should be present inside the locked button
    const lockIcon = secondButton?.querySelector('svg');
    expect(lockIcon).toBeInTheDocument();
    expect(lockIcon?.classList.contains('text-slate-700')).toBe(true);
  });

  it('Test 4: available case renders a slate ring indicator', () => {
    const progress: CaseProgress[] = [
      mkProgress('case-001', 'solved', 'complete'),
      mkProgress('case-002', 'available', 'instrumentation'),
      mkProgress('case-003', 'locked', 'instrumentation'),
      mkProgress('case-004', 'locked', 'instrumentation'),
    ];

    const { container } = render(
      <CaseSelector
        cases={mockCases}
        progress={progress}
        currentCaseId="case-001"
        onSelect={() => {}}
      />
    );

    // Available case: slate ring has border-slate-500 class
    const secondButton = container.querySelectorAll('button')[1];
    const slateDot = secondButton?.querySelector('.border-slate-500');
    expect(slateDot).toBeInTheDocument();
    // It should be a div (ring), not an svg (lock icon)
    expect(slateDot?.tagName.toLowerCase()).toBe('div');
  });
});
