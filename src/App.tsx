import { useState, useEffect, useRef } from 'react';
import { useLocation, useRoute } from 'wouter';
import { CodeEditor } from './components/CodeEditor';
import { InstructionsPanel } from './components/InstructionsPanel';
import { ValidationPanel } from './components/ValidationPanel';
import { InvestigationView } from './components/InvestigationView';
import { CaseSelector } from './components/CaseSelector';
import { CaseSolvedScreen } from './components/CaseSolvedScreen';
import { HomePage } from './components/HomePage';
import { OutputPanel } from './components/terminal/OutputPanel';
import { ReviewModal } from './components/ReviewModal';
import { WelcomeModal } from './components/WelcomeModal';
import { useCodeRunner } from './hooks/useCodeRunner';
import { useAcademyPersistence } from './hooks/useAcademyPersistence';
import { usePhase2Data } from './hooks/usePhase2Data';
import type { Case, ValidationResult } from './types';
import type { CaseProgress } from './types/progress';
import { validateSpans, validateYaml, type SpanValidationRule } from './lib/validation';
import { cases } from './data/cases';
import { FlaskConical, RotateCcw, Radio, ArrowLeft, BookOpen, Code2, Terminal, Search } from 'lucide-react';

type AppPhase = 'instrumentation' | 'investigation' | 'solved';
type MobileTab = 'instructions' | 'code' | 'output';

function initProgress(cases: Case[]): CaseProgress[] {
  return cases.map((c, i) => ({
    caseId: c.id,
    status: i === 0 ? 'available' : 'locked',
    phase: 'instrumentation',
    attempts: 0,
  }));
}

const INITIAL_PROGRESS = initProgress(cases);

