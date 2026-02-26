# Stack Research

**Domain:** Gamified OpenTelemetry Education Platform (Browser-Based Execution & Visualization)
**Researched:** 2026-02-26
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **React** | 19.2.4 | UI Framework | Mandated foundation. Provides concurrent rendering ideal for UI-heavy visualization dashboards. |
| **TypeScript** | 5.9.3 | Type System | Mandated. Essential for managing complex telemetry data shapes (traces, metrics, logs) and game state. |
| **Vite** | 7.3.1 | Build Tool | Mandated. Extremely fast HMR, crucial for rapid iteration of complex UI and handling WASM assets. |
| **Tailwind CSS** | 4.2.1 | Styling | Mandated. JIT engine and native CSS nesting for rapid dashboard construction without heavy component libraries. |
| **Pyodide** | 0.29.3 | Client-Side Python | Standard for WASM CPython. Runs standard `opentelemetry-sdk` directly in the browser. Allows intercepting telemetry via JS bridges (`pyodide.registerJsModule`) without requiring a backend. |
| **@monaco-editor/react**| 4.7.0 | Code Editor | Industry standard for web code execution. Provides Python syntax highlighting, linting overlays, and a VS Code-like experience out-of-the-box. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Zustand** | 5.0.11 | State Management | Managing complex, cross-component game state (phase unlocking, editor contents, captured mock telemetry payloads). |
| **@visx/visx** | 3.12.0 | Trace Visualization | Building custom D3-style trace flamegraphs and Gantt charts for the Trace Explorer. Lighter and more customizable than embedding full APM UIs. |
| **Recharts** | 3.7.0 | Metrics Dashboard | Standard for simple, responsive time-series charts (lines, bars, areas) needed for Phase 2 metrics investigation UI. |
| **Lucide React** | 0.47x.x | Iconography | Standard 2026 icon library for modern, clean, scalable SVG icons in the editor and investigation panels. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Vitest** | Unit/Component Testing | Fast Vite-native test runner. Essential for testing the YAML-like case validation logic without spinning up Pyodide. |
| **ESLint 9.x** | Code Linting | Flat config architecture is the standard. Crucial for maintaining TS strictness across complex mock backends. |

## Installation

```bash
# Core Dependencies
npm install react react-dom pyodide @monaco-editor/react zustand

# Visualization & UI
npm install @visx/visx recharts lucide-react

# Dev Dependencies
npm install -D typescript vite tailwindcss vitest @types/react @types/react-dom
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Pyodide** | **WebContainers (@webcontainer/api)** | WebContainers are better for full Node.js applications or multi-file, multi-process full-stack sandboxes. For purely running Python instrumentation scripts, Pyodide's direct WASM runtime has much less overhead and better Python standard library support. |
| **@visx/visx** | **Jaeger UI React Components** | Use Jaeger's UI if you have an actual Jaeger backend or a massive trace payload that needs enterprise-grade filtering. However, they are tightly coupled and extremely heavy. Visx is better for a simplified, controlled educational mock. |
| **Recharts / Visx** | **React Flow (@xyflow/react)** | React Flow is the 2026 standard for node-based, directed acyclic graphs (like architecture diagrams). Use it if the project shifts to visualizing *system topologies* rather than timeline trace flamegraphs. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Real OTel Collector / Backend** | Requires complex backend infrastructure, sandboxed server-side code execution, and high maintenance overhead, which violates the "mock/simplified backend" requirement. | **In-Browser JS Mock Backend** (Intercept OTel spans via Pyodide and store in Zustand state). |
| **Brython / Transcrypt** | These compile Python to JS and break standard library compatibility. Official `opentelemetry-sdk` Python packages will fail to install or run. | **Pyodide** (Compiles the actual CPython interpreter to WASM). |
| **iframe / eval() Sandboxes** | Insecure and lacks the ability to easily install pip packages (like `opentelemetry-api`) or bridge seamlessly with a React parent app. | **Pyodide Web Workers** |

## Stack Patterns by Variant

**If the validation logic blocks the main UI thread:**
- Use **Pyodide in a Web Worker (Comlink)**
- Because Pyodide parsing the Python standard library and running instrumentation can take 1-3 seconds, which will freeze the React 19 UI if run on the main thread.

**If traces need complex parent/child folding:**
- Use **@visx/hierarchy** combined with standard HTML/CSS grid rendering
- Because flamegraphs require exact coordinate mapping, and relying purely on standard React DOM without Visx scaling functions will lead to performance issues or misaligned span waterfalls.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `pyodide@0.29.3` | `vite@7.3.1` | Vite requires configuration to properly serve Pyodide's `.wasm` assets. You must either use the `vite-plugin-wasm` or load Pyodide from a CDN (e.g., jsDelivr) to avoid complex bundler configuration. |
| `@monaco-editor/react@4.7.0`| `react@19.2.4` | Ensure the Monaco instance is properly memoized or unmounted to prevent memory leaks during Vite's HMR or React 19's Strict Mode double-invocations. |

## Sources

- Context7 ID: `/pyodide/pyodide` — Verified Pyodide's `registerJsModule` allows custom Python module injection from JS, serving as the perfect interception layer for OpenTelemetry data without a real backend.
- NPM Registry — Verified current 2026 versions for Vite (7.3.1), Tailwind v4 (4.2.1), React 19 (19.2.4), Zustand (5.0.11), Visx (3.12.0), Recharts (3.7.0), @monaco-editor/react (4.7.0).
- GitHub/StackBlitz Docs — Confirmed WebContainers primarily target Node.js environments and Python support relies on secondary WASM layers, making Pyodide the clear choice for this domain.

---
*Stack research for: Telemetry Academy (Gamified OpenTelemetry Education Platform)*
*Researched: 2026-02-26*
