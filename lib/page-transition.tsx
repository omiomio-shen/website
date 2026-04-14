"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"

type TransitionDirection = 'up' | 'down' | null

interface PageTransitionContextType {
  isTransitioning: boolean
  transitionDirection: TransitionDirection
  startTransition: (href: string, direction: 'up' | 'down') => void
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined)

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState<TransitionDirection>(null)
  const router = useRouter()

  const startTransition = useCallback((href: string, direction: 'up' | 'down') => {
    setIsTransitioning(true)
    setTransitionDirection(direction)

    // Wait for animation to complete before navigating
    setTimeout(() => {
      router.push(href)
    }, 650) // match slide animation duration
  }, [router])

  return (
    <PageTransitionContext.Provider value={{ isTransitioning, transitionDirection, startTransition }}>
      {children}
    </PageTransitionContext.Provider>
  )
}

export function usePageTransition() {
  const context = useContext(PageTransitionContext)
  if (context === undefined) {
    throw new Error("usePageTransition must be used within a PageTransitionProvider")
  }
  return context
}

