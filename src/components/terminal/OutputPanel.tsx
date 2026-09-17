import { useMemo, useState } from 'react'
import type { RawOTelSpan } from '../../hooks/usePhase2Data'
import { normalizeAttributes } from '../../lib/spanTransform'

export interface OutputPanelProps {
  output: string[]
  error?: string | null
  isRunning?: boolean
  spans?: RawOTelSpan[]
}

type Tab = 'output' | 'spans'

// The Python exporter serializes timestamps as ISO-8601 strings (span.to_json());
// the JS worker sends epoch milliseconds. Normalize both to milliseconds.
function toMs(t: number | string): number {
  if (typeof t === 'number') return t
  const frac = /\.(\d+)/.exec(t)?.[1] ?? ''
  const subMs =
    frac.length > 3 ? Number(frac.slice(3, 6).padEnd(3, '0')) / 1000 : 0
  return Date.parse(t) + subMs
}

function formatDuration(span: RawOTelSpan): string {
  const ms = toMs(span.end_time) - toMs(span.start_time)
  return Number.isFinite(ms) ? `${ms.toFixed(2)} ms` : 'n/a'
}

const STATUS_CLASS: Record<string, string> = {
  OK: 'text-emerald-400',
  ERROR: 'text-red-400',
}

export function OutputPanel({
  output,
  error,
  isRunning,
  spans = [],
}: OutputPanelProps) {
  const [tab, setTab] = useState<Tab>('output')

  // Content + occurrence count keeps keys unique for repeated output lines
  // without relying on the array index.
  const lines = useMemo(() => {
    const seen = new Map<string, number>()
    return output.map(line => {
      const n = (seen.get(line) ?? 0) + 1
      seen.set(line, n)
      return { key: `${n}:${line}`, line }
    })
  }, [output])

  const tabClass = (t: Tab) =>
    `px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
      tab === t
        ? 'bg-slate-700 text-slate-100'
        : 'text-slate-400 hover:text-slate-200'
    }`

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 font-mono text-sm rounded-md overflow-hidden border border-slate-700">
      <div
        role="tablist"
        className="flex items-center gap-1 px-4 py-2 bg-slate-800 border-b border-slate-700"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'output'}
          className={tabClass('output')}
          onClick={() => setTab('output')}
        >
          Output
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'spans'}
          className={tabClass('spans')}
          onClick={() => setTab('spans')}
        >
          Spans{spans.length > 0 && ` (${spans.length})`}
        </button>
        {isRunning && (
          <span className="ml-4 text-emerald-400 text-xs animate-pulse">
            Running...
          </span>
        )}
      </div>
      <div hidden={tab !== 'output'} className="p-4 overflow-y-auto flex-1">
        {output.length === 0 && !error && !isRunning && (
          <div className="text-slate-500 italic">No output</div>
        )}
        {lines.map(({ key, line }) => (
          <div key={key} className="whitespace-pre-wrap">
            {line}
          </div>
        ))}
        {error && (
          <div className="text-red-400 whitespace-pre-wrap mt-2">{error}</div>
        )}
      </div>
      <div hidden={tab !== 'spans'} className="p-4 overflow-y-auto flex-1">
        {spans.length === 0 && (
          <div className="text-slate-500 italic">
            No spans captured yet. Run your code to see telemetry output.
          </div>
        )}
        {spans.map(span => {
          const status = span.status?.status_code ?? 'UNSET'
          const attributes = Object.entries(
            normalizeAttributes(span.attributes ?? {})
          )
          return (
            <div
              key={span.context.span_id}
              className="mb-3 pb-2 border-b border-slate-800 last:border-0"
            >
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="text-sky-300 font-semibold">{span.name}</span>
                <span className={STATUS_CLASS[status] ?? 'text-slate-400'}>
                  {status}
                </span>
                <span className="text-slate-400 text-xs">
                  {formatDuration(span)}
                </span>
                <span className="text-slate-500 text-xs">
                  parent: {span.parent_id ?? 'root'}
                </span>
              </div>
              {attributes.length === 0 ? (
                <div className="pl-4 text-xs text-slate-600">no attributes</div>
              ) : (
                attributes.map(([key, value]) => (
                  <div key={key} className="pl-4 text-xs break-all">
                    <span className="text-slate-400">{key}</span>
                    <span className="text-slate-600">=</span>
                    <span className="text-emerald-300">{value}</span>
                  </div>
                ))
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
