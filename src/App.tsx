import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useLocation, useRoute } from 'wouter'

import { CaseHeader } from './components/CaseHeader'
import { MobileCaseDrawer } from './components/MobileCaseDrawer'
import { CaseSolvedScreen } from './components/CaseSolvedScreen'
import { HomePage } from './components/HomePage'
import { ReviewModal } from './components/ReviewModal'
import { WelcomeModal } from './components/WelcomeModal'
import { ErrorBoundary } from './components/ErrorBoundary'
import { CookieConsent } from './components/CookieConsent'
import { Footer } from './components/Footer'
import { PhaseBar, type AppPhase } from './components/PhaseBar'
import { LanguageBar } from './components/LanguageBar'
import { InstrumentationWorkspace } from './components/InstrumentationWorkspace'
import { InvestigationWorkspace } from './components/InvestigationWorkspace'
import { reopenCookieConsent } from './lib/cookieConsent'
import { useCodeRunner, type Language } from './hooks/useCodeRunner'
import { useAnalytics } from './hooks/useAnalytics'
import { useAcademyPersistence } from './hooks/useAcademyPersistence'
import { useCaseRouteGuard } from './hooks/useCaseRouteGuard'
import { usePhase2Data } from './hooks/usePhase2Data'
import type { Case, ValidationResult } from './types'
import type { CaseProgress } from './types/progress'
import { validateSpans, validateYaml } from './lib/validation'
import { cases } from './data/cases'
import { useGroupRef, useDefaultLayout } from 'react-resizable-panels'

const FIRST_CASE_ID = '001-hello-span'

function initProgress(cases: Case[]): CaseProgress[] {
  return cases.map(c => ({
    caseId: c.id,
    status: c.id === FIRST_CASE_ID ? 'available' : 'locked',
    phase: 'instrumentation',
    attempts: 0,
  }))
}

