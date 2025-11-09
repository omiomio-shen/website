"use client"

import React, { useEffect, useState, useCallback } from 'react'
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

export function ArtworkModal({
  artworks,
  currentIndex,
  onClose,
  onNavigate,
}: ArtworkModalProps) {
  const [selectedEmotions, setSelectedEmotions] = useState<Set<string>>(
    new Set(),
  )
  // Initialize with default counts (simulating previous user interactions)
  const [emotionCounts, setEmotionCounts] = useState<Record<string, number>>(
    () => {
      const initialCounts: Record<string, number> = {}
      artworks[currentIndex].emotions.forEach((emotion) => {
        // Random count between 5 and 20 to simulate previous users
        initialCounts[emotion] = Math.floor(Math.random() * 16) + 5
      })
      return initialCounts
    },
  )

  const handlePrevious = useCallback(() => {
    const newIndex = currentIndex === 0 ? artworks.length - 1 : currentIndex - 1
    onNavigate(newIndex)
  }, [currentIndex, artworks.length, onNavigate])

  const handleNext = useCallback(() => {
    const newIndex = currentIndex === artworks.length - 1 ? 0 : currentIndex + 1
    onNavigate(newIndex)
  }, [currentIndex, artworks.length, onNavigate])

  const handleEmotionClick = (emotion: string) => {
    const newSelected = new Set(selectedEmotions)
    const newCounts = {
      ...emotionCounts,
    }
    if (newSelected.has(emotion)) {
      // Unselect - decrease count by 1
      newSelected.delete(emotion)
      newCounts[emotion] = Math.max(0, (newCounts[emotion] || 0) - 1)
    } else {
      // Select - increase count by 1
      newSelected.add(emotion)
      newCounts[emotion] = (newCounts[emotion] || 0) + 1
    }
    setSelectedEmotions(newSelected)
    setEmotionCounts(newCounts)
  }

  useEffect(() => {
    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') handlePrevious()
      if (e.key === 'ArrowRight') handleNext()
    }

    window.addEventListener('keydown', handleKeyDownGlobal)
    return () => window.removeEventListener('keydown', handleKeyDownGlobal)
  }, [handlePrevious, handleNext, onClose])

  // Update emotion counts when currentIndex changes
  useEffect(() => {
    setSelectedEmotions(new Set())
    const newCounts: Record<string, number> = {}
    artworks[currentIndex].emotions.forEach((emotion) => {
      newCounts[emotion] = Math.floor(Math.random() * 16) + 5
    })
    setEmotionCounts(newCounts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

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
      <div className="w-full h-full flex items-center justify-center px-16 sm:px-20 py-16 pb-40">
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
                  <span
                    className={`absolute -top-1 -right-1 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center transition-all ${isSelected ? 'bg-gray-900' : 'bg-gray-700'}`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

