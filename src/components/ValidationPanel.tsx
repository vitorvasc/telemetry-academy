import React, { useState } from 'react'
import type { ValidationResult } from '../types'
import {
  Play,
  Loader2,
  CheckCircle,
  RotateCw,
  XCircle,
  AlertCircle,
  Unlock,
  Sparkles,
  Lightbulb,
} from 'lucide-react'

interface ValidationPanelProps {
  results: ValidationResult[]
  isValidating: boolean
  onValidate: () => void | Promise<void>
  phaseUnlocked: boolean
  onStartInvestigation?: () => void
  isWorkerReady?: boolean // Add to distinguish init vs execution
  loadingLabel?: string // Progressive loading stage label from useCodeRunner
}

type RunButtonProps = Pick<
  ValidationPanelProps,
  'isValidating' | 'onValidate' | 'phaseUnlocked' | 'loadingLabel'
> & { isWorkerReady: boolean }

const RunButton: React.FC<RunButtonProps> = ({
  isValidating,
  onValidate,
  phaseUnlocked,
  isWorkerReady,
  loadingLabel,
}) => {
  const busy = !isWorkerReady || isValidating
  const isMac = navigator.userAgent.toUpperCase().includes('MAC')
  const title = busy ? undefined : isMac ? 'Run code (⌘↵)' : 'Run code (Ctrl+↵)'
  const colorClass = busy
    ? 'bg-primary/50 text-white cursor-not-allowed'
    : phaseUnlocked
      ? 'bg-success/20 text-green-400 hover:bg-success/30 active:scale-95'
      : 'bg-sky-500 hover:bg-sky-600 text-white active:scale-95'

  return (
    <button
      onClick={() => {
        void onValidate()
      }}
      title={title}
      disabled={busy}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${colorClass}`}
    >
      {!isWorkerReady ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">{loadingLabel || 'Loading sandbox...'}</span>
        </>
      ) : isValidating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Running code...
        </>
      ) : phaseUnlocked ? (
        <>
          <RotateCw className="w-4 h-4" />
          Re-check
        </>
      ) : (
        <>
          <Play className="w-4 h-4" />
          Check Code
        </>
      )}
    </button>
  )
}

const HintToggle: React.FC<{ text: string }> = ({ text }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2"
      >
        {open ? 'Hide hint' : 'Need a hint?'}
      </button>
      {open && <p className="mt-1 text-xs text-slate-400">{text}</p>}
    </div>
  )
}

// Progressive help for a failed rule: toggle on the first failure, inline hint
// on the next two, guided message from the third prior failure onward.
const HintBlock: React.FC<{ result: ValidationResult }> = ({ result }) => {
  const { hintMessage, guidedMessage, attemptsOnThisRule: attempts } = result
  if (attempts >= 3) {
    return guidedMessage ? (
      <div className="mt-2 px-3 py-2 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 animate-slide-in">
        {guidedMessage}
      </div>
    ) : null
  }
  if (!hintMessage) return null
  return attempts === 0 ? (
    <HintToggle text={hintMessage} />
  ) : (
    <p className="mt-1.5 text-xs text-slate-400">{hintMessage}</p>
  )
}

const TONE = {
  passed: { bg: 'bg-green-400/10 border-success/30', text: 'text-green-400' },
  guided: { bg: 'bg-amber-400/10 border-amber-500/30', text: 'text-amber-400' },
  failed: { bg: 'bg-red-400/10 border-error/30', text: 'text-red-400' },
} as const

const ResultRow: React.FC<{ result: ValidationResult; index: number }> = ({
  result,
  index,
}) => {
  const attempts = result.attemptsOnThisRule
  const failed = !result.passed
  const tone =
    TONE[result.passed ? 'passed' : attempts >= 3 ? 'guided' : 'failed']

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${tone.bg} animate-slide-in`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
        {result.passed ? (
          <CheckCircle className="w-5 h-5 text-green-400" />
        ) : (
          <XCircle className={`w-5 h-5 ${tone.text}`} />
        )}
        {failed && attempts >= 1 && (
          <Lightbulb
            className="w-3.5 h-3.5 text-amber-400/70"
            aria-label="Hint available"
          />
        )}
      </div>

      <div className="flex-1">
        <p className={`text-sm font-medium ${tone.text}`}>{result.message}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-slate-400">{result.description}</p>
          {failed && attempts > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded">
              Attempt {attempts + 1}
            </span>
          )}
        </div>
        {failed && <HintBlock result={result} />}
      </div>
    </div>
  )
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  results,
  isValidating,
  onValidate,
  phaseUnlocked,
  onStartInvestigation,
  isWorkerReady = true, // Default to true for backward compatibility
  loadingLabel,
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-sky-400" />
          <span className="font-medium text-white">Validation</span>
        </div>

        <RunButton
          isValidating={isValidating}
          onValidate={onValidate}
          phaseUnlocked={phaseUnlocked}
          isWorkerReady={isWorkerReady}
          loadingLabel={loadingLabel}
        />
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {isValidating && results.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">Running code and capturing telemetry...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Play className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">
              Click "Check Code" to validate your instrumentation
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((result, index) => (
              <ResultRow
                key={result.description}
                result={result}
                index={index}
              />
            ))}

            {/* Success Message */}
            {phaseUnlocked && (
              <div className="mt-4 p-4 bg-green-400/10 border border-success/30 rounded-lg animate-slide-in relative overflow-hidden">
                {/* Celebration glow animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/10 to-green-500/20 animate-pulse" />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center animate-pulse">
                    <Sparkles className="w-5 h-5 text-green-400" />
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold text-green-400">
                      Phase 1 Complete!
                    </h4>
                    <p className="text-sm text-slate-400">
                      Your instrumentation is working. The investigation phase
                      is now unlocked.
                    </p>
                  </div>

                  <button
                    onClick={onStartInvestigation}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    <Unlock className="w-4 h-4" />
                    Investigate →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
