---
description: Scaffold a new Telemetry Academy case directory with all required files
allowed-tools: Bash, Read, Write, Glob
---

# Scaffold New Case

Create a new case scaffold for Telemetry Academy.

## Step 1: Determine Next Case ID

```bash
ls src/cases/ | sort
```

The next case ID follows the pattern `<concept-slug>-<NNN>` where NNN is the next
3-digit number after the highest existing case number.

## Step 2: Create Directory Structure

```bash
mkdir -p src/cases/<new-id>
```

## Step 3: Create case.yaml Template

Create `src/cases/<new-id>/case.yaml`:

```yaml
id: <new-id>
name: "FILL IN: Human-readable title"
order: <next order number>
difficulty: rookie
concepts:
  - FILL_IN_CONCEPT

phase1:
  description: |
    **The Situation:**
    FILL IN: What is broken/blind in this service?

    **Your Mission:**
    FILL IN: What specifically does the user need to add?

    **Key Concepts:**
    - **CONCEPT**: FILL IN definition
    - **API**: FILL IN what API they use

    **Hints:**
    1. FILL IN hint 1
    2. FILL IN hint 2

  hints:
    - "FILL IN: specific OTel API hint"
    - "FILL IN: attribute/configuration hint"
    - "FILL IN: completion hint"

  validations:
    - type: span_exists
      description: "FILL IN: what span must exist"
      successMessage: "✓ FILL IN"
      errorMessage: "✗ FILL IN with fix suggestion"
      hintMessage: "💡 Hint: FILL IN"
      guidedMessage: "📖 FILL IN exact code"

    - type: telemetry_flowing
      description: "Telemetry must be properly configured and flowing"
      successMessage: "✓ Telemetry is flowing! Phase 1 complete."
      errorMessage: "✗ Telemetry not properly configured"
      hintMessage: "💡 Make sure your instrumentation is correctly set up"
      guidedMessage: "📖 Check that you have configured the TracerProvider and exporter"

phase2:
  description: |
    **Investigation Phase**

    FILL IN: What incident is the user investigating?
    FILL IN: What does the trace data show at a high level?

  investigationTools:
    - traces
    - logs

  rootCauseOptions:
    - id: a
      label: "FILL IN: distractor A"
      correct: false
      explanation: "FILL IN: why wrong, referencing specific span.attribute=value"

    - id: b
      label: "FILL IN: correct answer"
      correct: true
      explanation: "✓ FILL IN: why correct, referencing span.attribute=value and the fix"

    - id: c
      label: "FILL IN: distractor C"
      correct: false
      explanation: "FILL IN: why wrong"

    - id: d
      label: "FILL IN: distractor D"
      correct: false
      explanation: "FILL IN: why wrong"
```

## Step 4: Create setup.py Template

Create `src/cases/<new-id>/setup.py`:

```python
"""
FILL IN: Service name and description
Case: <new-id>
"""
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource

# Telemetry setup - do not modify
resource = Resource.create({"service.name": "FILL-IN-service"})
provider = TracerProvider(resource=resource)

# The exporter is pre-configured to send spans to the Academy UI
import js_exporter
processor = BatchSpanProcessor(js_exporter.JSSpanExporter())
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

tracer = trace.get_tracer("FILL-IN-service")


def FILL_IN_function_name(param):
    """FILL IN: realistic business logic description."""
    # TODO: Add OpenTelemetry instrumentation here
    #       - FILL IN: what span to create
    #       - FILL IN: what attributes to add

    # Existing business logic (do not modify):
    FILL_IN_business_logic_here
    return result


# Run the function to test your instrumentation
FILL_IN_function_name(FILL_IN_sample_param)
```

## Step 5: Confirm

List created files:
```bash
ls -la src/cases/<new-id>/
```

Print the next step reminder:
> Scaffold created for `<new-id>`. Next steps:
> 1. Fill in all `FILL IN` placeholders in `case.yaml`
> 2. Replace `setup.py` template with realistic business logic
> 3. Add phase2 data entry to `src/data/phase2.ts`
> 4. Run `/validate-case <new-id>` to check completeness
