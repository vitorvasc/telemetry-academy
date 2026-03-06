import { useState } from 'react';
import { Lock, CheckCircle2, Circle, ChevronRight, Shield, Menu, X } from 'lucide-react';
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

function StatusDot({ status }: { status: CaseProgress['status'] }) {
  if (status === 'solved') return <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />;
  if (status === 'available' || status === 'in-progress') return <Circle className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />;
  return <Lock className="w-3 h-3 text-slate-600 flex-shrink-0" />;
}

export function HomePage({ progress, onSelectCase }: HomePageProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const solvedCount = progress.filter(p => p.status === 'solved').length;
  const clearancePct = Math.round((solvedCount / cases.length) * 100);
  const rank = getRank(solvedCount);

  const handleSelect = (id: string) => {
    setDrawerOpen(false);
    onSelectCase(id);
  };

  const CaseList = () => (
    <div className="flex flex-col">
      <div className="px-4 py-3 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest text-slate-500">Clearance</span>
          <span className="text-[10px] text-slate-400">{solvedCount}/{cases.length}</span>
        </div>
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-violet-600 rounded-full transition-all"
            style={{ width: `${clearancePct}%` }}
          />
        </div>
      </div>
      {cases.map((c, i) => {
        const prog = progress.find(p => p.caseId === c.id);
        const status = prog?.status ?? 'locked';
        return (
          <button
            key={c.id}
            disabled={status === 'locked'}
            onClick={() => status !== 'locked' && handleSelect(c.id)}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-left w-full transition-colors
              ${status === 'locked' ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-800/50 cursor-pointer'}
            `}
          >
            <StatusDot status={status} />
            <span className={`text-xs truncate ${status === 'solved' ? 'text-slate-500 line-through' : status !== 'locked' ? 'text-slate-300' : 'text-slate-500'}`}>
              {String(i + 1).padStart(2, '0')} — {c.name}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="bg-slate-950 text-slate-50 min-h-screen flex flex-col">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-20 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden p-1.5 -ml-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-200 tracking-wide">Telemetry Academy</span>
          </div>

          <div className="flex-1" />

          {/* Stats */}
          <div className="flex items-center divide-x divide-slate-800 text-[11px]">
            <div className="flex items-center gap-1 pr-3 md:flex hidden">
              <span className="text-slate-500 uppercase tracking-wider">Rank</span>
              <span className="font-bold text-sky-400">{rank}</span>
            </div>
            <div className="flex items-center gap-1 px-3">
              <span className="text-slate-500 uppercase tracking-wider">Cases</span>
              <span className="font-bold text-white">{solvedCount}/{cases.length}</span>
            </div>
            <div className="flex items-center gap-1 pl-3">
              <span className="text-slate-500 uppercase tracking-wider hidden sm:inline">Clearance</span>
              <span className="font-bold text-violet-400">{clearancePct}%</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-slate-950 border-r border-slate-800 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 flex-shrink-0">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Incidents</span>
              <button onClick={() => setDrawerOpen(false)} className="text-slate-500 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <CaseList />
          </div>
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="flex flex-1">

        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-56 flex-shrink-0 border-r border-slate-800 sticky top-[49px] self-start h-[calc(100vh-49px)] overflow-y-auto">
          <CaseList />
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">

          {/* Hero */}
          <div className="flex flex-col items-center text-center px-4 py-10 border-b border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center mb-5 shadow-xl shadow-sky-500/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
              TELEMETRY ACADEMY
            </h1>
            <p className="text-slate-500 text-sm mb-8 max-w-xs">
              Learn OpenTelemetry by instrumenting real systems and investigating real incidents.
            </p>
            {/* Stats */}
            <div className="flex border border-slate-800 rounded-xl overflow-hidden w-full max-w-xs">
              {[
                { label: 'RANK', value: rank, color: 'text-sky-400' },
                { label: 'CASES', value: `${solvedCount}/${cases.length}`, color: 'text-white' },
                { label: 'CLEARED', value: `${clearancePct}%`, color: 'text-violet-400' },
              ].map(({ label, value, color }, i, arr) => (
                <div key={label} className={`flex-1 flex flex-col items-center py-4 ${i < arr.length - 1 ? 'border-r border-slate-800' : ''}`}>
                  <span className={`text-xl font-black ${color}`}>{value}</span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-500 mt-1">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Incidents */}
          <div className="px-4 sm:px-8 py-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-0.5 h-4 bg-gradient-to-b from-sky-500 to-violet-600 rounded-full" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Incidents</span>
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
                    onClick={() => !isLocked && handleSelect(c.id)}
                    className={`border rounded-xl p-4 transition-all
                      ${isLocked ? 'border-slate-800 bg-slate-900/20 opacity-50 cursor-default' :
                        isSolved ? 'border-slate-700 bg-slate-900/40 cursor-pointer hover:border-slate-600' :
                        'border-slate-700 bg-slate-900/70 cursor-pointer hover:border-sky-500/50 hover:bg-slate-900'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {/* Badge */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm
                        ${isSolved ? 'bg-green-950/60 text-green-400 border border-green-800/50' :
                          isLocked ? 'bg-slate-800 text-slate-600 border border-slate-700' :
                          'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                        }
                      `}>
                        {isSolved ? <CheckCircle2 className="w-5 h-5" /> :
                          isLocked ? <Lock className="w-4 h-4" /> :
                          String(i + 1).padStart(2, '0')}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <span className="font-bold text-sm text-slate-100">{c.name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${getDifficultyColor(c.difficulty)}`}>
                            {c.difficulty}
                          </span>
                          {isSolved && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-green-800/50 text-green-400 bg-green-950/40 uppercase">
                              Cleared
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {c.concepts.map(concept => (
                            <span key={concept} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                              {concept.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                        {!isLocked && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {c.phase1.description.replace(/\*\*/g, '').replace(/#+\s/g, '').trim().split('\n').filter(Boolean)[0]}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* CTA */}
                    {!isLocked && (
                      <div className="mt-3 flex justify-end">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold
                          ${isSolved
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-gradient-to-r from-sky-500 to-violet-600 text-white shadow-lg shadow-sky-500/20'
                          }
                        `}>
                          {isSolved ? 'Revisit' : status === 'in-progress' ? 'Continue' : 'Investigate'}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
