import { BasicTracerProvider, InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { trace, context, ROOT_CONTEXT, SpanStatusCode } from '@opentelemetry/api';
import type { ReadableSpan } from '@opentelemetry/sdk-trace-base';
import type { RawOTelSpan } from '../hooks/usePhase2Data';

// Silence the OpenTelemetry global logger in the worker
(globalThis as Record<string, unknown>)['OTEL_LOG_LEVEL'] = 'none';

let runId = 0;

function setupProvider(): { provider: BasicTracerProvider; exporter: InMemorySpanExporter } {
  const exporter = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  // Register as the global tracer provider
  trace.setGlobalTracerProvider(provider);
  return { provider, exporter };
}

function captureConsole(): { lines: string[]; restore: () => void } {
  const lines: string[] = [];
  const origLog = console.log.bind(console);
  const origWarn = console.warn.bind(console);
  const origError = console.error.bind(console);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.log = (...args: any[]) => { lines.push(args.map(String).join(' ')); };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.warn = (...args: any[]) => { lines.push('[warn] ' + args.map(String).join(' ')); };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.error = (...args: any[]) => { lines.push('[error] ' + args.map(String).join(' ')); };

  const restore = () => {
    console.log = origLog;
    console.warn = origWarn;
    console.error = origError;
  };
  return { lines, restore };
}

function spansToRaw(spans: ReadableSpan[]): RawOTelSpan[] {
  return spans.map(span => {
    const attrs: Record<string, string> = {};
    if (span.attributes) {
      Object.entries(span.attributes).forEach(([k, v]) => {
        attrs[k] = String(v ?? '');
      });
    }

    const statusCode = span.status.code as number;
    // SpanStatusCode: UNSET=0, OK=1, ERROR=2
    const statusStr = statusCode === 2 ? 'ERROR' : statusCode === 1 ? 'OK' : 'UNSET';

    // parentSpanContext is the public API for accessing the parent span ID
    const parentSpanId = span.parentSpanContext?.spanId ?? null;

    return {
      name: span.name,
      context: {
        trace_id: span.spanContext().traceId,
        span_id: span.spanContext().spanId,
      },
      parent_id: parentSpanId ?? undefined,
      start_time: span.startTime[0] * 1000 + span.startTime[1] / 1e6,
      end_time: span.endTime[0] * 1000 + span.endTime[1] / 1e6,
      attributes: attrs,
      status: { status_code: statusStr },
      events: (span.events ?? []).map(e => ({ name: e.name, timestamp: e.time[0] * 1000 })),
    } satisfies RawOTelSpan;
  });
}

self.onmessage = async (event: MessageEvent) => {
  const { type, code, id } = event.data as { type: string; code: string; id: string };

  if (type !== 'run') return;

  const currentRun = ++runId;
  const { provider, exporter } = setupProvider();
  const { lines, restore } = captureConsole();

  // 5s matches the Python worker convention. Note: setTimeout cannot interrupt a
  // synchronous infinite loop (e.g. while(true){}) because the JS event loop is
  // blocked — the host-side Worker.terminate() handles that case via useCodeRunner.
  const timeout = setTimeout(() => {
    if (runId === currentRun) {
      restore();
      self.postMessage({ type: 'error', id, error: 'Execution timed out (5s)' });
    }
  }, 5000);

  try {
    // Inject OTel globals into user code
     
    const globals = { trace, context, ROOT_CONTEXT, SpanStatusCode };
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function(
      ...Object.keys(globals),
      `"use strict";\n${code}`
    );

    await Promise.resolve(fn(...Object.values(globals)));

    clearTimeout(timeout);
    restore();

    // Force-end any open spans by shutting down the provider
    await provider.shutdown();

    const rawSpans = spansToRaw(exporter.getFinishedSpans());

    self.postMessage({
      type: 'complete',
      id,
      spans: rawSpans,
      output: lines,
    });
  } catch (err: unknown) {
    clearTimeout(timeout);
    restore();
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ type: 'error', id, error: message, output: lines });
  }
};
