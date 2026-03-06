from opentelemetry import trace

# Get the tracer
tracer = trace.get_tracer(__name__)

def process_order(order_id):
    # TODO: Create a span around this function
    # Hint: Use tracer.start_as_current_span()
    
    # TODO: Add order_id as an attribute
    # Hint: Use span.set_attribute("order_id", order_id)
    
    db.save(order_id)
    cache.invalidate(f"order:{order_id}")
    
    return {"status": "ok", "order_id": order_id}
