import { useState, useEffect, useRef, useCallback } from 'react'
import { Signal } from 'lucide-react'
import { CONSENT_STORAGE_KEY, registerBannerOpener } from '../lib/cookieConsent'
import { invalidateConsentCache } from '../hooks/useAnalytics'

const STORAGE_KEY = CONSENT_STORAGE_KEY
type ConsentValue = 'accepted' | 'rejected'

function getStoredConsent(): ConsentValue | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'accepted' || value === 'rejected') return value
  } catch {
    /* localStorage unavailable */
  }
  return null
}

function storeConsent(value: ConsentValue): void {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    /* localStorage unavailable */
  }
}

function updateGtagConsent(granted: boolean): void {
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied',
    })
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(() => getStoredConsent() === null)
  const acceptBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    registerBannerOpener(() => setVisible(true))
    return () => registerBannerOpener(null)
  }, [])

  // Focus the accept button when the banner becomes visible
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => acceptBtnRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [visible])

  const handleAccept = useCallback(() => {
    storeConsent('accepted')
    invalidateConsentCache()
    updateGtagConsent(true)
    setVisible(false)
  }, [])

  const handleReject = useCallback(() => {
    storeConsent('rejected')
    invalidateConsentCache()
    updateGtagConsent(false)
    setVisible(false)
  }, [])

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-describedby="cookie-consent-description"
      className="fixed z-50 bottom-4 inset-x-4 md:inset-x-0 md:bottom-6 md:mx-auto md:max-w-lg animate-consent-in"
    >
      <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl shadow-black/20 overflow-hidden">
        {/* Cyan accent bar */}
        <div className="h-0.5 bg-gradient-to-r from-cyan-500 to-cyan-500/0" />

        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Signal
              className="size-4 text-cyan-400 shrink-0"
              aria-hidden="true"
            />
            <h2 className="text-sm font-semibold text-slate-100">
              Your privacy
            </h2>
          </div>

          {/* Body */}
          <p
            id="cookie-consent-description"
            className="text-[13px] leading-relaxed text-slate-400"
          >
            We use basic analytics to see which exercises get the most traction
            and where people get stuck. No ads, no cross-site tracking. You can
            update this anytime via{' '}
            <span className="text-slate-300">Cookie Preferences</span> in the
            footer.
          </p>

          {/* Actions */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 pt-0.5">
            <button
              ref={acceptBtnRef}
              onClick={handleAccept}
              className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              Allow analytics
            </button>
            <button
              onClick={handleReject}
              className="flex-1 px-4 py-2 border border-slate-600 hover:border-slate-500 hover:bg-slate-700/50 active:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
