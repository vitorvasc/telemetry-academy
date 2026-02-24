# Telemetry Academy 🎓

> Learn OpenTelemetry by instrumenting real systems and investigating real incidents.

A gamified learning platform that combines **zero-to-hero OpenTelemetry education** with **incident investigation gameplay**. Each case has two phases that mirror real SRE workflows:

1. **Phase 1: Instrumentation** — Add telemetry to a blind system
2. **Phase 2: Investigation** — Use the data to find root causes

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC.svg)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open http://localhost:5173 to view the application.

---

## 🎮 How It Works

### Phase 1: Instrumentation

The system starts "blind" — no telemetry is flowing. Your mission is to:

- Add manual spans using the OpenTelemetry API
- Configure auto-instrumentation
- Set up the Collector pipeline
- Export telemetry to the backend

**Example:**
```python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

def process_order(order_id):
    with tracer.start_as_current_span("process_order") as span:
        span.set_attribute("order_id", order_id)
        # Your logic here
```

### Phase 2: Investigation

Once telemetry flows, investigate incidents using:

- **Trace Explorer** — Visualize request flows
- **Log Search** — Correlate logs with traces using `trace_id`
- **Metrics Dashboard** — Identify anomalies

Find the root cause and propose the fix!

---

## 📚 Case Progression

| Case | Concept | Difficulty |
|------|---------|------------|
| Hello, Span | Manual instrumentation | Rookie |
| Auto-magic | Auto-instrumentation | Rookie |
| The Collector | Collector pipeline | Junior |
| Broken Context | Context propagation | Junior |
| The Baggage | Baggage attributes | Senior |
| Metrics Meet Traces | Signal correlation | Senior |
| Log Detective | Logs in traces | Staff |
| Sampling Sleuth | Head/tail sampling | Staff |
| The Perfect Storm | Everything together | Expert |

---

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── CodeEditor.tsx   # Monaco Editor wrapper
│   ├── InstructionsPanel.tsx  # Case instructions & hints
│   └── ValidationPanel.tsx    # Validation results UI
├── data/
│   └── cases.ts         # Case definitions
├── types.ts             # TypeScript interfaces
├── App.tsx              # Main application
└── main.tsx             # Entry point
```

---

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4
- **Editor:** Monaco Editor (@monaco-editor/react)
- **Icons:** Lucide React

---

## 🎯 Current Status

This is a **Phase 1 prototype** (frontend mock):

- ✅ Monaco Editor with Python syntax
- ✅ Case instructions and hints panel
- ✅ Mock validation (simple string matching)
- ✅ Phase unlock flow
- 🚧 Real code execution (WIP)
- 🚧 Trace visualization (WIP)
- 🚧 Phase 2 investigation UI (WIP)

---

## 📝 Case Definition Format

Cases are defined in YAML-like TypeScript:

```typescript
{
  id: 'hello-span-001',
  name: 'Hello, Span',
  difficulty: 'rookie',
  concepts: ['manual_instrumentation', 'spans'],
  phase1: {
    description: '...',
    initialCode: '...',
    validations: [
      {
        type: 'span_exists',
        description: 'A span must be created',
        successMessage: '✓ Span created!',
        errorMessage: '✗ No span found'
      }
    ]
  }
}
```

---

## 🤝 Contributing

This project is in early development. Ideas, feedback, and contributions welcome!

---

## 📄 License

MIT License — see LICENSE for details.

---

*Built with 💡 by Vitor Vasconcellos and Lumen*
