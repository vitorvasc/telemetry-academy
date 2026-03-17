// trace, context, SpanStatusCode are available as globals

const tracer = trace.getTracer('billing-service');

function chargeUser(userId, amount) {
  return tracer.startActiveSpan('billing.charge', (span) => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      // TODO: Add span.setAttribute('user_id', userId) here
      // TODO: Add span.setAttribute('billing.attempt', attempt) here
      // These structured fields let you pivot from a log alert to this span instantly

      console.log(`Billing attempt ${attempt} for ${userId}: amount=${amount.toFixed(2)}`);

      if (attempt < 3) {
        console.warn(`Charge declined for ${userId} (attempt ${attempt}/3): insufficient_funds`);
      } else {
        console.error(`billing.charge failed for user_id=${userId}: insufficient_funds (attempt 3/3) — giving up`);
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'insufficient_funds' });
        span.end();
        throw new Error(`Charge failed for ${userId}: insufficient_funds after 3 attempts`);
      }
    }
    span.end();
  });
}

try {
  chargeUser('usr_4821', 99.00);
} catch (err) {
  console.log('Caught:', err.message);
}
