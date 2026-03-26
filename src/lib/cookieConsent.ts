let openBanner: (() => void) | null = null

export function registerBannerOpener(fn: (() => void) | null) {
  openBanner = fn
}

export function reopenCookieConsent() {
  openBanner?.()
}
