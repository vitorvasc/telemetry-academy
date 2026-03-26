/**
 * Lightweight GA4 event tracker.
 *
 * Calls window.gtag only when available (i.e. when VITE_GA_MEASUREMENT_ID is set
 * and the gtag script has loaded) AND the user has accepted cookie consent.
 * No-ops silently in dev, when blocked, or when consent was not granted.
 *
 * Note: GA4 Consent Mode already gates data collection server-side, so this
 * check is a client-side belt-and-suspenders guard.
 */
import { CONSENT_STORAGE_KEY } from '../lib/cookieConsent'

let cachedConsent: boolean | null = null

function hasAnalyticsConsent(): boolean {
  if (cachedConsent !== null) return cachedConsent
  try {
    cachedConsent = localStorage.getItem(CONSENT_STORAGE_KEY) === 'accepted'
  } catch {
    cachedConsent = false
  }
  return cachedConsent
}

// Invalidate cache when consent changes in the current tab or another tab.
// Symbol key prevents duplicate listeners when Vite HMR reloads this module.
const HMR_GUARD = Symbol.for('ta-consent-storage-listener')
const g = globalThis as unknown as Record<symbol, boolean>
if (typeof window !== 'undefined' && !g[HMR_GUARD]) {
  g[HMR_GUARD] = true
  window.addEventListener('storage', e => {
    if (e.key === CONSENT_STORAGE_KEY || e.key === null) cachedConsent = null
  })
}

export function invalidateConsentCache() {
  cachedConsent = null
}

export function useAnalytics() {
  const trackEvent = (name: string, params?: Record<string, unknown>) => {
    if (typeof window.gtag === 'function' && hasAnalyticsConsent()) {
      window.gtag('event', name, params)
    }
  }

  return { trackEvent }
}
