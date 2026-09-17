import { Code2, Lock } from 'lucide-react'

export type AppPhase = 'instrumentation' | 'investigation' | 'solved'

interface PhaseBarProps {
  appPhase: AppPhase
  phaseUnlocked: boolean
  locked: boolean
  onSelectPhase: (phase: AppPhase) => void
}

export function PhaseBar({
  appPhase,
  phaseUnlocked,
  locked,
  onSelectPhase,
}: PhaseBarProps) {
  if (locked || appPhase === 'solved') return null

  return (
    <div className="flex-shrink-0 flex border-b border-slate-700 bg-slate-900">
      <button
        onClick={() => onSelectPhase('instrumentation')}
        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
          appPhase === 'instrumentation'
            ? 'bg-sky-600/20 text-sky-400 border-b-2 border-sky-500'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <Code2 className="w-4 h-4" />1 · Instrument
      </button>
      <button
        disabled={!phaseUnlocked}
        onClick={() => phaseUnlocked && onSelectPhase('investigation')}
        title={!phaseUnlocked ? 'Complete Phase 1 to unlock' : undefined}
        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
          appPhase === 'investigation'
            ? 'bg-amber-600/20 text-amber-400 border-b-2 border-amber-500'
            : phaseUnlocked
              ? 'text-slate-500 hover:text-slate-300'
              : 'text-slate-700 cursor-not-allowed'
        }`}
      >
        {!phaseUnlocked && <Lock className="w-4 h-4 opacity-40" />}2 ·
        Investigate
      </button>
    </div>
  )
}
