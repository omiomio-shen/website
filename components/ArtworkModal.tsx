"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import Image from 'next/image'

interface ArtworkModalProps {
  artworks: {
    id: number
    url: string
    title: string
    orientation: 'landscape' | 'portrait'
  }[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
  thumbnailRect: DOMRect | null
}

type AnimationState = 'entering' | 'entered' | 'exiting' | 'exited'

export function ArtworkModal({
  artworks,
  currentIndex,
  onClose,
  onNavigate,
  thumbnailRect,
}: ArtworkModalProps) {
  const [animationState, setAnimationState] = useState<AnimationState>('entering')
  const [isClosing, setIsClosing] = useState(false)

  // Animation state machine
  useEffect(() => {
    if (animationState === 'entering') {
      const timer = setTimeout(() => {
        setAnimationState('entered')
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [animationState])

  const handlePrevious = useCallback(() => {
    const newIndex = currentIndex === 0 ? artworks.length - 1 : currentIndex - 1
    onNavigate(newIndex)
  }, [currentIndex, artworks.length, onNavigate])

  const handleNext = useCallback(() => {
    const newIndex = currentIndex === artworks.length - 1 ? 0 : currentIndex + 1
    onNavigate(newIndex)
  }, [currentIndex, artworks.length, onNavigate])

  const handleClose = useCallback(async () => {
    if (isClosing) return
    setIsClosing(true)
    
    setAnimationState('exiting')
    await new Promise(resolve => setTimeout(resolve, 400))
    onClose()
  }, [onClose, isClosing])

  useEffect(() => {
    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowLeft') handlePrevious()
      if (e.key === 'ArrowRight') handleNext()
    }

    window.addEventListener('keydown', handleKeyDownGlobal)
    return () => window.removeEventListener('keydown', handleKeyDownGlobal)
  }, [handlePrevious, handleNext, handleClose])

  const getTransformStyles = (): React.CSSProperties => {
    const startScale = 0.3

    if (animationState === 'entering') {
      return {
        transformOrigin: 'center center',
        transform: `scale(${startScale})`,
        opacity: 0,
        transition: 'none',
      }
    } else if (animationState === 'entered') {
      return {
        transformOrigin: 'center center',
        transform: 'scale(1)',
        opacity: 1,
        transition: 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)',
      }
    } else if (animationState === 'exiting') {
      return {
        transformOrigin: 'center center',
        transform: `scale(${startScale})`,
        opacity: 0,
        transition: 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)',
      }
    }

    return {}
  }

  return (
    <div 
      className="fixed inset-0 bg-[#F9FAFB] z-50 flex items-center justify-center"
      style={getTransformStyles()}
    >
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
      <div className={`w-full h-full flex items-center justify-center ${
        artworks[currentIndex].orientation === 'landscape'
          ? ""  // no padding for landscape - fill entire viewport
          : "px-2 sm:px-4 pt-4 sm:pt-6 pb-4 sm:pb-6"  // standard padding for portrait
      }`}>
        <div className="relative w-full h-full">
          <Image
            src={artworks[currentIndex].url}
            alt={`Artwork ${artworks[currentIndex].id}`}
            fill
            className={artworks[currentIndex].orientation === 'landscape' 
              ? "object-cover"    // maximized, fills viewport
              : "object-contain"  // fully visible, no crop
            }
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
    </div>
  )
}
