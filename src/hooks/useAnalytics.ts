/**
 * Lightweight GA4 event tracker.
 *
 * Calls window.gtag only when available (i.e. when VITE_GA_MEASUREMENT_ID is set
 * and the gtag script has loaded) AND the user has accepted cookie consent.
 * No-ops silently in dev, when blocked, or when consent was not granted.
 */

function hasAnalyticsConsent(): boolean {
  try {
    return localStorage.getItem('ta-cookie-consent') === 'accepted'
  } catch {
    return false
  }
}

export function useAnalytics() {
  const trackEvent = (name: string, params?: Record<string, unknown>) => {
    if (typeof window.gtag === 'function' && hasAnalyticsConsent()) {
      window.gtag('event', name, params)
    }
  }

  return { trackEvent }
}
