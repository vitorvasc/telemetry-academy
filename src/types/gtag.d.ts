interface GtagEventParams {
  [key: string]: unknown
}

interface GtagConsentParams {
  analytics_storage?: 'granted' | 'denied'
  ad_storage?: 'denied'
  ad_user_data?: 'denied'
  ad_personalization?: 'denied'
  [key: string]: unknown
}

interface Window {
  gtag?: {
    (
      command: 'config' | 'event' | 'js' | 'set',
      targetOrName: string | Date,
      params?: GtagEventParams
    ): void
    (
      command: 'consent',
      action: 'default' | 'update',
      params: GtagConsentParams
    ): void
  }
  dataLayer?: unknown[]
}
