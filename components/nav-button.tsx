"use client"

import type { ReactNode } from "react"
import { ArrowRight } from "lucide-react"

interface NavButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function NavButton({ children, className = "", onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center text-lg text-gray-300
      hover:text-white focus:outline-none ${className}`}
    >
      <span className="inline-block">{children}</span>
      <ArrowRight 
        className="ml-1 h-4 w-4 hidden group-hover:block text-gray-300 group-hover:text-white" 
      />
    </button>
  )
}
