import type { Language } from '../hooks/useCodeRunner'
import { PythonIcon, JavaScriptIcon } from './LanguageIcon'

interface LanguageBarProps {
  languages?: Language[]
  active: Language
  onSwitch: (lang: Language) => void
}

export function LanguageBar({
  languages = ['python'],
  active,
  onSwitch,
}: LanguageBarProps) {
  if (languages.length < 2) return null

  return (
    <div
      className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 border-b border-slate-700 bg-slate-900/50"
      role="tablist"
      aria-label="Language"
    >
      <span
        className="text-[10px] uppercase tracking-widest text-slate-500 mr-1"
        aria-hidden="true"
      >
        Lang
      </span>
      {languages.map(lang => (
        <button
          key={lang}
          role="tab"
          aria-selected={active === lang}
          onClick={() => onSwitch(lang)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            active === lang
              ? 'bg-slate-700 text-slate-100'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {lang === 'python' ? (
            <>
              <PythonIcon />
              <span>Python</span>
            </>
          ) : (
            <>
              <JavaScriptIcon />
              <span>JavaScript</span>
            </>
          )}
        </button>
      ))}
    </div>
  )
}
