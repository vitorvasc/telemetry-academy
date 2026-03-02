# Phase 1 Context

**User Decisions:**
- Use Pyodide for WASM execution
- Run Pyodide inside a Web Worker to avoid blocking the UI thread
- Do NOT use WebContainers (Node.js first, clunky for Python)
- Use OpenTelemetry Python SDK's SimpleSpanProcessor to avoid background threading issues in WASM
- Serialize telemetry to JSON in Python before sending across the JS bridge (avoid PyProxy memory leaks)
- Setup Monaco Editor integration

