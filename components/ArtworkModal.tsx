"use client"

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import Image from 'next/image'

interface ArtworkModalProps {
  artworks: {
    id: number
    url: string
    title: string
    emotions: string[]
  }[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}

// Track session state across paintings
type SessionState = {
  selectedEmotions: Set<string>
  pendingChanges: Record<string, number> // emotion -> delta
}

export function ArtworkModal({
  artworks,
  currentIndex,
  onClose,
  onNavigate,
}: ArtworkModalProps) {
  const [selectedEmotions, setSelectedEmotions] = useState<Set<string>>(
    new Set(),
  )
  const [emotionCounts, setEmotionCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  
  // Track session state per painting
  const sessionStateRef = useRef<Map<number, SessionState>>(new Map())
  const previousPaintingIdRef = useRef<number | null>(null)
  const hasCheckedSubmissionRef = useRef<Map<number, boolean>>(new Map())
  const baseEmotionsRef = useRef<Map<number, Set<string>>>(new Map()) // Original submission state

  const currentPainting = artworks[currentIndex]
  const currentPaintingId = currentPainting.id

  // Fetch emotion counts from database
  const fetchEmotionCounts = useCallback(async (paintingId: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/emotions/${paintingId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch emotion counts')
      }
      const data = await response.json()
      const counts = data.counts || {}
      
      // Get the latest session state (may have been updated during fetch)
      const sessionState = sessionStateRef.current.get(paintingId)
      if (sessionState) {
        // Apply any pending session changes to the fetched counts
        Object.entries(sessionState.pendingChanges).forEach(([emotion, delta]) => {
          counts[emotion] = (counts[emotion] || 0) + delta
        })
      }
      
      // Update counts - pending changes are already applied above
      // We read sessionState right before applying, so it should have the latest changes
      setEmotionCounts(counts)
    } catch (error) {
      console.error('Error fetching emotion counts:', error)
      // Fallback to 0 for all emotions
      const fallbackCounts: Record<string, number> = {}
      artworks.find(a => a.id === paintingId)?.emotions.forEach((emotion) => {
        fallbackCounts[emotion] = 0
      })
      setEmotionCounts(fallbackCounts)
    } finally {
      setLoading(false)
    }
  }, [artworks])

  // Check if user has already submitted for this painting
  const checkSubmission = useCallback(async (paintingId: number) => {
    if (hasCheckedSubmissionRef.current.get(paintingId)) {
      return
    }

    try {
      const response = await fetch(`/api/emotions/${paintingId}/submission`)
      if (!response.ok) {
        return
      }
      const data = await response.json() as { hasSubmitted: boolean; previousEmotions?: string[] }
      hasCheckedSubmissionRef.current.set(paintingId, true)

      if (data.hasSubmitted && data.previousEmotions) {
        // Restore previous selections
        const previousSet = new Set<string>(data.previousEmotions)
        baseEmotionsRef.current.set(paintingId, new Set<string>(previousSet))
        
        // Restore session state, preserving any existing pending changes and current selections
        const existingState = sessionStateRef.current.get(paintingId)
        // Merge previous emotions with any currently selected emotions (from current session)
        const mergedSelections = new Set<string>(previousSet)
        if (existingState?.selectedEmotions) {
          existingState.selectedEmotions.forEach(emotion => mergedSelections.add(emotion))
        }
        
        const sessionState: SessionState = {
          selectedEmotions: mergedSelections,
          pendingChanges: existingState?.pendingChanges || {}
        }
        sessionStateRef.current.set(paintingId, sessionState)
        
        // Update UI state with merged selections
        setSelectedEmotions(mergedSelections)
        
        // Note: pending changes are already applied by fetchEmotionCounts, so no need to re-apply here
      } else {
        // No previous submission, start fresh
        baseEmotionsRef.current.set(paintingId, new Set())
        const existingState = sessionStateRef.current.get(paintingId)
        // Preserve any current selections from this session
        const currentSelections = existingState?.selectedEmotions || new Set<string>()
        const sessionState: SessionState = {
          selectedEmotions: currentSelections,
          pendingChanges: existingState?.pendingChanges || {}
        }
        sessionStateRef.current.set(paintingId, sessionState)
        setSelectedEmotions(currentSelections)
        
        // Note: pending changes are already applied by fetchEmotionCounts, so no need to re-apply here
      }
    } catch (error) {
      console.error('Error checking submission:', error)
    }
  }, [])

  // Save current painting's state before navigating
  const saveCurrentState = useCallback(async (paintingId: number) => {
    const sessionState = sessionStateRef.current.get(paintingId)
    if (!sessionState) {
      return
    }

    const baseEmotions = baseEmotionsRef.current.get(paintingId) || new Set()
    const currentEmotions = new Set(selectedEmotions)
    const selectedArray = Array.from(selectedEmotions)

    // Calculate net deltas from base state
    const allEmotions = new Set([...baseEmotions, ...currentEmotions])
    const deltas: Record<string, number> = {}

    for (const emotion of allEmotions) {
      const wasSelected = baseEmotions.has(emotion)
      const isSelected = currentEmotions.has(emotion)
      
      if (wasSelected && !isSelected) {
        deltas[emotion] = -1
      } else if (!wasSelected && isSelected) {
        deltas[emotion] = 1
      }
    }

    // Only save if there are changes or if this is a new submission
    const hasChanges = Object.keys(deltas).length > 0 || baseEmotions.size === 0

    if (hasChanges) {
      // Save submission
      try {
        await fetch(`/api/emotions/${paintingId}/submission`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            selectedEmotions: selectedArray,
          }),
        })
      } catch (error) {
        console.error('Error saving submission:', error)
      }

      // Update emotion counts in database
      for (const [emotion, delta] of Object.entries(deltas)) {
        if (delta !== 0) {
          try {
            await fetch(`/api/emotions/${paintingId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                emotion,
                delta,
                ipAddress: 'client', // IP will be extracted server-side
              }),
            })
          } catch (error) {
            console.error(`Error updating ${emotion} count:`, error)
          }
        }
      }

      // Update base emotions to current state
      baseEmotionsRef.current.set(paintingId, new Set(selectedEmotions))
      
      // Clear pending changes since they've been saved to the database
      sessionState.pendingChanges = {}
      sessionStateRef.current.set(paintingId, sessionState)
    }
  }, [selectedEmotions])

  // Load state when painting changes
  useEffect(() => {
    // Save previous painting's state
    if (previousPaintingIdRef.current !== null && previousPaintingIdRef.current !== currentPaintingId) {
      saveCurrentState(previousPaintingIdRef.current)
    }

    // Load new painting's state
    previousPaintingIdRef.current = currentPaintingId
    
    // Fetch emotion counts
    fetchEmotionCounts(currentPaintingId)
    
    // Check for previous submission
    checkSubmission(currentPaintingId)

    // Restore session state if exists (from this session)
    // Note: This will be called after fetchEmotionCounts completes
    const sessionState = sessionStateRef.current.get(currentPaintingId)
    if (!sessionState) {
      // Initialize session state if it doesn't exist
      sessionStateRef.current.set(currentPaintingId, {
        selectedEmotions: new Set(),
        pendingChanges: {}
      })
    }
  }, [currentPaintingId, fetchEmotionCounts, checkSubmission, saveCurrentState])

  const handlePrevious = useCallback(async () => {
    // Save current state before navigating
    await saveCurrentState(currentPaintingId)
    
    const newIndex = currentIndex === 0 ? artworks.length - 1 : currentIndex - 1
    onNavigate(newIndex)
  }, [currentIndex, currentPaintingId, artworks.length, onNavigate, saveCurrentState])

  const handleNext = useCallback(async () => {
    // Save current state before navigating
    await saveCurrentState(currentPaintingId)
    
    const newIndex = currentIndex === artworks.length - 1 ? 0 : currentIndex + 1
    onNavigate(newIndex)
  }, [currentIndex, currentPaintingId, artworks.length, onNavigate, saveCurrentState])

  const handleEmotionClick = useCallback((emotion: string) => {
    const newSelected = new Set(selectedEmotions)
    const sessionState = sessionStateRef.current.get(currentPaintingId) || {
      selectedEmotions: new Set(),
      pendingChanges: {}
    }

    let delta = 0
    if (newSelected.has(emotion)) {
      // Unselect - decrease count by 1
      newSelected.delete(emotion)
      delta = -1
    } else {
      // Select - increase count by 1
      newSelected.add(emotion)
      delta = 1
    }

    // Update session state
    sessionState.selectedEmotions = newSelected
    // Track pending changes so fetchEmotionCounts can apply them
    sessionState.pendingChanges[emotion] = (sessionState.pendingChanges[emotion] || 0) + delta
    sessionStateRef.current.set(currentPaintingId, sessionState)

    // Update local counts for display
    setSelectedEmotions(newSelected)
    setEmotionCounts((prev) => {
      const newCounts = { ...prev }
      newCounts[emotion] = Math.max(0, (newCounts[emotion] || 0) + delta)
      return newCounts
    })
  }, [selectedEmotions, currentPaintingId])

  useEffect(() => {
    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') handlePrevious()
      if (e.key === 'ArrowRight') handleNext()
    }

    window.addEventListener('keydown', handleKeyDownGlobal)
    return () => window.removeEventListener('keydown', handleKeyDownGlobal)
  }, [handlePrevious, handleNext, onClose])

  // Save state when modal closes
  useEffect(() => {
    return () => {
      if (previousPaintingIdRef.current !== null) {
        saveCurrentState(previousPaintingIdRef.current)
      }
    }
  }, [saveCurrentState])

  return (
    <div className="fixed inset-0 bg-[#f8f8f6] bg-opacity-95 z-50 flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 hover:bg-gray-200 rounded-full transition-colors z-10"
        aria-label="Close modal"
      >
        <XIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700" />
      </button>

      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        className="absolute left-2 sm:left-6 p-2 sm:p-3 hover:bg-gray-200 rounded-full transition-colors z-10"
        aria-label="Previous artwork"
      >
        <ChevronLeftIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-700" />
      </button>

      {/* Artwork Image - Maximized */}
      <div className="w-full h-full flex items-center justify-center px-2 sm:px-4 pt-4 sm:pt-6 pb-24 sm:pb-28">
        <div className="relative w-full h-full max-w-full max-h-full">
          <Image
            src={artworks[currentIndex].url}
            alt={`Artwork ${artworks[currentIndex].id}`}
            fill
            className="object-contain"
            sizes="100vw"
          />
        </div>
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        className="absolute right-2 sm:right-6 p-2 sm:p-3 hover:bg-gray-200 rounded-full transition-colors z-10"
        aria-label="Next artwork"
      >
        <ChevronRightIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-700" />
      </button>

      {/* Emotions Section */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4">
        <div className="flex flex-col items-center gap-3">
          <p
            className="text-gray-600 text-sm"
          >
            What emotions do you feel?
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {artworks[currentIndex].emotions.map((emotion, index) => {
              const isSelected = selectedEmotions.has(emotion)
              const count = emotionCounts[emotion] || 0
              return (
                <button
                  key={index}
                  onClick={() => handleEmotionClick(emotion)}
                  className={`relative px-4 py-1.5 rounded-full text-sm transition-all ${isSelected ? 'bg-[#7a9b7a] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {emotion}
                  {count > 0 && (
                    <span
                      className={`absolute -top-1 -right-1 text-white text-xs font-normal rounded-full w-5 h-5 flex items-center justify-center transition-all font-['Inter',sans-serif] ${isSelected ? 'bg-[#1d331d]' : 'bg-gray-600'}`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
