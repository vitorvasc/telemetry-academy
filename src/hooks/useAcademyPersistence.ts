import { useState, useEffect, useRef, useCallback } from 'react';
import type { CaseProgress } from '../types/progress';

const STORAGE_KEY = 'telemetry-academy';
const SCHEMA_VERSION = 1;

export interface PersistedState {
  version: number;
  progress: CaseProgress[];
  caseCode: Record<string, string>; // caseId -> code
  attemptHistory: Record<string, Record<string, number>>; // caseId -> rule -> attempts
  timestamp: number;
}

interface UseAcademyPersistenceReturn {
  progress: CaseProgress[];
  setProgress: React.Dispatch<React.SetStateAction<CaseProgress[]>>;
  caseCode: Record<string, string>;
  setCaseCode: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  attemptHistory: Record<string, Record<string, number>>;
  updateAttemptHistory: (caseId: string, ruleDescription: string) => void;
  getAttemptCount: (caseId: string, ruleDescription: string) => number;
  getSavedCode: (caseId: string) => string | undefined;
  saveCode: (caseId: string, code: string) => void;
  resetAll: () => void;
  isLoaded: boolean;
}

export function useAcademyPersistence(
  initialProgress: CaseProgress[]
): UseAcademyPersistenceReturn {
  // State for persisted data
  const [progress, setProgress] = useState<CaseProgress[]>(initialProgress);
  const [caseCode, setCaseCode] = useState<Record<string, string>>({});
  const [attemptHistory, setAttemptHistory] = useState<Record<string, Record<string, number>>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Ref for debounce timer
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoaded(true);
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: PersistedState = JSON.parse(stored);

        // Check version for schema migration
        if (parsed.version === SCHEMA_VERSION) {
          setProgress(parsed.progress || initialProgress);
          setCaseCode(parsed.caseCode || {});
          setAttemptHistory(parsed.attemptHistory || {});
        } else {
          // Version mismatch - clear and use initial values
          console.warn(`Schema version mismatch: stored=${parsed.version}, expected=${SCHEMA_VERSION}. Clearing localStorage.`);
          localStorage.removeItem(STORAGE_KEY);
          setProgress(initialProgress);
          setCaseCode({});
          setAttemptHistory({});
        }
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      // On error, use initial values
      setProgress(initialProgress);
      setCaseCode({});
      setAttemptHistory({});
    }

    setIsLoaded(true);
  }, [initialProgress]);

  // Auto-save to localStorage with debounce
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      const state: PersistedState = {
        version: SCHEMA_VERSION,
        progress,
        caseCode,
        attemptHistory,
        timestamp: Date.now(),
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        // Handle quota exceeded error
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded. Progress not saved.');
        } else {
          console.error('Failed to save to localStorage:', error);
        }
      }
    }, 300); // 300ms debounce

    // Cleanup timeout on unmount or state change
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [progress, caseCode, attemptHistory, isLoaded]);

  // Update attempt count for a specific case and rule
  const updateAttemptHistory = useCallback((caseId: string, ruleDescription: string) => {
    setAttemptHistory(prev => ({
      ...prev,
      [caseId]: {
        ...prev[caseId],
        [ruleDescription]: (prev[caseId]?.[ruleDescription] || 0) + 1,
      },
    }));
  }, []);

  // Get attempt count for a specific case and rule
  const getAttemptCount = useCallback((caseId: string, ruleDescription: string): number => {
    return attemptHistory[caseId]?.[ruleDescription] || 0;
  }, [attemptHistory]);

  // Get saved code for a specific case
  const getSavedCode = useCallback((caseId: string): string | undefined => {
    return caseCode[caseId];
  }, [caseCode]);

  // Save code for a specific case
  const saveCode = useCallback((caseId: string, code: string) => {
    setCaseCode(prev => ({
      ...prev,
      [caseId]: code,
    }));
  }, []);

  // Reset all progress - clears localStorage and resets state
  const resetAll = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setProgress(initialProgress);
    setCaseCode({});
    setAttemptHistory({});
  }, [initialProgress]);

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
  };
}
