import { useState } from 'react'
import {
  FlaskConical,
  RotateCcw,
  ArrowLeft,
  LayoutPanelLeft,
  ChevronDown,
} from 'lucide-react'
import { CaseSelector } from './CaseSelector'
import { cases } from '../data/cases'
import type { Case } from '../types'
import type { CaseProgress } from '../types/progress'

const DIFFICULTY_BADGE: Partial<Record<Case['difficulty'], string>> = {
  rookie: 'border-green-800 text-green-400 bg-green-950/40',
  junior: 'border-sky-800 text-sky-400 bg-sky-950/40',
  senior: 'border-violet-800 text-violet-400 bg-violet-950/40',
}
const DEFAULT_DIFFICULTY_BADGE =
  'border-amber-800 text-amber-400 bg-amber-950/40'

interface CaseHeaderProps {
  currentCase: Case
  progress: CaseProgress[]
  onSelectCase: (id: string) => void
  onBack: () => void
  onOpenMobileDrawer: () => void
  onResetPanels: () => void
  onResetAll: () => void
}

export function CaseHeader({
  currentCase,
  progress,
  onSelectCase,
  onBack,
  onOpenMobileDrawer,
  onResetPanels,
  onResetAll,
}: CaseHeaderProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  return (
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
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 px-2 py-1 rounded hover:bg-slate-700/50 border border-slate-700"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Cases</span>
        </button>

        <div className="hidden sm:block w-px h-6 bg-slate-700 flex-shrink-0" />

        {/* Case Selector */}
        <div className="flex-1 min-w-0 hidden sm:block">
          <CaseSelector
            cases={cases}
            progress={progress}
            currentCaseId={currentCase.id}
            onSelect={onSelectCase}
          />
        </div>

        {/* Case name (mobile) — tappable to open case switcher */}
        <button
          className="flex-1 min-w-0 sm:hidden text-left flex items-center gap-1.5"
          onClick={onOpenMobileDrawer}
          aria-label="Switch case"
        >
          <span className="text-sm font-semibold text-slate-200 truncate">
            {currentCase.name}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        </button>

        {/* Difficulty badge (desktop) */}
        <span
          className={`hidden sm:inline text-[10px] font-bold px-2 py-1 rounded-full border flex-shrink-0 ${
            DIFFICULTY_BADGE[currentCase.difficulty] ?? DEFAULT_DIFFICULTY_BADGE
          }`}
        >
          {currentCase.difficulty.toUpperCase()}
        </span>

        {/* Reset panel sizes (desktop) */}
        <button
          onClick={onResetPanels}
          title="Reset panel sizes"
          className="hidden sm:block p-1.5 text-slate-500 hover:text-sky-400 transition-colors"
        >
          <LayoutPanelLeft className="w-3.5 h-3.5" />
        </button>

        {/* Reset (desktop) */}
        <div className="hidden sm:block">
          {showResetConfirm ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-slate-400">Reset?</span>
              <button
                onClick={() => {
                  onResetAll()
                  setShowResetConfirm(false)
                }}
                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
              >
                Yes
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-2 py-1 bg-slate-700 text-white text-xs rounded"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
