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
  const [preloadedCounts, setPreloadedCounts] = useState<Record<number, Record<string, number>>>({})
  const [showContent, setShowContent] = useState(false)
  const [thumbnailRect, setThumbnailRect] = useState<DOMRect | null>(null)
  const thumbnailRefs = React.useRef<Map<number, HTMLDivElement>>(new Map())

  // Trigger content visibility after delay
  useEffect(() => {
    // Wait for transition to complete (300ms) plus a small delay (200ms)
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  // Preload all emotion counts on mount for instant modal display
  useEffect(() => {
    const preloadEmotionCounts = async () => {
      console.log('[PRELOAD] Starting to preload emotion counts for all paintings...')
      const startTime = performance.now()
      
      // Fetch all counts in parallel
      const fetchPromises = artworks.map(async (artwork) => {
        try {
          const random = Math.random().toString(36).substring(7)
          const timestamp = Date.now()
          const response = await fetch(`/api/emotions/${artwork.id}?t=${timestamp}&r=${random}`, {
            method: 'GET',
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate',
              'Pragma': 'no-cache',
            },
          })
          
          if (response.ok) {
            const data = await response.json()
            return { paintingId: artwork.id, counts: data.counts || {} }
          }
          
          return { paintingId: artwork.id, counts: {} }
        } catch (error) {
          console.error(`[PRELOAD] Error fetching counts for painting ${artwork.id}:`, error)
          return { paintingId: artwork.id, counts: {} }
        }
      })

      const results = await Promise.all(fetchPromises)
      
      // Convert array to map
      const countsMap: Record<number, Record<string, number>> = {}
      results.forEach(({ paintingId, counts }) => {
        countsMap[paintingId] = counts
      })
      
      setPreloadedCounts(countsMap)
      
      const endTime = performance.now()
      console.log(`[PRELOAD] Finished preloading ${results.length} paintings in ${Math.round(endTime - startTime)}ms`)
    }

    preloadEmotionCounts()
  }, [])

  // Backup: Save on tab close (in case user closes tab while modal is open)
  // Primary save happens when modal closes
  useEffect(() => {
    const handlePageHide = () => {
      const sessionPaintings = getAllSessionPaintings()
      const sessionState = getOrInitializeSessionState()
      const sessionId = sessionState.sessionId
      
      if (!sessionId || Object.keys(sessionPaintings).length === 0) {
        return
      }
      
      console.log('[TAB CLOSE BACKUP] Saving remaining changes...')
      
      // Use keepalive fetch for backup save
      for (const [paintingIdStr, paintingState] of Object.entries(sessionPaintings)) {
        const paintingId = parseInt(paintingIdStr)
        if (isNaN(paintingId)) continue

        const baseEmotions = new Set(paintingState.baseEmotions || [])
        const currentEmotions = new Set(paintingState.selectedEmotions || [])
        const selectedArray = Array.from(currentEmotions)

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
          fetch(`/api/emotions/${paintingId}/submission`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selectedEmotions: selectedArray, sessionId }),
            keepalive: true,
          }).catch(console.error)

          for (const [emotion, delta] of Object.entries(deltas)) {
            if (delta !== 0) {
              fetch(`/api/emotions/${paintingId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emotion, delta, ipAddress: 'client' }),
                keepalive: true,
              }).catch(console.error)
            }
          }
        }
      }

      clearSessionState()
    }

    window.addEventListener('pagehide', handlePageHide)
    return () => window.removeEventListener('pagehide', handlePageHide)
  }, [])

  return (
    <div className="w-full min-h-screen">
      {/* Floating Navigation Bar */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 transition-all duration-300 shadow-sm"
        style={{
          opacity: showContent ? 1 : 0,
          filter: showContent ? 'blur(0px)' : 'blur(10px)'
        }}
      >
        <div className="max-w-6xl mx-auto px-8 py-4">
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
              </button>
            ))}
          </div>
        </div>
      </nav>
      
      {/* Hero Image - Full Width, starts at top */}
      <div 
        className="w-full mb-24 transition-all duration-300"
        style={{
          opacity: showContent ? 1 : 0,
          filter: showContent ? 'blur(0px)' : 'blur(10px)'
        }}
      >
        <div className="relative w-full aspect-[16/9] max-h-[600px]">
          <Image
            src="/images/painting_1.jpg"
            alt="Crimson Dreams - Featured Artwork"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
      </div>

      {/* Artwork Grid */}
      <div className="max-w-6xl mx-auto px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-16">
        {artworks.filter(artwork => artwork.id !== 16).map((artwork, index) => (
          <div
            key={artwork.id}
            ref={(el) => {
              if (el) {
                thumbnailRefs.current.set(index, el)
              } else {
                thumbnailRefs.current.delete(index)
              }
            }}
            onClick={() => {
              const element = thumbnailRefs.current.get(index)
              if (element) {
                const rect = element.getBoundingClientRect()
                setThumbnailRect(rect)
              }
              setSelectedIndex(index)
            }}
            className={`relative w-full aspect-square rounded-full overflow-hidden cursor-pointer group artwork-shadow scale-[0.85] transition-all duration-300`}
            style={{
              opacity: showContent ? 1 : 0,
              filter: showContent ? 'blur(0px)' : 'blur(10px)',
              transform: 'scale(0.85)',
              transitionDelay: `${index * 50 + 200}ms`
            }}
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
          preloadedCounts={preloadedCounts}
          thumbnailRect={thumbnailRect}
        />
      )}
    </div>
  )
}