function App() {
  // Persistence hook - handles loading from and saving to localStorage
  const {
    progress: allProgress,
    setProgress: setAllProgress,
    getSavedCode,
    saveCode,
    updateAttemptHistory,
    getAttemptCount,
    resetAll,
    isLoaded,
    hasSeenWelcome,
    markWelcomeSeen,
  } = useAcademyPersistence(INITIAL_PROGRESS);

  const [, setLocation] = useLocation();
  const [matchCase, params] = useRoute('/case/:id');

  // Derive showHome from URL — home when not on a case route
  const showHome = !matchCase;

  const [currentCaseId, setCurrentCaseId] = useState(cases[0].id);
  const [mobileTab, setMobileTab] = useState<MobileTab>('instructions');
  const [appPhase, setAppPhase] = useState<AppPhase>('instrumentation');
  const [code, setCode] = useState(cases[0].phase1.initialCode);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [investigationAttempts, setInvestigationAttempts] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const { isReady: isWorkerReady, initError, isRunning, output, spans, runCode } = useCodeRunner('python');
  const [workerError, setWorkerError] = useState<string | null>(null);

  // Clear validation results when code changes (prevents stale state)
  useEffect(() => {
    setValidationResults([]);
    setWorkerError(null);
  }, [code]);

  // Sync currentCaseId from URL params when navigating directly to /case/:id
  useEffect(() => {
    if (matchCase && params?.id) {
      const c = cases.find(x => x.id === params.id);
      if (c) {
        setCurrentCaseId(params.id);
      }
    }
  }, [matchCase, params?.id]);

  // Show welcome modal on first visit
  useEffect(() => {
    if (isLoaded && !hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, [isLoaded, hasSeenWelcome]);
  const initialLoadRef = useRef(true);
  const getSavedCodeRef = useRef(getSavedCode);
  getSavedCodeRef.current = getSavedCode;

  const currentCase = cases.find(c => c.id === currentCaseId) ?? cases[0];
  const currentIdx = cases.findIndex(c => c.id === currentCaseId);
  const nextCase = cases[currentIdx + 1];
  const currentProgress = allProgress.find(p => p.caseId === currentCaseId)!;
  const { data: phase2Data, hasData: hasPhase2Data } = usePhase2Data(spans, currentCaseId);
  const phaseUnlocked = appPhase === 'investigation' || appPhase === 'solved';

  // Load persisted code when persistence is ready or case switches.
  // getSavedCode is intentionally accessed via ref so its changing reference
  // (caused by caseCode updates on every keystroke) does not re-trigger this effect.
  useEffect(() => {
    if (isLoaded) {
      const saved = getSavedCodeRef.current(currentCaseId);
      if (saved) {
        setCode(saved);
      }
    }
  }, [isLoaded, currentCaseId]);

  // Code auto-save effect
  useEffect(() => {
    if (isLoaded && !initialLoadRef.current) {
      saveCode(currentCaseId, code);
    }
    initialLoadRef.current = false;
  }, [code, currentCaseId, isLoaded, saveCode]);

  // Navigate to a case from home
  const goToCase = (id: string) => {
    switchCase(id);
    setLocation(`/case/${id}`);
  };

  // Switch cases
  const switchCase = (id: string) => {
    const c = cases.find(x => x.id === id);
    if (!c) return;
    const prog = allProgress.find(p => p.caseId === id)!;
    setCurrentCaseId(id);
    // Load saved code or use initial code
    setCode(getSavedCode(id) || c.phase1.initialCode);
    setValidationResults([]);
    setAppPhase(prog.phase as AppPhase);
    setInvestigationAttempts(prog.attempts);
    setShowReviewModal(false);
  };

  // Update progress helper
  const updateProgress = (id: string, patch: Partial<CaseProgress>) => {
    setAllProgress(prev => prev.map(p => p.caseId === id ? { ...p, ...patch } : p));
  };

  // Phase 1 validation
  const handleValidate = async () => {
    setIsValidating(true);
    setWorkerError(null);

    // Mark in-progress
    updateProgress(currentCaseId, { status: 'in-progress', timeStartedMs: Date.now() });

    // YAML-mode branch: The Collector case validates YAML directly, no Python worker
    if ((currentCase as any).type === 'yaml-config') {
      const currentAttemptHistory: Record<string, number> = {};
      currentCase.phase1.validations.forEach(rule => {
        currentAttemptHistory[rule.description] = getAttemptCount(currentCaseId, rule.description);
      });

      const results = validateYaml(
        currentCase.phase1.validations as SpanValidationRule[],
        { yamlContent: code, attemptHistory: currentAttemptHistory }
      );

      results.forEach(r => {
        if (!r.passed) {
          updateAttemptHistory(currentCaseId, r.description);
        }
      });

      setValidationResults(results);

      if (results.every(r => r.passed)) {
        setAppPhase('investigation');
        updateProgress(currentCaseId, { phase: 'investigation' });
      }

      setIsValidating(false);
      return;
    }

    // Python worker path
    try {
      await runCode(code);
    } catch (err: any) {
      setWorkerError(err.message || 'Unknown execution error');
    }

    // Get attempt history for current case
    const currentAttemptHistory: Record<string, number> = {};
    currentCase.phase1.validations.forEach(rule => {
      currentAttemptHistory[rule.description] = getAttemptCount(currentCaseId, rule.description);
    });

    // Run real span-based validation
    const results = validateSpans(
      currentCase.phase1.validations as SpanValidationRule[],
      { spans, attemptHistory: currentAttemptHistory }
    );

    // Update attempt history for failed rules
    results.forEach(r => {
      if (!r.passed) {
        updateAttemptHistory(currentCaseId, r.description);
      }
    });

    setValidationResults(results);

    if (results.every(r => r.passed)) {
      setAppPhase('investigation');
      updateProgress(currentCaseId, { phase: 'investigation' });
    }

    setIsValidating(false);
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

  const handleResetAll = () => {
    resetAll();
    setCode(currentCase.phase1.initialCode);
    setValidationResults([]);
    setInvestigationAttempts(0);
    setAppPhase('instrumentation');
    setShowResetConfirm(false);
  };

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    markWelcomeSeen();
  };

  const goToNext = () => {
    if (nextCase) switchCase(nextCase.id);
  };

  const reviewInvestigation = () => setShowReviewModal(true);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (showHome) {
    return (
      <HomePage
        progress={allProgress}
        onSelectCase={goToCase}
      />
    );
  }

  return (
    <div className="h-screen bg-slate-900 text-slate-50 flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <header className="flex-shrink-0 border-b border-slate-700 bg-slate-800 px-3 sm:px-5 py-2">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Logo (desktop only) */}
          <div className="hidden sm:flex items-center gap-2.5 flex-shrink-0">
            <div className="w-7 h-7 bg-gradient-to-br from-sky-500 to-violet-600 rounded-lg flex items-center justify-center">
              <FlaskConical className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="text-sm font-bold text-white">Telemetry Academy</div>
          </div>

          {/* Back to home */}
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0 px-2 py-1 rounded hover:bg-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cases</span>
          </button>

          <div className="hidden sm:block w-px h-6 bg-slate-700 flex-shrink-0" />

          {/* Case Selector */}
          <div className="flex-1 min-w-0 hidden sm:block">
            <CaseSelector
              cases={cases}
              progress={allProgress}
              currentCaseId={currentCaseId}
              onSelect={switchCase}
            />
          </div>

          {/* Case name (mobile) */}
          <div className="flex-1 min-w-0 sm:hidden">
            <div className="text-sm font-semibold text-slate-200 truncate">{currentCase.name}</div>
          </div>

          {/* Phase Switcher */}
          {currentProgress.status !== 'locked' && (
            <div className="flex items-center gap-0.5 bg-slate-900 rounded-lg p-0.5 flex-shrink-0">
              <button
                onClick={() => setAppPhase('instrumentation')}
                className={`px-2 sm:px-3 py-1 rounded text-xs font-medium transition-colors ${
                  appPhase === 'instrumentation' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="hidden sm:inline">1 · </span>Instrument
              </button>
              <button
                disabled={!phaseUnlocked}
                onClick={() => phaseUnlocked && setAppPhase('investigation')}
                className={`px-2 sm:px-3 py-1 rounded text-xs font-medium transition-colors ${
                  appPhase === 'investigation' || appPhase === 'solved' ? 'bg-amber-600 text-white' :
                  phaseUnlocked ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 cursor-not-allowed'
                }`}
              >
                <span className="hidden sm:inline">2 · </span>Investigate
              </button>
            </div>
          )}

          {/* Difficulty badge (desktop) */}
          <span className={`hidden sm:inline text-[10px] font-bold px-2 py-1 rounded-full border flex-shrink-0 ${
            currentCase.difficulty === 'rookie' ? 'border-green-800 text-green-400 bg-green-950/40' :
            currentCase.difficulty === 'junior' ? 'border-sky-800 text-sky-400 bg-sky-950/40' :
            currentCase.difficulty === 'senior' ? 'border-violet-800 text-violet-400 bg-violet-950/40' :
            'border-amber-800 text-amber-400 bg-amber-950/40'
          }`}>
            {currentCase.difficulty.toUpperCase()}
          </span>

          {/* Reset (desktop) */}
          <div className="hidden sm:block">
            {showResetConfirm ? (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-slate-400">Reset?</span>
                <button onClick={handleResetAll} className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">Yes</button>
                <button onClick={() => setShowResetConfirm(false)} className="px-2 py-1 bg-slate-700 text-white text-xs rounded">No</button>
              </div>
            ) : (
              <button onClick={() => setShowResetConfirm(true)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors" title="Reset">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile Tab Bar ── */}
      {appPhase === 'instrumentation' && (
        <div className="flex sm:hidden border-b border-slate-700 bg-slate-800 flex-shrink-0">
          {([
            { id: 'instructions', label: 'Guide', icon: BookOpen },
            { id: 'code', label: 'Code', icon: Code2 },
            { id: 'output', label: 'Output', icon: Terminal },
          ] as { id: MobileTab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMobileTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors border-b-2 ${
                mobileTab === id ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}

      {appPhase === 'investigation' && (
        <div className="flex sm:hidden border-b border-slate-700 bg-slate-800 flex-shrink-0">
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-amber-400 border-b-2 border-amber-500">
            <Search className="w-3.5 h-3.5" />
            Investigation
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <main className="flex-1 flex overflow-hidden">
        {/* Modals — rendered at App root level */}
        {showReviewModal && (
          <ReviewModal
            spans={phase2Data?.spans ?? []}
            correctOption={phase2Data?.rootCauseOptions.find(o => o.correct) ?? null}
            onClose={() => setShowReviewModal(false)}
          />
        )}
        {showWelcome && <WelcomeModal onClose={handleWelcomeClose} />}

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
            {/* ── Desktop layout ── */}
            <div className="hidden sm:flex w-80 flex-shrink-0 border-r border-slate-700 overflow-y-auto">
              <InstructionsPanel
                case={currentCase}
                phaseUnlocked={phaseUnlocked}
                onStartInvestigation={() => setAppPhase('investigation')}
              />
            </div>
            <div className="hidden sm:flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 p-4 overflow-hidden">
                <CodeEditor value={code} onChange={setCode} language="python" />
              </div>
              <div className="h-56 flex-shrink-0 border-t border-slate-700 bg-slate-800 flex">
                <div className="flex-1 border-r border-slate-700">
                  <ValidationPanel
                    results={validationResults}
                    isValidating={isValidating}
                    isWorkerReady={isWorkerReady}
                    onValidate={handleValidate}
                    phaseUnlocked={phaseUnlocked}
                    onStartInvestigation={() => setAppPhase('investigation')}
                  />
                </div>
                <div className="flex-1">
                  <OutputPanel output={output} error={workerError || initError} isRunning={isRunning} />
                  {spans.length > 0 && (
                    <div className="text-xs text-slate-500 mt-1 px-4">
                      Captured {spans.length} telemetry span(s)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Mobile layout (tabs) ── */}
            <div className="flex sm:hidden flex-1 flex-col overflow-hidden">
              {mobileTab === 'instructions' && (
                <div className="flex-1 overflow-y-auto">
                  <InstructionsPanel
                    case={currentCase}
                    phaseUnlocked={phaseUnlocked}
                    onStartInvestigation={() => setAppPhase('investigation')}
                  />
                </div>
              )}
              {mobileTab === 'code' && (
                <div className="flex-1 p-3 overflow-hidden">
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  language={(currentCase as any).type === 'yaml-config' ? 'yaml' : 'python'}
                  filename={(currentCase as any).type === 'yaml-config' ? 'collector.yaml' : undefined}
                />
                </div>
              )}
              {mobileTab === 'output' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 border-b border-slate-700 overflow-hidden">
                    <ValidationPanel
                      results={validationResults}
                      isValidating={isValidating}
                      isWorkerReady={isWorkerReady}
                      onValidate={handleValidate}
                      phaseUnlocked={phaseUnlocked}
                      onStartInvestigation={() => { setAppPhase('investigation'); }}
                    />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <OutputPanel output={output} error={workerError || initError} isRunning={isRunning} />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-hidden">
            {hasPhase2Data && phase2Data ? (
              <InvestigationView
                data={phase2Data}
                caseName={currentCase.name}
                currentCaseId={currentCaseId}
                onCaseSolved={handleCaseSolved}
                onAttempt={handleInvestigationAttempt}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-slate-900 px-6">
                <div className="text-center max-w-md mx-auto">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Radio className="w-8 h-8 text-slate-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">No Telemetry Data</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Run your code in Phase 1 to generate telemetry data for investigation.
                  </p>
                  <button
                    onClick={() => setAppPhase('instrumentation')}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Go to Phase 1
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
