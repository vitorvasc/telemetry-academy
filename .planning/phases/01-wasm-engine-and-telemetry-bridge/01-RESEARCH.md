<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Use Pyodide for WASM execution
- Run Pyodide inside a Web Worker to avoid blocking the UI thread
- Do NOT use WebContainers (Node.js first, clunky for Python)
- Use OpenTelemetry Python SDK's SimpleSpanProcessor to avoid background threading issues in WASM
- Serialize telemetry to JSON in Python before sending across the JS bridge (avoid PyProxy memory leaks)
- Setup Monaco Editor integration

### Claude's Discretion
None explicitly specified, using standard React best practices for Pyodide worker orchestration.

### Deferred Ideas (OUT OF SCOPE)
None explicitly specified.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CORE-01 | User code executes securely in a Pyodide WASM Web Worker | Web Worker setup via `importScripts` for Pyodide |
| CORE-02 | Web Worker execution includes timeouts to prevent infinite loops | `pyodide.setInterruptBuffer` with `SharedArrayBuffer`, or `worker.terminate()` |
| CORE-03 | Custom OpenTelemetry `SpanExporter` intercepts Pyodide telemetry | Inject Python setup script containing custom `SpanExporter` before user code |
| CORE-04 | Python OpenTelemetry spans/attributes serialize cleanly to JSON | OpenTelemetry's `ReadableSpan.to_json()` + `json.dumps()` over `js.postMessage` |
</phase_requirements>

# Phase 1: WASM Engine & Telemetry Bridge - Research

**Researched:** 2026-02-26
**Domain:** Pyodide WebAssembly, Web Workers, OpenTelemetry Python SDK, React Contexts
**Confidence:** HIGH

## Summary

Phase 1 requires orchestrating a Pyodide Python environment inside a Web Worker. By relying strictly on the official Python OpenTelemetry SDK's `to_json` capabilities, we avoid the heavy `PyProxy` memory leaks notoriously caused by bridging complex Python objects to JavaScript directly.

The environment operates asynchronously, isolating student execution from the React UI thread. The system handles timeouts using standard WASM interrupt mechanisms or worker termination. A hidden setup script will execute immediately before the user's code, patching OpenTelemetry's global TracerProvider to route spans to JavaScript and capturing `sys.stdout` for print statements.

**Primary recommendation:** Use `importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js')` in a dedicated Web Worker and bridge serialized data strings only.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Pyodide | v0.25.0+ | Python WASM runtime | Most mature Python-in-browser engine with rich scientific package support. |
| OpenTelemetry Python | ^1.25.0 | Telemetry instrumentation | Standard SDK. Must install via `micropip` dynamically in Pyodide. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @monaco-editor/react | ^4.7.0 | IDE environment | For rendering student Python code. Already installed in project. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pyodide | WebContainers | WebContainers require a full Node stack to boot Python, causing latency overhead. |
| Worker Messages | PyProxy | PyProxy passes objects directly, but memory leaks easily occur if `.destroy()` isn't managed. |
| Custom AST Parser | OpenTelemetry SDK | Parsing AST is brittle and misses runtime attributes; executing real telemetry captures real output. |

## Architecture Patterns

### Recommended Project Structure
```
src/
├── workers/
│   ├── pyodide.worker.ts     # Main Web Worker execution loop
│   └── python/
│       └── setup_telemetry.py # Python script injected before student code
├── components/
│   ├── editor/
│   │   └── CodeEditor.tsx    # Monaco editor wrapper
│   └── terminal/
│       └── OutputPanel.tsx   # Displays stdout/spans
└── hooks/
    └── usePyodideWorker.ts   # React interface for Web Worker state
```

### Pattern 1: Stringified Telemetry Bridge
**What:** Pass only `json.dumps` stringified content from Pyodide to JS.
**When to use:** Whenever emitting Python objects (like OpenTelemetry spans) back to the JS thread.
**Example:**
```python
# Source: opentelemetry-python sdk docs & pyodide messaging best practices
class JSSpanExporter(SpanExporter):
    def export(self, spans):
        for span in spans:
            # .to_json() comes out-of-the-box on ReadableSpan
            span_json_str = span.to_json()
            postMessage(json.dumps({
                "type": "telemetry",
                "span": json.loads(span_json_str) 
            }))
        return SpanExportResult.SUCCESS
```

