// trace, context, SpanStatusCode are available as globals
// Note: The TracerProvider in this sandbox is pre-configured with ALWAYS_ON sampling.
// In real JS apps you configure sampling via:
//   new BasicTracerProvider({ sampler: new TraceIdRatioBasedSampler(0.1) })

const tracer = trace.getTracer('checkout-service');

// The sandbox TracerProvider already uses ALWAYS_ON — all spans are recorded.
// TODO: Add span.setAttribute('sampler.configured', 'always_on') inside the span
//       to confirm your sampler is active

function handleCheckout(orderId) {
  return tracer.startActiveSpan('checkout.handle', (span) => {
    span.setAttribute('order_id', orderId);
    // TODO: Add span.setAttribute('sampler.configured', 'always_on') here
    span.setAttribute('checkout.status', 'processed');
    span.end();
    return { status: 'ok', order_id: orderId };
  });
}

// Run 5 checkout requests
for (let i = 1; i <= 5; i++) {
  const orderId = `order_${String(i).padStart(3, '0')}`;
  const result = handleCheckout(orderId);
  console.log(`Processed: ${result.order_id}`);
}
