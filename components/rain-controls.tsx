"use client"

import type React from "react"

import { useState, useEffect } from "react"

interface RainControlsProps {
  onSettingsChange: (settings: RainSettings) => void
  initialSettings?: RainSettings
}

export interface RainSettings {
  density: number
  containerHeight: number
  animationDuration: number
}

export function RainControls({ onSettingsChange, initialSettings }: RainControlsProps) {
  const [settings, setSettings] = useState<RainSettings>(
    initialSettings || {
      density: 50,
      containerHeight: 200,
      animationDuration: 2,
    },
  )

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("rainSettings")
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings(parsedSettings)
        onSettingsChange(parsedSettings)
      } catch (e) {
        console.error("Failed to parse saved rain settings")
      }
    }
  }, [onSettingsChange])

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem("rainSettings", JSON.stringify(settings))
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
    <div className="absolute top-2 right-2 z-50 bg-black/50 backdrop-blur-sm p-3 rounded-lg text-white text-xs w-64">
      <h3 className="font-medium mb-2">Rain Controls</h3>

      <div className="mb-2">
        <label className="block mb-1">Density: {settings.density}%</label>
        <input
          type="range"
          name="density"
          min="10"
          max="100"
          value={settings.density}
          onChange={handleChange}
          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="mb-2">
        <label className="block mb-1">Rain Coverage: {settings.containerHeight}%</label>
        <input
          type="range"
          name="containerHeight"
          min="100"
          max="400"
          step="50"
          value={settings.containerHeight}
          onChange={handleChange}
          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div>
        <label className="block mb-1">Animation Speed: {settings.animationDuration}s</label>
        <input
          type="range"
          name="animationDuration"
          min="0.5"
          max="3"
          step="0.1"
          value={settings.animationDuration}
          onChange={handleChange}
          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  )
}
