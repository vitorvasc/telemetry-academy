import React, { useState } from 'react';
import type { Case } from '../types';
import { 
  BookOpen, 
  Lightbulb, 
  ChevronDown, 
  ChevronRight,
  Target,
  GraduationCap,
  Lock,
  Unlock,
  CheckCircle
} from 'lucide-react';

interface InstructionsPanelProps {
  case: Case;
  phaseUnlocked: boolean;
  onStartInvestigation?: () => void;
}

export const InstructionsPanel: React.FC<InstructionsPanelProps> = ({ 
  case: caseData, 
  phaseUnlocked,
  onStartInvestigation,
}) => {
  const [showHints, setShowHints] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* Case Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-400">
          <GraduationCap className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wide">{caseData.difficulty}</span>
        </div>
        
        <h2 className="text-2xl font-bold text-white">{caseData.name}</h2>
        
        <div className="flex flex-wrap gap-2">
          {caseData.concepts.map(concept => (
            <span 
              key={concept}
              className="px-2 py-1 text-xs bg-sky-400/10 text-sky-400 rounded-full"
            >
              {concept.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Phase 1: Instrumentation */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-amber-400">
          <Target className="w-5 h-5" />
          <h3 className="font-semibold">Phase 1: Instrumentation</h3>
        </div>
        
        <div className="prose prose-invert prose-sm max-w-none">
          <div className="whitespace-pre-line text-slate-400 leading-relaxed">
            {caseData.phase1.description}
          </div>
        </div>

        {/* Hints Section */}
        <div className="border border-slate-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowHints(!showHints)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-900 hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2 text-slate-400">
              <Lightbulb className="w-4 h-4" />
              <span className="text-sm font-medium">Hints</span>
            </div>
            {showHints ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          {showHints && (
            <ul className="p-4 space-y-2 bg-slate-800 animate-slide-in">
              {caseData.phase1.hints.map((hint, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-2 text-sm text-slate-400"
                >
                  <span className="text-sky-400 font-mono">{index + 1}.</span>
                  {hint}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Phase 2: Investigation (Locked/Preview) */}
      <div className="space-y-4 pt-4 border-t border-slate-700">
        <div className={`flex items-center gap-2 ${phaseUnlocked ? 'text-green-400' : 'text-slate-400'}`}>
          {phaseUnlocked ? <CheckCircle className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          <h3 className="font-semibold">Phase 2: Investigation</h3>
        </div>
        
        {phaseUnlocked ? (
          <div className="space-y-3">
            <div className="whitespace-pre-line text-slate-400 text-sm">
              {caseData.phase2?.description || 'Investigation phase ready!'}
            </div>
            <button
              onClick={onStartInvestigation}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              Open Investigation →
            </button>
          </div>
        ) : (
          <div className="p-4 bg-slate-900 rounded-lg border border-dashed border-slate-700">
            <p className="text-sm text-slate-400">
              Complete Phase 1 to unlock the investigation phase.
              You'll analyze traces to find the root cause!
            </p>
          </div>
        )}
      </div>

      {/* Resources */}
      <div className="pt-4 border-t border-slate-700">
        <div className="flex items-center gap-2 text-slate-400 mb-3">
          <BookOpen className="w-4 h-4" />
          <span className="text-sm font-medium">Learn</span>
        </div>
        
        <div className="space-y-2">
          <a 
            href="https://opentelemetry.io/docs/instrumentation/python/manual/"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-sky-400 hover:underline"
          >
            → OTel Python Manual Instrumentation
          </a>
          <a 
            href="https://opentelemetry.io/docs/concepts/signals/traces/"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-sky-400 hover:underline"
          >
            → Understanding Traces
          </a>
        </div>
      </div>
    </div>
  );
};
