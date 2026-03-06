import { Lock, CheckCircle2, Circle, ChevronRight, Radio, BarChart2, Shield } from 'lucide-react';
import { cases } from '../data/cases';
import type { CaseProgress } from '../types/progress';
import type { Case } from '../types';

interface HomePageProps {
  progress: CaseProgress[];
  onSelectCase: (id: string) => void;
}

function getRank(solvedCount: number): string {
  if (solvedCount === 0) return 'ROOKIE';
  if (solvedCount === 1) return 'JUNIOR';
  if (solvedCount === 2) return 'SENIOR';
  return 'STAFF';
}

function getDifficultyColor(difficulty: Case['difficulty']) {
  switch (difficulty) {
    case 'rookie': return 'text-green-400 border-green-800 bg-green-950/40';
    case 'junior': return 'text-sky-400 border-sky-800 bg-sky-950/40';
    case 'senior': return 'text-violet-400 border-violet-800 bg-violet-950/40';
    case 'staff': return 'text-amber-400 border-amber-800 bg-amber-950/40';
    default: return 'text-slate-400 border-slate-700 bg-slate-900/40';
  }
}

function getStatusIcon(status: CaseProgress['status']) {
  switch (status) {
    case 'solved':
      return <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />;
    case 'available':
    case 'in-progress':
      return <Circle className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />;
    default:
      return <Lock className="w-3 h-3 text-slate-600 flex-shrink-0" />;
  }
}

