"use client"

import type React from "react"

import { useState, useEffect } from "react"

interface SplashControlsProps {
  onSettingsChange: (settings: SplashSettings) => void
  initialSettings?: SplashSettings
  className?: string
}

export interface SplashSettings {
  density: number
  coverage: number
  animationDuration: number
  dropletSize: number
  rippleRoundness: number
}

export function SplashControls({ onSettingsChange, initialSettings, className }: SplashControlsProps) {
  const [settings, setSettings] = useState<SplashSettings>(
    initialSettings || {
      density: 50,
      coverage: 100,
      animationDuration: 1.4,
      dropletSize: 0.5,
      rippleRoundness: 25,
    },
  )

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("splashSettings")
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings(parsedSettings)
        onSettingsChange(parsedSettings)
      } catch (e) {
        console.error("Failed to parse saved splash settings")
      }
    }
  }, [onSettingsChange])

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem("splashSettings", JSON.stringify(settings))
  }, [settings])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numValue = Number.parseFloat(value)

    const newSettings = {
      ...settings,
      [name]: numValue,
    }

    setSettings(newSettings)
    onSettingsChange(newSettings)
  }

  return (
    <div
      className={`bg-black/50 backdrop-blur-sm p-3 rounded-lg text-white text-xs w-64 ${className || ''}`}
    >
      <h3 className="font-medium mb-2">Splash Controls</h3>

      <div className="mb-2">
        <label className="block mb-1">Number of Ripples: {settings.density}</label>
        <input
          type="range"
          name="density"
          min="5"
          max="50"
          value={settings.density}
          onChange={handleChange}
          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="mb-2">
        <label className="block mb-1">Distribution Area: {settings.coverage}%</label>
        <input
          type="range"
          name="coverage"
          min="20"
          max="100"
          value={settings.coverage}
          onChange={handleChange}
          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="mb-2">
        <label className="block mb-1">Animation Speed: {settings.animationDuration}s</label>
        <input
          type="range"
          name="animationDuration"
          min="0.5"
          max="4"
          step="0.1"
          value={settings.animationDuration}
          onChange={handleChange}
          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="mb-2">
        <label className="block mb-1">Ripple Size: {settings.dropletSize.toFixed(1)}</label>
        <input
          type="range"
          name="dropletSize"
          min="0.5"
          max="2.5"
          step="0.1"
          value={settings.dropletSize}
          onChange={handleChange}
          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div>
        <label className="block mb-1">Ripple Roundness: {settings.rippleRoundness}%</label>
        <input
          type="range"
          name="rippleRoundness"
          min="20"
          max="100"
          value={settings.rippleRoundness}
          onChange={handleChange}
          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  )
}
