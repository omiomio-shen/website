"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function ProductWorkPage() {
  const router = useRouter()
  const [isExiting, setIsExiting] = useState(false)

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isExiting) return
    setIsExiting(true)
    setTimeout(() => router.push('/'), 650)
  }

  return (
    <div className="h-screen overflow-hidden">
      {/* Sliding container: product work (100vh) above + home preview (100vh) below.
          At rest, translateY(0) keeps product work in view.
          On exit, page-slide-up animates to translateY(-100vh), revealing home preview. */}
      <div
        className={isExiting ? "page-slide-up" : ""}
        style={{ transform: isExiting ? undefined : 'translateY(0)' }}
      >
        {/* Product work page */}
        <div className="relative w-full h-screen bg-[#0C0F0E] overflow-hidden flex flex-col items-center justify-center">
          {/* Background */}
          <div className="absolute inset-0">
            <Image
              src="/images/bridge.jpeg"
              alt=""
              fill
              style={{ objectFit: 'cover', filter: 'blur(2px) grayscale(60%)' }}
              sizes="100vw"
              priority
            />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-6 text-center px-8">
            <h1 className="text-6xl font-semibold text-gray-200 font-sans" style={{ textShadow: '0 0 30px rgba(0,0,0,0.5)' }}>
              Coming soon
            </h1>
            <p className="text-gray-300 text-base font-light tracking-wide max-w-sm" style={{ textShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
              Product work is on its way. Check back later.
            </p>
          </div>

          {/* Home button */}
          <nav className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-8">
            <div className="flex items-center bg-white/10 backdrop-blur-md rounded-full px-6 py-2">
              <a
                href="/"
                onClick={handleHomeClick}
                className="text-gray-200 hover:text-white transition-colors text-lg cursor-pointer"
              >
                Home
              </a>
            </div>
          </nav>
        </div>

        {/* Home preview — sits below, slides into view on exit */}
        <div className="h-screen relative bg-[#0C0F0E] overflow-hidden">
          <Image
            src="/images/bridge.jpeg"
            alt=""
            fill
            style={{ objectFit: 'cover', filter: 'blur(2px) grayscale(60%)' }}
            sizes="100vw"
            priority
          />
        </div>
      </div>
    </div>
  )
}
