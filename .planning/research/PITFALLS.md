# Pitfalls Research

**Domain:** Browser-based WASM code execution & interactive OpenTelemetry learning
**Researched:** 2026-02-26
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: OTel Background Threading in WASM

**What goes wrong:**
OpenTelemetry's span export silently drops data or the Web Worker crashes with `RuntimeError` or threading exceptions when initializing the `TracerProvider`.

**Why it happens:**
The default OpenTelemetry Python SDK uses `BatchSpanProcessor`, which spawns a background thread to queue and export spans asynchronously. Python's `threading` module is highly restricted in Pyodide/WASM unless experimental WebAssembly threads are enabled (which require strict COOP/COEP HTTP headers).

**How to avoid:**
Force the use of `SimpleSpanProcessor` instead of `BatchSpanProcessor`. Since the platform exports data to local JavaScript memory (not over a network to a real backend), synchronous export is perfectly fast and avoids all WASM threading limitations.

**Warning signs:**
Spans sporadically missing; Web Worker crashing on `TracerProvider` initialization; `RuntimeError` regarding threading in the browser console.

**Phase to address:**
JS Exporter bridge / OpenTelemetry Setup Phase

---

### Pitfall 2: PyProxy Memory Leaks

**What goes wrong:**
The browser tab consumes gigabytes of RAM and eventually crashes (Out of Memory) after the user clicks "Run Code" multiple times to test their instrumentation.

**Why it happens:**
Passing complex Python objects (like raw OTel `Span` objects or Context dictionaries) directly to JavaScript creates `PyProxy` wrappers. The JavaScript garbage collector cannot automatically free the underlying WASM memory unless `proxy.destroy()` is explicitly called in JS.

**How to avoid:**
Serialize all telemetry data (traces, logs, metrics) to JSON on the Python side *before* posting it to the main UI thread via `self.postMessage(json.dumps(spans))`. Never pass raw PyProxies or let JS interact directly with Python SDK objects.

**Warning signs:**
Memory footprint growing by several megabytes on every execution; DevTools memory timeline showing a staircase pattern; tab crashing during extended play.

**Phase to address:**
Real code execution environment (WASM Worker) & JS Exporter bridge

---

### Pitfall 3: Unkillable Web Workers from Infinite Loops

**What goes wrong:**
A user accidentally writes an infinite loop (`while True: pass`) or very slow code in the browser editor. The "Run" button stays spinning forever, the code cannot be stopped, and the user must refresh the page.

**Why it happens:**
WASM executes synchronously. Once a tight loop starts in a Web Worker, it starves the worker's event loop, meaning standard `postMessage` cancellation commands are never processed.

**How to avoid:**
Run Pyodide strictly in a dedicated Web Worker (never the main thread). Implement an execution timeout. To kill a stuck worker, aggressively terminate the `Worker` instance (`worker.terminate()`) and spawn a new one, OR use a `SharedArrayBuffer` with `pyodide.setInterruptBuffer` to raise a `KeyboardInterrupt` inside the running Python environment.

**Warning signs:**
UI unresponsive during execution (if on main thread); inability to cancel a long-running script; "Run" button stuck in a loading state permanently.

**Phase to address:**
Real code execution environment (WASM Worker)

---

### Pitfall 4: Validation Logic Rigidity (AST Parsing)

**What goes wrong:**
A user writes perfectly valid OpenTelemetry code (e.g., `span.set_attribute("user.id", 123)`), but the platform validation fails because it expects `span.set_attribute('user.id', 123)` or a specific variable name. The user gets frustrated and quits.

**Why it happens:**
Interactive learning platforms often take the shortcut of validating source code by parsing the Abstract Syntax Tree (AST) or using fragile regular expressions, instead of validating the *actual behavior/output* of the code.

**How to avoid:**
Validate the generated telemetry outputs in JavaScript, not the source code. Check the exported JSON spans: "Does a span named 'login' exist with attribute 'user.id' == 123?" regardless of how the user authored the Python code to achieve that state.

**Warning signs:**
High failure rate on seemingly easy cases; users attempting the exact same logic 5 different ways before passing; false negatives in validation.

