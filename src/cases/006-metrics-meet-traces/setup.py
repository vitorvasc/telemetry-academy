from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import InMemoryMetricReader
from opentelemetry.sdk.resources import Resource

# --- SDK setup (don't change these) ---
resource = Resource(attributes={})
tracer_provider = TracerProvider(resource=resource)
tracer_provider.add_span_processor(SimpleSpanProcessor(JSSpanExporter()))
trace.set_tracer_provider(tracer_provider)
tracer = trace.get_tracer(__name__)

reader = InMemoryMetricReader()
meter_provider = MeterProvider(resource=resource, metric_readers=[reader])
metrics.set_meter_provider(meter_provider)
meter = metrics.get_meter(__name__)
# --------------------------------------

def handle_checkout(order_id, amount):
    with tracer.start_as_current_span("checkout.handle") as span:
        # TODO: Create a counter named 'requests.total' and a histogram named
        # 'request.duration' (unit='ms') using the meter above.
        # Hint: meter.create_counter(...) and meter.create_histogram(...)

        # TODO: Record metric observations and confirm with a span attribute.
        # After recording, add: span.set_attribute('metrics.recorded', 'true')
        # Hint: counter.add(1, {"endpoint": "/checkout"})
        #       histogram.record(amount, {"endpoint": "/checkout"})

        span.set_attribute("order_id", order_id)
        return {"status": "ok", "order_id": order_id, "amount": amount}

handle_checkout("ord_5521", 142)
