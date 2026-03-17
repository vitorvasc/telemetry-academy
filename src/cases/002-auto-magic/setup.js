// trace, context, SpanStatusCode are available as globals

// In JavaScript/Node.js, auto-instrumentation is done via
// @opentelemetry/auto-instrumentations-node or manual SDK setup.
// Here we'll practice the manual SDK setup pattern.

const tracer = trace.getTracer('user-service', '1.0.0');

async function getUser(userId) {
  // TODO: Wrap this function with a span
  // Hint: Use tracer.startActiveSpan('http.get /users/:id', span => { ... })

  // TODO: Add HTTP attributes to the span
  // Hint: span.setAttribute('http.method', 'GET')
  //       span.setAttribute('http.url', `/users/${userId}`)

  // Simulated HTTP call that sometimes fails
  if (userId === 999) {
    throw new Error('External API returned 500');
  }

  console.log(`Fetched user ${userId}`);
  return { id: userId, name: 'Alice' };
}

// Run the function
try {
  await getUser(42);
  await getUser(999);
} catch (err) {
  console.log('Error caught:', err.message);
}
