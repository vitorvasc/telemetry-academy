import React from 'react'
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

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  results,
  isValidating,
  onValidate,
  phaseUnlocked,
  onStartInvestigation,
  isWorkerReady = true, // Default to true for backward compatibility
  loadingLabel,
}) => {
  const isMac = navigator.userAgent.toUpperCase().includes('MAC')
  const buttonTitle =
    !isWorkerReady || isValidating || phaseUnlocked
      ? undefined
      : isMac
        ? 'Run code (⌘↵)'
        : 'Run code (Ctrl+↵)'

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-sky-400" />
          <span className="font-medium text-white">Validation</span>
        </div>

        <button
          onClick={() => {
            void onValidate()
          }}
          title={buttonTitle}
          disabled={!isWorkerReady || isValidating}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
            transition-all duration-200
            ${
              !isWorkerReady || isValidating
                ? 'bg-primary/50 text-white cursor-not-allowed'
                : phaseUnlocked
                  ? 'bg-success/20 text-green-400 hover:bg-success/30 active:scale-95'
                  : 'bg-sky-500 hover:bg-sky-600 text-white active:scale-95'
            }
          `}
        >
          {!isWorkerReady ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">
                {loadingLabel || 'Loading Python...'}
              </span>
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
            {results.map((result, index) => {
              const isGuided = result.attemptsOnThisRule >= 3
              const bgClass = result.passed
                ? 'bg-green-400/10 border-success/30'
                : isGuided
                  ? 'bg-amber-400/10 border-amber-500/30' // Amber for guided help
                  : 'bg-red-400/10 border-error/30' // Red for errors
              const textClass = result.passed
                ? 'text-green-400'
                : isGuided
                  ? 'text-amber-400'
                  : 'text-red-400'

              return (
                <div
                  key={result.description}
                  className={`
                    flex items-start gap-3 p-3 rounded-lg border
                    ${bgClass}
                    animate-slide-in
                  `}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    {result.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : isGuided ? (
                      <XCircle className="w-5 h-5 text-amber-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    {!result.passed && result.attemptsOnThisRule >= 1 && (
                      <Lightbulb
                        className="w-3.5 h-3.5 text-amber-400/70"
                        aria-label="Hint available"
                      />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className={`text-sm font-medium ${textClass}`}>
                      {result.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-400">
                        {result.description}
                      </p>
                      {!result.passed && result.attemptsOnThisRule > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded">
                          Attempt {result.attemptsOnThisRule + 1}
                        </span>
                      )}
                    </div>
                    {!result.passed &&
                      result.hintMessage &&
                      result.attemptsOnThisRule >= 1 &&
                      result.attemptsOnThisRule < 3 && (
                        <p className="mt-1.5 text-xs text-slate-400">
                          {result.hintMessage}
                        </p>
                      )}
                    {!result.passed && isGuided && result.guidedMessage && (
                      <div className="mt-2 px-3 py-2 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 animate-slide-in">
                        {result.guidedMessage}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

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
