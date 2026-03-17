import React from 'react'
import type { Case } from '../types'
import type { CaseProgress } from '../types/progress'
import { X, Lock, CheckCircle2 } from 'lucide-react'

interface MobileCaseDrawerProps {
  cases: Case[]
  progress: CaseProgress[]
  currentCaseId: string
  onSelect: (id: string) => void
  onClose: () => void
}

export const MobileCaseDrawer: React.FC<MobileCaseDrawerProps> = ({
  cases,
  progress,
  currentCaseId,
  onSelect,
  onClose,
}) => {
  const getProgress = (id: string) => progress.find(p => p.caseId === id)

  const handleSelect = (id: string) => {
    onSelect(id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-label="Close case switcher"
      />
      {/* Sheet */}
      <div className="relative bg-slate-900 border-t border-slate-700 rounded-t-2xl pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-700">
          <span className="text-sm font-semibold text-slate-200">
            Switch Case
          </span>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Case list */}
        <ul className="py-2">
          {cases.map((c, idx) => {
            const prog = getProgress(c.id)
            const isLocked = prog?.status === 'locked'
            const isSolved = prog?.status === 'solved'
            const isCurrent = c.id === currentCaseId

            return (
              <li key={c.id}>
                <button
                  disabled={isLocked}
                  onClick={() => !isLocked && handleSelect(c.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isCurrent
                      ? 'bg-slate-800'
                      : isLocked
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-slate-800'
                  }`}
                >
                  {/* Status icon */}
                  {isSolved ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : isLocked ? (
                    <Lock className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  ) : (
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${isCurrent ? 'border-sky-400' : 'border-slate-500'}`}
                    />
                  )}
                  {/* Case info */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-medium truncate ${isCurrent ? 'text-white' : isLocked ? 'text-slate-600' : 'text-slate-300'}`}
                    >
                      <span className="text-slate-500 mr-1">#{idx + 1}</span>
                      {c.name}
                    </div>
                    <div className="text-xs text-slate-500 capitalize">
                      {c.difficulty}
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="text-xs text-sky-400 font-medium flex-shrink-0">
                      Current
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
