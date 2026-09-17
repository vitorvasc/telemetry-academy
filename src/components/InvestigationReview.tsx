import React from 'react'
import { CheckCircle2, Clock, Activity } from 'lucide-react'
import type { TraceSpan } from '../types/phase2'
import type { RootCauseOption } from '../types/phase2'
import { formatSpanMs } from '../lib/formatters'

interface InvestigationReviewProps {
  spans: TraceSpan[]
  correctOption: RootCauseOption | null
}

export const InvestigationReview: React.FC<InvestigationReviewProps> = ({
  spans,
  correctOption,
}) => {
  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-2xl flex flex-col text-left">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700">
        <Activity className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-semibold text-slate-200">
          Investigation Review
        </span>
      </div>

      {/* Content */}
      <div className="px-5 py-4 space-y-5">
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
                    <th className="text-right px-3 py-2 font-medium">Status</th>
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
    </div>
  )
}
