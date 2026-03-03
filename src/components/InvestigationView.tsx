import React, { useState } from 'react';
import type { Phase2Data } from '../types/phase2';
import { TraceViewer } from './TraceViewer';
import { LogViewer } from './LogViewer';
import { RootCauseSelector } from './RootCauseSelector';
import { GitBranch, ScrollText, Target, Siren, CheckCircle2 } from 'lucide-react';

type Tab = 'traces' | 'logs' | 'rootcause';

interface InvestigationViewProps {
  data: Phase2Data;
  caseName: string;
  onCaseSolved: () => void;
  onAttempt?: () => void;
}

export const InvestigationView: React.FC<InvestigationViewProps> = ({ data, caseName, onCaseSolved, onAttempt }) => {
  const [activeTab, setActiveTab] = useState<Tab>('traces');
  const [solved, setSolved] = useState(false);
  // Lifted filter state for LogViewer - persists across tab switches
  const [logFilter, setLogFilter] = useState('');

  const handleSolved = () => {
    setSolved(true);
    onCaseSolved();
  };

  const tabs: { id: Tab; label: string; Icon: React.ElementType; step: number }[] = [
    { id: 'traces',    label: 'Traces',     Icon: GitBranch,  step: 1 },
    { id: 'logs',      label: 'Logs',       Icon: ScrollText, step: 2 },
    { id: 'rootcause', label: 'Root Cause', Icon: Target,     step: 3 },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Incident Banner */}
      <div className={`flex items-center justify-between px-5 py-2.5 flex-shrink-0 ${
        solved
          ? 'bg-green-950/60 border-b border-green-800'
          : 'bg-red-950/60 border-b border-red-900'
      }`}>
        <div className="flex items-center gap-3">
          {solved
            ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            : <Siren className="w-4 h-4 text-red-400 flex-shrink-0 animate-pulse" />
          }
          <div>
            <span className={`text-xs font-bold uppercase tracking-widest mr-3 ${solved ? 'text-green-400' : 'text-red-400'}`}>
              {solved ? 'Incident Resolved' : 'Incident Active'}
            </span>
            <span className="text-xs text-slate-400">{caseName} · </span>
            <span className="text-xs text-slate-300">{data.narrative.split('\n')[0]}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-slate-500">
          <span>Trace: <span className="text-slate-400 font-mono">{data.traceId.slice(0, 8)}…</span></span>
          <span className={`font-mono font-semibold ${solved ? 'text-green-400' : 'text-amber-400'}`}>
            {(data.totalDurationMs / 1000).toFixed(2)}s total
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 bg-slate-800/60 flex-shrink-0">
        {tabs.map(({ id, label, Icon, step }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2.5 px-5 py-3 text-sm font-medium border-b-2 transition-all duration-150 ${
                isActive
                  ? 'border-sky-500 text-white bg-slate-800/60'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                isActive ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {step}
              </div>
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : ''}`} />
              <span>{label}</span>
            </button>
          );
        })}
        {/* Hint */}
        <div className="ml-auto flex items-center pr-4 text-[10px] text-slate-600">
          Follow the steps: Traces → Logs → Root Cause
        </div>
      </div>

      {/* Content - using display:none to preserve component state across tab switches */}
      <div className="flex-1 overflow-hidden">
        {/* Traces Tab */}
        <div style={{ display: activeTab === 'traces' ? 'block' : 'none' }} className="h-full">
          <TraceViewer spans={data.spans} totalDurationMs={data.totalDurationMs} traceId={data.traceId} />
        </div>
        
        {/* Logs Tab - with lifted filter state for persistence */}
        <div style={{ display: activeTab === 'logs' ? 'block' : 'none' }} className="h-full">
          <LogViewer 
            logs={data.logs} 
            highlightTraceId={data.traceId}
            filter={logFilter}
            onFilterChange={setLogFilter}
          />
        </div>
        
        {/* Root Cause Tab */}
        <div style={{ display: activeTab === 'rootcause' ? 'block' : 'none' }} className="h-full overflow-y-auto p-6">
          <RootCauseSelector options={data.rootCauseOptions} onSolved={handleSolved} onAttempt={onAttempt} />
        </div>
      </div>
    </div>
  );
};
