from opentelemetry import trace, baggage, context
from opentelemetry.propagators.textmap import DefaultTextMapPropagator

tracer = trace.get_tracer("checkout-platform")
propagator = DefaultTextMapPropagator()

# --- Mock services (don't change these) ---
class MockAuth:
    def validate_token(self, user_id):
        return {"result": "valid", "pool_wait_ms": 3200}

class MockInventory:
    def check_stock(self, item_id):
        return {"cache_hit": False, "cached_stock": 0, "actual_stock": 142}

class MockPayment:
    def charge(self, order_id, amount, stock):
        return {"status": "rejected", "reason": "out_of_stock"} if stock == 0 else {"status": "ok"}

auth_svc = MockAuth()
inventory_svc = MockInventory()
payment_svc = MockPayment()
# ------------------------------------------

def process_checkout(user_id, tier, order_id):
    # Baggage is already set for you — user.tier is available downstream
    ctx = baggage.set_baggage("user.tier", tier)
    carrier = {}
    propagator.inject(carrier, context=ctx)

    # TODO: Add a checkout.process span that wraps the calls below
    # Hint: with tracer.start_as_current_span('checkout.process') as span:

    validate_auth(user_id, carrier)
    check_inventory("item_882", carrier)
    charge_payment(order_id, 249.99, carrier)

def validate_auth(user_id, carrier):
    # TODO: Extract context and add an auth.validate span
    # Hint: ctx = propagator.extract(carrier), then start_as_current_span in that context

    auth_result = auth_svc.validate_token(user_id)

    # TODO: Add auth.connection_pool.wait_ms attribute to the span
    # Hint: span.set_attribute('auth.connection_pool.wait_ms', str(auth_result['pool_wait_ms']))

def check_inventory(item_id, carrier):
    # TODO: Extract context and add an inventory.check span

    stock = inventory_svc.check_stock(item_id)

    # TODO: Add inventory.cache_hit attribute to the span
    # Hint: span.set_attribute('inventory.cache_hit', str(stock['cache_hit']).lower())

def charge_payment(order_id, amount, carrier):
    result = payment_svc.charge(order_id, amount, 0)
    return result

process_checkout("usr_5521", "premium", "ord_7732")
