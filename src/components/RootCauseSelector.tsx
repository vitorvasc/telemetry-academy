import React, { useState, useEffect } from 'react';
import type { RootCauseOption } from '../types/phase2';
import type { EvaluationResult } from '../lib/rootCauseEngine';
import { CheckCircle2, XCircle, Trophy, RotateCcw, HelpCircle } from 'lucide-react';

interface RootCauseSelectorProps {
  options: RootCauseOption[];
  evaluationResult?: EvaluationResult | null;
  onSubmitGuess?: (guessId: string) => void;
  onSolved: () => void;
  onAttempt?: () => void;
}

export const RootCauseSelector: React.FC<RootCauseSelectorProps> = ({ 
  options, 
  evaluationResult,
  onSubmitGuess,
  onSolved, 
  onAttempt 
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const selectedOption = options.find(o => o.id === selected);
  // Use evaluation result if available, otherwise fall back to static option.correct
  const isCorrect = submitted && (evaluationResult?.correct ?? selectedOption?.correct);

  // Reset state when evaluation result is cleared (new telemetry data)
  useEffect(() => {
    if (evaluationResult === null) {
      setSubmitted(false);
      setSelected(null);
    }
  }, [evaluationResult]);

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
    setAttempts(a => a + 1);
    onAttempt?.();
    
    // Use engine evaluation if onSubmitGuess is provided
    if (onSubmitGuess) {
      onSubmitGuess(selected);
    } else if (selectedOption?.correct) {
      // Fallback to static behavior
      setTimeout(onSolved, 2000);
    }
  };

  const handleRetry = () => {
    setSubmitted(false);
    setSelected(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Prompt */}
      <div className="flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-slate-300 leading-relaxed">
          Based on the <strong className="text-sky-400">traces</strong> and{' '}
          <strong className="text-amber-400">logs</strong>, what is the root cause of the 5-second latency?
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {options.map(option => {
          const isSelected = selected === option.id;
          const showResult = submitted && isSelected;
          const correct = option.correct;

          const borderCls = showResult
            ? correct
              ? 'border-green-500 bg-green-950/40'
              : 'border-red-500 bg-red-950/40'
            : isSelected
              ? 'border-sky-500 bg-sky-950/30'
              : 'border-slate-700 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-800/40';

          return (
            <div key={option.id} className="rounded-xl overflow-hidden border transition-all duration-200">
              <button
                disabled={submitted}
                onClick={() => setSelected(option.id)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-all duration-200 ${borderCls}`}
              >
                {/* Radio indicator */}
                <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  showResult && correct  ? 'border-green-400 bg-green-400' :
                  showResult && !correct ? 'border-red-400 bg-red-400' :
                  isSelected            ? 'border-sky-400' :
                                          'border-slate-600'
                }`}>
                  {showResult && correct  && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  {showResult && !correct && <XCircle className="w-3.5 h-3.5 text-white" />}
                  {!submitted && isSelected && <div className="w-2 h-2 rounded-full bg-sky-400" />}
                </div>

                {/* Label */}
                <div className="flex-1">
                  <span className="text-xs font-mono text-slate-500 mr-2">
                    [{option.id.toUpperCase()}]
                  </span>
                  <span className={`text-sm ${
                    showResult && correct  ? 'text-green-200' :
                    showResult && !correct ? 'text-red-300' :
                    isSelected            ? 'text-slate-100' :
                                            'text-slate-300'
                  }`}>
                    {option.label}
                  </span>
                </div>
              </button>

              {/* Explanation (inline below the option) */}
              {showResult && (
                <div className={`px-4 py-3 border-t text-xs leading-relaxed ${
                  correct
                    ? 'border-green-800/60 bg-green-950/30 text-green-300'
                    : 'border-red-800/60 bg-red-950/30 text-red-300'
                }`}>
                  {evaluationResult && isSelected ? (
                    // Show dynamic feedback from the engine
                    <>
                      {evaluationResult.explanation}
                      {evaluationResult.hint && (
                        <div className="mt-2 text-amber-400">
                          {evaluationResult.hint}
                        </div>
                      )}
                    </>
                  ) : (
                    // Fallback to static explanation from option
                    option.explanation
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed bg-sky-600 hover:bg-sky-500 text-white active:scale-[0.99]"
        >
          Submit Answer
        </button>
      ) : isCorrect ? (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-green-950/40 border border-green-700">
          <div className="w-10 h-10 bg-green-900/60 rounded-full flex items-center justify-center flex-shrink-0">
            <Trophy className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <div className="text-green-400 font-bold text-sm">Case Solved!</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Solved in {attempts} attempt{attempts !== 1 ? 's' : ''} · Moving to next case…
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-red-950/30 border border-red-900/50">
          <div className="flex items-center gap-2 text-xs text-red-400">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            Incorrect — review the trace data and try again
            <span className="text-slate-500">({attempts} attempt{attempts !== 1 ? 's' : ''})</span>
          </div>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-600 hover:border-slate-400 text-slate-300 text-xs rounded-lg transition-colors flex-shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};
