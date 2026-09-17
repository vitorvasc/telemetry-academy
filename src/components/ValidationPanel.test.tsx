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

  it('shows the hint inline without a toggle at 1-2 prior attempts', () => {
    renderPanel([{ ...failedResult, attemptsOnThisRule: 1 }])
    expect(screen.getByText(failedResult.hintMessage!)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Need a hint?' })
    ).not.toBeInTheDocument()
  })

  it('shows the guided message at 3+ prior attempts', () => {
    renderPanel([
      { ...failedResult, attemptsOnThisRule: 3, guidedMessage: 'Guided text' },
    ])
    expect(screen.getByText('Guided text')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Need a hint?' })
    ).not.toBeInTheDocument()
  })

  it('does not render the toggle when validation passes', () => {
    renderPanel([{ ...failedResult, passed: true, message: 'Span found' }])
    expect(
      screen.queryByRole('button', { name: 'Need a hint?' })
    ).not.toBeInTheDocument()
  })
})

describe('ValidationPanel run button', () => {
  const renderButton = (
    props: Partial<React.ComponentProps<typeof ValidationPanel>>
  ) =>
    render(
      <ValidationPanel
        results={[]}
        isValidating={false}
        onValidate={vi.fn()}
        phaseUnlocked={false}
        {...props}
      />
    )

  it('is disabled with a loading label until the worker is ready', () => {
    renderButton({ isWorkerReady: false })
    expect(
      screen.getByRole('button', { name: /loading sandbox/i })
    ).toBeDisabled()
  })

  it('shows the loading stage label while initializing', () => {
    renderButton({
      isWorkerReady: false,
      loadingLabel: 'Setting up sandbox (3/3)',
    })
    expect(
      screen.getByRole('button', { name: /setting up sandbox \(3\/3\)/i })
    ).toBeDisabled()
  })

  it('is enabled once the worker is ready', () => {
    renderButton({ isWorkerReady: true })
    expect(screen.getByRole('button', { name: /check code/i })).toBeEnabled()
  })

  it('is disabled while a run is in progress', () => {
    renderButton({ isWorkerReady: true, isValidating: true })
    expect(screen.getByRole('button', { name: /running code/i })).toBeDisabled()
  })
})
