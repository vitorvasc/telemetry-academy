from opentelemetry import trace, baggage, context
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.resources import Resource

# TODO: Import inject and extract from opentelemetry.propagate
# from opentelemetry.propagate import inject, extract

provider = TracerProvider(
    resource=Resource(attributes={"service.name": "api-gateway"})
)
provider.add_span_processor(SimpleSpanProcessor(JSSpanExporter()))
trace.set_tracer_provider(provider)

tracer = trace.get_tracer(__name__)


def check_rate_limit(user_id: str, carrier: dict):
    # TODO: Extract the context (with baggage) from the carrier
    # ctx = extract(carrier)
    # TODO: Read baggage values
    # plan = baggage.get_baggage("user.plan", ctx)
    # region = baggage.get_baggage("request.region", ctx)
    with tracer.start_as_current_span("rate_limiter.check") as span:
        # TODO: Annotate the span with baggage values
        # span.set_attribute("user.plan", plan or "missing")
        # span.set_attribute("request.region", region or "missing")
        span.set_attribute("rate_limit.applied", "free_tier")
        span.set_attribute("rate_limit.threshold_rpm", "60")
        return {"allowed": False, "reason": "rate_limit_exceeded"}


def handle_api_request(user_id: str, plan: str):
    with tracer.start_as_current_span("api.request") as span:
        span.set_attribute("user_id", user_id)
        span.set_attribute("http.method", "GET")
        span.set_attribute("http.route", "/api/data")

        carrier = {}
        # TODO: Set user.plan and request.region as baggage
        # ctx = baggage.set_baggage("user.plan", plan)
        # ctx = baggage.set_baggage("request.region", "us-east-1", context=ctx)

        # TODO: Inject the context (with baggage) into the carrier
        # inject(carrier, context=ctx)

        result = check_rate_limit(user_id, carrier)
        return result


handle_api_request("usr_9921", "premium")
