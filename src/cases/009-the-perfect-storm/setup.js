// trace, context, SpanStatusCode are available as globals

const tracer = trace.getTracer('checkout-platform');

// --- Mock services (don't change these) ---
const authSvc = {
  validateToken: (userId) => ({ result: 'valid', pool_wait_ms: 3200 }),
};
const inventorySvc = {
  checkStock: (itemId) => ({ cache_hit: false, cached_stock: 0, actual_stock: 142 }),
};
const paymentSvc = {
  charge: (orderId, amount, stock) =>
    stock === 0
      ? { status: 'rejected', reason: 'out_of_stock' }
      : { status: 'ok' },
};
// ------------------------------------------

function validateAuth(userId, carrier) {
  // TODO: Extract context from carrier and start an auth.validate span
  // const ctx = propagation.extract(ROOT_CONTEXT, carrier);
  return tracer.startActiveSpan('auth.validate', (span) => {
    const authResult = authSvc.validateToken(userId);
    // TODO: Add auth.connection_pool.wait_ms attribute to the span
    // span.setAttribute('auth.connection_pool.wait_ms', String(authResult.pool_wait_ms));
    span.end();
    return authResult;
  });
}

function checkInventory(itemId, carrier) {
  // TODO: Extract context and add an inventory.check span
  return tracer.startActiveSpan('inventory.check', (span) => {
    const stock = inventorySvc.checkStock(itemId);
    // TODO: Add inventory.cache_hit attribute to the span
    // span.setAttribute('inventory.cache_hit', String(stock.cache_hit));
    span.end();
    return stock;
  });
}

function chargePayment(orderId, amount, carrier) {
  return tracer.startActiveSpan('payment.charge', (span) => {
    const result = paymentSvc.charge(orderId, amount, 0);
    if (result.status === 'rejected') {
      span.setStatus({ code: SpanStatusCode.ERROR, message: result.reason });
    }
    span.end();
    return result;
  });
}

function processCheckout(userId, tier, orderId) {
  // Baggage is set for you — user.tier is available downstream
  const carrier = { 'user.tier': tier };

  // TODO: Add a checkout.process span that wraps the calls below
  // Hint: tracer.startActiveSpan('checkout.process', (span) => { ... })

  validateAuth(userId, carrier);
  checkInventory('item_882', carrier);
  chargePayment(orderId, 249.99, carrier);
}

processCheckout('usr_5521', 'premium', 'ord_7732');
console.log('Checkout complete');
