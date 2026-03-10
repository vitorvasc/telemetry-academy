import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Case } from '../types';
import {
  BookOpen,
  Lightbulb,
  Target,
  GraduationCap,
  Lock,
  Unlock,
  CheckCircle,
  ChevronDown,
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
  const mdClass = "prose prose-invert prose-sm max-w-none prose-p:text-slate-400 prose-strong:text-slate-200 prose-code:text-sky-300 prose-code:bg-slate-800 prose-code:px-1 prose-code:rounded prose-headings:text-slate-200 prose-li:text-slate-400 prose-ul:my-1 prose-ol:my-1 prose-p:my-1";
  const hintMdClass = "prose prose-invert prose-sm max-w-none prose-p:text-slate-400 prose-p:my-0 prose-code:text-sky-300 prose-code:bg-slate-800 prose-code:px-1 prose-code:rounded [&>p]:inline";

  const [phase1Open, setPhase1Open] = useState(true);
  const [phase2Open, setPhase2Open] = useState(true);

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
        <button
          onClick={() => setPhase1Open(o => !o)}
          className="flex items-center gap-2 text-amber-400 w-full text-left"
        >
          <Target className="w-5 h-5 flex-shrink-0" />
          <h3 className="font-semibold flex-1">Phase 1: Instrumentation</h3>
          <ChevronDown className={`w-4 h-4 transition-transform ${phase1Open ? '' : '-rotate-90'}`} />
        </button>

        {phase1Open && (
          <>
            <div className={mdClass}>
              <ReactMarkdown>{caseData.phase1.description}</ReactMarkdown>
            </div>

            {/* Hints Section */}
            <div className="border border-slate-700 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-900">
                <Lightbulb className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-400">Hints</span>
              </div>
              <ul className="p-4 space-y-2 bg-slate-800">
                {caseData.phase1.hints.map((hint, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="text-sky-400 font-mono flex-shrink-0">{index + 1}.</span>
                    <span className={hintMdClass}>
                      <ReactMarkdown>{hint}</ReactMarkdown>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Phase 2: Investigation (Locked/Preview) */}
      <div className="space-y-4 pt-4 border-t border-slate-700">
        <button
          onClick={() => setPhase2Open(o => !o)}
          className={`flex items-center gap-2 w-full text-left ${phaseUnlocked ? 'text-green-400' : 'text-slate-400'}`}
        >
          {phaseUnlocked ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <Lock className="w-5 h-5 flex-shrink-0" />}
          <h3 className="font-semibold flex-1">Phase 2: Investigation</h3>
          <ChevronDown className={`w-4 h-4 transition-transform ${phase2Open ? '' : '-rotate-90'}`} />
        </button>

        {phase2Open && (
          phaseUnlocked ? (
            <div className="space-y-3">
              <div className={mdClass}>
                <ReactMarkdown>{caseData.phase2?.description || 'Investigation phase ready!'}</ReactMarkdown>
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
          )
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
