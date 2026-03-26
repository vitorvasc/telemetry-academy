/**
 * Lightweight GA4 event tracker.
 *
 * Calls window.gtag only when available (i.e. when VITE_GA_MEASUREMENT_ID is set
 * and the gtag script has loaded). No-ops silently in dev or when blocked.
 */
export function useAnalytics() {
  const trackEvent = (name: string, params?: Record<string, unknown>) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params)
    }
  }

  return { trackEvent }
}
