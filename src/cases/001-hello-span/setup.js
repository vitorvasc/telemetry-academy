// trace, context, SpanStatusCode are available as globals

const tracer = trace.getTracer('order-service');

function processOrder(orderId) {
  // TODO: Create a span around this function
  // Hint: Use tracer.startActiveSpan()

  // TODO: Add order_id as an attribute
  // Hint: Use span.setAttribute('order_id', orderId)

  // Simulated operations
  console.log(`Processing order ${orderId}...`);

  return { status: 'ok', order_id: orderId };
}

// Run the function
const result = processOrder('order-42');
console.log('Result:', JSON.stringify(result));
