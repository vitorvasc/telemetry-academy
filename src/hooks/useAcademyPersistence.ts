// Note on caseId keys in localStorage:
// Case directories were renamed from suffix-number format (e.g., hello-span-001)
// to numbered-prefix format (e.g., 001-hello-span) in the quick-001 refactor.
// Existing localStorage data keyed by old caseIds will be orphaned.
// If a migration is ever needed, increment SCHEMA_VERSION and map old keys to new ones.
import { useState, useEffect, useRef, useCallback } from 'react'
import type { CaseProgress } from '../types/progress'

const STORAGE_KEY = 'telemetry-academy'
const SCHEMA_VERSION = 3 // v3: language-aware code keys (caseId:language)

export interface PersistedState {
  version: number
  progress: CaseProgress[]
  caseCode: Record<string, string> // caseId -> code
  attemptHistory: Record<string, Record<string, number>> // caseId -> rule -> attempts
  hasSeenWelcome: boolean
  timestamp: number
}

interface UseAcademyPersistenceReturn {
  progress: CaseProgress[]
  setProgress: React.Dispatch<React.SetStateAction<CaseProgress[]>>
  caseCode: Record<string, string>
  setCaseCode: React.Dispatch<React.SetStateAction<Record<string, string>>>
  attemptHistory: Record<string, Record<string, number>>
  updateAttemptHistory: (caseId: string, ruleDescription: string) => void
  getAttemptCount: (caseId: string, ruleDescription: string) => number
  getSavedCode: (caseId: string, language: string) => string | undefined
  saveCode: (caseId: string, code: string, language: string) => void
  resetAll: () => void
  isLoaded: boolean
  hasSeenWelcome: boolean
  markWelcomeSeen: () => void
}

export function useAcademyPersistence(
  initialProgress: CaseProgress[]
): UseAcademyPersistenceReturn {
  // State for persisted data
  const [progress, setProgress] = useState<CaseProgress[]>(initialProgress)
  const [caseCode, setCaseCode] = useState<Record<string, string>>({})
  const [attemptHistory, setAttemptHistory] = useState<
    Record<string, Record<string, number>>
  >({})
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Ref for debounce timer
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoaded(true)
      return
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parsed: PersistedState = JSON.parse(stored)

        // Check version for schema migration
        if (parsed.version === SCHEMA_VERSION) {
          setProgress(parsed.progress || initialProgress)
          setCaseCode(parsed.caseCode || {})
          setAttemptHistory(parsed.attemptHistory || {})
          setHasSeenWelcome(parsed.hasSeenWelcome ?? false)
        } else if (parsed.version === 2) {
          // v2 → v3: existing code was Python-only; re-key as caseId:python
          const migratedCode: Record<string, string> = {}
          for (const [key, value] of Object.entries(parsed.caseCode || {})) {
            migratedCode[`${key}:python`] = value
          }
          setProgress(parsed.progress || initialProgress)
          setCaseCode(migratedCode)
          setAttemptHistory(parsed.attemptHistory || {})
          setHasSeenWelcome(parsed.hasSeenWelcome ?? false)
          // Auto-save will persist the migrated state with version 3
        } else {
          // Version mismatch - clear and use initial values
          // eslint-disable-next-line no-console
          console.warn(
            `Schema version mismatch: stored=${parsed.version}, expected=${SCHEMA_VERSION}. Clearing localStorage.`
          )
          localStorage.removeItem(STORAGE_KEY)
          setProgress(initialProgress)
          setCaseCode({})
          setAttemptHistory({})
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load from localStorage:', error)
      // On error, use initial values
      setProgress(initialProgress)
      setCaseCode({})
      setAttemptHistory({})
    }

    setIsLoaded(true)
  }, [initialProgress])

  // Auto-save to localStorage with debounce
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      const state: PersistedState = {
        version: SCHEMA_VERSION,
        progress,
        caseCode,
        attemptHistory,
        hasSeenWelcome,
        timestamp: Date.now(),
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch (error) {
        // Handle quota exceeded error
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          // eslint-disable-next-line no-console
          console.warn('localStorage quota exceeded. Progress not saved.')
        } else {
          // eslint-disable-next-line no-console
          console.error('Failed to save to localStorage:', error)
        }
      }
    }, 300) // 300ms debounce

    // Cleanup timeout on unmount or state change
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [progress, caseCode, attemptHistory, hasSeenWelcome, isLoaded])

  // Update attempt count for a specific case and rule
  const updateAttemptHistory = useCallback(
    (caseId: string, ruleDescription: string) => {
      setAttemptHistory(prev => ({
        ...prev,
        [caseId]: {
          ...prev[caseId],
          [ruleDescription]: (prev[caseId]?.[ruleDescription] || 0) + 1,
        },
      }))
    },
    []
  )

  // Get attempt count for a specific case and rule
  const getAttemptCount = useCallback(
    (caseId: string, ruleDescription: string): number => {
      return attemptHistory[caseId]?.[ruleDescription] || 0
    },
    [attemptHistory]
  )

  // Get saved code for a specific case (language-aware: key is caseId:language)
  const getSavedCode = useCallback(
    (caseId: string, language: string): string | undefined => {
      return caseCode[`${caseId}:${language}`]
    },
    [caseCode]
  )

  // Save code for a specific case (language-aware: key is caseId:language)
  const saveCode = useCallback(
    (caseId: string, code: string, language: string) => {
      setCaseCode(prev => ({
        ...prev,
        [`${caseId}:${language}`]: code,
      }))
    },
    []
  )

  // Reset all progress - clears localStorage and resets state
  const resetAll = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
    setProgress(initialProgress)
    setCaseCode({})
    setAttemptHistory({})
    setHasSeenWelcome(false)
  }, [initialProgress])

  // Mark welcome modal as seen
  const markWelcomeSeen = useCallback(() => {
    setHasSeenWelcome(true)
  }, [])

  return {
    progress,
    setProgress,
    caseCode,
    setCaseCode,
    attemptHistory,
    updateAttemptHistory,
    getAttemptCount,
    getSavedCode,
    saveCode,
    resetAll,
    isLoaded,
    hasSeenWelcome,
    markWelcomeSeen,
  }
}
