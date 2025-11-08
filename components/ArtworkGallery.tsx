"use client"

import React, { useState } from 'react'
import { ArtworkModal } from './ArtworkModal'
import Image from 'next/image'

const artworks = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=800&fit=crop',
    title: 'Crimson Dreams',
    emotions: ['Joy', 'Passion'],
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&h=800&fit=crop',
    title: 'Ocean Whispers',
    emotions: ['Serene', 'Peaceful'],
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=800&h=800&fit=crop',
    title: 'Golden Horizon',
    emotions: ['Hope', 'Wonder'],
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1578926078433-e28468c9cf82?w=800&h=800&fit=crop',
    title: 'Midnight Bloom',
    emotions: ['Mystery', 'Calm'],
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=800&fit=crop',
    title: 'Summer Glow',
    emotions: ['Joy', 'Energy'],
  },
  {
    id: 6,
    url: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=800&h=800&fit=crop',
    title: 'Forest Song',
    emotions: ['Serene', 'Growth'],
  },
  {
    id: 7,
    url: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=800&h=800&fit=crop',
    title: 'Velvet Night',
    emotions: ['Contemplative', 'Peace'],
  },
  {
    id: 8,
    url: 'https://images.unsplash.com/photo-1582201957340-005e7d4c6b08?w=800&h=800&fit=crop',
    title: 'Desert Bloom',
    emotions: ['Resilience', 'Beauty'],
  },
  {
    id: 9,
    url: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800&h=800&fit=crop',
    title: 'Azure Dreams',
    emotions: ['Tranquil', 'Clarity'],
  },
  {
    id: 10,
    url: 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=800&h=800&fit=crop',
    title: 'Autumn Reverie',
    emotions: ['Nostalgia', 'Warmth'],
  },
  {
    id: 11,
    url: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800&h=800&fit=crop',
    title: 'Dawn Breaking',
    emotions: ['Hope', 'Renewal'],
  },
  {
    id: 12,
    url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=800&fit=crop',
    title: 'Ethereal Mist',
    emotions: ['Serene', 'Mystery'],
  },
]

export function ArtworkGallery() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [activeNav, setActiveNav] = useState('Paintings')

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
              className="relative text-gray-600 hover:text-gray-900 transition-colors py-2"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '1.125rem',
              }}
            >
              {item}
              {activeNav === item && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto mb-16 text-center py-12">
        <h1
          className="font-bold text-gray-900"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '4rem',
            lineHeight: '1.1',
          }}
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
              src={artwork.url}
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

