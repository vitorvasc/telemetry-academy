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
  const [spans, setSpans] = useState<any[]>([]);
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
    initWorker();
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [initWorker]);

  const runCode = useCallback((code: string, timeoutMs = 5000): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isReady) {
        reject(new Error('Worker is not ready'));
        return;
      }

      setIsRunning(true);
      setOutput([]);
      setSpans([]);

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
          } catch (e) {
            return;
          }
        }

        const { type, id, result, error, message, span } = data;

        if (type === 'stdout') {
          setOutput(prev => [...prev, message]);
          return;
        }

        if (type === 'telemetry') {
          setSpans(prev => [...prev, span]);
          return;
        }

        if (id !== runId) return;

        if (type === 'success') {
          clearTimeout(timeoutId);
          workerRef.current?.removeEventListener('message', messageHandler);
          setIsRunning(false);
          resolve(result);
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

  return { isReady, initError, isRunning, output, spans, runCode };
}
