"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Settings } from "lucide-react"
import { NavButton } from "@/components/nav-button"
import { WaterSplash } from "@/components/water-splash"
import { RainControls, type RainSettings } from "@/components/rain-controls"
import { SplashControls, type SplashSettings } from "@/components/splash-controls"

export default function Home() {
  const [hoverSection, setHoverSection] = useState<string>("none")
  const [bottomHeight, setBottomHeight] = useState(0)
  const [showControls, setShowControls] = useState(false)
  const [typedText, setTypedText] = useState("")
  const navLeftPosition = "108px" // Control both navigation buttons' horizontal position

  const [rainSettings, setRainSettings] = useState<RainSettings>({
    density: 35,
    containerHeight: 100,
    animationDuration: 3,
  })

  const [splashSettings, setSplashSettings] = useState<SplashSettings>({
    density: 50,
    coverage: 100,
    animationDuration: 3,
    dropletSize: 0.5,
    rippleRoundness: 25,
  })

  const [showRainControls, setShowRainControls] = useState(false)
  const [showSplashControls, setShowSplashControls] = useState(false)

  // Refs for the hover detection areas
  const topSectionRef = useRef<HTMLDivElement>(null)
  const bottomSectionRef = useRef<HTMLDivElement>(null)

  // Split position at 55% from the top
  const splitPosition = "55%"

  // Secret key handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const newText = typedText + e.key
      setTypedText(newText.slice(-5)) // Keep only last 5 characters

      if (newText.slice(-5) === "cutie") {
        setShowControls(prev => !prev)
        setTypedText("")
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [typedText])

  // Calculate the height of the bottom section for water splash effect
  useEffect(() => {
    const updateHeight = () => {
      const windowHeight = window.innerHeight
      const splitPixels = Math.round(windowHeight * 0.55)
      setBottomHeight(windowHeight - splitPixels)
    }

    updateHeight()
    window.addEventListener("resize", updateHeight)
    return () => window.removeEventListener("resize", updateHeight)
  }, [])

  // Set up mouse tracking for hover detection
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Get the mouse position
      const { clientX, clientY } = e

      // Get the button elements - we'll check if the mouse is over them
      const topButtonElement = document.getElementById("top-nav-button")
      const bottomButtonElement = document.getElementById("bottom-nav-button")

      // Check if mouse is over any button
      const isOverTopButton =
        topButtonElement &&
        e.target instanceof Node &&
        (topButtonElement === e.target || topButtonElement.contains(e.target))

      const isOverBottomButton =
        bottomButtonElement &&
        e.target instanceof Node &&
        (bottomButtonElement === e.target || bottomButtonElement.contains(e.target))

      // If over a button, don't change section hover state
      if (isOverTopButton || isOverBottomButton) {
        return
      }

      // Otherwise, determine which section we're hovering based on Y position
      const splitPixels = window.innerHeight * 0.55

      if (clientY < splitPixels) {
        setHoverSection("top")
      } else if (clientY >= splitPixels) {
        setHoverSection("bottom")
      } else {
        setHoverSection("none")
      }
    }

    const handleMouseLeave = () => {
      setHoverSection("none")
    }

    // Add event listeners to the document
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  // Update the rainStyles object to ensure animation speed is independent of container height
  const rainStyles = {
    "--rain-container-height": `${rainSettings.containerHeight}%`,
    "--rain-animation-duration": `${rainSettings.animationDuration}s`,
    "--rain-animation-duration-1": `${rainSettings.animationDuration * 0.75}s`,
    "--rain-animation-duration-2": `${rainSettings.animationDuration * 0.85}s`,
    "--rain-animation-duration-3": `${rainSettings.animationDuration}s`,
    "--rain-animation-duration-4": `${rainSettings.animationDuration * 1.15}s`,
    "--rain-opacity": rainSettings.density / 100,
  } as React.CSSProperties

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center"
      style={{ backgroundColor: "#0C0F0E", ...rainStyles }}
    >
      {/* Controls toggle buttons - only visible when secret key is typed */}
      {showControls && (
        <div className="absolute top-2 right-2 z-50 flex flex-col gap-2">
          <button
            onClick={() => {
              setShowRainControls(!showRainControls)
              setShowSplashControls(false)
            }}
            className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-xs hover:bg-black/70 transition-colors flex items-center gap-1"
          >
            <Settings className="w-3 h-3" />
            Rain
          </button>
          <button
            onClick={() => {
              setShowSplashControls(!showSplashControls)
              setShowRainControls(false)
            }}
            className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-xs hover:bg-black/70 transition-colors flex items-center gap-1"
          >
            <Settings className="w-3 h-3" />
            Splash
          </button>
        </div>
      )}

      {/* Rain Controls */}
      {showControls && showRainControls && (
        <RainControls 
          onSettingsChange={setRainSettings} 
          initialSettings={rainSettings}
          className="absolute top-20 right-2 z-50"
        />
      )}

      {/* Splash Controls */}
      {showControls && showSplashControls && (
        <SplashControls
          onSettingsChange={setSplashSettings}
          initialSettings={splashSettings}
          className="absolute top-20 right-2 z-50"
        />
      )}

      {/* Hover detection areas */}
      <div
        ref={topSectionRef}
        className="absolute top-0 left-0 w-full z-20 pointer-events-none"
        style={{ height: splitPosition }}
      />
      <div
        ref={bottomSectionRef}
        className="absolute left-0 w-full bottom-0 z-20 pointer-events-none"
        style={{ top: splitPosition }}
      />

      {/* Subtle separation line */}
      <div
        className="absolute left-0 w-full z-10 pointer-events-none"
        style={{
          top: splitPosition,
          height: "1px",
          background:
            "linear-gradient(to right, rgba(255,255,255,0.03), rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.03))",
          boxShadow: "0 0 2px rgba(255,255,255,0.15)",
        }}
      />

      {/* Text container for all text elements */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        {/* "Mia" heading with split effect */}
        <div
          className="absolute"
          style={{ left: "100px", top: splitPosition, transform: "translateY(-50%)" }}
        >
          <div className="relative">
            {/* Top half of text - visible when top section is hovered */}
            <h1
              className="text-8xl font-semibold transition-colors duration-200 font-sans"
              style={{
                position: "absolute",
                color: hoverSection === "top" ? "rgba(255, 255, 255, 0.8)" : "rgb(209, 213, 219)",
                clipPath: `polygon(0 0, 100% 0, 100% 50%, 0 50%)`,
                filter: hoverSection === "top" ? "blur(0)" : "blur(2px) grayscale(60%)",
                opacity: hoverSection === "top" ? 1 : 0.8,
                textShadow: "0 0 20px rgba(0,0,0,0.3)",
              }}
            >
              Mia
            </h1>

            {/* Bottom half of text - visible when bottom section is hovered */}
            <h1
              className="text-8xl font-semibold transition-colors duration-200 font-sans"
              style={{
                position: "absolute",
                color: hoverSection === "bottom" ? "rgba(255, 255, 255, 0.8)" : "rgb(209, 213, 219)",
                clipPath: `polygon(0 50%, 100% 50%, 100% 100%, 0 100%)`,
                filter: hoverSection === "bottom" ? "blur(0)" : "blur(2px) grayscale(60%)",
                opacity: hoverSection === "bottom" ? 1 : 0.8,
                textShadow: "0 0 20px rgba(0,0,0,0.3)",
              }}
            >
              Mia
            </h1>

            {/* Base text (always visible) for proper sizing and spacing */}
            <h1 className="text-8xl font-semibold invisible" aria-hidden="true">
              Mia
            </h1>
          </div>
        </div>

        {/* Navigation buttons */}
        {/* Product at Centrl - visible when hovering top section */}
        <div
          className={`absolute transition-opacity duration-200 ${hoverSection === "top" ? "opacity-100" : "opacity-0"}`}
          style={{
            left: navLeftPosition,
            top: "43.5%",
            transform: "translateY(-50%)",
          }}
        >
          <div id="top-nav-button" className="pointer-events-auto">
            <NavButton className="text-left">Product at Centrl</NavButton>
          </div>
        </div>

        {/* Oil paintings - visible when hovering bottom section */}
        <div
          className={`absolute transition-opacity duration-200 ${hoverSection === "bottom" ? "opacity-100" : "opacity-0"}`}
          style={{
            left: navLeftPosition,
            top: "66.5%",
            transform: "translateY(-50%)",
          }}
        >
          <div id="bottom-nav-button" className="pointer-events-auto">
            <NavButton href="/oil-paintings" className="text-left">Oil paintings</NavButton>
          </div>
        </div>
      </div>

      {/* Image Container */}
      <div className="absolute inset-0 w-full h-full">
        {/* Blurred background image with grayscale */}
        <div className="absolute inset-0 transition-all duration-300">
          <Image
            src="/images/bridge.jpeg"
            alt="Blurred bridge"
            fill
            style={{
              objectFit: "cover",
              filter: "blur(2px) grayscale(60%)",
            }}
            priority
          />
        </div>

        {/* Clear image for top section */}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: hoverSection === "top" ? 1 : 0,
            clipPath: `polygon(0 0, 100% 0, 100% ${splitPosition}, 0 ${splitPosition})`,
          }}
        >
          <Image src="/images/bridge.jpeg" alt="Clear bridge top section" fill style={{ objectFit: "cover" }} priority />
        </div>

        {/* Clear image for bottom section */}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: hoverSection === "bottom" ? 1 : 0,
            clipPath: `polygon(0 ${splitPosition}, 100% ${splitPosition}, 100% 100%, 0 100%)`,
          }}
        >
          <Image
            src="/images/bridge.jpeg"
            alt="Clear bridge bottom section"
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </div>
      </div>

      {/* Rain animation layers - only visible when hovering top section */}
      <div
        className={`absolute top-0 left-0 w-full overflow-hidden pointer-events-none transition-opacity duration-200 ${
          hoverSection === "top" ? "opacity-100" : "opacity-0"
        }`}
        style={{ height: splitPosition }}
      >
        <div className="rain-container">
          <div className="rain-layer rain-layer-1"></div>
          <div className="rain-layer rain-layer-2"></div>
          <div className="rain-layer rain-layer-3"></div>
          <div className="rain-layer rain-layer-4"></div>
        </div>
      </div>

      {/* Water splash animation - only visible when hovering bottom section */}
      <div
        className={`absolute left-0 w-full overflow-hidden pointer-events-none transition-opacity duration-200 ${
          hoverSection === "bottom" ? "opacity-100" : "opacity-0"
        }`}
        style={{ top: splitPosition, height: `calc(100% - ${splitPosition})` }}
      >
        <WaterSplash visible={hoverSection === "bottom"} containerHeight={bottomHeight} settings={splashSettings} />
      </div>

      {/* Attribution and branding */}
      <div className="absolute bottom-0 left-0 w-full z-30 p-6 flex justify-between items-center">
        {/* Left side - Branding */}
        <div className="text-white/70 text-[11px] font-light tracking-wide">
          Mia&apos;s little corner on the internet. Made with 💜 from San Francisco.
        </div>

        {/* Right side - Image attribution */}
        <div className="text-white/70 text-[11px] font-light tracking-wide">
          A stranger in{" "}
          <Link
            href="https://www.google.com/maps/place/Shinjuku+Gyoen+National+Garden/@35.6851763,139.7074768,17z/data=!3m1!4b1!4m6!3m5!1s0x60188cc21b93233f:0x6a1eb1b5a117f287!8m2!3d35.6851763!4d139.7100517!16zL20vMDdkM24x?entry=ttu&g_ep=EgoyMDI1MDQyOS4wIKXMDSoASAFQAw%3D%3D"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline hover:text-white transition-colors cursor-pointer"
          >
            Shinjuku Gyoen National Garden
          </Link>
          .
        </div>
      </div>
    </main>
  )
}