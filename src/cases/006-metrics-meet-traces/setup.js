// trace, context, SpanStatusCode are available as globals
// Note: OTel JS metrics require @opentelemetry/sdk-metrics
// In this sandbox, use the metrics API from @opentelemetry/api

const { metrics } = await import('@opentelemetry/api').catch(() => ({ metrics: null }));

const tracer = trace.getTracer('checkout-service');
const meter = metrics?.getMeter('checkout-service');

// TODO: Create a counter named 'requests.total'
// const requestCounter = meter?.createCounter('requests.total', {
//   description: 'Total number of checkout requests',
// });

// TODO: Create a histogram named 'request.duration' (unit: 'ms')
// const durationHistogram = meter?.createHistogram('request.duration', {
//   unit: 'ms',
//   description: 'Duration of checkout requests',
// });

function handleCheckout(orderId, amount) {
  return tracer.startActiveSpan('checkout.handle', (span) => {
    span.setAttribute('order_id', orderId);

    // TODO: Record metric observations
    // requestCounter?.add(1, { endpoint: '/checkout' });
    // durationHistogram?.record(amount, { endpoint: '/checkout' });

    // TODO: Confirm metrics are recorded with a span attribute
    // span.setAttribute('metrics.recorded', 'true');

    span.end();
    return { status: 'ok', order_id: orderId, amount };
  });
}

const result = handleCheckout('ord_5521', 142);
console.log('Result:', JSON.stringify(result));
