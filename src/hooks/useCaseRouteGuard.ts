import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { resolveGuardedCase } from '../lib/routeGuard'
import type { CaseProgress } from '../types/progress'

/**
 * Redirects away from a locked case route once persisted progress is loaded.
 * Waiting for `isLoaded` keeps returning users on cases they already unlocked.
 */
export function useCaseRouteGuard(
  isLoaded: boolean,
  progress: CaseProgress[],
  requestedId: string | undefined
): void {
  const [, setLocation] = useLocation()
  useEffect(() => {
    if (!isLoaded || !requestedId) return
    const allowed = resolveGuardedCase(progress, requestedId)
    if (allowed !== requestedId) {
      setLocation(allowed ? `/case/${allowed}` : '/', { replace: true })
    }
  }, [isLoaded, progress, requestedId, setLocation])
}
