"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"

const artworks = [
  { id: 1, url: '/images/painting_1.jpg', title: 'Crimson Dreams' },
  { id: 2, url: '/images/painting_2.jpg', title: 'Ocean Whispers' },
  { id: 3, url: '/images/painting_3.jpg', title: 'Golden Horizon' },
  { id: 4, url: '/images/painting_4.jpg', title: 'Midnight Bloom' },
  { id: 5, url: '/images/painting_5.jpg', title: 'Summer Glow' },
  { id: 6, url: '/images/painting_6.jpg', title: 'Forest Song' },
  { id: 7, url: '/images/painting_7.jpg', title: 'Velvet Night' },
  { id: 8, url: '/images/painting_8.jpg', title: 'Desert Bloom' },
  { id: 9, url: '/images/painting_9.jpg', title: 'Azure Dreams' },
  { id: 10, url: '/images/painting_10.jpg', title: 'Autumn Reverie' },
  { id: 11, url: '/images/painting_11.jpg', title: 'Dawn Breaking' },
  { id: 12, url: '/images/painting_12.jpg', title: 'Ethereal Mist' },
  { id: 13, url: '/images/painting_13.jpg', title: 'Twilight Serenade' },
  { id: 14, url: '/images/painting_14.jpg', title: 'Verdant Path' },
  { id: 15, url: '/images/painting_15.jpg', title: 'Crimson Tide' },
  { id: 16, url: '/images/painting_16.jpg', title: 'Starlight Canvas' },
]

export default function OilPaintingsPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const goToPrevious = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev === 0 ? artworks.length - 1 : prev - 1))
    setTimeout(() => setIsTransitioning(false), 300)
  }, [isTransitioning])

  const goToNext = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev === artworks.length - 1 ? 0 : prev + 1))
    setTimeout(() => setIsTransitioning(false), 300)
  }, [isTransitioning])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious()
      } else if (e.key === "ArrowRight") {
        goToNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [goToPrevious, goToNext])

  const currentArtwork = artworks[currentIndex]

  return (
    <div className="w-full h-screen bg-[#0C0F0E] flex flex-col overflow-hidden">
      {/* Painting Container */}
      <div className="flex-1 relative">
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          <Image
            src={currentArtwork.url}
            alt={currentArtwork.title}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="flex items-center justify-center gap-12 py-6 bg-black/30 backdrop-blur-sm">
        <button
          onClick={goToPrevious}
          className="text-white/60 hover:text-white transition-colors text-xl font-light px-4 py-2"
          aria-label="Previous painting"
        >
          ←
        </button>

        <Link
          href="/"
          className="text-white/60 hover:text-white transition-colors text-sm tracking-widest uppercase"
        >
          Home
        </Link>

        <button
          onClick={goToNext}
          className="text-white/60 hover:text-white transition-colors text-xl font-light px-4 py-2"
          aria-label="Next painting"
        >
          →
        </button>
      </nav>
    </div>
  )
}
