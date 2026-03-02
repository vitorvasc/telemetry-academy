import { loadPyodide } from 'pyodide';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pyodide: any = null;

self.onmessage = async (event: MessageEvent) => {
  const { type, code, id, setupScript } = event.data;

  if (type === 'init') {
    try {
      pyodide = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.3/full/',
      });

      await pyodide.loadPackage('micropip');
      const micropip = pyodide.pyimport('micropip');
      await micropip.install(['opentelemetry-api', 'opentelemetry-sdk']);

      await pyodide.runPythonAsync(setupScript);

      self.postMessage({ type: 'ready' });
    } catch (error) {
      self.postMessage({ type: 'error', error: String(error) });
    }
  } else if (type === 'run') {
    if (!pyodide) {
      self.postMessage({ type: 'error', id, error: 'Pyodide is not initialized' });
      return;
    }

    try {
      const result = await pyodide.runPythonAsync(code);
      self.postMessage({ type: 'success', id, result });
    } catch (error) {
      self.postMessage({ type: 'error', id, error: String(error) });
    }
  }
};