### Anti-Patterns to Avoid
- **BatchSpanProcessor in WASM:** WASM does not fully support Python threading mechanisms robustly yet. `BatchSpanProcessor` spawns background daemon threads. Use `SimpleSpanProcessor` instead.
- **Leaking PyProxies:** Returning Python dictionaries to JavaScript natively without `toJs()` or serialization will cause memory leaks that crash the browser tab over time.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Span serialization | Custom Python dict extractors | `span.to_json()` | The SDK natively handles timestamps, Span ID formats, Links, and event arrays. |
| Python Syntax parsing | regex to find trace usage | Run Python via Pyodide | Runtime guarantees correct API usage that regex would falsify. |
| Infinite Loop Handling | Complex Python thread timers | `setInterruptBuffer` or Worker Terminate | WASM blocks the main thread completely, soft python timers won't fire. |

**Key insight:** The OpenTelemetry Python SDK does all the heavy lifting for formatting and context tracking. We just need to route its output to JS.

## Common Pitfalls

### Pitfall 1: SharedArrayBuffer CORS Issues
**What goes wrong:** `SharedArrayBuffer` is undefined, causing `setInterruptBuffer` to fail.
**Why it happens:** Vite dev servers and production hosts don't add Cross-Origin isolation headers by default.
**How to avoid:** For guaranteed robustness, handle infinite loop timeouts by calling `worker.terminate()` and re-instantiating the worker if `SharedArrayBuffer` isn't available.

### Pitfall 2: Overriding stdout incorrectly
**What goes wrong:** `print()` calls in the student code crash or go nowhere.
**Why it happens:** `sys.stdout` expects a flush method and proper write formatting.
**How to avoid:** Build a compliant wrapper in the setup script.
```python
class JSStdout:
    def write(self, s):
        if s.strip(): postMessage(json.dumps({"type": "stdout", "message": s}))
    def flush(self): pass
sys.stdout = JSStdout()
```

### Pitfall 3: Loading micropip sequentially
**What goes wrong:** `loadPyodide()` and `micropip.install()` delay execution drastically.
**Why it happens:** Pyodide network initialization is slow.
**How to avoid:** Initialize the worker globally on app load, rather than waiting for the user to click "Run".

## Code Examples

Verified patterns from official sources:

### Initializing Pyodide Worker
```typescript
// Source: Pyodide Worker Documentation
importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodide: any;

self.onmessage = async (event) => {
  if (event.data.type === "init") {
    pyodide = await (self as any).loadPyodide();
    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");
    await micropip.install(["opentelemetry-api", "opentelemetry-sdk"]);
    self.postMessage({ type: "ready" });
  }
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| regex checks | Runtime Validation | V1 | Ensures students actually build functional telemetry pipelines |
| PyProxy passing | JSON Bridging | Pyodide 0.20+ | Eliminates manual `.destroy()` memory management overhead |

## Open Questions

1. **Vite Headers Control**
   - What we know: `SharedArrayBuffer` needs isolation headers.
   - What's unclear: Can we guarantee the Vite config will serve those headers?
   - Recommendation: Default to `worker.terminate()` as the primary execution timeout strategy since it handles isolation errors gracefully.

## Sources

### Primary (HIGH confidence)
- `/pyodide/pyodide` - Context7 Docs: Worker timeouts and interrupts.
- `/websites/opentelemetry-python_readthedocs_io_en_stable` - Context7 Docs: `ReadableSpan.to_json()` and `SpanExporter` architecture.

### Secondary (MEDIUM confidence)
- Official Pyodide messaging best practices around avoiding PyProxy objects to prevent memory leaks.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Pyodide and Monaco are industry standards.
- Architecture: HIGH - Verified OpenTelemetry SDK classes directly via Context7.
- Pitfalls: HIGH - Known browser security constraints around `SharedArrayBuffer`.

**Research date:** 2026-02-26
**Valid until:** 2026-03-26