export function Footer({ onManageCookies }: { onManageCookies?: () => void }) {
  return (
    <footer className="flex-shrink-0 border-t border-slate-800 bg-slate-950 px-4 py-2 flex items-center justify-between text-[11px] text-slate-500">
      <span>
        <a
          href="https://telemetry.academy"
          className="hover:text-slate-300 transition-colors"
        >
          telemetry.academy
        </a>
        {' · '}MIT License
      </span>
      <div className="flex items-center gap-3">
        {onManageCookies && (
          <button
            type="button"
            onClick={onManageCookies}
            className="hover:text-slate-300 transition-colors"
          >
            Cookie Preferences
          </button>
        )}
        <a
          href="https://github.com/vitorvasc/telemetry-academy"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-slate-300 transition-colors"
        >
          GitHub ↗
        </a>
      </div>
    </footer>
  )
}
