"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface PageTransitionContextType {
  isTransitioning: boolean
  startTransition: (href: string) => void
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined)

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const router = useRouter()

  const startTransition = useCallback((href: string) => {
    setIsTransitioning(true)
    
    // Wait for animation to complete before navigating
    setTimeout(() => {
      router.push(href)
    }, 300) // 300ms animation duration
  }, [router])

  return (
    <PageTransitionContext.Provider value={{ isTransitioning, startTransition }}>
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