**Phase to address:**
Case Design & Validation Engine Implementation

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| **Mocking Exporters with `print()`** | Fast to build MVP | Users don't learn real OTel configuration; hard to build the trace viewer | Only in UI mockups (Phase 1) |
| **Destroying & Recreating Worker per Run** | Guarantees clean state and kills infinite loops | 2-5 second load time penalty on *every* code run as Pyodide re-initializes | Never for an interactive coding platform |
| **Regex Code Validation** | Easy to implement | extremely fragile; breaks on comments, whitespace, or valid alternative syntax | Only for the absolute simplest checks |

## Integration Gotchas

Common mistakes when connecting OpenTelemetry to the browser environment.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **OTLPSpanExporter** | Letting users configure standard exporters that use synchronous `requests` sockets | Inject a hidden setup script that configures a custom JS bridge exporter before user code runs |
| **Context Propagation** | Assuming Python thread-local context works perfectly in WASM | Explicitly pass context or use Pyodide-compatible context vars; avoid complex async propagation unless necessary |
| **Monaco Editor** | Leaving default web worker settings for Monaco | Configure Vite to properly bundle Monaco's web workers to avoid 404s in production (Cloudflare Pages) |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Loading Pyodide from CDN** | Slow initial load | Pre-fetch the Pyodide runtime and standard library during the initial page load while the user reads the intro | Slow network connections |
| **Rendering thousands of Spans** | Trace viewer stutters | Implement virtualization for the trace waterfall and log tables | Cases with >500 spans/logs |
| **Syncing Editor to React State** | Typing latency in Monaco Editor | Debounce Monaco `onChange` events or use uncontrolled components with refs for the code content | Fast typists / large files |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Main Thread Execution** | Malicious or infinite-loop code freezes the entire browser tab, causing a DOS | Strict isolation using Web Workers for all Pyodide execution |
| **XSS in Trace Viewer** | User injects `<script>` tags into span attributes which get rendered as HTML in the trace viewer | Sanitize all span attributes and log messages before rendering in React |
| **Access to Browser APIs** | Pyodide has access to the DOM if run on the main thread | Web Worker naturally sandboxes Pyodide from DOM access |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **State Loss on Refresh** | Users accidentally refresh and lose 20 minutes of code, abandoning the platform | Aggressive `localStorage` debounced auto-saving of code and progress |
| **Vague Validation Errors** | "Validation failed" gives no clue what the user did wrong | Provide specific, actionable feedback per check (e.g., "Missing span attribute: 'http.status_code'") |
| **Overwhelming Initial Code** | Users are intimidated by massive boilerplate | Hide standard OTel setup boilerplate. Let them focus purely on the instrumentation (`get_tracer`, `start_as_current_span`) |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Code Execution:** Often missing **infinite loop protection** — verify you can run `while True: pass` and recover the UI.
- [ ] **WASM OTel Export:** Often missing **support for complex attribute types** — verify array and dictionary attributes serialize correctly across the JS bridge.
- [ ] **State Persistence:** Often missing **versioning** — verify what happens if `localStorage` has a saved state from an older, incompatible version of a case.
- [ ] **Monaco Editor:** Often missing **Python standard library autocompletion** — verify `opentelemetry` types and basic Python syntax hints load correctly.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **Worker Deadlock** | LOW | Terminate Web Worker, show "Execution timed out" toast, spin up new Worker in background. |
| **Corrupted `localStorage`** | MEDIUM | Catch JSON parse errors on load, clear specific case state, and fallback to default initial code. |
| **Memory Leak (Tab crash)** | HIGH | Hard to recover automatically since the browser kills the tab. Must prevent via JSON serialization. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| OTel Background Threading | JS Exporter Bridge | Ensure `SimpleSpanProcessor` is used and spans arrive synchronously in JS |
| PyProxy Memory Leaks | Real Code Execution (WASM) | Monitor JS heap size during 50 consecutive code executions; ensure no staircase pattern |
| Unkillable Workers | Real Code Execution (WASM) | Run `while True: pass`, ensure execution aborts after N seconds |
| Validation Rigidity | Case Design / Validation | Write tests for validations using structurally different but functionally identical Python code |
| State Loss on Refresh | `localStorage` Persistence | Refresh the page mid-typing and verify code and validation state are restored |

## Sources

- [Pyodide Web Worker Documentation (Context7) - Memory management and interrupts]
- [OpenTelemetry Python SDK Documentation (Context7) - Exporters and Processors]
- [Browser extension/WASM interactive platform post-mortems]
- [React/Monaco Editor integration best practices]

---
*Pitfalls research for: Telemetry Academy (Gamified OTel Learning)*
*Researched: 2026-02-26*