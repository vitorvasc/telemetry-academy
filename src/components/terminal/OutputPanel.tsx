export interface OutputPanelProps {
  output: string[];
  error?: string | null;
  isRunning?: boolean;
}

export function OutputPanel({ output, error, isRunning }: OutputPanelProps) {
  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 font-mono text-sm rounded-md overflow-hidden border border-slate-700">
      <div className="flex items-center px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="font-semibold text-slate-200">Terminal Output</span>
        {isRunning && <span className="ml-4 text-emerald-400 text-xs animate-pulse">Running...</span>}
      </div>
      <div className="p-4 overflow-y-auto flex-1">
        {output.length === 0 && !error && !isRunning && (
          <div className="text-slate-500 italic">No output</div>
        )}
        {output.map((line, i) => (
          <div key={`${i}-${line.slice(0, 20)}`} className="whitespace-pre-wrap">{line}</div>
        ))}
        {error && (
          <div className="text-red-400 whitespace-pre-wrap mt-2">{error}</div>
        )}
      </div>
    </div>
  );
}
