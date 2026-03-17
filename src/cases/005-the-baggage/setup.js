// trace, context, SpanStatusCode are available as globals
// propagation is available via @opentelemetry/api

const tracer = trace.getTracer('api-gateway');

function checkRateLimit(userId, carrier) {
  // TODO: Extract the context (with baggage) from the carrier
  // const ctx = propagation.extract(ROOT_CONTEXT, carrier);
  // TODO: Read baggage values
  // const { baggage: baggageApi } = require('@opentelemetry/api');
  // const plan = baggageApi.getBaggage(ctx)?.getEntry('user.plan')?.value;
  // const region = baggageApi.getBaggage(ctx)?.getEntry('request.region')?.value;

  return tracer.startActiveSpan('rate_limiter.check', (span) => {
    // TODO: Annotate the span with baggage values
    // span.setAttribute('user.plan', plan ?? 'missing');
    // span.setAttribute('request.region', region ?? 'missing');
    span.setAttribute('rate_limit.applied', 'free_tier');
    span.setAttribute('rate_limit.threshold_rpm', '60');
    span.end();
    return { allowed: false, reason: 'rate_limit_exceeded' };
  });
}

function handleApiRequest(userId, plan) {
  return tracer.startActiveSpan('api.request', (span) => {
    span.setAttribute('user_id', userId);
    span.setAttribute('http.method', 'GET');
    span.setAttribute('http.route', '/api/data');

    const carrier = {};
    // TODO: Set user.plan and request.region as baggage
    // const { baggage: baggageApi } = require('@opentelemetry/api');
    // let ctx = baggageApi.setBaggage(context.active(), baggageApi.createBaggage({ 'user.plan': { value: plan } }));
    // ctx = baggageApi.setBaggage(ctx, baggageApi.createBaggage({ 'request.region': { value: 'us-east-1' } }));

    // TODO: Inject the context (with baggage) into the carrier
    // propagation.inject(ctx, carrier);

    const result = checkRateLimit(userId, carrier);
    span.end();
    return result;
  });
}

const result = handleApiRequest('usr_9921', 'premium');
console.log('Result:', JSON.stringify(result));
