// trace, context, SpanStatusCode are available as globals

// In Python, URLLibInstrumentor patches urllib automatically.
// In JavaScript there's no WASM-compatible auto-instrumentation,
// so we manually create the same span that the instrumentor would produce:
// a root span named "HTTP GET" with http.url and http.status_code attributes.

const tracer = trace.getTracer('checkout-service', '1.0.0');

async function fetchPaymentApi(url) {
  // TODO: Wrap this in a span named exactly "HTTP GET"
  // Hint: tracer.startActiveSpan('HTTP GET', async (span) => { ... })

  // TODO: Add the attributes that URLLibInstrumentor sets automatically:
  //   span.setAttribute('http.url', url)
  //   span.setAttribute('http.method', 'GET')

  // Simulated HTTP call (replace with span-wrapped version)
  console.log(`GET ${url}`);
  return { status: 200 };
}

// TODO: Call span.end() when done, then return inside the span callback
await fetchPaymentApi('https://payment-api.internal/charge');
