/**
 * Format a span duration (in milliseconds) for display in trace/investigation views.
 *
 * Rules:
 * - Under 1000ms: show as "Xms" (no rounding — preserves precision from OTel nanosecond source)
 * - 1000ms or more: show as "X.XXs"
 *
 * Used by: TraceViewer, ReviewModal, rootCauseEngine
 */
export function formatSpanMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
  return `${ms}ms`
}

/**
 * Format a wall-clock elapsed duration (in milliseconds) for user-facing score display.
 *
 * Rules:
 * - Under 60 seconds: show as "Xs"
 * - 60 seconds or more: show as "Xm Ys"
 *
 * Used by: CaseSolvedScreen (time-to-solve display)
 */
export function formatElapsedMs(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  if (m > 0) return `${m}m ${s % 60}s`
  return `${s}s`
}
