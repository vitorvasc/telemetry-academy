# Research: Multi-Language Support in Telemetry Academy

**Date:** 2026-03-17  
**Author:** Lumen  
**Status:** Research — not yet planned  
**Context:** Today we only support Python (via Pyodide WASM) and YAML (The Collector case). This document explores what it would take to also support Go, Java, and JavaScript.

---

## TL;DR

| Language | Feasibility | Effort | OTel SDK Works? | Recommended Approach |
|----------|-------------|--------|-----------------|----------------------|
| **JavaScript** | ✅ Easy | Low | ✅ Yes (native) | Web Worker + sandboxed eval |
| **Go** | ⚠️ Medium | High | ⚠️ Partial | Pre-compiled WASM per exercise |
| **Java** | ⚠️ Medium-Hard | Very High | ⚠️ Partial | CheerpJ (JVM in browser) or server-side fallback |

---

## Current Architecture (Python)

The current flow:
1. User writes Python in Monaco Editor
2. Code is sent to a **Pyodide Web Worker** (Python runtime compiled to WASM)
3. The OTel SDK (`opentelemetry-api` + `opentelemetry-sdk`) runs inside Pyodide via `micropip`
4. A custom `JSSpanExporter` sends spans from Python → JavaScript via `postMessage`
5. JavaScript validates spans, updates UI

**What makes Python easy:**
- Pyodide is a mature, complete CPython port to WASM
- `micropip` can install pure-Python packages (like the OTel SDK) at runtime
- The OTel Python SDK is pure Python — no C extensions needed

---

## Option 1: JavaScript ✅ (Low effort)

### How it works
JavaScript already runs natively in the browser. No WASM needed.

### Execution approach
```
User code → sandboxed Web Worker → OTel JS SDK → custom in-memory exporter → postMessage → main thread
```

The OTel JavaScript SDK (`@opentelemetry/sdk-trace-web`) runs natively. A custom `InMemorySpanExporter` collects spans and sends them back to the main thread.

### Worker setup
```typescript
// js.worker.ts
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

const exporter = new InMemorySpanExporter();
const provider = new WebTracerProvider({
  spanProcessors: [new SimpleSpanProcessor(exporter)]
});
provider.register();

// Inject provider into user code scope, execute via new Function()
// After execution, read exporter.getFinishedSpans() and postMessage back
```

### Security
- Isolated in a Web Worker (no DOM access)
- `new Function()` sandboxing (same pattern used by CodeSandbox and others)
- No infinite loop protection by default — needs a timeout/AbortController

### OTel SDK availability
✅ `@opentelemetry/api` + `@opentelemetry/sdk-trace-base` both work in browser/worker context. Already well-tested.

### Changes needed in Telemetry Academy
1. **New worker:** `src/workers/js.worker.ts` (parallel to `python.worker.ts`)
2. **`useCodeRunner` hook:** detect `language: 'javascript'` and route to the JS worker
3. **Case YAML:** add `language: javascript` field
4. **No new dependencies** — OTel JS SDK is already installable

### Effort estimate: **~1-2 days**

---

## Option 2: Go ⚠️ (High effort)

### Core constraint
Go cannot install packages at runtime in WASM like Python can via micropip. **Every case needs a pre-compiled `.wasm` binary** that already includes the OTel SDK.

### Approach A: Pre-compiled WASM per case (recommended)
```
Build time:
  go code template + OTel SDK → compiled to .wasm (TinyGo or standard Go) → bundled in public/

Runtime:
  User edits only the "instrumentation" portion → JavaScript splices it into a template → re-evaluation is simulated
  OR: code is sent to a build server → compiled → wasm returned
```

**Problem:** You can't compile arbitrary Go code in the browser. The user's code needs to be compiled to WASM first.

### Approach B: Server-side compilation (simplest Go path)
A lightweight build API:
```
POST /api/compile/go
Body: { code: "package main\n..." }
Response: { wasm: "<base64>" } or { error: "...", stderr: "..." }
```

The server runs `go build -o out.wasm ./...` (or `tinygo build`) and returns the WASM binary. The browser then runs it.

**Pros:** User writes real Go, full OTel SDK, realistic experience  
**Cons:** Requires a backend — breaks the "zero backend" architecture

### Approach C: TinyGo + pre-templated cases
Each Go case ships with a `template.go` where the user fills in specific functions. A build step during `npm run build` compiles the template to WASM and bundles it. The "user's code" is actually a string substitution into the template — not free-form editing.

