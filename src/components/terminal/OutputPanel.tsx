import { useMemo } from 'react'

export interface OutputPanelProps {
  output: string[]
  error?: string | null
  isRunning?: boolean
}

export function OutputPanel({ output, error, isRunning }: OutputPanelProps) {
  // Build stable per-line keys that survive duplicate output lines.
  // The terminal log is append-only, so a "content + occurrence" key uniquely
  // identifies each row without leaning on the array index.
  const lines = useMemo(() => {
    const seen = new Map<string, number>()
    return output.map(line => {
      const n = (seen.get(line) ?? 0) + 1
      seen.set(line, n)
      return { key: `${n}:${line}`, line }
    })
  }, [output])

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 font-mono text-sm rounded-md overflow-hidden border border-slate-700">
      <div className="flex items-center px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="font-semibold text-slate-200">Terminal Output</span>
        {isRunning && (
          <span className="ml-4 text-emerald-400 text-xs animate-pulse">
            Running...
          </span>
        )}
      </div>
      <div className="p-4 overflow-y-auto flex-1">
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
    </div>
  )
}
