import React, { useState } from 'react';
import type { LogEntry } from '../types/phase2';
import { Search, Link2 } from 'lucide-react';

interface LogViewerProps {
  logs: LogEntry[];
  highlightTraceId?: string;
}

const LEVEL = {
  debug: { label: 'DEBUG', cls: 'text-slate-500',  bg: '' },
  info:  { label: 'INFO ', cls: 'text-sky-400',    bg: '' },
  warn:  { label: 'WARN ', cls: 'text-amber-400',  bg: 'bg-amber-900/10' },
  error: { label: 'ERROR', cls: 'text-red-400',    bg: 'bg-red-900/10' },
};

export const LogViewer: React.FC<LogViewerProps> = ({ logs, highlightTraceId }) => {
  const [filter, setFilter] = useState('');
  const [traceCorr, setTraceCorr] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  const filtered = logs.filter(l =>
    !filter || l.message.toLowerCase().includes(filter.toLowerCase()) || l.level.includes(filter.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-slate-950 font-mono">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-700 bg-slate-900">
        <div className="flex items-center gap-2 flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 focus-within:border-sky-600">
          <Search className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Filter logs..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="flex-1 text-xs bg-transparent text-slate-300 placeholder-slate-600 outline-none"
          />
        </div>
        <button
          onClick={() => setTraceCorr(!traceCorr)}
          title="Highlight entries correlated with this trace"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors border ${
            traceCorr
              ? 'border-sky-600 text-sky-400 bg-sky-900/20'
              : 'border-slate-700 text-slate-500 hover:border-slate-500'
          }`}
        >
          <Link2 className="w-3 h-3" />
          trace_id
        </button>
        <div className="text-[10px] text-slate-600 pl-1">
          {filtered.length}/{logs.length}
        </div>
      </div>

      {/* Log Lines */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs border-collapse">
          <tbody>
            {filtered.map((log, i) => {
              const lv = LEVEL[log.level];
              const isCorr = traceCorr && log.traceId === highlightTraceId;
              const isSel = selected === i;

              return (
                <tr
                  key={i}
                  onClick={() => setSelected(isSel ? null : i)}
                  className={`cursor-pointer border-b border-slate-800/40 ${lv.bg} ${
                    isSel ? 'bg-slate-800' : 'hover:bg-slate-800/50'
                  } transition-colors`}
                >
                  {/* Trace correlation indicator */}
                  <td className="w-1 p-0">
                    <div className={`h-full w-1 ${isCorr ? 'bg-sky-500' : 'bg-transparent'}`} style={{ minHeight: '24px' }} />
                  </td>

                  {/* Timestamp */}
                  <td className="px-2 py-1.5 text-slate-600 whitespace-nowrap align-top">
                    {log.timestamp}
                  </td>

                  {/* Level */}
                  <td className={`px-1 py-1.5 whitespace-nowrap align-top font-bold ${lv.cls}`}>
                    {lv.label}
                  </td>

                  {/* Service */}
                  <td className="px-2 py-1.5 text-slate-600 whitespace-nowrap align-top">
                    [{log.service}]
                  </td>

                  {/* Message */}
                  <td className="px-2 py-1.5 align-top w-full">
                    <span className={
                      log.level === 'error' ? 'text-red-300' :
                      log.level === 'warn'  ? 'text-amber-200' :
                      'text-slate-300'
                    }>
                      {log.message}
                    </span>
                    {isSel && (
                      <div className="mt-2 space-y-1 text-[10px] text-slate-500">
                        <div>trace_id: <span className="text-sky-500">{log.traceId}</span></div>
                        <div>span_id: <span className="text-slate-400">{log.spanId}</span></div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-slate-700 bg-slate-900 text-[10px] text-slate-600">
        <span>Blue bar = correlated with trace <span className="text-slate-500">{highlightTraceId?.slice(0, 8)}…</span></span>
        <span>Click a row to see trace_id / span_id</span>
      </div>
    </div>
  );
};
