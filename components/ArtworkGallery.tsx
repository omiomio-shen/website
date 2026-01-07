"use client"

import React, { useState, useEffect } from 'react'
import { ArtworkModal } from './ArtworkModal'
import Image from 'next/image'

// Helper function to convert image URL to thumbnail version
function getThumbnailUrl(url: string): string {
  const lastSlash = url.lastIndexOf('/')
  const filename = url.substring(lastSlash + 1)
  const lastDot = filename.lastIndexOf('.')
  const baseName = filename.substring(0, lastDot)
  const extension = filename.substring(lastDot)
  
  // Special case: painting_1.jpg uses .jpeg extension for thumbnail
  if (baseName === 'painting_1' && extension === '.jpg') {
    return url.substring(0, lastSlash + 1) + baseName + '_thumbnail.jpeg'
  }
  
  return url.substring(0, lastSlash + 1) + baseName + '_thumbnail' + extension
}

const artworks = [
  {
    id: 1,
    url: '/images/painting_1.jpg',
    title: 'Crimson Dreams',
    orientation: 'landscape' as const,
  },
  {
    id: 2,
    url: '/images/painting_2.jpg',
    title: 'Ocean Whispers',
    orientation: 'portrait' as const,
  },
  {
    id: 3,
    url: '/images/painting_3.jpg',
    title: 'Golden Horizon',
    orientation: 'portrait' as const,
  },
  {
    id: 4,
    url: '/images/painting_4.jpg',
    title: 'Midnight Bloom',
    orientation: 'landscape' as const,
  },
  {
    id: 5,
    url: '/images/painting_5.jpg',
    title: 'Summer Glow',
    orientation: 'portrait' as const,
  },
  {
    id: 6,
    url: '/images/painting_6.jpg',
    title: 'Forest Song',
    orientation: 'portrait' as const,
  },
  {
    id: 7,
    url: '/images/painting_7.jpg',
    title: 'Velvet Night',
    orientation: 'portrait' as const,
  },
  {
    id: 8,
    url: '/images/painting_8.jpg',
    title: 'Desert Bloom',
    orientation: 'landscape' as const,
  },
  {
    id: 9,
    url: '/images/painting_9.jpg',
    title: 'Azure Dreams',
    orientation: 'portrait' as const,
  },
  {
    id: 10,
    url: '/images/painting_10.jpg',
    title: 'Autumn Reverie',
    orientation: 'portrait' as const,
  },
  {
    id: 11,
    url: '/images/painting_11.jpg',
    title: 'Dawn Breaking',
    orientation: 'landscape' as const,
  },
  {
    id: 14,
    url: '/images/painting_14.jpg',
    title: 'Verdant Path',
    orientation: 'landscape' as const,
  },
  {
    id: 12,
    url: '/images/painting_12.jpg',
    title: 'Ethereal Mist',
    orientation: 'portrait' as const,
  },
  {
    id: 13,
    url: '/images/painting_13.jpg',
    title: 'Twilight Serenade',
    orientation: 'portrait' as const,
  },
  {
    id: 15,
    url: '/images/painting_15.jpg',
    title: 'Crimson Tide',
    orientation: 'portrait' as const,
  },
  {
    id: 16,
    url: '/images/painting_16.jpg',
    title: 'Starlight Canvas',
    orientation: 'landscape' as const,
  },
]

export function ArtworkGallery() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [activeNav, setActiveNav] = useState('Paintings')
  const [showContent, setShowContent] = useState(false)
  const [thumbnailRect, setThumbnailRect] = useState<DOMRect | null>(null)
  const [showNav, setShowNav] = useState(false)
  const [isInHeroSection, setIsInHeroSection] = useState(true)
  const [isHoveringNav, setIsHoveringNav] = useState(false)
  const thumbnailRefs = React.useRef<Map<number, HTMLDivElement>>(new Map())
  const hideNavTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  // Trigger content visibility after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  // Track if user is in hero section (first viewport height)
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const viewportHeight = window.innerHeight
      
      setIsInHeroSection(scrollY < viewportHeight * 0.8)
    }

    handleScroll()
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-hide nav bar only when in hero section
  useEffect(() => {
    if (!isInHeroSection) {
      setShowNav(true)
      if (hideNavTimerRef.current) {
        clearTimeout(hideNavTimerRef.current)
      }
      return
    }

    const handleUserActivity = () => {
      setShowNav(true)
      
      if (hideNavTimerRef.current) {
        clearTimeout(hideNavTimerRef.current)
      }
      
      hideNavTimerRef.current = setTimeout(() => {
        if (!isHoveringNav) {
          setShowNav(false)
        }
      }, 2000)
    }

    window.addEventListener('mousemove', handleUserActivity)
    window.addEventListener('scroll', handleUserActivity)
    
    return () => {
      if (hideNavTimerRef.current) {
        clearTimeout(hideNavTimerRef.current)
      }
      window.removeEventListener('mousemove', handleUserActivity)
      window.removeEventListener('scroll', handleUserActivity)
    }
  }, [isInHeroSection, isHoveringNav])

  return (
    <div className="w-full min-h-screen">
      {/* Floating Navigation Bar */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm"
        onMouseEnter={() => setIsHoveringNav(true)}
        onMouseLeave={() => setIsHoveringNav(false)}
        style={{
          opacity: showContent && showNav ? 1 : 0,
          filter: showContent ? 'blur(0px)' : 'blur(10px)',
          transform: showNav ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'opacity 300ms, filter 300ms, transform 300ms'
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
        <div className="relative w-full h-screen">
          <Image
            src="/images/painting_1.jpg"
            alt="Crimson Dreams - Featured Artwork"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          
          {/* View Paintings Button */}
          <div 
            className="absolute transition-opacity duration-300"
            style={{
              top: '50%',
              left: '33.33%',
              transform: 'translate(-50%, -50%)',
              opacity: showContent && showNav ? 1 : 0,
              pointerEvents: showNav ? 'auto' : 'none'
            }}
          >
            <button
              onClick={() => {
                const artworkGrid = document.getElementById('artwork-grid')
                if (artworkGrid) {
                  artworkGrid.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }}
              className="group relative flex items-center text-lg text-gray-300 hover:text-white focus:outline-none transition-colors"
            >
              <span className="inline-block">View paintings</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1 h-4 w-4 hidden group-hover:block"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Artwork Grid */}
      <div id="artwork-grid" className="max-w-6xl mx-auto px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-16">
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
          thumbnailRect={thumbnailRect}
        />
      )}
    </div>
  )
}
