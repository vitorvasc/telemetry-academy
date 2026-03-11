---
created: 2025-06-25
updated: 2025-06-25
project: Telemetry Academy
tags: [opentelemetry, education, gamification, observability, incident-response]
status: active
---

# Telemetry Academy — Concept

> **Learn OpenTelemetry by instrumenting real systems and investigating real incidents.**

---

## Core Concept

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

## Case Progression (Zero-to-Hero)

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

## Game Mechanics

### Phase 1 Interface: The Workshop

```
[File: payment_service.py]
def process_payment(order_id):
    # TODO: Add span here
    # Hint: Use tracer.start_as_current_span()

    db.query("UPDATE orders SET paid=true")
    cache.invalidate(f"order:{order_id}")
    return {"status": "ok"}

[Validation Checks]
✓ Span created with correct name?
✓ Attribute 'order_id' added?
✓ Errors captured in span status?
✓ Telemetry flowing to collector?
→ Phase 2 Unlocked
```

### Phase 2 Interface: The Investigation Board

```
┌─────────────────────────────────────────────────────────────┐
│  TRACE: payment-service (3 spans)                    5.2s   │
│                                                             │
│  [process_payment]  ████████████████████ 5.2s              │
│    ├── [db.query]   ████████████████      4.9s  ← ANOMALY  │
│    └── [cache.inv]  █                       3ms            │
│                                                             │
│  Root Cause Analysis:                                       │
│  [ ] Missing PostgreSQL index                               │
│  [✓] Connection pool misconfigured                          │
│  [ ] Cache miss causing DB overload                         │
└─────────────────────────────────────────────────────────────┘
```

---

*Document created for concept refinement. See README.md for current implementation status.*
