import logging
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.resources import Resource

# --- SDK setup (don't change these) ---
resource = Resource(attributes={})
tracer_provider = TracerProvider(resource=resource)
tracer_provider.add_span_processor(SimpleSpanProcessor(JSSpanExporter()))
trace.set_tracer_provider(tracer_provider)
tracer = trace.get_tracer(__name__)
# --------------------------------------

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def charge_user(user_id, amount):
    with tracer.start_as_current_span("billing.charge") as span:
        for attempt in range(1, 4):
            # TODO: Add span.set_attribute("user_id", user_id) here
            # TODO: Add span.set_attribute("billing.attempt", attempt) here
            # These structured fields let you pivot from a log alert to this span instantly

            logger.info("Billing attempt %d for %s: amount=%.2f", attempt, user_id, amount)

            if attempt < 3:
                logger.warning("Charge declined for %s (attempt %d/3): insufficient_funds", user_id, attempt)
            else:
                logger.error("billing.charge failed for user_id=%s: insufficient_funds (attempt 3/3) — giving up", user_id)
                raise ValueError(f"Charge failed for {user_id}: insufficient_funds after 3 attempts")

charge_user("usr_4821", 99.00)
