"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  const [showNav, setShowNav] = useState(false)
  const [isHoveringNav, setIsHoveringNav] = useState(false)
  const hideNavTimerRef = useRef<NodeJS.Timeout | null>(null)

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

  // Auto-hide nav bar on inactivity
  useEffect(() => {
    const handleUserActivity = () => {
      setShowNav(true)
      
      if (hideNavTimerRef.current) {
        clearTimeout(hideNavTimerRef.current)
      }
      
      hideNavTimerRef.current = setTimeout(() => {
        if (!isHoveringNav) {
          setShowNav(false)
        }
      }, 2500)
    }

    window.addEventListener('mousemove', handleUserActivity)
    window.addEventListener('keydown', handleUserActivity)
    
    // Show nav initially
    handleUserActivity()
    
    return () => {
      if (hideNavTimerRef.current) {
        clearTimeout(hideNavTimerRef.current)
      }
      window.removeEventListener('mousemove', handleUserActivity)
      window.removeEventListener('keydown', handleUserActivity)
    }
  }, [isHoveringNav])

  const currentArtwork = artworks[currentIndex]

  return (
    <div className="w-full h-screen bg-[#0C0F0E] overflow-hidden relative">
      {/* Blurred Background - Same painting, covers full page */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        <Image
          src={currentArtwork.url}
          alt=""
          fill
          className="object-cover"
          style={{
            filter: "blur(24px) grayscale(60%)",
            transform: "scale(1.1)",
          }}
          sizes="100vw"
          priority
        />
      </div>

      {/* Full-Screen Painting */}
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

      {/* Overlaid Navigation */}
      <nav 
        className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-16 py-8 transition-all duration-300"
        onMouseEnter={() => setIsHoveringNav(true)}
        onMouseLeave={() => setIsHoveringNav(false)}
        style={{
          opacity: showNav ? 1 : 0,
          transform: showNav ? 'translateY(0)' : 'translateY(20px)',
          pointerEvents: showNav ? 'auto' : 'none',
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
        }}
      >
        <button
          onClick={goToPrevious}
          className="text-white/70 hover:text-white transition-colors text-2xl font-extralight px-6 py-3"
          aria-label="Previous painting"
        >
          ←
        </button>

        <Link
          href="/"
          className="text-white/70 hover:text-white transition-colors text-sm tracking-[0.3em] uppercase font-light"
        >
          Home
        </Link>

        <button
          onClick={goToNext}
          className="text-white/70 hover:text-white transition-colors text-2xl font-extralight px-6 py-3"
          aria-label="Next painting"
        >
          →
        </button>
      </nav>

      {/* Painting Counter */}
      <div 
        className="absolute top-6 right-6 text-white/50 text-sm tracking-widest font-light transition-opacity duration-300"
        style={{ opacity: showNav ? 1 : 0 }}
      >
        {currentIndex + 1} / {artworks.length}
      </div>
    </div>
  )
}
