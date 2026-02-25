---
created: 2025-06-25
updated: 2025-06-25
project: Telemetry Academy
tags: [opentelemetry, education, gamification, observability, incident-response]
status: active
---

# Telemetry Academy: Incident Response

> **Learn OpenTelemetry by instrumenting real systems and investigating real incidents.**

---

## 🎯 Project Names

### Primary Recommendation
**Telemetry Academy** — Clean, professional, immediately conveys the educational aspect and the observability domain. Works well for branding and is easy to remember.

### Alternative Names to Consider

| Name | Vibe | Pros | Cons |
|------|------|------|------|
| **O11Y Detective** | Mystery/investigation | Unique, catchy abbreviation | Less obvious for beginners |
| **Trace Detective** | Investigation focus | Clear about traces | Narrow (sounds trace-only) |
| **Observability Dojo** | Practice/training | Implies hands-on learning | May sound too martial-artsy |
| **Signal Sleuth** | Mystery + signal | Alliterative, memorable | "Signal" may confuse non-OTel folks |
| **The OTel Incident** | Story-driven | Narrative appeal | May sound like a single case |
| **OpenTelemetry Quest** | Adventure | Ties to OTel brand | Too similar to Grafana's Quest World |
| **Root Cause Academy** | Investigation focus | Clear outcome | Less about the journey/instrumentation |
| **Span & Solve** | Playful | Short, punchy | May sound too casual for enterprise |

**My take:** Stick with **Telemetry Academy** for the main brand, but use **O11Y Detective** or **Signal Sleuth** as taglines or sub-brands for specific modules (e.g., "O11Y Detective: Advanced Investigation").

---

## 💡 Core Concept

A hybrid learning platform that combines **zero-to-hero OpenTelemetry education** with **incident investigation gameplay**. Each case has two distinct phases that mirror real-world SRE workflows:

### Phase 1: Instrumentation
> "The system is blind. You see nothing."

Players must instrument a simulated application by:
- Adding manual spans and attributes
- Configuring auto-instrumentation
- Setting up the OpenTelemetry Collector
- Defining resource attributes and context propagation
- Configuring exporters

**Goal:** Make telemetry flow. Only when data is being emitted does Phase 2 unlock.

### Phase 2: Investigation
> "Now you have data. What happened?"

Players investigate a simulated incident using real observability tools:
- Explore traces in a Jaeger/Tempo-like UI
- Correlate logs using `trace_id`
- Identify anomalous spans (errors, high latency)
- Find the root cause (slow DB? cache miss? race condition?)
- Propose and validate the fix

---

## 📚 Case Progression (Zero-to-Hero)

| Case # | OTel Concept | Phase 1: Setup | Phase 2: Investigation |
|--------|--------------|----------------|------------------------|
| **1. Hello, Span** | Manual instrumentation | Create a basic span, add custom attributes | Discover which function took 5 seconds |
| **2. Auto-magic** | Auto-instrumentation | Enable OTel agent, zero code changes | Mystery HTTP 500 — which endpoint failed? |
| **3. The Collector** | Collector pipeline | Configure OTLP receiver + exporters | Data not arriving — debug the pipeline |
| **4. Broken Context** | Context propagation | Pass context between 2 microservices | Trace breaks at service B — why? |
| **5. The Baggage** | Baggage attributes | Add `user_id` to baggage for correlation | Find which user caused a latency spike |
| **6. Metrics Meet Traces** | Signal correlation | Add custom metrics alongside traces | High latency → which database operation? |
| **7. Log Detective** | Logs in traces | Structured logging with `trace_id` | Error in logs → find the full trace |
| **8. Sampling Sleuth** | Head/tail sampling | Configure sampling ratios | Rare incident — was the trace sampled? |
| **9. The Perfect Storm** | Everything together | Full system instrumentation | Cascading failure — find the trigger |

---

## 🎮 Game Mechanics

### Phase 1 Interface: The Workshop

```yaml
# Scenario: Payment API experiencing latency
# Mission: Instrument to see what's happening

[File: payment_service.py]
def process_payment(order_id):
    # TODO: Add span here
    # Hint: Use tracer.start_as_current_span()
    
    db.query("UPDATE orders SET paid=true")  # suspicious
    cache.invalidate(f"order:{order_id}")
    return {"status": "ok"}

[Validation Checks]
✓ Span created with correct name?
✓ Attribute 'order_id' added?
✓ Errors captured in span status?
✓ Telemetry flowing to collector?
→ Phase 2 Unlocked
```

