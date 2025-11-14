"use client"

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import Image from 'next/image'
import {
  getOrInitializeSessionState,
  updatePaintingState,
  getPaintingState,
  getAllSessionPaintings,
  clearSessionState,
} from '@/lib/session-storage'

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
  
  const previousPaintingIdRef = useRef<number | null>(null)
  const baseEmotionsRef = useRef<Map<number, Set<string>>>(new Map()) // Original state when session started
  const hasInitializedRef = useRef(false)
  const sessionEndHandlerRegisteredRef = useRef(false)

  const currentPainting = artworks[currentIndex]
  const currentPaintingId = currentPainting.id

  // Save all session changes to database (called on session end)
  const saveSessionToDatabase = useCallback(async () => {
    const sessionPaintings = getAllSessionPaintings()
    
    for (const [paintingIdStr, paintingState] of Object.entries(sessionPaintings)) {
      const paintingId = parseInt(paintingIdStr)
      if (isNaN(paintingId)) continue

      const baseEmotions = baseEmotionsRef.current.get(paintingId) || new Set<string>()
      const currentEmotions = new Set(paintingState.selectedEmotions)
      const selectedArray = Array.from(currentEmotions)

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

      // Only save if there are changes
      const hasChanges = Object.keys(deltas).length > 0

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
      }
    }

    // Clear session state after saving
    clearSessionState()
  }, [])

  // Register session end handler (beforeunload and visibilitychange)
  useEffect(() => {
    if (sessionEndHandlerRegisteredRef.current) {
      return
    }
    sessionEndHandlerRegisteredRef.current = true

    let isSaving = false

    const handleSessionEnd = async () => {
      if (isSaving) {
        return // Prevent duplicate saves
      }
      isSaving = true
      
      try {
        await saveSessionToDatabase()
      } catch (error) {
        console.error('Error saving session on end:', error)
      } finally {
        isSaving = false
      }
    }

    // Save when page is about to unload
    const handleBeforeUnload = () => {
      // Use synchronous approach - fire and forget
      handleSessionEnd()
    }

    // Save when tab becomes hidden (backup for mobile/background tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleSessionEnd()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [saveSessionToDatabase])

  // Initialize session on mount
  useEffect(() => {
    if (hasInitializedRef.current) {
      return
    }
    hasInitializedRef.current = true

    const initializeSession = async () => {
      // Initialize session state
      getOrInitializeSessionState()

      // Load base emotions for all paintings from database
      for (const artwork of artworks) {
        try {
          const response = await fetch(`/api/emotions/${artwork.id}/submission`, {
            cache: 'no-store',
          })
          if (response.ok) {
            const data = await response.json() as { hasSubmitted: boolean; previousEmotions?: string[] }
            if (data.hasSubmitted && data.previousEmotions) {
              baseEmotionsRef.current.set(artwork.id, new Set(data.previousEmotions))
              // Initialize session state with base emotions
              updatePaintingState(artwork.id, data.previousEmotions, data.previousEmotions)
            } else {
              baseEmotionsRef.current.set(artwork.id, new Set())
              updatePaintingState(artwork.id, [], [])
            }
          }
        } catch (error) {
          console.error(`Error loading base emotions for painting ${artwork.id}:`, error)
          baseEmotionsRef.current.set(artwork.id, new Set())
          updatePaintingState(artwork.id, [], [])
        }
      }
    }

    initializeSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artworks])

  // Fetch emotion counts from database - show database counts directly
  // Optimistic updates are handled separately in handleEmotionClick
  const fetchEmotionCounts = useCallback(async (paintingId: number) => {
    try {
      setLoading(true)
      // Use cache: 'no-store' to bypass browser and Next.js cache in production
      // Add timestamp to ensure fresh fetch
      const timestamp = Date.now()
      const response = await fetch(`/api/emotions/${paintingId}?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch emotion counts')
      }
      const data = await response.json()
      const counts = data.counts || {}
      
      // Show database counts directly - they are the source of truth
      // Don't apply optimistic updates here - they're handled in handleEmotionClick
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

  // Load state when painting changes
  useEffect(() => {
    previousPaintingIdRef.current = currentPaintingId
    
    // Restore session state from sessionStorage
    const paintingState = getPaintingState(currentPaintingId)
    if (paintingState) {
      // Restore base emotions to ref if not already set
      if (!baseEmotionsRef.current.has(currentPaintingId)) {
        baseEmotionsRef.current.set(currentPaintingId, new Set(paintingState.baseEmotions))
      }
      
      const selectedSet = new Set(paintingState.selectedEmotions)
      setSelectedEmotions(selectedSet)
    } else {
      // Initialize if doesn't exist
      const baseEmotions = baseEmotionsRef.current.get(currentPaintingId) || new Set<string>()
      const baseArray = Array.from(baseEmotions)
      updatePaintingState(currentPaintingId, baseArray, baseArray)
      setSelectedEmotions(new Set(baseEmotions))
    }
    
    // Fetch emotion counts (after restoring state so counts are calculated correctly)
    fetchEmotionCounts(currentPaintingId)
  }, [currentPaintingId, fetchEmotionCounts])

  const handlePrevious = useCallback(() => {
    // Save current state to sessionStorage before navigating
    const selectedArray = Array.from(selectedEmotions)
    updatePaintingState(currentPaintingId, selectedArray)
    
    const newIndex = currentIndex === 0 ? artworks.length - 1 : currentIndex - 1
    onNavigate(newIndex)
  }, [currentIndex, currentPaintingId, artworks.length, onNavigate, selectedEmotions])

  const handleNext = useCallback(() => {
    // Save current state to sessionStorage before navigating
    const selectedArray = Array.from(selectedEmotions)
    updatePaintingState(currentPaintingId, selectedArray)
    
    const newIndex = currentIndex === artworks.length - 1 ? 0 : currentIndex + 1
    onNavigate(newIndex)
  }, [currentIndex, currentPaintingId, artworks.length, onNavigate, selectedEmotions])

  const handleEmotionClick = useCallback((emotion: string) => {
    const newSelected = new Set(selectedEmotions)
    
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

    // Update sessionStorage immediately
    const selectedArray = Array.from(newSelected)
    updatePaintingState(currentPaintingId, selectedArray)

    // Update local state
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

  // Save to sessionStorage when modal closes (but don't save to DB yet)
  useEffect(() => {
    return () => {
      if (previousPaintingIdRef.current !== null) {
        const selectedArray = Array.from(selectedEmotions)
        updatePaintingState(previousPaintingIdRef.current, selectedArray)
      }
    }
  }, [selectedEmotions])

  return (
    <div className="fixed inset-0 bg-[#f8f8f6] z-50 flex items-center justify-center">
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
