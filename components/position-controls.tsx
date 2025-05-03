"use client"

import type React from "react"

import { useState, useEffect } from "react"

interface PositionControlsProps {
  onPositionChange: (positions: PositionSettings) => void
  initialPositions?: PositionSettings
}

export interface PositionSettings {
  productLeftPosition: number
  productTopPosition: number
  oilLeftPosition: number
  oilTopPosition: number
}

export function PositionControls({ onPositionChange, initialPositions }: PositionControlsProps) {
  const [positions, setPositions] = useState<PositionSettings>(
    initialPositions || {
      productLeftPosition: 9.5,
      productTopPosition: 40,
      oilLeftPosition: 9.5,
      oilTopPosition: 70,
    },
  )

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem("positionSettings", JSON.stringify(positions))
  }, [positions])

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedPositions = localStorage.getItem("positionSettings")
    if (savedPositions) {
      try {
        const parsedPositions = JSON.parse(savedPositions)
        setPositions(parsedPositions)
        onPositionChange(parsedPositions)
      } catch (e) {
        console.error("Failed to parse saved position settings")
      }
    }
  }, [onPositionChange])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numValue = Number.parseFloat(value)

    const newPositions = {
      ...positions,
      [name]: numValue,
    }

    setPositions(newPositions)
    onPositionChange(newPositions)
  }

  return (
    <div className="absolute top-2 left-2 z-50 bg-black/50 backdrop-blur-sm p-3 rounded-lg text-white text-xs w-64 mt-12">
      <h3 className="font-medium mb-2">Position Controls</h3>

      <div className="mb-2">
        <label className="block mb-1">Product Left: {positions.productLeftPosition}%</label>
        <input
          type="range"
          name="productLeftPosition"
          min="0"
          max="50"
          step="0.1"
          value={positions.productLeftPosition}
          onChange={handleChange}
          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="mb-2">
        <label className="block mb-1">Product Top: {positions.productTopPosition}%</label>
        <input
          type="range"
          name="productTopPosition"
          min="0"
          max="100"
          step="1"
          value={positions.productTopPosition}
          onChange={handleChange}
          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="mb-2">
        <label className="block mb-1">Oil Left: {positions.oilLeftPosition}%</label>
        <input
          type="range"
          name="oilLeftPosition"
          min="0"
          max="50"
          step="0.1"
          value={positions.oilLeftPosition}
          onChange={handleChange}
          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div>
        <label className="block mb-1">Oil Top: {positions.oilTopPosition}%</label>
        <input
          type="range"
          name="oilTopPosition"
          min="0"
          max="100"
          step="1"
          value={positions.oilTopPosition}
          onChange={handleChange}
          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  )
}
