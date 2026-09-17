import { datadogRum } from '@datadog/browser-rum'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Router } from 'wouter'
import './index.css'
import App from './App.tsx'

datadogRum.init({
  applicationId: import.meta.env.VITE_DD_RUM_APPLICATION_ID || '',
  clientToken: import.meta.env.VITE_DD_RUM_CLIENT_TOKEN || '',
  site: import.meta.env.VITE_DD_SITE || '',
  service: import.meta.env.VITE_DD_SERVICE || '',
  env: import.meta.env.VITE_DD_ENV || '',
  version: import.meta.env.VITE_DD_VERSION || '',
  sessionSampleRate: 100,
  sessionReplaySampleRate: 20,
  trackUserInteractions: true,
  trackResources: true,
  trackLongTasks: true,
  defaultPrivacyLevel: 'mask-user-input',
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>
)
