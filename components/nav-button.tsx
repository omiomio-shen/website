"use client"

import type { ReactNode } from "react"

interface NavButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function NavButton({ children, className = "", onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center text-lg text-white
      transition-all 
      hover:text-white
      active:transform active:scale-[0.98]
      focus:outline-none ${className}`}
    >
      <span>{children}</span>
      <span className="ml-1.5 opacity-0 group-hover:opacity-100">→</span>
    </button>
  )
}
