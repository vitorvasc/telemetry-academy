// trace, context, ROOT_CONTEXT, SpanStatusCode, propagation are available as globals

const tracer = trace.getTracer('checkout-service');

// TODO: Extract trace context from carrier using propagation.extract()
// const ctx = propagation.extract(ROOT_CONTEXT, carrier);
// Then use: tracer.startActiveSpan('payment.charge', {}, ctx, (span) => { ... })

function chargePayment(orderId, amount, carrier) {
  // TODO: Extract the trace context from the carrier
  // const ctx = propagation.extract(ROOT_CONTEXT, carrier);
  return tracer.startActiveSpan('payment.charge', (span) => {
    span.setAttribute('payment.amount', String(amount));
    span.setAttribute('payment.status', 'charged');
    span.end();
    return { charged: true, amount };
  });
}

function processCheckout(orderId) {
  return tracer.startActiveSpan('checkout.process', (span) => {
    span.setAttribute('order_id', orderId);
    span.setAttribute('checkout.step', 'payment');

    const carrier = {};
    // TODO: Inject the current trace context into the carrier
    // propagation.inject(context.active(), carrier);

    const result = chargePayment(orderId, 129.99, carrier);
    span.end();
    return { status: 'ok', order_id: orderId, payment: result };
  });
}

const result = processCheckout('ord_8821');
console.log('Checkout result:', JSON.stringify(result));
