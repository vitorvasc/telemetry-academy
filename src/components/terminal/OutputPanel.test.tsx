import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { OutputPanel } from './OutputPanel'
import type { RawOTelSpan } from '../../hooks/usePhase2Data'

const root: RawOTelSpan = {
  name: 'checkout',
  context: { span_id: 'aaa', trace_id: 't1' },
  start_time: 1000,
  end_time: 1012.5,
  attributes: { 'order.id': 'ord-42', 'order.total': 99.9 },
  status: { status_code: 'OK' },
}

const child: RawOTelSpan = {
  name: 'charge_card',
  context: { span_id: 'bbb', trace_id: 't1' },
  parent_id: 'aaa',
  start_time: 1002,
  end_time: 1005,
  attributes: {},
  status: { status_code: 'ERROR' },
}

describe('OutputPanel spans tab', () => {
  it('shows the empty state when no spans were captured', () => {
    render(<OutputPanel output={[]} spans={[]} />)
    fireEvent.click(screen.getByRole('tab', { name: /spans/i }))
    expect(
      screen.getByText(
        'No spans captured yet. Run your code to see telemetry output.'
      )
    ).toBeVisible()
  })

  it('lists every span with name, attributes, parent, status and duration', () => {
    render(<OutputPanel output={['hello']} spans={[root, child]} />)
    fireEvent.click(screen.getByRole('tab', { name: /spans/i }))

    expect(screen.getByText('checkout')).toBeVisible()
    expect(screen.getByText('charge_card')).toBeVisible()
    expect(screen.getByText('order.id')).toBeVisible()
    expect(screen.getByText('ord-42')).toBeVisible()
    expect(screen.getByText('parent: root')).toBeVisible()
    expect(screen.getByText('parent: aaa')).toBeVisible()
    expect(screen.getByText('OK')).toBeVisible()
    expect(screen.getByText('ERROR')).toBeVisible()
    expect(screen.getByText('12.50 ms')).toBeVisible()
    expect(screen.getByText('3.00 ms')).toBeVisible()

    // Output tab content stays mounted (display:none), not unmounted
    expect(screen.getByText('hello')).not.toBeVisible()
    fireEvent.click(screen.getByRole('tab', { name: /output/i }))
    expect(screen.getByText('hello')).toBeVisible()
    expect(screen.getByText('checkout')).not.toBeVisible()
  })
})
