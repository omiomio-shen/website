"use client"

import type { ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

interface NavButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  href?: string
}

export function NavButton({ children, className = "", onClick, href }: NavButtonProps) {
  const content = (
    <>
      <span className="inline-block">{children}</span>
      <ArrowRight 
        className="ml-1 h-4 w-4 hidden group-hover:block text-gray-300 group-hover:text-white" 
      />
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={`group relative flex items-center text-lg text-gray-300
        hover:text-white focus:outline-none ${className}`}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center text-lg text-gray-300
      hover:text-white focus:outline-none ${className}`}
    >
      {content}
    </button>
  )
}
