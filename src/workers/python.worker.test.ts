import { describe, it, expect, vi } from 'vitest';

// Mock pyodide before importing the worker module (ESM top-level import)
vi.mock('pyodide', () => ({ loadPyodide: vi.fn() }));

import { serializeResult } from './python.worker';

describe('serializeResult', () => {
  it('returns null for null', () => {
    expect(serializeResult(null)).toBe(null);
  });

  it('returns null for undefined', () => {
    expect(serializeResult(undefined)).toBe(null);
  });

  it('passes through string primitives', () => {
    expect(serializeResult('hello')).toBe('hello');
  });

  it('passes through number primitives', () => {
    expect(serializeResult(42)).toBe(42);
  });

  it('calls toJs on PyProxy-like object and calls destroy', () => {
    const destroy = vi.fn();
    const proxy = { toJs: () => ({ foo: 'bar' }), destroy };
    expect(serializeResult(proxy)).toEqual({ foo: 'bar' });
    expect(destroy).toHaveBeenCalledOnce();
  });

  it('handles PyProxy without destroy gracefully', () => {
    const proxy = { toJs: () => [1, 2, 3] };
    expect(serializeResult(proxy)).toEqual([1, 2, 3]);
  });

  it('returns null for unknown objects (no toJs)', () => {
    expect(serializeResult({})).toBe(null);
  });

  it('returns null for functions', () => {
    expect(serializeResult(() => {})).toBe(null);
  });
});

// Note: loading-stage postMessage emission during init is verified manually (integration test).
// The worker emits { type: 'loading-stage', stage, total, label } before each major await in the
// 'init' handler. These messages are handled by useCodeRunner's initWorker onmessage handler,
// which updates the loadingLabel state. Unit-testing the worker's message emission requires
// a full Web Worker environment (Pyodide), which is not available in Vitest's jsdom context.