const INITIAL_PROGRESS = initProgress(cases)

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
  } = useAcademyPersistence(INITIAL_PROGRESS)

  const { trackEvent } = useAnalytics()
  const [, setLocation] = useLocation()
  const [matchCase, params] = useRoute('/case/:id')

  // Derive showHome from URL — home when not on a case route
  const showHome = !matchCase

  const [currentCaseId, setCurrentCaseId] = useState(cases[0].id)
  const [appPhase, setAppPhase] = useState<AppPhase>('instrumentation')
  const [code, setCode] = useState(cases[0].phase1.initialCode)
  const [resetCount, setResetCount] = useState(0)
  const [validationResults, setValidationResults] = useState<
    ValidationResult[]
  >([])
  const [isValidating, setIsValidating] = useState(false)
  const [investigationAttempts, setInvestigationAttempts] = useState(0)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showMobileDrawer, setShowMobileDrawer] = useState(false)

  const [activeLanguage, setActiveLanguage] = useState<Language>('python')
  const {
    isReady: isWorkerReady,
    initError,
    isRunning,
    output,
    spans,
    runCode,
    loadingLabel,
  } = useCodeRunner(activeLanguage)
  const [workerError, setWorkerError] = useState<string | null>(null)

  // Clear validation results when code changes (prevents stale state)
  useEffect(() => {
    setValidationResults([])
    setWorkerError(null)
  }, [code])

  // Sync currentCaseId from URL params when navigating directly to /case/:id
  useEffect(() => {
    if (matchCase && params?.id) {
      const c = cases.find(x => x.id === params.id)
      if (c) {
        setCurrentCaseId(params.id)
      }
    }
  }, [matchCase, params?.id])

  useCaseRouteGuard(isLoaded, allProgress, matchCase ? params?.id : undefined)

  // Show welcome modal on first visit
  useEffect(() => {
    if (isLoaded && !hasSeenWelcome) {
      setShowWelcome(true)
    }
  }, [isLoaded, hasSeenWelcome])
  const initialLoadRef = useRef(true)
  const languageSwitchRef = useRef(false)
  // Stable ref to getSavedCode — avoids re-triggering the load effect on every keystroke
  // (getSavedCode identity changes when caseCode updates)
  const getSavedCodeRef = useRef(getSavedCode)
  const [lastPassedCode, setLastPassedCode] = useState<string | null>(null)
  const mainGroupRef = useGroupRef()

  // Panel persistence via useDefaultLayout (react-resizable-panels v4)
  const mainLayout = useDefaultLayout({
    id: 'ta-panel-main',
    storage: localStorage,
  })
  const rightLayout = useDefaultLayout({
    id: 'ta-panel-right',
    storage: localStorage,
  })
  const bottomLayout = useDefaultLayout({
    id: 'ta-panel-bottom',
    storage: localStorage,
  })
  // Keep getSavedCodeRef in sync — intentional pattern to prevent effect re-triggering on keystroke
  // eslint-disable-next-line react-hooks/refs
  getSavedCodeRef.current = getSavedCode

  // Resolve the code for a given case+language: saved code → initial code fallback.
  // Uses getSavedCodeRef to avoid re-triggering effects on every keystroke.
  const resolveCode = useCallback(
    (caseId: string, lang: Language): string => {
      const saved = getSavedCodeRef.current(caseId, lang)
      if (saved !== undefined) return saved
      const c = cases.find(x => x.id === caseId)
      if (!c) return ''
      return lang === 'javascript' && c.phase1.initialCodeJs
        ? c.phase1.initialCodeJs
        : c.phase1.initialCode
    },
    [cases]
  )

  const currentCase = useMemo(
    () => cases.find(c => c.id === currentCaseId) ?? cases[0],
    [currentCaseId]
  )
  const currentIdx = useMemo(
    () => cases.findIndex(c => c.id === currentCaseId),
    [currentCaseId]
  )
  const nextCase = useMemo(() => cases[currentIdx + 1], [currentIdx])
  const currentProgress = useMemo(
    () => allProgress.find(p => p.caseId === currentCaseId)!,
    [allProgress, currentCaseId]
  )
  const { data: phase2Data, hasData: hasPhase2Data } = usePhase2Data(
    spans,
    currentCaseId
  )
  // Derive phase unlock from persisted progress, not code equality. This prevents
  // switching languages (which changes `code`) from re-locking Phase 2.
  // lastPassedCode !== null covers the brief moment before progress flushes to localStorage.
  const phaseUnlocked =
    currentProgress.phase === 'investigation' ||
    currentProgress.phase === 'complete' ||
    lastPassedCode !== null

  // Load persisted code when persistence is ready, case switches, or language changes.
  // getSavedCode is intentionally accessed via ref so its changing reference
  // (caused by caseCode updates on every keystroke) does not re-trigger this effect.
  useEffect(() => {
    // switchLanguage already set the code inline — skip to avoid double-set.
    // Clear the ref before the isLoaded guard so it doesn't persist across loads.
    if (languageSwitchRef.current) {
      languageSwitchRef.current = false
      return
    }
    if (!isLoaded) return
    setCode(resolveCode(currentCaseId, activeLanguage))
  }, [isLoaded, currentCaseId, activeLanguage, resolveCode])

  // Code auto-save effect
  useEffect(() => {
    if (isLoaded && !initialLoadRef.current) {
      saveCode(currentCaseId, code, activeLanguage)
    }
    initialLoadRef.current = false
  }, [code, currentCaseId, isLoaded, saveCode, activeLanguage])

  // Switch language within a case — save current code first, then let the load effect
  // restore the target language's saved code (or fall back to initial code).
  const switchLanguage = useCallback(
    (lang: Language) => {
      if (lang === activeLanguage) return
      saveCode(currentCaseId, code, activeLanguage)
      // Load the target language's code NOW so it batches with setActiveLanguage,
      // preventing the caseKey effect in CodeEditor from reading stale content.
      setCode(resolveCode(currentCaseId, lang))
      languageSwitchRef.current = true
      setActiveLanguage(lang)
      setValidationResults([])
    },
    [activeLanguage, currentCaseId, code, saveCode, resolveCode]
  )

  // Switch cases
  const switchCase = useCallback(
    (id: string) => {
      const c = cases.find(x => x.id === id)
      if (!c) return
      const prog = allProgress.find(p => p.caseId === id)!
      setCurrentCaseId(id)
      setActiveLanguage('python') // reset to Python when switching cases
      const savedCode = resolveCode(id, 'python')
      setCode(savedCode)
      setValidationResults([])
      setAppPhase(prog.phase as AppPhase)
      setInvestigationAttempts(prog.attempts)
      setShowReviewModal(false)
      if (prog.phase === 'investigation' || prog.phase === 'complete') {
        setLastPassedCode(savedCode)
      } else {
        setLastPassedCode(null)
      }
    },
    [allProgress, resolveCode]
  )

  // Navigate to a case from home
  const goToCase = useCallback(
    (id: string) => {
      const c = cases.find(x => x.id === id)
      if (c) {
        trackEvent('case_started', {
          case_id: c.id,
          case_name: c.name,
          difficulty: c.difficulty,
        })
      }
      switchCase(id)
      setLocation(`/case/${id}`)
    },
    [switchCase, setLocation, trackEvent]
  )

  // Update progress helper
  const updateProgress = useCallback(
    (id: string, patch: Partial<CaseProgress>) => {
      setAllProgress(prev =>
        prev.map(p => (p.caseId === id ? { ...p, ...patch } : p))
      )
    },
    [setAllProgress]
  )

  // Phase 1 validation
  const handleValidate = async () => {
    // Both the panel button and the editor's Cmd/Ctrl+Enter shortcut land here;
    // running before the worker is ready burns a failed attempt on zero spans.
    if (!isWorkerReady || isValidating) return
    setIsValidating(true)
    setWorkerError(null)

    // Mark in-progress

    updateProgress(currentCaseId, {
      status: 'in-progress',
      timeStartedMs: Date.now(),
    })

    // YAML-mode branch: The Collector case validates YAML directly, no Python worker
    if (currentCase.type === 'yaml-config') {
      const currentAttemptHistory: Record<string, number> = {}
      currentCase.phase1.validations.forEach(rule => {
        currentAttemptHistory[rule.description] = getAttemptCount(
          currentCaseId,
          rule.description
        )
      })

      const results = validateYaml(currentCase.phase1.validations, {
        yamlContent: code,
        attemptHistory: currentAttemptHistory,
      })

      results.forEach(r => {
        if (!r.passed) {
          updateAttemptHistory(currentCaseId, r.description)
        }
      })

      setValidationResults(results)

      if (results.every(r => r.passed)) {
        setAppPhase('investigation')
        setLastPassedCode(code)
        updateProgress(currentCaseId, { phase: 'investigation' })
      }

      setIsValidating(false)
      return
    }

    // Python worker path
    let runSpans: typeof spans = []
    try {
      const runResult = await runCode(code)
      runSpans = runResult.spans
    } catch (err: unknown) {
      setWorkerError(
        (err instanceof Error ? err.message : null) || 'Unknown execution error'
      )
    }

    // Get attempt history for current case
    const currentAttemptHistory: Record<string, number> = {}
    currentCase.phase1.validations.forEach(rule => {
      currentAttemptHistory[rule.description] = getAttemptCount(
        currentCaseId,
        rule.description
      )
    })

    // Run real span-based validation
    const results = validateSpans(currentCase.phase1.validations, {
      spans: runSpans,
      attemptHistory: currentAttemptHistory,
    })

    // Update attempt history for failed rules
    results.forEach(r => {
      if (!r.passed) {
        updateAttemptHistory(currentCaseId, r.description)
      }
    })

    setValidationResults(results)

    trackEvent('validation_attempted', {
      case_id: currentCaseId,
      passed: results.every(r => r.passed),
      language: activeLanguage,
    })

    if (results.every(r => r.passed)) {
      setAppPhase('investigation')
      setLastPassedCode(code)
      updateProgress(currentCaseId, { phase: 'investigation' })
    }

    setIsValidating(false)
  }

  // Phase 2 solved
  const handleCaseSolved = () => {
    const now = Date.now()
    trackEvent('case_solved', {
      case_id: currentCaseId,
      case_name: currentCase.name,
      attempts: investigationAttempts,
      language: activeLanguage,
    })
    setAppPhase('solved')
    updateProgress(currentCaseId, {
      status: 'solved',
      phase: 'complete',
      timeSolvedMs: now,
      attempts: investigationAttempts,
    })
    // Unlock next case
    if (nextCase) {
      updateProgress(nextCase.id, { status: 'available' })
    }
  }

  const handleInvestigationAttempt = () => {
    setInvestigationAttempts(a => a + 1)
  }

  const handleResetAll = () => {
    resetAll()
    setCode(currentCase.phase1.initialCode)
    setResetCount(c => c + 1)
    setValidationResults([])
    setInvestigationAttempts(0)
    setAppPhase('instrumentation')
    setActiveLanguage('python')
    setLastPassedCode(null)
  }

  const handleWelcomeClose = () => {
    setShowWelcome(false)
    markWelcomeSeen()
  }

  const handleResetPanels = () => {
    localStorage.removeItem('react-resizable-panels:ta-panel-main')
    localStorage.removeItem('react-resizable-panels:ta-panel-right')
    localStorage.removeItem('react-resizable-panels:ta-panel-bottom')
    mainGroupRef.current?.setLayout({
      'ta-instructions': 25,
      'ta-editor-group': 75,
    })
  }

  const goToNext = () => {
    if (nextCase) switchCase(nextCase.id)
  }

  const reviewInvestigation = () => setShowReviewModal(true)

  const languageBar = (
    <LanguageBar
      languages={currentCase.languages}
      active={activeLanguage}
      onSwitch={switchLanguage}
    />
  )

  const phaseBar = (
    <PhaseBar
      appPhase={appPhase}
      phaseUnlocked={phaseUnlocked}
      locked={currentProgress.status === 'locked'}
      onSelectPhase={setAppPhase}
    />
  )

  // Loading state
  if (!isLoaded) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400">Loading...</span>
        </div>
      </div>
    )
  }

  if (showHome) {
    return (
      <div className="h-screen flex flex-col bg-slate-950">
        <div className="flex-1 overflow-y-auto">
          <HomePage progress={allProgress} onSelectCase={goToCase} />
        </div>
        <Footer onManageCookies={reopenCookieConsent} />
        <CookieConsent />
      </div>
    )
  }

  return (
    <div className="h-screen bg-slate-900 text-slate-50 flex flex-col overflow-hidden">
      <CaseHeader
        currentCase={currentCase}
        progress={allProgress}
        onSelectCase={switchCase}
        onBack={() => setLocation('/')}
        onOpenMobileDrawer={() => setShowMobileDrawer(true)}
        onResetPanels={handleResetPanels}
        onResetAll={handleResetAll}
      />

      {/* ── Main ── */}
      <main className="flex-1 flex overflow-hidden">
        {/* Modals — rendered at App root level */}
        {showReviewModal && (
          <ReviewModal
            spans={phase2Data?.spans ?? []}
            correctOption={
              phase2Data?.rootCauseOptions.find(o => o.correct) ?? null
            }
            onClose={() => setShowReviewModal(false)}
          />
        )}
        {showWelcome && <WelcomeModal onClose={handleWelcomeClose} />}
        {showMobileDrawer && (
          <MobileCaseDrawer
            cases={cases}
            progress={allProgress}
            currentCaseId={currentCaseId}
            onSelect={id => {
              switchCase(id)
              setLocation(`/case/${id}`)
            }}
            onClose={() => setShowMobileDrawer(false)}
          />
        )}

        <ErrorBoundary>
          {appPhase === 'solved' ? (
            <div className="flex-1 overflow-hidden">
              <CaseSolvedScreen
                solvedCase={currentCase}
                nextCase={nextCase}
                progress={{
                  ...currentProgress,
                  attempts: investigationAttempts,
                }}
                onNext={goToNext}
                onReview={reviewInvestigation}
              />
            </div>
          ) : appPhase === 'instrumentation' ? (
            <InstrumentationWorkspace
              currentCase={currentCase}
              code={code}
              onCodeChange={setCode}
              language={activeLanguage}
              resetCount={resetCount}
              onValidate={handleValidate}
              validationResults={validationResults}
              isValidating={isValidating}
              isWorkerReady={isWorkerReady}
              loadingLabel={loadingLabel}
              phaseUnlocked={phaseUnlocked}
              onStartInvestigation={() => setAppPhase('investigation')}
              output={output}
              workerError={workerError}
              initError={initError}
              isRunning={isRunning}
              spanCount={spans.length}
              phaseBar={phaseBar}
              languageBar={languageBar}
              groupRef={mainGroupRef}
              mainLayout={mainLayout}
              rightLayout={rightLayout}
              bottomLayout={bottomLayout}
            />
          ) : (
            <InvestigationWorkspace
              currentCase={currentCase}
              phaseUnlocked={phaseUnlocked}
              phase2Data={phase2Data}
              hasPhase2Data={hasPhase2Data}
              output={output}
              onCaseSolved={handleCaseSolved}
              onAttempt={handleInvestigationAttempt}
              onGoToPhase1={() => setAppPhase('instrumentation')}
              phaseBar={phaseBar}
              groupRef={mainGroupRef}
              mainLayout={mainLayout}
            />
          )}
        </ErrorBoundary>
      </main>
      <Footer onManageCookies={reopenCookieConsent} />
      <CookieConsent />
    </div>
  )
}

export default App
