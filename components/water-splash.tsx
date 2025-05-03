"use client"

import { useEffect, useState } from "react"
import type { SplashSettings } from "./splash-controls"

interface WaterSplashProps {
  visible: boolean
  containerHeight: number
  settings: SplashSettings
}

interface Splash {
  id: number
  x: number
  y: number
  size: number
  delay: number
  duration: number
  depthFactor: number // Added for depth perception
}

export function WaterSplash({ visible, containerHeight, settings }: WaterSplashProps) {
  const [splashes, setSplashes] = useState<Splash[]>([])

  // Generate new splashes when component mounts or visibility/settings change
  useEffect(() => {
    if (visible) {
      const newSplashes = Array.from({ length: settings.density }, (_, i) => {
        // Calculate y position based on coverage
        const y = Math.random() * settings.coverage + (100 - settings.coverage) / 2

        // Calculate depth factor based on y position (0.5-2.0)
        // Higher y values (closer to bottom) get larger ripples
        const depthFactor = 0.5 + (y / 100) * 1.5

        return {
          id: i,
          x: Math.random() * 100, // Random position across width (%)
          y: y, // Random position based on coverage
          size: Math.random() * 1.5 + 0.5, // Random base size between 0.5 and 2
          delay: Math.random() * 5, // Random delay up to 5s
          duration: Math.random() * 1.5 + settings.animationDuration * 0.5, // Random duration based on animation speed
          depthFactor: depthFactor, // Store depth factor for ripple sizing
        }
      })

      setSplashes(newSplashes)
    }
  }, [visible, settings.density, settings.coverage, settings.animationDuration])

  if (!visible) return null

  // Calculate aspect ratio for ripples based on roundness (100% = circle, lower = more oval)
  const aspectRatio = settings.rippleRoundness / 100

  return (
    <div
      className="absolute left-0 w-full overflow-hidden pointer-events-none"
      style={{ height: `${containerHeight}px` }}
    >
      {splashes.map((splash) => (
        <div
          key={splash.id}
          className="absolute"
          style={{
            left: `${splash.x}%`,
            top: `${splash.y}%`,
            opacity: 0,
            animation: `splash ${splash.duration}s ${splash.delay}s infinite`,
          }}
        >
          {/* Ripple 1 - Inner ripple */}
          <div
            className="absolute border-2 border-white/55"
            style={{
              width: `${splash.size * 20 * settings.dropletSize * splash.depthFactor}px`,
              height: `${splash.size * 20 * settings.dropletSize * splash.depthFactor * aspectRatio}px`,
              borderRadius: "50%",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%) scale(0)",
              opacity: 0,
              animation: `ripple ${splash.duration}s ${splash.delay}s infinite`,
            }}
          />

          {/* Ripple 2 - Middle ripple */}
          <div
            className="absolute border border-white/45"
            style={{
              width: `${splash.size * 40 * settings.dropletSize * splash.depthFactor}px`,
              height: `${splash.size * 40 * settings.dropletSize * splash.depthFactor * aspectRatio}px`,
              borderRadius: "50%",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%) scale(0)",
              opacity: 0,
              animation: `ripple ${splash.duration}s ${splash.delay + 0.1}s infinite`,
            }}
          />

          {/* Ripple 3 - Outer ripple */}
          <div
            className="absolute border border-white/35"
            style={{
              width: `${splash.size * 60 * settings.dropletSize * splash.depthFactor}px`,
              height: `${splash.size * 60 * settings.dropletSize * splash.depthFactor * aspectRatio}px`,
              borderRadius: "50%",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%) scale(0)",
              opacity: 0,
              animation: `ripple ${splash.duration}s ${splash.delay + 0.2}s infinite`,
            }}
          />
        </div>
      ))}

      <style jsx>{`
        @keyframes splash {
          0% {
            opacity: 0;
          }
          10% {
            opacity: 0.95;
          }
          70% {
            opacity: 0.65;
          }
          100% {
            opacity: 0;
          }
        }
        
        @keyframes ripple {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.85;
          }
          70% {
            opacity: 0.65;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
