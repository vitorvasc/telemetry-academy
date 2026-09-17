import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ValidationPanel } from './ValidationPanel'
import type { ValidationResult } from '../types'

const failedResult: ValidationResult = {
  type: 'span_exists',
  description: 'Creates a span',
  successMessage: 'Span found',
  errorMessage: 'No span found',
  hintMessage: 'Use tracer.start_as_current_span()',
  message: 'No span found',
  passed: false,
  attemptsOnThisRule: 0,
}

const renderPanel = (results: ValidationResult[]) =>
  render(
    <ValidationPanel
      results={results}
      isValidating={false}
      onValidate={vi.fn()}
      phaseUnlocked={false}
    />
  )

describe('ValidationPanel hint toggle', () => {
  it('reveals the hint after the first failed attempt when clicked', async () => {
    renderPanel([failedResult])
    expect(
      screen.queryByText(failedResult.hintMessage!)
    ).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Need a hint?' }))

    expect(screen.getByText(failedResult.hintMessage!)).toBeInTheDocument()
  })

  it('does not render the toggle when validation passes', () => {
    renderPanel([{ ...failedResult, passed: true, message: 'Span found' }])
    expect(
      screen.queryByRole('button', { name: 'Need a hint?' })
    ).not.toBeInTheDocument()
  })
})
