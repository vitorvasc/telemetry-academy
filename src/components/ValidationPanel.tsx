import React from 'react';
import type { ValidationResult } from '../types';
import { 
  Play, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Unlock,
  Sparkles
} from 'lucide-react';

interface ValidationPanelProps {
  results: ValidationResult[];
  isValidating: boolean;
  onValidate: () => void;
  phaseUnlocked: boolean;
  onStartInvestigation?: () => void;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  results,
  isValidating,
  onValidate,
  phaseUnlocked,
  onStartInvestigation,
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-sky-400" />
          <span className="font-medium text-white">Validation</span>
        </div>
        
        <button
          onClick={onValidate}
          disabled={isValidating || phaseUnlocked}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
            transition-all duration-200
            ${phaseUnlocked 
              ? 'bg-success/20 text-green-400 cursor-default' 
              : isValidating
                ? 'bg-primary/50 text-white cursor-not-allowed'
                : 'bg-sky-500 hover:bg-sky-600 text-white active:scale-95'
            }
          `}
        >
          {isValidating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Validating...
            </>
          ) : phaseUnlocked ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Complete
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
        {results.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Play className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">Click "Check Code" to validate your instrumentation</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`
                  flex items-start gap-3 p-3 rounded-lg border
                  ${result.passed 
                    ? 'bg-green-400/10 border-success/30' 
                    : 'bg-red-400/10 border-error/30'
                  }
                  animate-slide-in
                `}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {result.passed ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                
                <div className="flex-1">
                  <p className={`text-sm font-medium ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                    {result.message}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {result.description}
                  </p>
                </div>
              </div>
            ))}

            {/* Success Message */}
            {phaseUnlocked && (
              <div className="mt-4 p-4 bg-green-400/10 border border-success/30 rounded-lg animate-slide-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-green-400" />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-400">Phase 1 Complete!</h4>
                    <p className="text-sm text-slate-400">
                      Your instrumentation is working. The investigation phase is now unlocked.
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
  );
};
