/**
 * Language-agnostic OTel completion definitions.
 *
 * Each entry is defined with camelCase and snake_case variants so a single
 * data source drives autocomplete for every supported editor language.
 * To add a new language, just add a naming convention key to CompletionItem
 * and map it in registerOTelCompletions.
 */

import type { Monaco } from '@monaco-editor/react'

// 0 = Method, 1 = Property (mapped to Monaco CompletionItemKind at registration)
type ItemKind = 0 | 1

interface CompletionItem {
  /** { camelCase: 'getTracer', snake_case: 'get_tracer' } */
  label: { [key: string]: string }
  /** Snippet insertText per convention */
  insertText: { [key: string]: string }
  detail: string
  kind: ItemKind
}

interface GlobalItem {
  label: string
  detail: string
}

// ── Dot-triggered completions keyed by object name ──

const OTEL_MEMBER_COMPLETIONS: Record<string, CompletionItem[]> = {
  trace: [
    {
      label: { camelCase: 'getTracer', snake_case: 'get_tracer' },
      insertText: {
        camelCase: "getTracer('${1:service-name}')",
        snake_case: 'get_tracer(${1:__name__})',
      },
      detail: '(name) -> Tracer',
      kind: 0,
    },
  ],
  tracer: [
    {
      label: { camelCase: 'startSpan', snake_case: 'start_span' },
      insertText: {
        camelCase: "startSpan('${1:span-name}')",
        snake_case: 'start_span(${1:name})',
      },
      detail: '(name, options?) -> Span',
      kind: 0,
    },
    {
      label: {
        camelCase: 'startActiveSpan',
        snake_case: 'start_as_current_span',
      },
      insertText: {
        camelCase:
          "startActiveSpan('${1:span-name}', (${2:span}) => {\n\t$0\n})",
        snake_case: 'start_as_current_span(${1:name})',
      },
      detail: '(name, fn?) -> Span',
      kind: 0,
    },
  ],
  span: [
    {
      label: { camelCase: 'setAttribute', snake_case: 'set_attribute' },
      insertText: {
        camelCase: "setAttribute('${1:key}', ${2:value})",
        snake_case: 'set_attribute(${1:key}, ${2:value})',
      },
      detail: '(key, value) -> void',
      kind: 0,
    },
    {
      label: { camelCase: 'setAttributes', snake_case: 'set_attributes' },
      insertText: {
        camelCase: 'setAttributes({ ${1} })',
        snake_case: 'set_attributes(${1:attributes})',
      },
      detail: '(attributes) -> void',
      kind: 0,
    },
    {
      label: { camelCase: 'setStatus', snake_case: 'set_status' },
      insertText: {
        camelCase: 'setStatus({ code: SpanStatusCode.${1:OK} })',
        snake_case: 'set_status(${1:StatusCode.OK})',
      },
      detail: '(status) -> void',
      kind: 0,
    },
    {
      label: { camelCase: 'addEvent', snake_case: 'add_event' },
      insertText: {
        camelCase: "addEvent('${1:event-name}')",
        snake_case: 'add_event(${1:name})',
      },
      detail: '(name, attributes?) -> void',
      kind: 0,
    },
    {
      label: {
        camelCase: 'recordException',
        snake_case: 'record_exception',
      },
      insertText: {
        camelCase: 'recordException(${1:error})',
        snake_case: 'record_exception(${1:exception})',
      },
      detail: '(exception) -> void',
      kind: 0,
    },
    {
      label: { camelCase: 'end', snake_case: 'end' },
      insertText: { camelCase: 'end()', snake_case: 'end()' },
      detail: '() -> void',
      kind: 0,
    },
    {
      label: { camelCase: 'spanContext', snake_case: 'get_span_context' },
      insertText: {
        camelCase: 'spanContext()',
        snake_case: 'get_span_context()',
      },
      detail: '() -> SpanContext',
      kind: 0,
    },
    {
      label: { camelCase: 'isRecording', snake_case: 'is_recording' },
      insertText: {
        camelCase: 'isRecording()',
        snake_case: 'is_recording()',
      },
      detail: '() -> bool',
      kind: 0,
    },
  ],
  SpanStatusCode: [
    {
      label: { camelCase: 'OK', snake_case: 'OK' },
      insertText: { camelCase: 'OK', snake_case: 'OK' },
      detail: 'SpanStatusCode.OK',
      kind: 1,
    },
    {
      label: { camelCase: 'ERROR', snake_case: 'ERROR' },
      insertText: { camelCase: 'ERROR', snake_case: 'ERROR' },
      detail: 'SpanStatusCode.ERROR',
      kind: 1,
    },
    {
      label: { camelCase: 'UNSET', snake_case: 'UNSET' },
      insertText: { camelCase: 'UNSET', snake_case: 'UNSET' },
      detail: 'SpanStatusCode.UNSET',
      kind: 1,
    },
  ],
  StatusCode: [
    {
      label: { camelCase: 'OK', snake_case: 'OK' },
      insertText: { camelCase: 'OK', snake_case: 'OK' },
      detail: 'StatusCode.OK',
      kind: 1,
    },
    {
      label: { camelCase: 'ERROR', snake_case: 'ERROR' },
      insertText: { camelCase: 'ERROR', snake_case: 'ERROR' },
      detail: 'StatusCode.ERROR',
      kind: 1,
    },
    {
      label: { camelCase: 'UNSET', snake_case: 'UNSET' },
      insertText: { camelCase: 'UNSET', snake_case: 'UNSET' },
      detail: 'StatusCode.UNSET',
      kind: 1,
    },
  ],
}

