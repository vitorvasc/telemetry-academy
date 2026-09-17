import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { RawOTelSpan } from '../hooks/usePhase2Data'

// Importing the worker module registers its `self.onmessage` handler.
import './js.worker'

type Posted = {
  type: string
  id?: string
  spans?: RawOTelSpan[]
  output?: string[]
  error?: string
}

const INSTRUMENTED_CODE = `
const tracer = trace.getTracer('orders')
function processOrder(orderId) {
  return tracer.startActiveSpan('process_order', span => {
    span.setAttribute('order_id', orderId)
    span.end()
    return 'ok'
  })
}
console.log(processOrder('42'))
`

async function run(id: string, code: string): Promise<Posted> {
  const posted = vi.fn<(msg: Posted) => void>()
  const spy = vi
    .spyOn(self, 'postMessage')
    .mockImplementation(msg => posted(msg as Posted))
  await self.onmessage!.call(
    self,
    new MessageEvent('message', { data: { type: 'run', id, code } })
  )
  spy.mockRestore()
  expect(posted).toHaveBeenCalledOnce()
  return posted.mock.calls[0][0]
}

describe('js.worker run', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('delivers spans ended by user code on the first run', async () => {
    const msg = await run('run-1', INSTRUMENTED_CODE)
    expect(msg.type).toBe('complete')
    expect(msg.id).toBe('run-1')
    expect(msg.output).toEqual(['ok'])
    expect(msg.spans).toHaveLength(1)
    expect(msg.spans![0].name).toBe('process_order')
    expect(msg.spans![0].attributes).toEqual({ order_id: '42' })
    expect(msg.spans![0].status.status_code).toBe('UNSET')
  })

  it('keeps delivering spans on later runs in the same worker', async () => {
    const msg = await run('run-2', INSTRUMENTED_CODE)
    expect(msg.type).toBe('complete')
    expect(msg.spans).toHaveLength(1)
    expect(msg.spans![0].name).toBe('process_order')
  })

  it('does not carry spans over from a previous run', async () => {
    const msg = await run('run-3', 'console.log("no spans")')
    expect(msg.type).toBe('complete')
    expect(msg.spans).toEqual([])
    expect(msg.output).toEqual(['no spans'])
  })
})
