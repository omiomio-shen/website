"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, ArrowRight } from "lucide-react"

const artworks = [
  { id: 1, url: '/images/painting_1.jpg', title: 'Crimson Dreams', orientation: 'landscape' as const },
  { id: 2, url: '/images/painting_8.jpg', title: 'Desert Bloom', orientation: 'landscape' as const },
  { id: 3, url: '/images/painting_2.jpg', title: 'Ocean Whispers', orientation: 'portrait' as const },
  { id: 4, url: '/images/painting_3.jpg', title: 'Golden Horizon', orientation: 'portrait' as const },
  { id: 5, url: '/images/painting_5.jpg', title: 'Summer Glow', orientation: 'portrait' as const },
  { id: 6, url: '/images/painting_6.jpg', title: 'Forest Song', orientation: 'portrait' as const },
  { id: 7, url: '/images/painting_7.jpg', title: 'Velvet Night', orientation: 'portrait' as const },
  { id: 8, url: '/images/painting_9.jpg', title: 'Azure Dreams', orientation: 'portrait' as const },
]

export default function OilPaintingsPage() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [nextIndex, setNextIndex] = useState<number | null>(null)
  const [showNext, setShowNext] = useState(false)
  const [showNav, setShowNav] = useState(false)
  const [isHoveringNav, setIsHoveringNav] = useState(false)
  const [isPortraitViewport, setIsPortraitViewport] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const hideNavTimerRef = useRef<NodeJS.Timeout | null>(null)
  const transitioningRef = useRef(false)
  const currentIndexRef = useRef(currentIndex)

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  // Viewport orientation detection
  useEffect(() => {
    const checkViewport = () => {
      setIsPortraitViewport(window.innerHeight > window.innerWidth)
    }

    checkViewport()
    window.addEventListener('resize', checkViewport)
    return () => window.removeEventListener('resize', checkViewport)
  }, [])

  const navigate = useCallback((targetIndex: number) => {
    if (transitioningRef.current) return
    transitioningRef.current = true
    // Mount the next image at opacity-0, then trigger the fade-in on the next two frames
    // (double rAF ensures the element has painted at opacity-0 before the transition starts)
    setNextIndex(targetIndex)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setShowNext(true)
      })
    })
    setTimeout(() => {
      setCurrentIndex(targetIndex)
      setNextIndex(null)
      setShowNext(false)
      transitioningRef.current = false
    }, 500)
  }, [])

  const goToPrevious = useCallback(() => {
    const prev = currentIndexRef.current
    navigate(prev === 0 ? artworks.length - 1 : prev - 1)
  }, [navigate])

  const goToNext = useCallback(() => {
    const prev = currentIndexRef.current
    navigate(prev === artworks.length - 1 ? 0 : prev + 1)
  }, [navigate])

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isExiting) return
    setIsExiting(true)
    setTimeout(() => router.push('/'), 650)
  }

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

    handleUserActivity()

    return () => {
      if (hideNavTimerRef.current) {
        clearTimeout(hideNavTimerRef.current)
      }
      window.removeEventListener('mousemove', handleUserActivity)
    }
  }, [isHoveringNav])

  const currentArtwork = artworks[currentIndex]

  // Determine object-fit based on viewport and painting orientation
  const getObjectFit = (paintingOrientation: 'landscape' | 'portrait') => {
    const isPaintingLandscape = paintingOrientation === 'landscape'

    if (isPortraitViewport) {
      return isPaintingLandscape ? 'object-contain' : 'object-cover'
    } else {
      return isPaintingLandscape ? 'object-cover' : 'object-contain'
    }
  }

  return (
    <div className="h-screen overflow-hidden">
      {/* Sliding container: home preview (100vh) above + painting (100vh) below.
          At rest, translateY(-100vh) keeps the painting in view.
          On exit, page-slide-down animates to translateY(0), revealing the home preview. */}
      <div
        className={isExiting ? "page-slide-down" : ""}
        style={{ transform: isExiting ? undefined : 'translateY(-100vh)' }}
      >
        {/* Home preview — sits above the painting, slides into view on exit */}
        <div className="h-screen relative bg-[#0C0F0E] overflow-hidden">
          <Image
            src="/images/bridge.jpeg"
            alt=""
            fill
            style={{ objectFit: 'cover', filter: 'blur(2px) grayscale(60%)' }}
            sizes="100vw"
            priority
          />
        </div>

        {/* Painting page */}
        <div className="relative w-full h-screen bg-[#0C0F0E] overflow-hidden">
          {/* Blurred Background - current painting */}
          <div className="absolute inset-0">
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

          {/* Full-Screen Painting - current */}
          <div className="absolute inset-0">
            <Image
              src={currentArtwork.url}
              alt={currentArtwork.title}
              fill
              className={getObjectFit(currentArtwork.orientation)}
              sizes="100vw"
              priority
            />
          </div>

          {/* Blurred Background - next painting, crossfades in on top */}
          {nextIndex !== null && (
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${
                showNext ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={artworks[nextIndex].url}
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
          )}

          {/* Full-Screen Painting - next, crossfades in on top */}
          {nextIndex !== null && (
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${
                showNext ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={artworks[nextIndex].url}
                alt={artworks[nextIndex].title}
                fill
                className={getObjectFit(artworks[nextIndex].orientation)}
                sizes="100vw"
                priority
              />
            </div>
          )}

          {/* Overlaid Navigation */}
          <nav
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-8"
            onMouseEnter={() => setIsHoveringNav(true)}
            onMouseLeave={() => setIsHoveringNav(false)}
            style={{ pointerEvents: showNav ? 'auto' : 'none' }}
          >
            <div
              className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-6 py-2 transition-opacity duration-500"
              style={{ opacity: showNav ? 1 : 0 }}
            >
              <button
                onClick={goToPrevious}
                className="text-gray-300 hover:text-white transition-colors px-1"
                aria-label="Previous painting"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <a
                href="/"
                onClick={handleHomeClick}
                className="text-gray-300 hover:text-white transition-colors text-lg cursor-pointer"
              >
                Home
              </a>

              <button
                onClick={goToNext}
                className="text-gray-300 hover:text-white transition-colors px-1"
                aria-label="Next painting"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </nav>

          {/* Painting Counter */}
          <div
            className="absolute top-6 right-6 text-white/50 text-sm tracking-widest font-light transition-opacity duration-500"
            style={{ opacity: showNav ? 1 : 0 }}
          >
            {currentIndex + 1} / {artworks.length}
          </div>
        </div>
      </div>
    </div>
  )
}
