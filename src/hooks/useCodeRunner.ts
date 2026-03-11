import { useState, useEffect, useCallback, useRef } from 'react';
import setupScript from '../workers/python/setup_telemetry.py?raw';

export type Language = 'python';

function createWorker(language: Language): Worker {
  // Static URL patterns required for Vite to detect and bundle worker files.
  // Each language branch must use a literal string in new URL().
  if (language === 'python') {
    return new Worker(new URL('../workers/python.worker.ts', import.meta.url), { type: 'module' });
  }
  throw new Error(`Unsupported language: ${language}`);
}

export function useCodeRunner(language: Language = 'python') {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [spans, setSpans] = useState<Record<string, unknown>[]>([]);
  const [loadingLabel, setLoadingLabel] = useState<string>('');
  const workerRef = useRef<Worker | null>(null);

  const initWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    const worker = createWorker(language);
    workerRef.current = worker;
    setIsReady(false);
    setInitError(null);

    worker.onmessage = (event) => {
      const { type, error, id } = event.data;
      if (type === 'ready') {
        setIsReady(true);
        setLoadingLabel('');
      } else if (type === 'loading-stage') {
        setLoadingLabel(`${event.data.label} (${event.data.stage}/${event.data.total})`);
      } else if (type === 'error' && !id) {  // run errors have an id; ignore them here
        console.error('Worker initialization error:', error);
        setInitError(error);
      }
    };

    worker.onerror = (error) => {
      console.error('Worker global error:', error);
      setInitError(String(error.message || 'Worker global error'));
    };

    worker.postMessage({ type: 'init', setupScript });
  }, [language]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    initWorker();
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [initWorker]);

  const runCode = useCallback((code: string, timeoutMs = 5000): Promise<{ result: unknown; spans: Record<string, unknown>[] }> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isReady) {
        reject(new Error('Worker is not ready'));
        return;
      }

      setIsRunning(true);
      setOutput([]);
      setSpans([]);

      const collectedSpans: Record<string, unknown>[] = [];
      const runId = Math.random().toString(36).substring(7);

      const timeoutId = setTimeout(() => {
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
        setIsRunning(false);
        initWorker();
        reject(new Error(`Execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const messageHandler = (event: MessageEvent) => {
        let data = event.data;

        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch {
            return;
          }
        }

        const { type, id, result, error, message, span } = data;

        if (type === 'stdout') {
          setOutput(prev => [...prev, message]);
          return;
        }

        if (type === 'telemetry') {
          collectedSpans.push(span);
          setSpans(prev => [...prev, span]);
          return;
        }

        if (id !== runId) return;

        if (type === 'success') {
          clearTimeout(timeoutId);
          workerRef.current?.removeEventListener('message', messageHandler);
          setIsRunning(false);
          resolve({ result, spans: collectedSpans });
        } else if (type === 'error') {
          clearTimeout(timeoutId);
          workerRef.current?.removeEventListener('message', messageHandler);
          setIsRunning(false);
          reject(new Error(error));
        }
      };

      workerRef.current.addEventListener('message', messageHandler);
      workerRef.current.postMessage({ type: 'run', code, id: runId });
    });
  }, [isReady, initWorker]);

  return { isReady, initError, isRunning, output, spans, runCode, loadingLabel };
}
