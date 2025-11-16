"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { ArtworkModal } from './ArtworkModal'
import Image from 'next/image'
import {
  getAllSessionPaintings,
  clearSessionState,
  getOrInitializeSessionState,
} from '@/lib/session-storage'

// Helper function to convert image URL to thumbnail version
function getThumbnailUrl(url: string): string {
  // Extract the base name and extension
  const lastSlash = url.lastIndexOf('/')
  const filename = url.substring(lastSlash + 1)
  const lastDot = filename.lastIndexOf('.')
  const baseName = filename.substring(0, lastDot)
  const extension = filename.substring(lastDot)
  
  // Special case: painting_1.jpg uses .jpeg extension for thumbnail
  if (baseName === 'painting_1' && extension === '.jpg') {
    return url.substring(0, lastSlash + 1) + baseName + '_thumbnail.jpeg'
  }
  
  // Insert "_thumbnail" before the extension
  return url.substring(0, lastSlash + 1) + baseName + '_thumbnail' + extension
}

const artworks = [
  {
    id: 1,
    url: '/images/painting_1.jpg',
    title: 'Crimson Dreams',
    emotions: ['Calm', 'Mysterious', 'Nostalgic'],
  },
  {
    id: 2,
    url: '/images/painting_2.jpg',
    title: 'Ocean Whispers',
    emotions: ['Solitary', 'Accepting'],
  },
  {
    id: 3,
    url: '/images/painting_3.jpg',
    title: 'Golden Horizon',
    emotions: ['Hopeful', 'Curious', 'Warm'],
  },
  {
    id: 4,
    url: '/images/painting_4.jpg',
    title: 'Midnight Bloom',
    emotions: ['Wondering', 'Mysterious'],
  },
  {
    id: 5,
    url: '/images/painting_5.jpg',
    title: 'Summer Glow',
    emotions: ['Joyful', 'Energetic', 'Loving'],
  },
  {
    id: 6,
    url: '/images/painting_6.jpg',
    title: 'Forest Song',
    emotions: ['Reflective', 'Resilient'],
  },
  {
    id: 7,
    url: '/images/painting_7.jpg',
    title: 'Velvet Night',
    emotions: ['Contemplative', 'Intimate'],
  },
  {
    id: 8,
    url: '/images/painting_8.jpg',
    title: 'Desert Bloom',
    emotions: ['Romantic', 'Harmonious'],
  },
  {
    id: 9,
    url: '/images/painting_9.jpg',
    title: 'Azure Dreams',
    emotions: ['Relaxed', 'Connected'],
  },
  {
    id: 10,
    url: '/images/painting_10.jpg',
    title: 'Autumn Reverie',
    emotions: ['Chaotic', 'Unsettling'],
  },
  {
    id: 11,
    url: '/images/painting_11.jpg',
    title: 'Dawn Breaking',
    emotions: ['Connected', 'Warm'],
  },
  {
    id: 12,
    url: '/images/painting_12.jpg',
    title: 'Ethereal Mist',
    emotions: ['Playful', 'Quirky'],
  },
  {
    id: 13,
    url: '/images/painting_13.jpg',
    title: 'Twilight Serenade',
    emotions: ['Energetic', 'Optimistic'],
  },
  {
    id: 14,
    url: '/images/painting_14.jpg',
    title: 'Verdant Path',
    emotions: ['Reflective', 'Warm'],
  },
  {
    id: 15,
    url: '/images/painting_15.jpg',
    title: 'Crimson Tide',
    emotions: ['Happy', 'Hopeful'],
  },
  {
    id: 16,
    url: '/images/painting_16.jpg',
    title: 'Starlight Canvas',
    emotions: ['Passionate', 'Curious'],
  },
]

