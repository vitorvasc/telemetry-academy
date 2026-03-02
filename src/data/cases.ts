import type { Case } from '../types';

export const cases: Case[] = [
  {
    id: 'hello-span-001',
    name: 'Hello, Span',
    difficulty: 'rookie',
    concepts: ['manual_instrumentation', 'spans', 'attributes'],
    phase1: {
      description: `
Welcome to your first case, Rookie!

**The Situation:**
The order processing service is running slow, and we have no visibility into what's happening. The system is essentially "blind" — we need to add telemetry to see inside.

**Your Mission:**
Instrument the code to create a span around the order processing logic and add the order_id as an attribute.

**Key Concepts:**
- **Span**: A unit of work in distributed tracing (represents an operation)
- **Attribute**: Key-value pairs that add context to spans
- **Tracer**: The OTel object that creates spans

**Hints:**
1. Use the tracer to start a span
2. Add 'order_id' as an attribute
3. The span should cover the entire function execution
`,
      hints: [
        'Use `tracer.start_as_current_span()` to create a span',
        'Add attributes using `span.set_attribute()` or pass them when starting the span',
        'Make sure the span covers the database and cache operations',
      ],
      initialCode: `from opentelemetry import trace

# Get the tracer
tracer = trace.get_tracer(__name__)

def process_order(order_id):
    # TODO: Create a span around this function
    # Hint: Use tracer.start_as_current_span()
    
    # TODO: Add order_id as an attribute
    # Hint: Use span.set_attribute("order_id", order_id)
    
    db.save(order_id)
    cache.invalidate(f"order:{order_id}")
    
    return {"status": "ok", "order_id": order_id}
`,
      validations: [
        {
          type: 'span_exists',
          description: 'A span must be created around the process_order function',
          successMessage: '✓ Span created successfully',
          errorMessage: '✗ No span found. Use tracer.start_as_current_span()',
          hintMessage: '💡 Hint: Use tracer.start_as_current_span(\'process_order\')',
          guidedMessage: "📖 Use: with tracer.start_as_current_span('process_order') as span:",
        },
        {
          type: 'attribute_exists',
          description: 'The order_id must be added as a span attribute',
          successMessage: '✓ Attribute order_id added',
          errorMessage: '✗ Attribute order_id not found. Use set_attribute()',
          hintMessage: "💡 Hint: Use span.set_attribute('order_id', order_id)",
          guidedMessage: "📖 Inside the span context, add: span.set_attribute('order_id', order_id)",
        },
        {
          type: 'telemetry_flowing',
          description: 'Telemetry must be properly configured and flowing',
          successMessage: '✓ Telemetry is flowing! Phase 1 complete.',
          errorMessage: '✗ Telemetry not properly configured',
          hintMessage: '💡 Make sure your span covers all the function logic',
          guidedMessage: "📖 Ensure the 'with' block wraps the database and cache operations",
        },
      ],
    },
    phase2: {
      description: `
**Investigation Phase**

Now that telemetry is flowing, we can see what's happening!

The traces show that the order processing is taking 5 seconds. Your job is to investigate the trace data and find the root cause.
`,
      investigationTools: ['traces', 'logs'],
    },
  },
  {
    id: 'auto-magic-002',
    name: 'Auto-magic',
    difficulty: 'rookie',
    concepts: ['auto_instrumentation', 'http_traces', 'zero_code'],
    phase1: {
      description: `
**Case #2: Auto-magic**

Your system has multiple HTTP endpoints, but manual instrumentation is tedious. Let's explore auto-instrumentation!

**Your Mission:**
Configure auto-instrumentation for a FastAPI application without modifying the application code.
`,
      hints: [
        'Use opentelemetry-instrument command',
        'Set OTEL_SERVICE_NAME environment variable',
        'Configure the exporter endpoint',
      ],
      initialCode: `# app.py - DON'T MODIFY THIS FILE
from fastapi import FastAPI
import requests

app = FastAPI()

@app.get("/users/{user_id}")
def get_user(user_id: int):
    # This endpoint sometimes fails
    response = requests.get(f"https://api.external.com/users/{user_id}")
    return response.json()

# TODO: Configure auto-instrumentation
# Hint: Use the opentelemetry-instrument command
# Example: opentelemetry-instrument --traces_exporter otlp python app.py
`,
      validations: [
        {
          type: 'span_exists',
          description: 'HTTP spans must be auto-generated',
          successMessage: '✓ HTTP spans are being generated',
          errorMessage: '✗ No HTTP spans found. Check auto-instrumentation config',
          hintMessage: '💡 Hint: Check opentelemetry-instrument is configured',
          guidedMessage: '📖 Set OTEL_SERVICE_NAME and run with: opentelemetry-instrument python app.py',
        },
      ],
    },
    phase2: {
      description: `
**Investigation Phase**

Users are reporting 500 errors. Investigate the traces to find which endpoint is failing and why.
`,
      investigationTools: ['traces'],
    },
  },
];