export function HomePage({ progress, onSelectCase }: HomePageProps) {
  const solvedCount = progress.filter(p => p.status === 'solved').length;
  const availableCount = progress.filter(p => p.status !== 'locked').length;
  const clearancePct = Math.round((solvedCount / cases.length) * 100);
  const rank = getRank(solvedCount);

  const activeCaseId = progress.find(p => p.status === 'in-progress' || p.status === 'available')?.caseId
    ?? progress.find(p => p.status === 'solved')?.caseId
    ?? cases[0].id;

  return (
    <div className="h-screen bg-slate-950 text-slate-50 flex flex-col overflow-hidden">
      {/* ── Top Nav ── */}
      <header className="flex-shrink-0 border-b border-slate-800 bg-slate-950 px-6 py-3">
        <div className="flex items-center gap-3">
          {/* Shield logo */}
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-sky-500 to-violet-600 rounded-lg flex-shrink-0">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-xs font-bold tracking-widest text-slate-400 uppercase">Telemetry Academy</div>
            <div className="text-[10px] text-slate-600 tracking-wider">OpenTelemetry · Zero to Hero</div>
          </div>

          <div className="flex-1" />

          {/* Stats pills */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 uppercase tracking-widest text-[10px]">Rank</span>
              <span className="font-bold text-sky-400">{rank}</span>
            </div>
            <div className="w-px h-4 bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 uppercase tracking-widest text-[10px]">Cases</span>
              <span className="font-bold text-white">{solvedCount}/{cases.length}</span>
            </div>
            <div className="w-px h-4 bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 uppercase tracking-widest text-[10px]">Clearance</span>
              <span className="font-bold text-violet-400">{clearancePct}%</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Body: Sidebar + Main ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Sidebar ── */}
        <aside className="w-56 flex-shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col overflow-hidden">
          {/* Progress */}
          <div className="px-4 py-3 border-b border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-widest text-slate-500">Clearance</span>
              <span className="text-[10px] text-slate-400">{solvedCount}/{cases.length}</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-violet-600 rounded-full transition-all duration-500"
                style={{ width: `${clearancePct}%` }}
              />
            </div>
          </div>

          {/* Case list */}
          <div className="flex-1 overflow-y-auto py-2">
            {cases.map((c, i) => {
              const prog = progress.find(p => p.caseId === c.id);
              const status = prog?.status ?? 'locked';
              const isActive = c.id === activeCaseId;

              return (
                <button
                  key={c.id}
                  disabled={status === 'locked'}
                  onClick={() => status !== 'locked' && onSelectCase(c.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors
                    ${isActive ? 'bg-slate-800/60' : ''}
                    ${status === 'locked' ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-800/40 cursor-pointer'}
                  `}
                >
                  {getStatusIcon(status)}
                  <span className={`text-xs truncate ${
                    status === 'solved' ? 'text-slate-400 line-through' :
                    isActive ? 'text-slate-100 font-medium' : 'text-slate-400'
                  }`}>
                    {String(i + 1).padStart(2, '0')} — {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto">
          {/* Hero */}
          <div className="border-b border-slate-800 px-10 py-10 flex flex-col items-center text-center">
            {/* Badge */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center mb-5 shadow-2xl shadow-sky-500/20">
              <Shield className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white mb-1">
              TELEMETRY ACADEMY
            </h1>
            <p className="text-slate-500 text-sm mb-8">
              Learn OpenTelemetry by instrumenting real systems and investigating real incidents.
            </p>

            {/* Stats row */}
            <div className="flex items-stretch gap-0 border border-slate-800 rounded-xl overflow-hidden">
              {[
                { label: 'RANK', value: rank, color: 'text-sky-400' },
                { label: 'CASES', value: `${solvedCount}/${cases.length}`, color: 'text-white' },
                { label: 'CLEARANCE', value: `${clearancePct}%`, color: 'text-violet-400' },
              ].map(({ label, value, color }, i, arr) => (
                <div key={label} className={`flex flex-col items-center px-8 py-4 ${i < arr.length - 1 ? 'border-r border-slate-800' : ''}`}>
                  <span className={`text-2xl font-black ${color}`}>{value}</span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Case list */}
          <div className="px-10 py-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-4 bg-gradient-to-b from-sky-500 to-violet-600 rounded-full" />
              <span className="text-xs font-bold tracking-widest uppercase text-slate-300">Incidents</span>
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-xs text-slate-600">{solvedCount}/{cases.length} cleared</span>
            </div>

            <div className="flex flex-col gap-3">
              {cases.map((c, i) => {
                const prog = progress.find(p => p.caseId === c.id);
                const status = prog?.status ?? 'locked';
                const isLocked = status === 'locked';
                const isSolved = status === 'solved';

                return (
                  <div
                    key={c.id}
                    className={`group relative border rounded-xl p-5 transition-all duration-200
                      ${isLocked
                        ? 'border-slate-800 bg-slate-900/30 opacity-50'
                        : isSolved
                          ? 'border-slate-700 bg-slate-900/50'
                          : 'border-slate-700 bg-slate-900/80 hover:border-sky-500/40 hover:bg-slate-900 cursor-pointer'
                      }
                    `}
                  >
                    <div className="flex items-start gap-4">
                      {/* Number badge */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black
                        ${isSolved
                          ? 'bg-green-950/60 text-green-400 border border-green-800/50'
                          : isLocked
                            ? 'bg-slate-800 text-slate-600 border border-slate-700'
                            : 'bg-gradient-to-br from-sky-500/20 to-violet-600/20 text-sky-400 border border-sky-500/30'
                        }
                      `}>
                        {isSolved ? <CheckCircle2 className="w-5 h-5" /> : isLocked ? <Lock className="w-4 h-4" /> : String(i + 1).padStart(2, '0')}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-100">{c.name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${getDifficultyColor(c.difficulty)}`}>
                            {c.difficulty}
                          </span>
                          {isSolved && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-green-800/50 text-green-400 bg-green-950/40 uppercase tracking-wide">
                              Cleared
                            </span>
                          )}
                        </div>

                        {/* Concepts */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {c.concepts.map(concept => (
                            <span key={concept} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                              {concept.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>

                        {/* Description excerpt */}
                        {!isLocked && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {c.phase1.description.replace(/\*\*/g, '').replace(/#+\s/g, '').trim().split('\n').filter(Boolean)[0]}
                          </p>
                        )}
                      </div>

                      {/* CTA */}
                      {!isLocked && (
                        <button
                          onClick={() => onSelectCase(c.id)}
                          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all
                            ${isSolved
                              ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                              : 'bg-gradient-to-r from-sky-500 to-violet-600 text-white hover:opacity-90 shadow-lg shadow-sky-500/20'
                            }
                          `}
                        >
                          {isSolved ? 'Revisit' : status === 'in-progress' ? 'Continue' : 'Investigate'}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-10 pb-8 flex items-center gap-2 text-slate-700 text-xs">
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Telemetry Academy · {availableCount} incident{availableCount !== 1 ? 's' : ''} available</span>
          </div>
        </main>
      </div>
    </div>
  );
}
