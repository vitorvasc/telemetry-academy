/// <reference lib="webworker" />
import setupScript from './python/setup_telemetry.py?raw';

// Declare global types for Pyodide
declare global {
  function loadPyodide(config?: { indexURL?: string }): Promise<any>;
}

// Load Pyodide from CDN
importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js');

let pyodide: any = null;

self.onmessage = async (event: MessageEvent) => {
  const { type, code, id } = event.data;

  if (type === 'init') {
    try {
      pyodide = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
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
      // Execute the Python code
      const result = await pyodide.runPythonAsync(code);
      self.postMessage({ type: 'success', id, result });
    } catch (error) {
      self.postMessage({ type: 'error', id, error: String(error) });
    }
  }
};
