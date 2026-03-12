import { loadPyodide } from 'pyodide';
import type { PyodideInterface } from 'pyodide';

let pyodide: PyodideInterface | null = null;

/**
 * Converts a Pyodide PyProxy (or any value) to a plain, structured-cloneable
 * JS value before postMessage. Without this, postMessage throws DataCloneError
 * because PyProxy objects are not structured-cloneable.
 */
export function serializeResult(result: unknown): unknown {
  if (result === null || result === undefined) return null;
  // Primitive JS values are structured-cloneable as-is
  if (typeof result !== 'object' && typeof result !== 'function') return result;
  // Pyodide PyProxy objects have a toJs() method
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (result as any).toJs === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plain = (result as any).toJs({ dict_converter: Object.fromEntries });
    // Destroy the proxy to free Python memory
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (result as any).destroy === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any).destroy();
    }
    return plain;
  }
  // Unknown object type — return null rather than risk DataCloneError
  return null;
}

self.onmessage = async (event: MessageEvent) => {
  const { type, code, id, setupScript } = event.data;

  if (type === 'init') {
    try {
      self.postMessage({ type: 'loading-stage', stage: 1, total: 3, label: 'Loading Python runtime' });
      // NOTE: Keep this version in sync with the "pyodide" entry in package.json.
      // When upgrading pyodide, update the version segment in this URL to match.
      pyodide = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.3/full/',
        // @ts-expect-error - cache option exists but types are outdated
        cache: true,
      });

      self.postMessage({ type: 'loading-stage', stage: 2, total: 3, label: 'Installing packages' });
      await pyodide.loadPackage('micropip');
      const micropip = pyodide.pyimport('micropip');
      await micropip.install(['opentelemetry-api', 'opentelemetry-sdk']);

      self.postMessage({ type: 'loading-stage', stage: 3, total: 3, label: 'Setting up sandbox' });
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
      self.postMessage({ type: 'success', id, result: serializeResult(result) });
    } catch (error) {
      self.postMessage({ type: 'error', id, error: String(error) });
    }
  }
};
