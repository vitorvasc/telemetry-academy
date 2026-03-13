from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace.sampling import (
    TraceIdRatioBased,
    ParentBased,
    ALWAYS_ON,
    ALWAYS_OFF,
)

# --- SDK setup ---
resource = Resource(attributes={})
# TODO: Add sampler=ALWAYS_ON to capture all spans
#       TracerProvider(sampler=ALWAYS_ON, resource=resource)
tracer_provider = TracerProvider(resource=resource)
tracer_provider.add_span_processor(SimpleSpanProcessor(JSSpanExporter()))
trace.set_tracer_provider(tracer_provider)
tracer = trace.get_tracer(__name__)
# -----------------

def handle_checkout(order_id):
    with tracer.start_as_current_span("checkout.handle") as span:
        span.set_attribute("order_id", order_id)
        # TODO: Add span.set_attribute("sampler.configured", "always_on") here
        #       This confirms your sampler is active
        span.set_attribute("checkout.status", "processed")

# Run 5 checkout requests
for i in range(1, 6):
    handle_checkout(f"order_{i:03d}")
