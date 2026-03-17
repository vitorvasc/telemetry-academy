# Worker postMessage Protocol

The execution workers communicate with the host (`src/hooks/useCodeRunner.ts`) via `postMessage`. This document describes all message types for both the Python and JavaScript workers.

---

## JavaScript Worker

The JavaScript worker (`src/workers/js.worker.ts`) has a simpler lifecycle than the Python worker — no init/ready handshake is needed.

### Lifecycle

The host sets `isReady = true` immediately after creating the JS worker (no `init` message sent, no `ready` message expected). The Run button activates as soon as the worker is created.

### Host → Worker: `run`

Same shape as the Python worker:

```typescript
{ type: 'run', code: string, id: string }
```

- `code` — the student's JavaScript code, executed in a sandboxed function scope with OTel globals injected.
- `id` — correlation ID matching the eventual `complete` or `error` response.

### Worker → Host: `complete`

Sent when execution finishes without throwing.

```typescript
{ type: 'complete', id: string, spans: RawOTelSpan[], output: string[] }
```

- `spans` — all finished spans from the `InMemorySpanExporter`, converted to `RawOTelSpan` format.
- `output` — captured `console.log/warn/error` lines, batched (no streaming).

### Worker → Host: `error`

Sent on execution failure or timeout. **Always has `id`** (no init-phase errors).

```typescript
{ type: 'error', id: string, error: string, output?: string[] }
```

- `output` — console lines captured before the error, if any.

### Key Differences from Python Worker

| Feature | Python | JavaScript |
|---------|--------|-----------|
| Init handshake | `init` → `ready` | None — host sets `isReady` immediately |
| Streaming output | `stdout`/`telemetry` messages | Batched in `complete` |
| Timeout (worker-side) | N/A | 5s `setTimeout` guards async hangs |
| Sync loop protection | N/A | Host `Worker.terminate()` (worker-side timeout can't interrupt a blocked event loop) |

---

## Python Worker

The Python execution worker (`src/workers/python.worker.ts`) communicates with the host (`src/hooks/useCodeRunner.ts`) via `postMessage`. This document describes all message types in both directions.

---

## Host → Worker Messages

### `init`

Sent once on worker startup to load Pyodide and install packages.

```typescript
{ type: 'init', setupScript: string }
```

- `setupScript` — the Python bootstrap code (loaded from `src/workers/python/setup_telemetry.py`) that installs the custom OTel exporter. Loaded via `?raw` import.
- No `id` field — this is a one-shot initialization, not a correlated request.

### `run`

Sent each time the student clicks "Run".

```typescript
{ type: 'run', code: string, id: string }
```

- `code` — the student's Python code to execute via `pyodide.runPythonAsync()`.
- `id` — a random correlation ID (e.g. `"x4f2k1"`) used to match this request to the eventual `success` or `error` response. Generated with `Math.random().toString(36).substring(7)`.

---

## Worker → Host Messages

### `loading-stage`

Sent during `init` to report progress (before `ready`). Three stages are emitted:

```typescript
{ type: 'loading-stage', stage: number, total: number, label: string }
```

| stage | label |
|-------|-------|
| 1 | `'Loading Python runtime'` |
| 2 | `'Installing packages'` |
| 3 | `'Setting up sandbox'` |

The host renders these as a loading indicator: `"${label} (${stage}/${total})"`.

### `ready`

Sent once after `init` completes successfully. No additional fields.

```typescript
{ type: 'ready' }
```

Sets `isReady = true` in the host. Run button becomes active.

### `error` (init failure)

Sent if `init` fails (Pyodide load error, package install failure, or setup script error). **No `id` field.**

```typescript
{ type: 'error', error: string }
```

The absence of `id` distinguishes this from a run error. The host sets `initError` state.

### `error` (run failure)

Sent if a `run` execution throws (Python syntax error, runtime exception, timeout). **Has `id` field matching the originating `run` message.**

```typescript
{ type: 'error', id: string, error: string }
```

The host rejects the `runCode` promise with `new Error(error)`.

### `success`

Sent when a `run` execution completes without throwing. **Has `id` field.**

```typescript
{ type: 'success', id: string, result: unknown }
```

- `result` — the return value of `pyodide.runPythonAsync(code)`, serialized via `serializeResult()` to strip Pyodide `PyProxy` objects (which are not structured-cloneable). Non-serializable values become `null`.
- The host resolves the `runCode` promise with `{ result, spans: collectedSpans }`.

### `stdout`

Sent by the Python setup script when the student's code calls `print()`. Emitted for each line of output.

```typescript
{ type: 'stdout', message: string }
```

The host appends `message` to the `output` state array (displayed in the console panel).

### `telemetry`

Sent by the custom OTel exporter whenever a span is exported. One message per span.

```typescript
{ type: 'telemetry', span: Record<string, unknown> }
```

- `span` — the serialized OTel span object. The host casts it to `RawOTelSpan` and accumulates it in `collectedSpans` for the current run.
- These messages carry no `id` — they are broadcast during execution, before `success` is sent.
- The `collectedSpans` array is passed to the resolved `runCode` promise along with `result`.

---

## ID Correlation Pattern

`run` / `success` / `error`(run) messages share an `id` field for correlation. The host generates a random ID per invocation:

```
host  →  { type: 'run', id: 'x4f2k1', code: '...' }
worker → { type: 'stdout', message: 'hello' }          // no id — broadcast
worker → { type: 'telemetry', span: {...} }             // no id — broadcast
worker → { type: 'success', id: 'x4f2k1', result: null }
```

The `messageHandler` in `useCodeRunner` filters messages: any `success`/`error` with an `id !== runId` is ignored. This prevents stale responses from a previous run from resolving/rejecting the current promise.

---

## Init Error vs Run Error

Both use `type: 'error'`. The distinguishing field is presence of `id`:

| Condition | `id` field | Handler |
|-----------|-----------|---------|
| Init failure | absent | sets `initError` state |
| Run failure | present (matches `run` id) | rejects `runCode` promise |

In `useCodeRunner`:
```typescript
if (type === 'error' && !id) {
  setInitError(error ?? null);  // init error
}
// run errors are handled inside messageHandler (filtered by id match)
```

---

## Timeout Behaviour

`runCode` accepts a `timeoutMs` parameter (default `5000`ms). On expiry:

1. The worker is terminated (`worker.terminate()`)
2. `workerRef.current` is set to `null`
3. `initWorker()` is called to create a fresh worker
4. The `runCode` promise rejects with `"Execution timed out after 5000ms"`

There is no `timeout` message type — the timeout is managed entirely on the host side.