// ── Top-level globals (no dot) ──

const OTEL_GLOBALS: GlobalItem[] = [
  { label: 'trace', detail: 'OpenTelemetry trace API' },
  { label: 'context', detail: 'OpenTelemetry context API' },
  { label: 'propagation', detail: 'OpenTelemetry propagation API' },
  { label: 'metrics', detail: 'OpenTelemetry metrics API' },
  { label: 'ROOT_CONTEXT', detail: 'Root context constant' },
]

// ── Language → naming convention mapping ──
// To support a new language, add its Monaco language id here.

const LANGUAGE_CONVENTION: Record<string, string> = {
  python: 'snake_case',
  javascript: 'camelCase',
  typescript: 'camelCase',
}

// ── JS/TS type stubs (addExtraLib handles autocomplete natively) ──

export const OTEL_GLOBALS_DTS = `
interface Span {
  setAttribute(key: string, value: string | number | boolean): Span;
  setAttributes(attributes: Record<string, string | number | boolean>): Span;
  setStatus(status: { code: SpanStatusCode; message?: string }): Span;
  addEvent(name: string, attributes?: Record<string, string | number | boolean>): Span;
  recordException(exception: Error | string): void;
  end(): void;
  spanContext(): { traceId: string; spanId: string };
  isRecording(): boolean;
}

interface Tracer {
  startSpan(name: string, options?: {
    attributes?: Record<string, string | number | boolean>;
    kind?: number;
  }): Span;
  startActiveSpan<T>(name: string, fn: (span: Span) => T): T;
  startActiveSpan<T>(name: string, options: {
    attributes?: Record<string, string | number | boolean>;
    kind?: number;
  }, fn: (span: Span) => T): T;
}

interface TracerProvider {
  getTracer(name: string, version?: string): Tracer;
}

interface TraceAPI {
  getTracer(name: string, version?: string): Tracer;
  setGlobalTracerProvider(provider: TracerProvider): void;
  getTracerProvider(): TracerProvider;
}

interface ContextAPI {
  active(): unknown;
  with<T>(ctx: unknown, fn: () => T): T;
}

interface PropagationAPI {
  inject(context: unknown, carrier: Record<string, string>): void;
  extract(context: unknown, carrier: Record<string, string>): unknown;
}

interface MetricsAPI {
  getMeter(name: string, version?: string): unknown;
}

declare const trace: TraceAPI;
declare const context: ContextAPI;
declare const ROOT_CONTEXT: unknown;
declare const SpanStatusCode: { UNSET: 0; OK: 1; ERROR: 2 };
declare const propagation: PropagationAPI;
declare const metrics: MetricsAPI;
`

// ── Registration ──

const registeredLanguages = new Set<string>()

/**
 * Register OTel completion providers for all supported languages.
 * Call once from the editor's onMount handler.
 * Safe to call multiple times — each language is registered only once.
 */
export function registerOTelCompletions(monaco: Monaco) {
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */

  // JS/TS get native type-based autocomplete via addExtraLib
  monaco.languages.typescript.javascriptDefaults.addExtraLib(
    OTEL_GLOBALS_DTS,
    'otel-globals.d.ts'
  )

  // For non-TS languages (Python, future additions), register a completion provider
  for (const [languageId, convention] of Object.entries(LANGUAGE_CONVENTION)) {
    if (languageId === 'javascript' || languageId === 'typescript') continue
    if (registeredLanguages.has(languageId)) continue
    registeredLanguages.add(languageId)
    monaco.languages.registerCompletionItemProvider(languageId, {
      triggerCharacters: ['.'],
      provideCompletionItems(model: any, position: any) {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }

        const lineContent = model.getLineContent(position.lineNumber)
        const textBeforeCursor = lineContent.substring(0, position.column - 1)
        const dotMatch = textBeforeCursor.match(/(\w+)\.\s*$/)

        if (dotMatch) {
          const objectName = dotMatch[1]
          const items = OTEL_MEMBER_COMPLETIONS[objectName]
          if (items) {
            return {
              suggestions: items.map(item => ({
                label: item.label[convention] ?? item.label['camelCase'],
                kind:
                  item.kind === 0
                    ? monaco.languages.CompletionItemKind.Method
                    : monaco.languages.CompletionItemKind.Property,
                insertText:
                  item.insertText[convention] ?? item.insertText['camelCase'],
                insertTextRules:
                  monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: item.detail,
                range,
              })),
            }
          }
        }

        return {
          suggestions: OTEL_GLOBALS.map(item => ({
            label: item.label,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: item.label,
            detail: item.detail,
            range,
          })),
        }
      },
    })
  }

  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
}
