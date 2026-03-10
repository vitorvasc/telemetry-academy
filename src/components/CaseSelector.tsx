import React from 'react';
import type { Case } from '../types';
import type { CaseProgress } from '../types/progress';
import { Lock } from 'lucide-react';

interface CaseSelectorProps {
  cases: Case[];
  progress: CaseProgress[];
  currentCaseId: string;
  onSelect: (id: string) => void;
}

type PhaseStatus = 'solved' | 'phase1done' | 'active' | 'available' | 'locked';

const getPhaseStatus = (prog: CaseProgress): PhaseStatus => {
  if (prog.status === 'solved') return 'solved';
  if (prog.phase === 'investigation' || prog.phase === 'complete') return 'phase1done';
  if (prog.status === 'in-progress') return 'active';
  if (prog.status === 'available') return 'available';
  return 'locked';
};

const ProgressDot: React.FC<{ status: PhaseStatus }> = ({ status }) => {
  if (status === 'solved') return <div className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0" />;
  if (status === 'phase1done') return <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60 border border-amber-400 flex-shrink-0" />;
  if (status === 'active') return <div className="w-2.5 h-2.5 rounded-full border-2 border-sky-400 flex-shrink-0" />;
  if (status === 'available') return <div className="w-2.5 h-2.5 rounded-full border border-slate-500 flex-shrink-0" />;
  return <Lock className="w-2.5 h-2.5 text-slate-700 flex-shrink-0" />;
};

const DIFFICULTY_COLOR = {
  rookie: 'text-green-400',
  junior: 'text-sky-400',
  senior: 'text-violet-400',
  staff:  'text-amber-400',
};

export const CaseSelector: React.FC<CaseSelectorProps> = ({
  cases,
  progress,
  currentCaseId,
  onSelect,
}) => {
  const getProgress = (id: string) => progress.find(p => p.caseId === id);

  return (
    <div className="flex items-center gap-1">
      {cases.map((c, idx) => {
        const prog = getProgress(c.id);
        const status = prog?.status ?? 'locked';
        const isCurrent = c.id === currentCaseId;
        const isLocked = status === 'locked';
        const isSolved = status === 'solved';

        return (
          <button
            key={c.id}
            disabled={isLocked}
            onClick={() => !isLocked && onSelect(c.id)}
            title={isLocked ? 'Complete previous case to unlock' : c.name}
            className={`
              relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
              transition-all duration-150 border
              ${isCurrent
                ? 'bg-slate-700 border-slate-500 text-white'
                : isLocked
                  ? 'border-slate-800 text-slate-700 cursor-not-allowed'
                  : isSolved
                    ? 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }
            `}
          >
            {/* Phase-aware progress indicator */}
            {prog && <ProgressDot status={getPhaseStatus(prog)} />}

            {/* Number + Name */}
            <span>
              <span className="text-slate-500 mr-1">#{idx + 1}</span>
              <span className={isCurrent ? 'text-white' : isLocked ? 'text-slate-700' : 'text-slate-400'}>
                {c.name}
              </span>
            </span>

            {/* Difficulty dot */}
            {!isLocked && (
              <span className={`text-[9px] font-bold ${DIFFICULTY_COLOR[c.difficulty]}`}>
                {c.difficulty.slice(0, 3).toUpperCase()}
              </span>
            )}

            {/* In-progress indicator */}
            {isCurrent && !isSolved && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-sky-500 rounded-full border border-slate-900" />
            )}
          </button>
        );
      })}
    </div>
  );
};
