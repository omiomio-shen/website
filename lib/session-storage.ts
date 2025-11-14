// Session storage utilities for emotion selection persistence

const SESSION_STORAGE_KEY = 'emotion_selection_session'

export type SessionState = {
  sessionId: string
  paintings: {
    [paintingId: number]: {
      selectedEmotions: string[]
      baseEmotions: string[] // Original state when session started
    }
  }
}

/**
 * Get or create a unique session ID
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  const existing = sessionStorage.getItem('emotion_session_id')
  if (existing) {
    return existing
  }

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  sessionStorage.setItem('emotion_session_id', sessionId)
  return sessionId
}

/**
 * Get session state from sessionStorage
 */
export function getSessionState(): SessionState | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!stored) {
      return null
    }
    return JSON.parse(stored) as SessionState
  } catch (error) {
    console.error('Error reading session state:', error)
    return null
  }
}

/**
 * Save session state to sessionStorage
 */
export function saveSessionState(state: SessionState): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Error saving session state:', error)
  }
}

/**
 * Initialize a new session state
 */
export function initializeSessionState(): SessionState {
  return {
    sessionId: getOrCreateSessionId(),
    paintings: {},
  }
}

/**
 * Get or initialize session state
 */
export function getOrInitializeSessionState(): SessionState {
  const existing = getSessionState()
  if (existing) {
    return existing
  }
  return initializeSessionState()
}

/**
 * Update painting state in session
 */
export function updatePaintingState(
  paintingId: number,
  selectedEmotions: string[],
  baseEmotions?: string[]
): void {
  const state = getOrInitializeSessionState()
  
  if (!state.paintings[paintingId]) {
    state.paintings[paintingId] = {
      selectedEmotions: [],
      baseEmotions: baseEmotions || [],
    }
  } else {
    // Preserve existing baseEmotions if not provided
    if (baseEmotions === undefined) {
      baseEmotions = state.paintings[paintingId].baseEmotions
    }
  }

  state.paintings[paintingId].selectedEmotions = selectedEmotions
  if (baseEmotions !== undefined) {
    state.paintings[paintingId].baseEmotions = baseEmotions
  }

  saveSessionState(state)
}

/**
 * Get painting state from session
 */
export function getPaintingState(paintingId: number): {
  selectedEmotions: string[]
  baseEmotions: string[]
} | null {
  const state = getSessionState()
  if (!state || !state.paintings[paintingId]) {
    return null
  }
  return state.paintings[paintingId]
}

/**
 * Clear session state (called on session end)
 */
export function clearSessionState(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    sessionStorage.removeItem('emotion_session_id')
  } catch (error) {
    console.error('Error clearing session state:', error)
  }
}

/**
 * Get all paintings with changes in the session
 */
export function getAllSessionPaintings(): SessionState['paintings'] {
  const state = getSessionState()
  return state?.paintings || {}
}

