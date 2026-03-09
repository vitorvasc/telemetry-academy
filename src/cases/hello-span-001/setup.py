import micropip
await micropip.install('opentelemetry-sdk')

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

# Set up the tracer
exporter = InMemorySpanExporter()
provider = TracerProvider()
provider.add_span_processor(SimpleSpanProcessor(exporter))
trace.set_tracer_provider(provider)
tracer = trace.get_tracer(__name__)

# --- Mock infrastructure (don't change these) ---
class MockDB:
    def save(self, order_id):
        pass  # Simulates a slow DB write

class MockCache:
    def invalidate(self, key):
        pass  # Simulates cache invalidation

db = MockDB()
cache = MockCache()
# ------------------------------------------------

def process_order(order_id):
    # TODO: Create a span around this function
    # Hint: Use tracer.start_as_current_span('process_order')

    # TODO: Add order_id as an attribute
    # Hint: Inside the span, call span.set_attribute('order_id', order_id)

    db.save(order_id)
    cache.invalidate(f"order:{order_id}")

    return {"status": "ok", "order_id": order_id}

process_order("order-42")
