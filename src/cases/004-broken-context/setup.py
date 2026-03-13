from opentelemetry import trace, context
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.resources import Resource

# TODO: Import inject and extract from opentelemetry.propagate
# from opentelemetry.propagate import inject, extract

provider = TracerProvider(
    resource=Resource(attributes={"service.name": "checkout-service"})
)
provider.add_span_processor(SimpleSpanProcessor(JSSpanExporter()))
trace.set_tracer_provider(provider)

tracer = trace.get_tracer(__name__)


def charge_payment(order_id: str, amount: float, carrier: dict):
    # TODO: Extract the trace context from the carrier
    # ctx = extract(carrier)
    # Then start the span with: tracer.start_as_current_span('payment.charge', context=ctx)
    with tracer.start_as_current_span("payment.charge") as span:
        span.set_attribute("payment.amount", str(amount))
        span.set_attribute("payment.status", "charged")
        return {"charged": True, "amount": amount}


def process_checkout(order_id: str):
    with tracer.start_as_current_span("checkout.process") as span:
        span.set_attribute("order_id", order_id)
        span.set_attribute("checkout.step", "payment")

        carrier = {}
        # TODO: Inject the current trace context into the carrier
        # inject(carrier)

        result = charge_payment(order_id, 129.99, carrier)
        return {"status": "ok", "order_id": order_id, "payment": result}


process_checkout("ord_8821")
