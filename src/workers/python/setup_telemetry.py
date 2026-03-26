import sys
import json
import js
from pyodide.ffi import to_js
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor, SpanExporter, SpanExportResult
from opentelemetry.sdk.resources import Resource

def _to_js_obj(d):
    """Convert a Python dict to a plain JS object (structured-cloneable)."""
    return to_js(d, dict_converter=js.Object.fromEntries)

class JSStdout:
    def write(self, s):
        if s:
            js.postMessage(_to_js_obj({"type": "stdout", "message": str(s)}))

    def flush(self):
        pass

class JSSpanExporter(SpanExporter):
    def export(self, spans):
        for span in spans:
            try:
                span_json_str = span.to_json()
                js.postMessage(_to_js_obj({
                    "type": "telemetry",
                    "span": json.loads(span_json_str)
                }))
            except Exception as e:
                js.postMessage(_to_js_obj({"type": "error", "message": f"Span export error: {str(e)}"}))
        return SpanExportResult.SUCCESS

    def shutdown(self):
        pass

# Setup stdout override
sys.stdout = JSStdout()

# Configure OpenTelemetry global TracerProvider
# Use Resource directly to avoid threading-based resource detection (not supported in WASM)
# Note: Resource.create() uses threading - we must use Resource() constructor directly
resource = Resource(attributes={"service.name": "telemetry-academy"})
provider = TracerProvider(resource=resource)
processor = SimpleSpanProcessor(JSSpanExporter())
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)
