# Telemetry Academy

> Learn OpenTelemetry by doing — instrument real systems, then investigate real incidents.

**Live:** [telemetry.academy](https://telemetry.academy) &nbsp;·&nbsp; **GitHub:** [vitorvasc/telemetry-academy](https://github.com/vitorvasc/telemetry-academy)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC.svg)

---

## What It Is

A gamified, browser-based OTel learning platform. Each case has two phases that mirror real SRE workflows:

1. **Phase 1 — Instrumentation:** Add telemetry to a blind system (Python runs in-browser via Pyodide WASM)
2. **Phase 2 — Investigation:** Use the data you created to find the root cause of a synthetic incident

No backend required. No account needed. Everything runs in your browser.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Case Progression

| # | Case | Concept | Difficulty | Status |
|---|------|---------|------------|--------|
| 1 | Hello, Span | Manual instrumentation | Rookie | ✅ Done |
| 2 | Auto-magic | Auto-instrumentation | Rookie | ✅ Done |
| 3 | The Collector | Collector pipeline / YAML | Junior | Planned |
| 4 | Broken Context | Context propagation | Junior | Planned |
| 5 | The Baggage | Baggage attributes | Senior | Planned |
| 6 | Metrics Meet Traces | Signal correlation | Senior | Planned |
| 7 | Log Detective | Logs in traces | Staff | Planned |
| 8 | Sampling Sleuth | Head/tail sampling | Staff | Planned |
| 9 | The Perfect Storm | Everything together | Expert | Planned |

---

## Architecture

- **Runtime:** Python executes in a Pyodide Web Worker (WASM) — zero backend
- **OTel bridge:** Custom `JSSpanExporter` posts spans from Python → JavaScript via `postMessage`
- **Validation:** 8 declarative check types evaluate spans in real time
- **Investigation:** Synthetic traces, logs, and a rules-based root cause engine
- **Persistence:** `localStorage` only — no auth, no accounts

```
src/
├── cases/<id>/          # case.yaml + setup.py (auto-discovered)
├── components/          # React UI (TraceViewer, LogViewer, CodeEditor…)
├── data/                # caseLoader.ts, phase2.ts
├── hooks/               # useCodeRunner, useAcademyPersistence
├── lib/                 # validation.ts, rootCauseEngine.ts, spanTransform.ts
├── types/               # TypeScript interfaces
└── workers/             # python.worker.ts + setup_telemetry.py
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| Python runtime | Pyodide 0.29.3 (WASM) |
| OTel SDK | `opentelemetry-api` + `opentelemetry-sdk` (via micropip) |
| Icons | Lucide React |

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

Development follows the **GSD (Get Shit Done)** workflow: Research → CONTEXT.md → PLAN.md → Execute → VERIFICATION.md. All planning artifacts live in `.planning/`.

The fastest way to contribute is to **author a new case** — see [docs/adding_cases.md](docs/adding_cases.md).

---

## Related Projects

- [SDPD](https://sdpd.live) — System Design Police Department (inspiration for investigation mechanics)
- [SQLPD](https://sqlpd.com) — SQL Police Department (original detective game format)
- [Quest World](https://github.com/grafana/adventure) — Grafana's observability adventure game
- [OpenTelemetry Demo](https://github.com/open-telemetry/opentelemetry-demo) — Official OTel reference application

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

*Built by [Vitor Vasconcellos](https://github.com/vitorvasc)*
