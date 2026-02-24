import React, { useState } from 'react';
import type { TraceSpan } from '../types/phase2';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface TraceViewerProps {
  spans: TraceSpan[];
  totalDurationMs: number;
  traceId: string;
}

const STATUS = {
  ok:      { bar: 'bg-sky-500',   dot: 'bg-sky-400',   text: 'text-sky-400',   badge: 'OK',   badgeCls: 'bg-sky-900/60 text-sky-300' },
  warning: { bar: 'bg-amber-500', dot: 'bg-amber-400', text: 'text-amber-400', badge: 'SLOW', badgeCls: 'bg-amber-900/60 text-amber-300' },
  error:   { bar: 'bg-red-500',   dot: 'bg-red-400',   text: 'text-red-400',   badge: 'ERR',  badgeCls: 'bg-red-900/60 text-red-300' },
};

const fmt = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;

function TimeRuler({ totalMs }: { totalMs: number }) {
  const steps = [0, 25, 50, 75, 100];
  return (
    <div className="relative h-6 flex items-end border-b border-slate-700 bg-slate-900/50">
      {steps.map(pct => (
        <div key={pct} className="absolute flex flex-col items-center" style={{ left: `${pct}%` }}>
          <span className="text-[10px] text-slate-600 mb-1">
            {fmt((totalMs * pct) / 100)}
          </span>
          <div className="w-px h-2 bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

export const TraceViewer: React.FC<TraceViewerProps> = ({ spans, totalDurationMs, traceId }) => {
  const [openSpan, setOpenSpan] = useState<string | null>('span-002'); // open the slow one by default

  const pct = (ms: number) => `${((ms / totalDurationMs) * 100).toFixed(2)}%`;

  return (
    <div className="h-full flex flex-col text-sm">
      {/* Trace Meta */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700 bg-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Trace ID</span>
            <span className="text-xs text-slate-300 font-mono">{traceId.slice(0, 16)}…</span>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Duration</span>
            <span className="text-xs text-amber-400 font-mono font-bold">{fmt(totalDurationMs)}</span>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Spans</span>
            <span className="text-xs text-slate-300 font-mono">{spans.length}</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-600">Click a span to inspect attributes</div>
      </div>

      {/* Column Headers */}
      <div className="flex px-4 py-1.5 border-b border-slate-700/60 text-[10px] text-slate-600 uppercase tracking-wider bg-slate-900/30">
        <div className="w-56 flex-shrink-0">Service / Operation</div>
        <div className="w-16 flex-shrink-0 text-right pr-3">Duration</div>
        <div className="flex-1">
          <TimeRuler totalMs={totalDurationMs} />
        </div>
      </div>

      {/* Span Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {spans.map((span) => {
          const s = STATUS[span.status];
          const isOpen = openSpan === span.id;

          return (
            <div key={span.id}>
              {/* Row */}
              <div
                className={`flex items-center px-4 py-2 cursor-pointer transition-colors group ${
                  isOpen ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'
                }`}
                onClick={() => setOpenSpan(isOpen ? null : span.id)}
              >
                {/* Name */}
                <div className="w-56 flex-shrink-0 flex items-center gap-1.5 min-w-0">
                  <div style={{ marginLeft: `${span.depth * 18}px` }} className="flex items-center gap-1.5 min-w-0">
                    {isOpen
                      ? <ChevronDown className="w-3 h-3 text-slate-500 flex-shrink-0" />
                      : <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0 group-hover:text-slate-400" />
                    }
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                    <div className="min-w-0">
                      <div className="text-xs text-slate-200 font-mono truncate">{span.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{span.service}</div>
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div className={`w-16 flex-shrink-0 text-right pr-3 text-xs font-mono font-medium ${s.text}`}>
                  {fmt(span.durationMs)}
                </div>

                {/* Timeline */}
                <div className="flex-1 relative h-7 flex items-center">
                  {/* Background grid lines */}
                  {[25, 50, 75].map(p => (
                    <div key={p} className="absolute top-0 bottom-0 w-px bg-slate-800" style={{ left: `${p}%` }} />
                  ))}
                  {/* Span bar */}
                  <div
                    className={`absolute h-5 rounded-sm ${s.bar} opacity-85 flex items-center overflow-hidden min-w-[3px] transition-all`}
                    style={{ left: pct(span.offsetMs), width: pct(span.durationMs) }}
                  >
                    <span className="px-1 text-[10px] text-white/80 font-mono truncate hidden sm:block">
                      {fmt(span.durationMs)}
                    </span>
                  </div>
                  {/* Status badge */}
                  {span.status !== 'ok' && (
                    <div
                      className={`absolute right-0 top-1 text-[9px] px-1 rounded font-bold ${s.badgeCls}`}
                    >
                      {s.badge}
                    </div>
                  )}
                </div>
              </div>

              {/* Attributes Drawer */}
              {isOpen && (
                <div className="mx-4 mb-2 rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
                  <div className="px-3 py-1.5 bg-slate-800/60 border-b border-slate-700 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Span Attributes</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${s.badgeCls}`}>{s.badge}</span>
                  </div>
                  <div className="p-3 space-y-1.5 max-h-48 overflow-y-auto">
                    {Object.entries(span.attributes).map(([k, v]) => (
                      <div key={k} className="flex gap-3 font-mono text-xs">
                        <span className="text-sky-400 flex-shrink-0 w-48 truncate">{k}</span>
                        <span className={`${
                          k.includes('wait') || k.includes('pool') ? 'text-amber-300 font-semibold' : 'text-slate-300'
                        }`}>{v}</span>
                      </div>
                    ))}
                  </div>
                  {span.status === 'warning' && (
                    <div className="px-3 py-2 bg-amber-900/20 border-t border-amber-900/40 text-xs text-amber-400 flex items-center gap-2">
                      <span className="text-amber-500">⚠</span>
                      <span><strong>db.connection_pool.wait_ms</strong> is abnormally high — check the connection pool configuration</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
