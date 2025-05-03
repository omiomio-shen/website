"use client"

import { useState } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface RoleToggleProps {
  onRoleChange: (role: string) => void
  className?: string
}

export function RoleToggle({ onRoleChange, className }: RoleToggleProps) {
  const [value, setValue] = useState("product-manager")

  const handleValueChange = (value: string) => {
    if (value) {
      setValue(value)
      onRoleChange(value)
    }
  }

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={handleValueChange}
      className={`bg-black/30 backdrop-blur-sm border border-white/20 ${className}`}
    >
      <ToggleGroupItem value="product-manager" className="text-white data-[state=on]:bg-white/20">
        Product Manager
      </ToggleGroupItem>
      <ToggleGroupItem value="artist" className="text-white data-[state=on]:bg-white/20">
        Artist
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
