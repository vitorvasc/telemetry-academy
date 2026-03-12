import React, { useEffect, useState } from 'react';
import type { Case } from '../types';
import type { CaseProgress } from '../types/progress';
import { Trophy, Clock, Target, ChevronRight, Star, BookOpen } from 'lucide-react';
import { formatElapsedMs } from '../lib/formatters';

interface CaseSolvedScreenProps {
  solvedCase: Case;
  nextCase?: Case;
  progress: CaseProgress;
  onNext: () => void;
  onReview: () => void;
}

function getScore(attempts: number, durationMs: number): { stars: number; label: string } {
  if (attempts === 1 && durationMs < 120_000) return { stars: 3, label: 'Perfect' };
  if (attempts <= 2 && durationMs < 300_000) return { stars: 2, label: 'Great' };
  return { stars: 1, label: 'Solved' };
}

export const CaseSolvedScreen: React.FC<CaseSolvedScreenProps> = ({
  solvedCase,
  nextCase,
  progress,
  onNext,
  onReview,
}) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 50); }, []);

  const durationMs = progress.timeSolvedMs && progress.timeStartedMs
    ? progress.timeSolvedMs - progress.timeStartedMs
    : 0;

  const { stars, label } = getScore(progress.attempts, durationMs);

  return (
    <div className={`
      h-full flex flex-col items-center justify-center bg-slate-900 p-8
      transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
    `}>
      <div className="max-w-lg w-full space-y-8 text-center">

        {/* Trophy */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/40">
            <Trophy className="w-10 h-10 text-white" />
          </div>

          {/* Stars */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(n => (
              <Star
                key={n}
                className={`w-7 h-7 transition-all duration-300 ${
                  n <= stars
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-700'
                }`}
                style={{ transitionDelay: `${n * 150}ms` }}
              />
            ))}
          </div>

          <div>
            <div className="text-3xl font-bold text-white">{label}!</div>
            <div className="text-slate-400 text-sm mt-1">
              Case solved — <span className="text-green-400 font-medium">{solvedCase.name}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: Target,
              label: 'Attempts',
              value: progress.attempts,
              color: progress.attempts === 1 ? 'text-green-400' : progress.attempts <= 2 ? 'text-sky-400' : 'text-amber-400',
            },
            {
              icon: Clock,
              label: 'Time',
              value: durationMs > 0 ? formatElapsedMs(durationMs) : '—',
              color: 'text-sky-400',
            },
            {
              icon: Star,
              label: 'Score',
              value: `${stars}/3`,
              color: 'text-amber-400',
            },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
              <Icon className={`w-4 h-4 ${color} mx-auto mb-2`} />
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* What you learned */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 text-left">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">What you learned</span>
          </div>
          <ul className="space-y-1.5">
            {solvedCase.concepts.map(concept => (
              <li key={concept} className="flex items-center gap-2 text-sm text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />
                {concept.replace(/_/g, ' ')}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {nextCase ? (
            <button
              onClick={onNext}
              className="w-full flex items-center justify-center gap-2 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-colors active:scale-[0.99]"
            >
              Next Case: {nextCase.name}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="py-3 text-center text-slate-500 text-sm border border-slate-700 rounded-xl">
              🎉 You've completed all available cases! More coming soon.
            </div>
          )}
          <button
            onClick={onReview}
            className="w-full py-2.5 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 text-sm rounded-xl transition-colors"
          >
            Review Investigation
          </button>
        </div>
      </div>
    </div>
  );
};
