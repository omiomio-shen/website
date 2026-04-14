"use client"

import type { ReactNode } from "react"
import { ArrowUp, ArrowDown, ArrowRight } from "lucide-react"
import Link from "next/link"

interface NavButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  href?: string
  onNavigate?: (href: string) => void
  arrow?: 'right' | 'up' | 'down'
}

export function NavButton({ children, className = "", onClick, href, onNavigate, arrow = 'right' }: NavButtonProps) {
  const ArrowIcon = arrow === 'up' ? ArrowUp : arrow === 'down' ? ArrowDown : ArrowRight

  const content = (
    <>
      <span className="inline-block">{children}</span>
      <ArrowIcon
        className="ml-2 h-4 w-4 hidden group-hover:block text-gray-300 group-hover:text-white"
      />
    </>
  )

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onNavigate && href) {
      e.preventDefault()
      onNavigate(href)
    }
  }

  if (href) {
    return (
      <Link
        href={href}
        onClick={handleClick}
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