export function ArtworkGallery() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [activeNav, setActiveNav] = useState('Paintings')

  // Save session to database when tab closes
  const saveSessionToDatabase = useCallback(async () => {
    const sessionPaintings = getAllSessionPaintings()
    const sessionState = getOrInitializeSessionState()
    const sessionId = sessionState.sessionId
    
    if (!sessionId || Object.keys(sessionPaintings).length === 0) {
      return // Nothing to save
    }
    
    for (const [paintingIdStr, paintingState] of Object.entries(sessionPaintings)) {
      const paintingId = parseInt(paintingIdStr)
      if (isNaN(paintingId)) continue

      const baseEmotions = new Set(paintingState.baseEmotions || [])
      const currentEmotions = new Set(paintingState.selectedEmotions || [])
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
        // Save submission with session_id
        try {
          await fetch(`/api/emotions/${paintingId}/submission`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              selectedEmotions: selectedArray,
              sessionId: sessionId,
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

  // Register session end handler at app level (not inside modal)
  useEffect(() => {
    let isSaving = false

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSaving) return
      isSaving = true

      // Use fetch with keepalive for reliable save on tab close
      const sessionPaintings = getAllSessionPaintings()
      const sessionState = getOrInitializeSessionState()
      const sessionId = sessionState.sessionId
      
      if (!sessionId || Object.keys(sessionPaintings).length === 0) {
        return
      }

      console.log('[BEFOREUNLOAD] Starting save process for', Object.keys(sessionPaintings).length, 'paintings')

      // Send data using fetch with keepalive (more reliable than sendBeacon)
      for (const [paintingIdStr, paintingState] of Object.entries(sessionPaintings)) {
        const paintingId = parseInt(paintingIdStr)
        if (isNaN(paintingId)) continue

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
          console.log('[BEFOREUNLOAD] Saving painting', paintingId, 'with deltas:', deltas)
          
          // Save submission - using fetch with keepalive
          const submissionData = JSON.stringify({
            selectedEmotions: selectedArray,
            sessionId: sessionId,
          })
          
          fetch(`/api/emotions/${paintingId}/submission`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: submissionData,
            keepalive: true, // Critical for unload events
          }).catch((error) => {
            console.error('[BEFOREUNLOAD] Error saving submission:', error)
          })

          // Update emotion counts
          for (const [emotion, delta] of Object.entries(deltas)) {
            if (delta !== 0) {
              const countData = JSON.stringify({
                emotion,
                delta,
                ipAddress: 'client',
              })
              
              fetch(`/api/emotions/${paintingId}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: countData,
                keepalive: true, // Critical for unload events
              }).catch((error) => {
                console.error('[BEFOREUNLOAD] Error updating emotion count:', error)
              })
            }
          }
        }
      }

      // Clear session state
      clearSessionState()
      console.log('[BEFOREUNLOAD] Save process completed')
    }

    // Save when tab becomes hidden (backup for mobile/background tabs)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && !isSaving) {
        isSaving = true
        try {
          await saveSessionToDatabase()
        } catch (error) {
          console.error('Error saving session on visibility change:', error)
        } finally {
          isSaving = false
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [saveSessionToDatabase])

  return (
    <div className="w-full min-h-screen px-8 py-6">
      {/* Navigation */}
      <nav className="max-w-6xl mx-auto mb-12">
        <div className="flex items-center justify-center gap-12">
          {['Home', 'Product', 'Paintings'].map((item) => (
            <button
              key={item}
              onClick={() => {
                if (item === 'Home') {
                  window.location.href = '/'
                } else {
                  setActiveNav(item)
                }
              }}
              className={`relative transition-colors py-2 text-sm ${
                activeNav === item ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {item}
              {activeNav === item && (
                <div className="absolute bottom-[0.0625rem] left-0 right-0 h-px bg-gray-900" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto mb-16 text-center py-12">
        <h1
          className="font-bold text-gray-900 text-6xl leading-tight"
        >
          Oil Paintings
        </h1>
      </div>

      {/* Artwork Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {artworks.map((artwork, index) => (
          <div
            key={artwork.id}
            onClick={() => setSelectedIndex(index)}
            className="relative w-full aspect-square rounded-full overflow-hidden cursor-pointer group artwork-shadow scale-90"
          >
            <Image
              src={getThumbnailUrl(artwork.url)}
              alt={`Artwork ${artwork.id}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-120"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedIndex !== null && (
        <ArtworkModal
          artworks={artworks}
          currentIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNavigate={setSelectedIndex}
        />
      )}
    </div>
  )
}

