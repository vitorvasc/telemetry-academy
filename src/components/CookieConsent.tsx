import { useState, useEffect, useRef, useCallback } from 'react'

const STORAGE_KEY = 'ta-cookie-consent'
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
  const bannerRef = useRef<HTMLDivElement>(null)
  const acceptBtnRef = useRef<HTMLButtonElement>(null)

  // Focus the accept button when the banner becomes visible
  useEffect(() => {
    if (visible) {
      // Small delay so the DOM has rendered
      const timer = setTimeout(() => acceptBtnRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [visible])

  const handleAccept = useCallback(() => {
    storeConsent('accepted')
    updateGtagConsent(true)
    setVisible(false)
  }, [])

  const handleReject = useCallback(() => {
    storeConsent('rejected')
    updateGtagConsent(false)
    setVisible(false)
  }, [])

  if (!visible) return null

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-label="Cookie consent"
      aria-describedby="cookie-consent-description"
      className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6"
    >
      <div className="max-w-3xl mx-auto bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <p
            id="cookie-consent-description"
            className="text-sm text-slate-300 flex-1"
          >
            We use cookies for{' '}
            <span className="text-cyan-400 font-medium">analytics only</span>{' '}
            to understand how the platform is used and improve the learning
            experience. No personal data is sold or shared with third parties.
          </p>
          <div className="flex flex-col md:flex-row gap-2 md:gap-3 shrink-0">
            <button
              ref={acceptBtnRef}
              onClick={handleAccept}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              Accept
            </button>
            <button
              onClick={handleReject}
              className="px-5 py-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-300 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
