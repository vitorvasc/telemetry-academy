import { useState } from 'react';
import { CodeEditor } from './components/CodeEditor';
import { InstructionsPanel } from './components/InstructionsPanel';
import { ValidationPanel } from './components/ValidationPanel';
import { InvestigationView } from './components/InvestigationView';
import { CaseSelector } from './components/CaseSelector';
import { CaseSolvedScreen } from './components/CaseSolvedScreen';
import type { Case, ValidationResult } from './types';
import type { CaseProgress } from './types/progress';
import { cases } from './data/cases';
import { helloSpanPhase2 } from './data/phase2';
import { FlaskConical } from 'lucide-react';

type AppPhase = 'instrumentation' | 'investigation' | 'solved';

const PHASE2_DATA: Record<string, typeof helloSpanPhase2> = {
  'hello-span-001': helloSpanPhase2,
};

function initProgress(cases: Case[]): CaseProgress[] {
  return cases.map((c, i) => ({
    caseId: c.id,
    status: i === 0 ? 'available' : 'locked',
    phase: 'instrumentation',
    attempts: 0,
  }));
}

function App() {
  const [allProgress, setAllProgress] = useState<CaseProgress[]>(initProgress(cases));
  const [currentCaseId, setCurrentCaseId] = useState(cases[0].id);
  const [appPhase, setAppPhase] = useState<AppPhase>('instrumentation');
  const [code, setCode] = useState(cases[0].phase1.initialCode);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [investigationAttempts, setInvestigationAttempts] = useState(0);

  const currentCase = cases.find(c => c.id === currentCaseId) ?? cases[0];
  const currentIdx = cases.findIndex(c => c.id === currentCaseId);
  const nextCase = cases[currentIdx + 1];
  const currentProgress = allProgress.find(p => p.caseId === currentCaseId)!;
  const phase2Data = PHASE2_DATA[currentCaseId];
  const phaseUnlocked = appPhase === 'investigation' || appPhase === 'solved';

  // Switch cases
  const switchCase = (id: string) => {
    const c = cases.find(x => x.id === id);
    if (!c) return;
    const prog = allProgress.find(p => p.caseId === id)!;
    setCurrentCaseId(id);
    setCode(c.phase1.initialCode);
    setValidationResults([]);
    setAppPhase(prog.phase as AppPhase);
    setInvestigationAttempts(prog.attempts);
  };

  // Update progress helper
  const updateProgress = (id: string, patch: Partial<CaseProgress>) => {
    setAllProgress(prev => prev.map(p => p.caseId === id ? { ...p, ...patch } : p));
  };

  // Phase 1 validation
  const handleValidate = () => {
    setIsValidating(true);

    // Mark in-progress
    updateProgress(currentCaseId, { status: 'in-progress', timeStartedMs: Date.now() });

    setTimeout(() => {
      const results = currentCase.phase1.validations.map(v => {
        const passed = simulateValidation(code, v);
        return { ...v, passed, message: passed ? v.successMessage : v.errorMessage };
      });
      setValidationResults(results);

      if (results.every(r => r.passed)) {
        setAppPhase('investigation');
        updateProgress(currentCaseId, { phase: 'investigation' });
      }
      setIsValidating(false);
    }, 1500);
  };

  // Phase 2 solved
  const handleCaseSolved = () => {
    const now = Date.now();
    setAppPhase('solved');
    updateProgress(currentCaseId, {
      status: 'solved',
      phase: 'complete',
      timeSolvedMs: now,
      attempts: investigationAttempts,
    });
    // Unlock next case
    if (nextCase) {
      updateProgress(nextCase.id, { status: 'available' });
    }
  };

  const handleInvestigationAttempt = () => {
    setInvestigationAttempts(a => a + 1);
  };

  const goToNext = () => {
    if (nextCase) switchCase(nextCase.id);
  };

  const reviewInvestigation = () => {
    setAppPhase('investigation');
  };

  const simulateValidation = (code: string, validation: any): boolean => {
    switch (validation.type) {
      case 'span_exists':    return code.includes('start_as_current_span') || code.includes('start_span');
      case 'attribute_exists': return code.includes('set_attribute') && code.includes('order_id');
      case 'telemetry_flowing': return code.includes('start_as_current_span') && code.includes('order_id');
      default: return false;
    }
  };

  return (
    <div className="h-screen bg-slate-900 text-slate-50 flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <header className="flex-shrink-0 border-b border-slate-700 bg-slate-800 px-5 py-2.5">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-violet-600 rounded-lg flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-white">Telemetry Academy</div>
              <div className="text-[10px] text-slate-500">OpenTelemetry · Zero to Hero</div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-slate-700 flex-shrink-0" />

          {/* Case Selector */}
          <CaseSelector
            cases={cases}
            progress={allProgress}
            currentCaseId={currentCaseId}
            onSelect={switchCase}
          />

          {/* Spacer */}
          <div className="flex-1" />

          {/* Phase Switcher */}
          {currentProgress.status !== 'locked' && (
            <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 flex-shrink-0">
              <button
                onClick={() => setAppPhase('instrumentation')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  appPhase === 'instrumentation'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1 · Instrument
              </button>
              <button
                disabled={!phaseUnlocked}
                onClick={() => phaseUnlocked && setAppPhase('investigation')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  appPhase === 'investigation' || appPhase === 'solved'
                    ? 'bg-amber-600 text-white'
                    : phaseUnlocked
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-700 cursor-not-allowed'
                }`}
              >
                2 · Investigate
              </button>
            </div>
          )}

          {/* Difficulty badge */}
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border flex-shrink-0 ${
            currentCase.difficulty === 'rookie' ? 'border-green-800 text-green-400 bg-green-950/40' :
            currentCase.difficulty === 'junior' ? 'border-sky-800 text-sky-400 bg-sky-950/40' :
            currentCase.difficulty === 'senior' ? 'border-violet-800 text-violet-400 bg-violet-950/40' :
            'border-amber-800 text-amber-400 bg-amber-950/40'
          }`}>
            {currentCase.difficulty.toUpperCase()}
          </span>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex overflow-hidden">
        {appPhase === 'solved' ? (
          <div className="flex-1 overflow-hidden">
            <CaseSolvedScreen
              solvedCase={currentCase}
              nextCase={nextCase}
              progress={{ ...currentProgress, attempts: investigationAttempts }}
              onNext={goToNext}
              onReview={reviewInvestigation}
            />
          </div>
        ) : appPhase === 'instrumentation' ? (
          <>
            <div className="w-80 flex-shrink-0 border-r border-slate-700 overflow-y-auto">
              <InstructionsPanel
                case={currentCase}
                phaseUnlocked={phaseUnlocked}
                onStartInvestigation={() => setAppPhase('investigation')}
              />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 p-4 overflow-hidden">
                <CodeEditor value={code} onChange={setCode} language="python" />
              </div>
              <div className="h-56 flex-shrink-0 border-t border-slate-700 bg-slate-800">
                <ValidationPanel
                  results={validationResults}
                  isValidating={isValidating}
                  onValidate={handleValidate}
                  phaseUnlocked={phaseUnlocked}
                  onStartInvestigation={() => setAppPhase('investigation')}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-hidden">
            {phase2Data ? (
              <InvestigationView
                data={phase2Data}
                caseName={currentCase.name}
                onCaseSolved={handleCaseSolved}
                onAttempt={handleInvestigationAttempt}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Investigation data not available for this case yet.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
