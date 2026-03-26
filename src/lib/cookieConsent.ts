export const CONSENT_STORAGE_KEY = 'ta-cookie-consent'

/**
 * Singleton banner opener — registered by the CookieConsent component on mount.
 * Only one CookieConsent instance should be mounted at a time; if multiple
 * mount, the last one wins.
 */
let openBanner: (() => void) | null = null

export function registerBannerOpener(fn: (() => void) | null) {
  openBanner = fn
}

export function reopenCookieConsent() {
  openBanner?.()
}
