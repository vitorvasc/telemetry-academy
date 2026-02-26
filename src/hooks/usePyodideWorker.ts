import { useState, useEffect, useCallback, useRef } from 'react';

export function usePyodideWorker() {
  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [spans, setSpans] = useState<any[]>([]);
  const workerRef = useRef<Worker | null>(null);

  const initWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    const worker = new Worker(new URL('../workers/pyodide.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    setIsReady(false);

    worker.onmessage = (event) => {
      const { type } = event.data;
      if (type === 'ready') {
        setIsReady(true);
      }
    };

    worker.postMessage({ type: 'init' });
  }, []);

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
        // Timeout reached, terminate and recreate
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
        setIsRunning(false);
        initWorker(); // Respawn worker
        reject(new Error(`Execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const messageHandler = (event: MessageEvent) => {
        let data = event.data;
        
        // Handle JSON strings originating from Python's js.postMessage
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) {
            // Not a JSON string, ignore or log
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

  return { isReady, isRunning, output, spans, runCode };
}
