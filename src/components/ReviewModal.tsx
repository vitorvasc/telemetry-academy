import React from 'react'
import { X, CheckCircle2, Clock, Activity } from 'lucide-react'
import type { TraceSpan } from '../types/phase2'
import type { RootCauseOption } from '../types/phase2'
import { formatSpanMs } from '../lib/formatters'

interface ReviewModalProps {
  spans: TraceSpan[]
  correctOption: RootCauseOption | null
  onClose: () => void
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  spans,
  correctOption,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        className="absolute inset-0 w-full h-full bg-black/70 cursor-default"
        onClick={onClose}
        aria-label="Close review modal"
      />

      {/* Modal card */}
      <div className="relative z-10 bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-slate-200">
              Investigation Review
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* Spans table — or empty state for yaml-config cases */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Your Trace ({spans.length} span{spans.length !== 1 ? 's' : ''})
            </div>
            {spans.length === 0 ? (
              <div className="rounded-lg border border-slate-700 px-4 py-3 text-xs text-slate-500 italic">
                This case uses YAML configuration — no live spans were captured.
                See the root cause explanation below.
              </div>
            ) : (
              <div className="rounded-lg border border-slate-700 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-slate-400">
                      <th className="text-left px-3 py-2 font-medium">
                        Span Name
                      </th>
                      <th className="text-right px-3 py-2 font-medium">
                        Duration
                      </th>
                      <th className="text-right px-3 py-2 font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {spans.map((span, i) => (
                      <tr
                        key={span.id}
                        className={`border-t border-slate-700/50 ${i % 2 === 0 ? '' : 'bg-slate-800/30'}`}
                      >
                        <td className="px-3 py-2 text-slate-300 font-mono">
                          {span.name}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-400">
                          <span className="flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" />
                            {formatSpanMs(span.durationMs)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className={`font-bold ${span.status === 'error' ? 'text-red-400' : 'text-green-400'}`}
                          >
                            {span.status === 'error' ? 'ERROR' : 'OK'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Correct explanation */}
          {correctOption && (
            <div className="bg-green-950/30 border border-green-800/50 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-green-400 mb-1">
                    Root Cause
                  </div>
                  <div className="text-sm font-medium text-slate-200 mb-2">
                    {correctOption.label}
                  </div>
                  <div className="text-xs text-slate-400 leading-relaxed">
                    {correctOption.explanation}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white text-sm rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
