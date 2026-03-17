import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAcademyPersistence } from '../useAcademyPersistence'
import type { CaseProgress } from '../../types/progress'

// ============================================================================
// Helpers
// ============================================================================

const STORAGE_KEY = 'telemetry-academy'
const SCHEMA_VERSION = 2

const makeProgress = (
  caseId: string,
  status: CaseProgress['status'] = 'available'
): CaseProgress => ({
  caseId,
  status,
  phase: 'instrumentation',
  attempts: 0,
})

const initialProgress: CaseProgress[] = [
  makeProgress('001-hello-span', 'available'),
  makeProgress('002-auto-magic', 'locked'),
]

function seedLocalStorage(overrides: Record<string, unknown> = {}) {
  const state = {
    version: SCHEMA_VERSION,
    progress: initialProgress,
    caseCode: { '001-hello-span': 'print("hello")' },
    attemptHistory: { '001-hello-span': { 'must create span': 2 } },
    hasSeenWelcome: true,
    timestamp: Date.now(),
    ...overrides,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// ============================================================================
// Setup / Teardown
// ============================================================================

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

// ============================================================================
// Basic save/load round-trip
// ============================================================================

describe('useAcademyPersistence — load from localStorage', () => {
  it('loads seeded progress from localStorage', async () => {
    seedLocalStorage()
    const { result } = renderHook(() => useAcademyPersistence(initialProgress))

    // Wait for the useEffect to run and mark isLoaded=true
    await act(async () => {})

    expect(result.current.isLoaded).toBe(true)
    expect(result.current.progress).toEqual(initialProgress)
  })

  it('loads seeded caseCode from localStorage', async () => {
    seedLocalStorage()
    const { result } = renderHook(() => useAcademyPersistence(initialProgress))
    await act(async () => {})

    expect(result.current.getSavedCode('001-hello-span')).toBe('print("hello")')
  })

  it('loads seeded attemptHistory from localStorage', async () => {
    seedLocalStorage()
    const { result } = renderHook(() => useAcademyPersistence(initialProgress))
    await act(async () => {})

    expect(
      result.current.getAttemptCount('001-hello-span', 'must create span')
    ).toBe(2)
  })

  it('loads hasSeenWelcome from localStorage', async () => {
    seedLocalStorage({ hasSeenWelcome: true })
    const { result } = renderHook(() => useAcademyPersistence(initialProgress))
    await act(async () => {})

    expect(result.current.hasSeenWelcome).toBe(true)
  })

  it('uses initial values when localStorage is empty', async () => {
    const { result } = renderHook(() => useAcademyPersistence(initialProgress))
    await act(async () => {})

    expect(result.current.isLoaded).toBe(true)
    expect(result.current.progress).toEqual(initialProgress)
    expect(result.current.hasSeenWelcome).toBe(false)
  })
})

// ============================================================================
// Schema migration — version mismatch
// ============================================================================

describe('useAcademyPersistence — schema migration', () => {
  it('clears localStorage and uses initial values when version mismatches', async () => {
    seedLocalStorage({ version: 1 }) // old schema version
    const { result } = renderHook(() => useAcademyPersistence(initialProgress))
    await act(async () => {})

    expect(result.current.isLoaded).toBe(true)
    // After migration, code should be cleared
    expect(result.current.getSavedCode('001-hello-span')).toBeUndefined()
    // localStorage key should be removed
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('does not wipe data when version matches', async () => {
    seedLocalStorage({ version: SCHEMA_VERSION })
    const { result } = renderHook(() => useAcademyPersistence(initialProgress))
    await act(async () => {})

    expect(result.current.getSavedCode('001-hello-span')).toBe('print("hello")')
  })
})

// ============================================================================
// State mutations
// ============================================================================

describe('useAcademyPersistence — saveCode', () => {
  it('saves code for a case', async () => {
    const { result } = renderHook(() => useAcademyPersistence(initialProgress))
    await act(async () => {})

    act(() => {
      result.current.saveCode(
        '001-hello-span',
        'with tracer.start_as_current_span("process_order"):'
      )
    })

    expect(result.current.getSavedCode('001-hello-span')).toBe(
      'with tracer.start_as_current_span("process_order"):'
    )
  })

  it('preserves other case codes when saving for one case', async () => {
    seedLocalStorage()
    const { result } = renderHook(() => useAcademyPersistence(initialProgress))
    await act(async () => {})

    act(() => {
      result.current.saveCode('002-auto-magic', 'new code for case 2')
    })

    expect(result.current.getSavedCode('001-hello-span')).toBe('print("hello")')
    expect(result.current.getSavedCode('002-auto-magic')).toBe(
      'new code for case 2'
    )
  })
})

describe('useAcademyPersistence — updateAttemptHistory', () => {
  it('increments attempt count for a rule', async () => {
    const { result } = renderHook(() => useAcademyPersistence(initialProgress))
    await act(async () => {})

    act(() => {
      result.current.updateAttemptHistory('001-hello-span', 'must create span')
    })

    expect(
      result.current.getAttemptCount('001-hello-span', 'must create span')
    ).toBe(1)
  })

  it('increments correctly when called multiple times', async () => {
    const { result } = renderHook(() => useAcademyPersistence(initialProgress))
    await act(async () => {})

    act(() =>
      result.current.updateAttemptHistory('001-hello-span', 'must create span')
    )
    act(() =>
      result.current.updateAttemptHistory('001-hello-span', 'must create span')
    )
    act(() =>
      result.current.updateAttemptHistory('001-hello-span', 'must create span')
    )

    expect(
      result.current.getAttemptCount('001-hello-span', 'must create span')
    ).toBe(3)
  })

  it('tracks counts independently per rule and case', async () => {
    const { result } = renderHook(() => useAcademyPersistence(initialProgress))
    await act(async () => {})

    act(() => result.current.updateAttemptHistory('001-hello-span', 'rule-A'))
    act(() => result.current.updateAttemptHistory('001-hello-span', 'rule-A'))
    act(() => result.current.updateAttemptHistory('002-auto-magic', 'rule-A'))

    expect(result.current.getAttemptCount('001-hello-span', 'rule-A')).toBe(2)
    expect(result.current.getAttemptCount('002-auto-magic', 'rule-A')).toBe(1)
  })

  it('returns 0 for rules not yet attempted', async () => {
    const { result } = renderHook(() => useAcademyPersistence(initialProgress))
    await act(async () => {})

    expect(
      result.current.getAttemptCount('001-hello-span', 'never-seen-rule')
    ).toBe(0)
  })
})

describe('useAcademyPersistence — markWelcomeSeen', () => {
  it('sets hasSeenWelcome to true', async () => {
    const { result } = renderHook(() => useAcademyPersistence(initialProgress))
    await act(async () => {})

    expect(result.current.hasSeenWelcome).toBe(false)
    act(() => result.current.markWelcomeSeen())
    expect(result.current.hasSeenWelcome).toBe(true)
  })
})

// ============================================================================
// resetAll
// ============================================================================

describe('useAcademyPersistence — resetAll', () => {
  it('clears all state back to initial values', async () => {
    seedLocalStorage()
    const { result } = renderHook(() => useAcademyPersistence(initialProgress))
    await act(async () => {})

    // Confirm data was loaded
    expect(result.current.getSavedCode('001-hello-span')).toBe('print("hello")')

    act(() => result.current.resetAll())

    expect(result.current.getSavedCode('001-hello-span')).toBeUndefined()
    expect(
      result.current.getAttemptCount('001-hello-span', 'must create span')
    ).toBe(0)
    expect(result.current.hasSeenWelcome).toBe(false)
    expect(result.current.progress).toEqual(initialProgress)
  })

  it('removes the localStorage key on resetAll', async () => {
    seedLocalStorage()
    const { result } = renderHook(() => useAcademyPersistence(initialProgress))
    await act(async () => {})

    act(() => result.current.resetAll())
    // After reset, the key should be removed
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})

// ============================================================================
// Data loss prevention — bad localStorage data
// ============================================================================

describe('useAcademyPersistence — bad localStorage data', () => {
  it('handles malformed JSON gracefully (does not throw)', async () => {
    localStorage.setItem(STORAGE_KEY, '{ this is not valid json }}}')
    const { result } = renderHook(() => useAcademyPersistence(initialProgress))
    await act(async () => {})

    // Should fall back to initial values, not throw
    expect(result.current.isLoaded).toBe(true)
    expect(result.current.progress).toEqual(initialProgress)
  })

  it('uses initial progress when caseCode field is missing in stored state', async () => {
    const incompleteState = {
      version: SCHEMA_VERSION,
      progress: initialProgress,
      // caseCode missing
      attemptHistory: {},
      hasSeenWelcome: false,
      timestamp: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(incompleteState))
    const { result } = renderHook(() => useAcademyPersistence(initialProgress))
    await act(async () => {})

    expect(result.current.getSavedCode('001-hello-span')).toBeUndefined()
    expect(result.current.isLoaded).toBe(true)
  })
})

// ============================================================================
// Auto-save to localStorage
// ============================================================================

describe('useAcademyPersistence — auto-save', () => {
  it('saves updated code to localStorage after debounce', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useAcademyPersistence(initialProgress))
    await act(async () => {})

    act(() => {
      result.current.saveCode('001-hello-span', 'saved-code')
    })

    // Advance past the 300ms debounce
    await act(async () => {
      vi.advanceTimersByTime(400)
    })

    const stored = localStorage.getItem(STORAGE_KEY)
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!)
    expect(parsed.caseCode['001-hello-span']).toBe('saved-code')
    expect(parsed.version).toBe(SCHEMA_VERSION)

    vi.useRealTimers()
  })
})
