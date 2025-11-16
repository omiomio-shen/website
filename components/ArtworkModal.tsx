"use client"

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import Image from 'next/image'
import {
  getOrInitializeSessionState,
  updatePaintingState,
  getPaintingState,
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
  // Track optimistic count updates per painting during this session
  const optimisticCountsRef = useRef<Map<number, Record<string, number>>>(new Map())
  const hasClosedRef = useRef(false) // Track if we've already saved on close

  const currentPainting = artworks[currentIndex]
  const currentPaintingId = currentPainting.id

  // Reset close flag when modal opens (each time)
  useEffect(() => {
    hasClosedRef.current = false
    console.log('[MODAL OPEN] Reset close flag')
  }, [])

  // Initialize session on mount (lightweight - no API calls)
  useEffect(() => {
    if (hasInitializedRef.current) {
      return
    }
    hasInitializedRef.current = true

    // Just initialize session state to generate/retrieve session ID
    // Don't fetch any data yet - that will happen on-demand
    getOrInitializeSessionState()
    console.log('[MODAL] Session initialized (lazy loading enabled)')
  }, [])

  // Fetch emotion counts from database and apply optimistic updates
  const fetchEmotionCounts = useCallback(async (paintingId: number) => {
    try {
      setLoading(true)
      // Aggressive cache busting for production - use random query param
      const random = Math.random().toString(36).substring(7)
      const timestamp = Date.now()
      const response = await fetch(`/api/emotions/${paintingId}?t=${timestamp}&r=${random}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'X-Request-ID': `${Date.now()}-${Math.random()}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch emotion counts')
      }
      const data = await response.json()
      const baseCounts = data.counts || {}
      
      // Apply optimistic updates from this session
      const optimisticDeltas = optimisticCountsRef.current.get(paintingId) || {}
      const finalCounts = { ...baseCounts }
      
      for (const [emotion, delta] of Object.entries(optimisticDeltas)) {
        finalCounts[emotion] = Math.max(0, (finalCounts[emotion] || 0) + delta)
      }
      
      setEmotionCounts(finalCounts)
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

  // Load state when painting changes (with lazy loading)
  useEffect(() => {
    previousPaintingIdRef.current = currentPaintingId
    
    const loadPaintingData = async () => {
      // Check if we've already loaded base emotions for this painting
      const hasBaseEmotions = baseEmotionsRef.current.has(currentPaintingId)
      
      // Try to restore from sessionStorage first
      const paintingState = getPaintingState(currentPaintingId)
      
      if (paintingState) {
        // We have session state - restore it
        if (!hasBaseEmotions) {
          baseEmotionsRef.current.set(currentPaintingId, new Set(paintingState.baseEmotions))
        }
        
        if (paintingState.optimisticDeltas) {
          optimisticCountsRef.current.set(currentPaintingId, paintingState.optimisticDeltas)
        }
        
        setSelectedEmotions(new Set(paintingState.selectedEmotions))
      } else if (!hasBaseEmotions) {
        // First time viewing this painting - fetch submission check
        const sessionState = getOrInitializeSessionState()
        const sessionId = sessionState.sessionId
        
        try {
          const response = await fetch(`/api/emotions/${currentPaintingId}/submission?session_id=${encodeURIComponent(sessionId)}`, {
            cache: 'no-store',
          })
          
          if (response.ok) {
            const data = await response.json() as { hasSubmitted: boolean; previousEmotions?: string[] }
            const baseEmotionsArray = data.hasSubmitted && data.previousEmotions ? data.previousEmotions : []
            
            baseEmotionsRef.current.set(currentPaintingId, new Set(baseEmotionsArray))
            updatePaintingState(currentPaintingId, baseEmotionsArray, baseEmotionsArray, {})
            setSelectedEmotions(new Set(baseEmotionsArray))
          } else {
            // Error fetching - initialize empty
            baseEmotionsRef.current.set(currentPaintingId, new Set())
            updatePaintingState(currentPaintingId, [], [], {})
            setSelectedEmotions(new Set())
          }
        } catch (error) {
          console.error(`Error loading base emotions for painting ${currentPaintingId}:`, error)
          baseEmotionsRef.current.set(currentPaintingId, new Set())
          updatePaintingState(currentPaintingId, [], [], {})
          setSelectedEmotions(new Set())
        }
      } else {
        // Has base emotions but no session state - initialize from base
        const baseEmotions = baseEmotionsRef.current.get(currentPaintingId) || new Set<string>()
        const baseArray = Array.from(baseEmotions)
        updatePaintingState(currentPaintingId, baseArray, baseArray, {})
        setSelectedEmotions(new Set(baseEmotions))
      }
      
      // Fetch emotion counts (after loading base state)
      await fetchEmotionCounts(currentPaintingId)
    }
    
    loadPaintingData()
  }, [currentPaintingId, fetchEmotionCounts])

  // Save all changes to database
  const saveAllChangesToDatabase = useCallback(async () => {
    if (hasClosedRef.current) return // Already saved
    hasClosedRef.current = true
    
    const sessionState = getOrInitializeSessionState()
    const sessionId = sessionState.sessionId
    
    console.log('[MODAL CLOSE] Saving all changes to database...')
    
    // Iterate through all paintings that have changes
    for (const paintingId of baseEmotionsRef.current.keys()) {
      const paintingState = getPaintingState(paintingId)
      if (!paintingState) continue
      
      const baseEmotions = new Set(paintingState.baseEmotions || [])
      const currentEmotions = new Set(paintingState.selectedEmotions || [])
      const selectedArray = Array.from(currentEmotions)
      
      // Calculate deltas
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
      
      const hasChanges = Object.keys(deltas).length > 0
      
      if (hasChanges) {
        console.log(`[MODAL CLOSE] Saving painting ${paintingId} with deltas:`, deltas)
        
        // Save submission
        try {
          const response = await fetch(`/api/emotions/${paintingId}/submission`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              selectedEmotions: selectedArray,
              sessionId: sessionId,
            }),
          })
          console.log(`[MODAL CLOSE] Submission response:`, response.status, response.ok)
        } catch (error) {
          console.error(`[MODAL CLOSE] Error saving submission:`, error)
        }
        
        // Update emotion counts
        for (const [emotion, delta] of Object.entries(deltas)) {
          if (delta !== 0) {
            try {
              const response = await fetch(`/api/emotions/${paintingId}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  emotion,
                  delta,
                  ipAddress: 'client',
                }),
              })
              console.log(`[MODAL CLOSE] Count update response for ${emotion}:`, response.status, response.ok)
            } catch (error) {
              console.error(`[MODAL CLOSE] Error updating ${emotion} count:`, error)
            }
          }
        }
      }
      
      // CRITICAL: Always update the baseline after modal close
      // This ensures next time the modal opens, the baseline matches database
      console.log(`[MODAL CLOSE] Updating baseline for painting ${paintingId}`)
      baseEmotionsRef.current.set(paintingId, new Set(selectedArray))
      updatePaintingState(paintingId, selectedArray, selectedArray, {})
      
      // Clear optimistic counts for this painting
      optimisticCountsRef.current.set(paintingId, {})
    }
    
    console.log('[MODAL CLOSE] All changes saved!')
  }, [])

  const handlePrevious = useCallback(() => {
    // Save current state to sessionStorage before navigating
    const selectedArray = Array.from(selectedEmotions)
    const optimisticDeltas = optimisticCountsRef.current.get(currentPaintingId) || {}
    updatePaintingState(currentPaintingId, selectedArray, undefined, optimisticDeltas)
    
    const newIndex = currentIndex === 0 ? artworks.length - 1 : currentIndex - 1
    onNavigate(newIndex)
  }, [currentIndex, currentPaintingId, artworks.length, onNavigate, selectedEmotions])

  const handleNext = useCallback(() => {
    // Save current state to sessionStorage before navigating
    const selectedArray = Array.from(selectedEmotions)
    const optimisticDeltas = optimisticCountsRef.current.get(currentPaintingId) || {}
    updatePaintingState(currentPaintingId, selectedArray, undefined, optimisticDeltas)
    
    const newIndex = currentIndex === artworks.length - 1 ? 0 : currentIndex + 1
    onNavigate(newIndex)
  }, [currentIndex, currentPaintingId, artworks.length, onNavigate, selectedEmotions])

  // Handle modal close - save to database before closing
  const handleClose = useCallback(async () => {
    // Save current painting state first
    const selectedArray = Array.from(selectedEmotions)
    const optimisticDeltas = optimisticCountsRef.current.get(currentPaintingId) || {}
    updatePaintingState(currentPaintingId, selectedArray, undefined, optimisticDeltas)
    
    // Save all changes to database
    await saveAllChangesToDatabase()
    
    // Then close the modal
    onClose()
  }, [currentPaintingId, selectedEmotions, saveAllChangesToDatabase, onClose])

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

    // Track optimistic delta for this painting
    const selectedArray = Array.from(newSelected)
    const currentDeltas = optimisticCountsRef.current.get(currentPaintingId) || {}
    const baseEmotions = baseEmotionsRef.current.get(currentPaintingId) || new Set<string>()
    
    // Calculate net delta from base state
    const wasInBase = baseEmotions.has(emotion)
    const isInNew = newSelected.has(emotion)
    
    let netDelta = 0
    if (wasInBase && !isInNew) {
      netDelta = -1  // Removed from base
    } else if (!wasInBase && isInNew) {
      netDelta = 1   // Added to base
    } else {
      netDelta = 0   // No change from base
    }
    
    const updatedDeltas = { ...currentDeltas }
    if (netDelta === 0) {
      delete updatedDeltas[emotion]  // Back to base state
    } else {
      updatedDeltas[emotion] = netDelta
    }
    optimisticCountsRef.current.set(currentPaintingId, updatedDeltas)

    // Save optimistic deltas to sessionStorage
    updatePaintingState(currentPaintingId, selectedArray, undefined, updatedDeltas)

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
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowLeft') handlePrevious()
      if (e.key === 'ArrowRight') handleNext()
    }

    window.addEventListener('keydown', handleKeyDownGlobal)
    return () => window.removeEventListener('keydown', handleKeyDownGlobal)
  }, [handlePrevious, handleNext, handleClose])

  return (
    <div className="fixed inset-0 bg-[#f8f8f6] z-50 flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={handleClose}
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
