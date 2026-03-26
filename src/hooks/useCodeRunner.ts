import { useState, useEffect, useCallback, useRef } from 'react'
import setupScript from '../workers/python/setup_telemetry.py?raw'
import type { RawOTelSpan } from './usePhase2Data'

export type Language = 'python' | 'javascript'

interface WorkerMessage {
  type: string
  id?: string
  error?: string
  label?: string
  stage?: number
  total?: number
  message?: string
  span?: Record<string, unknown>
  result?: unknown
}

function createWorker(language: Language): Worker {
  // Static URL patterns required for Vite to detect and bundle worker files.
  // Each language branch must use a literal string in new URL().
  if (language === 'python') {
    return new Worker(new URL('../workers/python.worker.ts', import.meta.url), {
      type: 'module',
    })
  }
  if (language === 'javascript') {
    return new Worker(new URL('../workers/js.worker.ts', import.meta.url), {
      type: 'module',
    })
  }
  // language is narrowed to never here; cast to string for the error message
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`Unsupported language: ${language}`)
}

export function useCodeRunner(language: Language = 'python') {
  const [isReady, setIsReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState<string[]>([])
  const [spans, setSpans] = useState<RawOTelSpan[]>([])
  const [loadingLabel, setLoadingLabel] = useState<string>('')
  const workerRef = useRef<Worker | null>(null)

  const initWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
    }

    const worker = createWorker(language)
    workerRef.current = worker
    setIsReady(false)
    setInitError(null)

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const { type, error, id } = event.data
      if (type === 'ready') {
        setIsReady(true)
        setLoadingLabel('')
      } else if (type === 'loading-stage') {
        setLoadingLabel(
          `${event.data.label ?? ''} (${event.data.stage ?? 0}/${event.data.total ?? 0})`
        )
      } else if (type === 'error' && !id) {
        // run errors have an id; ignore them here
        // eslint-disable-next-line no-console
        console.error('Worker initialization error:', error)
        setInitError(error ?? null)
      }
    }

    worker.onerror = error => {
      // eslint-disable-next-line no-console
      console.error('Worker global error:', error)
      setInitError(String(error.message || 'Worker global error'))
    }

    if (language === 'python') {
      worker.postMessage({ type: 'init', setupScript })
    } else {
      // JS worker is ready immediately — no init needed
      setIsReady(true)
    }
  }, [language])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    initWorker()
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, [initWorker])

  const runCode = useCallback(
    (
      code: string,
      timeoutMs = 5000
    ): Promise<{ result: unknown; spans: RawOTelSpan[] }> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current || !isReady) {
          reject(new Error('Worker is not ready'))
          return
        }

        setIsRunning(true)
        setOutput([])
        setSpans([])

        const collectedSpans: RawOTelSpan[] = []
        const collectedLines: string[] = []
        const runId = crypto.randomUUID()

        const timeoutId = setTimeout(() => {
          if (workerRef.current) {
            // Remove the message listener before terminating to prevent
            // memory leaks and duplicate output from stale listeners
            workerRef.current.removeEventListener('message', messageHandler)
            workerRef.current.terminate()
            workerRef.current = null
          }
          setIsRunning(false)
          initWorker()
          reject(new Error(`Execution timed out after ${timeoutMs}ms`))
        }, timeoutMs)

        const messageHandler = (
          event: MessageEvent<
            WorkerMessage & { spans?: RawOTelSpan[]; output?: string[] }
          >
        ) => {
          const data = event.data

          const { type, id, result, error, message, span } = data

          if (type === 'stdout') {
            collectedLines.push(message ?? '')
            return
          }

          if (type === 'telemetry') {
            if (span) {
              const rawSpan = span as unknown as RawOTelSpan
              collectedSpans.push(rawSpan)
            }
            return
          }

          if (id !== runId) return

          // JS worker sends 'complete' with spans[] and output[] in one shot
          if (type === 'complete') {
            clearTimeout(timeoutId)
            workerRef.current?.removeEventListener('message', messageHandler)
            const jsSpans = data.spans ?? []
            const jsLines = data.output ?? []
            setOutput(jsLines)
            setSpans(jsSpans)
            setIsRunning(false)
            resolve({ result: undefined, spans: jsSpans })
            return
          }

          if (type === 'success') {
            clearTimeout(timeoutId)
            workerRef.current?.removeEventListener('message', messageHandler)
            setOutput(collectedLines)
            setSpans(collectedSpans)
            setIsRunning(false)
            resolve({ result, spans: collectedSpans })
          } else if (type === 'error') {
            clearTimeout(timeoutId)
            workerRef.current?.removeEventListener('message', messageHandler)
            // JS worker may include output even on error
            const errLines = data.output ?? collectedLines
            setOutput(errLines)
            setSpans(collectedSpans)
            setIsRunning(false)
            reject(new Error(error))
          }
        }

        workerRef.current.addEventListener('message', messageHandler)
        workerRef.current.postMessage({ type: 'run', code, id: runId })
      })
    },
    [isReady, initWorker]
  )

  return { isReady, initError, isRunning, output, spans, runCode, loadingLabel }
}
