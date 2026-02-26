import sys
import json
import js
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor, SpanExporter, SpanExportResult

class JSStdout:
    def write(self, s):
        if s:
            # postMessage via JS global
            js.postMessage(json.dumps({"type": "stdout", "message": str(s)}))
    
    def flush(self):
        pass

class JSSpanExporter(SpanExporter):
    def export(self, spans):
        for span in spans:
            try:
                span_json_str = span.to_json()
                js.postMessage(json.dumps({
                    "type": "telemetry", 
                    "span": json.loads(span_json_str)
                }))
            except Exception as e:
                js.postMessage(json.dumps({"type": "error", "message": f"Span export error: {str(e)}"}))
        return SpanExportResult.SUCCESS
    
    def shutdown(self):
        pass

# Setup stdout override
sys.stdout = JSStdout()

# Configure OpenTelemetry global TracerProvider
provider = TracerProvider()
processor = SimpleSpanProcessor(JSSpanExporter())
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)