**Features:**
- Monaco Editor for code editing
- Inline hints and documentation
- Real-time validation
- Terminal simulation for Collector config

### Phase 2 Interface: The Investigation Board

```
┌─────────────────────────────────────────────────────────────┐
│  TRACE: payment-service (3 spans)                    5.2s   │
│                                                             │
│  [process_payment]  ████████████████████ 5.2s              │
│    ├── [db.query]   ████████████████      4.9s  ← ANOMALY  │
│    └── [cache.inv]  █                       3ms            │
│                                                             │
│  Problem Span Attributes:                                   │
│  • db.statement: "UPDATE orders SET paid=true"             │
│  • db.system: "postgresql"                                  │
│  • net.peer.name: "db-primary"                              │
│                                                             │
│  [Correlated Logs]                                          │
│  14:32:01 ERROR: connection pool exhausted                 │
│                                                             │
│  Root Cause Analysis:                                       │
│  [ ] Missing PostgreSQL index                               │
│  [ ] Connection pool misconfigured          ☑               │
│  [ ] Cache miss causing DB overload                         │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Interactive trace visualization (similar to Jaeger)
- Log search with `trace_id` correlation
- Metric charts (latency heatmaps, error rates)
- "Aha!" moment detection when root cause is identified
- Explanation of the correct answer with learning notes

---

## 🛠️ Technical Stack (MVP)

### Backend (Go)
- **Case Orchestrator:** Loads YAML case definitions, manages player progress
- **Code Runner:** WASM-based sandbox for executing player instrumentation code
- **Validator:** Checks if generated telemetry meets requirements
- **Infrastructure Simulator:** Generates realistic load, errors, and latency patterns

### Frontend (React + TypeScript)
- **Split-screen layout:** Code editor (left) + Visualization (right)
- **Monaco Editor:** For Python/Go/Java code editing
- **Trace Viewer:** Custom component or embedded Jaeger UI
- **Terminal:** XTerm.js for simulated shell experience

### Observability Backend
- **Jaeger or Grafana Tempo:** Real trace storage and querying
- **Grafana Loki:** Log aggregation
- **Prometheus:** Metrics storage
- Player exports OTLP to these systems — real data, real tools.

### Case Definition Format (YAML)

```yaml
case_id: "hello-span-001"
name: "Hello, Span"
difficulty: "rookie"
concepts:
  - manual_instrumentation
  - spans
  - attributes

phase1:
  initial_code: |
    def process_order(order_id):
        # Your code here
        db.save(order_id)
        return {"ok": true}
  
  validation:
    - type: span_exists
      name: "process_order"
    - type: attribute_exists
      key: "order_id"
    - type: telemetry_flowing
      timeout: 30s

phase2:
  scenario: "Orders are taking 5 seconds to process"
  traces:
    - service: "order-service"
      spans:
        - name: "process_order"
          duration_ms: 5000
          attributes:
            order_id: "12345"
  
  investigation_tools:
    - traces
    - logs
  
  root_cause:
    type: "slow_database"
    explanation: "The database connection is not pooled, causing each query to establish a new connection."
```

---

## 🚀 Next Steps

1. **Concept Validation:** Build a single-case prototype (Phase 1 only, mocked) to test the learning flow
2. **Case Design:** Finalize the first 3 cases (Rookie level) with full specifications
3. **Tech Spike:** Validate the WASM code runner approach vs. container-based sandboxing
4. **UI Mockups:** Design the split-screen interface and trace visualization component
5. **Community:** Consider proposing this to the OpenTelemetry community as an official learning resource

---

## 📎 Related Projects

- [SDPD](https://sdpd.live) — System Design Police Department (inspiration for investigation mechanics)
- [SQLPD](https://sqlpd.com) — SQL Police Department (original detective game format)
- [Quest World](https://github.com/grafana/adventure) — Grafana's observability adventure game
- [OpenTelemetry Demo](https://github.com/open-telemetry/opentelemetry-demo) — Reference application for OTel

---

*Document created for concept refinement. Subject to change as the project evolves.*