**Pros:** Pure client-side, no backend  
**Cons:** Very limited code freedom; more like a fill-in-the-blank exercise than free coding

### OTel SDK for Go in WASM
- `go.opentelemetry.io/otel` works with TinyGo (with some limitations)
- Some SDK features rely on goroutines, which TinyGo supports but with constraints
- A custom `SpanExporter` that writes to a JS channel via `syscall/js` is doable

### Effort estimate: **1-2 weeks** (with backend) or **3-4 days** (template-only, no free editing)

---

## Option 3: Java ⚠️ (Very high effort)

### Options for running Java in the browser

#### CheerpJ (Most complete)
- Full JVM in WebAssembly — runs standard Java bytecode
- **CheerpJ 4.0** (2025): supports Java 11, JNI, and dynamic class loading
- Bundle size: **~8MB initial** + classes loaded on demand
- **Free for open source** (requires attribution)
- Supports running code like: `CheerpJ.run("Main.java", code)`

#### TeaVM (Ahead-of-time compiler)
- Compiles Java bytecode → JavaScript or WASM at build time
- Smaller bundle, but same constraint as Go: **no runtime compilation**
- User's code would need a pre-build step

### OTel Java SDK
- The OTel Java SDK (`opentelemetry-sdk`) is a standard JAR
- With CheerpJ, it **should** work — it loads JARs from URLs
- With TeaVM, SDK would need to be bundled at build time

### The main challenge
Java's OTel SDK uses threads, reflection, and service loaders heavily. These all work in a real JVM but have varying support in WASM JVM implementations.

### Effort estimate: **2-4 weeks** to get a working prototype with CheerpJ; unknown long-tail for SDK compatibility

---

## Recommended Roadmap

### Phase 1 — JavaScript (Quick win)
Add JavaScript support first. Native, no WASM needed, OTel JS SDK works perfectly. Great for teaching the OTel JS ecosystem (common in frontend/Node.js contexts).

```yaml
# Example case YAML
language: javascript  # new field, defaults to 'python'
```

### Phase 2 — Go (Medium-term)
Two sub-options:
- **2a.** Template-based Go cases (client-only, limited editing freedom)
- **2b.** Lightweight compile server (Fly.io or CF Worker with a Go toolchain)

Recommendation: **2b** — a simple Fly.io service running `tinygo build` takes ~1 day to set up and enables real Go editing.

### Phase 3 — Java (Long-term / Optional)
Java is the most complex. Worth doing if there's demand from the enterprise/JVM community. CheerpJ is the most realistic path.

---

## Architecture Changes

### What stays the same
- YAML case format (just add `language: go|java|javascript`)
- Validation engine (validates spans regardless of source language)
- Investigation phase (Phase 2 is already language-agnostic)
- Root cause engine
- Home page and UI

### What changes
- `useCodeRunner` hook: language-aware worker selection
- New workers per language (`js.worker.ts`, and potentially a Go/Java bridge)
- `caseLoader.ts`: read `language` field from YAML
- For Go/Java: potentially a build server + new API integration

### New `language` field in case YAML
```yaml
id: trace-context-go-003
name: "Trace Context (Go)"
language: go  # new — defaults to 'python' for existing cases
difficulty: junior
concepts:
  - context_propagation
  - go_sdk
```

---

## Key Questions for Discussion

1. **Architecture purity vs practicality:** Are we OK adding a build server for Go, or do we want to stay 100% client-side?
2. **Priority:** JavaScript is the lowest effort and hits a big audience (frontend devs, Node.js users). Start there?
3. **Go vs Java:** Go is more relevant to the OTel community (the Collector is written in Go, many backends too). Java is important for enterprise. Which first?
4. **Case parity:** Should every concept have a version in each language, or do some concepts only exist in specific languages?

---

## References

- [TinyGo WASM docs](https://tinygo.org/docs/guides/webassembly/wasm/)
- [Notes on running Go in the browser with WASM (Eli Bendersky, 2024)](https://eli.thegreenplace.net/2024/notes-on-running-go-in-the-browser-with-webassembly/)
- [CheerpJ — JVM for the browser](https://cheerpj.com/)
- [OTel JS Browser SDK](https://opentelemetry.io/docs/languages/js/getting-started/browser/)
- [Pyodide security model](https://pyodide.org/en/stable/usage/security.html)
