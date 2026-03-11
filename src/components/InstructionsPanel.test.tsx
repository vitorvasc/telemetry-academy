import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InstructionsPanel } from './InstructionsPanel';
import type { Case } from '../types';

const mockCase: Case = {
  id: 'test',
  name: 'Test Case',
  difficulty: 'rookie',
  concepts: [],
  phase1: {
    description: '',
    hints: ['Hint one', 'Hint two'],
    validations: [],
    initialCode: '',
  },
  phase2: undefined,
};

describe('InstructionsPanel', () => {
  it('renders hints list in the DOM without any user interaction', () => {
    render(
      <InstructionsPanel
        case={mockCase}
        phaseUnlocked={false}
      />
    );
    expect(screen.getByText('Hint one')).toBeInTheDocument();
    expect(screen.getByText('Hint two')).toBeInTheDocument();
  });

  it('does not render a collapsible button with a "Hints" label', () => {
    render(
      <InstructionsPanel
        case={mockCase}
        phaseUnlocked={false}
      />
    );
    // There should be no button element with "Hints" text (it's always visible now)
    const buttons = screen.queryAllByRole('button');
    const hintsButton = buttons.find((btn: HTMLElement) => btn.textContent?.includes('Hints'));
    expect(hintsButton).toBeUndefined();
  });

  it('renders all hint text items from the hints array', () => {
    render(
      <InstructionsPanel
        case={mockCase}
        phaseUnlocked={false}
      />
    );
    mockCase.phase1.hints.forEach((hint) => {
      expect(screen.getByText(hint)).toBeInTheDocument();
    });
  });
});
