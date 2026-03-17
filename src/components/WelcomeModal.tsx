import React from 'react'
import { X, FlaskConical, Search, Trophy } from 'lucide-react'

interface WelcomeModalProps {
  onClose: () => void
}

const STEPS = [
  {
    icon: FlaskConical,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/30',
    title: 'Instrument',
    body: 'Add OpenTelemetry spans to blind systems. Your code runs live in the browser — no setup required.',
  },
  {
    icon: Search,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    title: 'Investigate',
    body: 'Use the traces and logs your instrumentation generates to diagnose a realistic incident.',
  },
  {
    icon: Trophy,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/30',
    title: 'Solve',
    body: 'Identify the root cause and earn stars. Each case teaches a real OTel skill used in production.',
  },
]

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        className="absolute inset-0 w-full h-full bg-black/80 cursor-default"
        onClick={onClose}
        aria-label="Close welcome"
      />

      {/* Modal card */}
      <div className="relative z-10 bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div>
            <div className="text-base font-bold text-white">
              Welcome to Telemetry Academy
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Learn OpenTelemetry by doing
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="px-5 py-5 space-y-3">
          {STEPS.map(({ icon: Icon, color, bg, title, body }, i) => (
            <div
              key={title}
              className={`flex gap-3 p-3 rounded-xl border ${bg}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}
              >
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-slate-500">
                    {String(i + 1)}
                  </span>
                  <span className={`text-sm font-semibold ${color}`}>
                    {title}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-violet-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity active:scale-[0.99]"
          >
            Start Investigating
          </button>
        </div>
      </div>
    </div>
  )
}
