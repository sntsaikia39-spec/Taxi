'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'

export default function PageTransitionController() {
  const pathname = usePathname()
  const isFirst = useRef(true)

  useEffect(() => {
    // Skip the very first mount — AppSplashLoader handles the initial reveal
    if (isFirst.current) {
      isFirst.current = false
      return
    }

    const overlay = document.getElementById('page-transition-overlay') as HTMLElement | null
    if (!overlay) return

    // Small delay lets the new page paint fully behind the overlay before we reveal it
    const tid = setTimeout(() => {
      gsap.killTweensOf(overlay)
      gsap.to(overlay, {
        opacity: 0,
        y: -24,
        duration: 0.44,
        ease: 'power3.out',
        onComplete: () => gsap.set(overlay, { y: 0 }),
      })
    }, 55)

    return () => clearTimeout(tid)
  }, [pathname])

  return (
    <div
      id="page-transition-overlay"
      className="fixed inset-0 pointer-events-none select-none"
      style={{ zIndex: 49, opacity: 0 }}
    >
      {/* Brand-dark fill */}
      <div className="absolute inset-0" style={{ background: '#1a1512' }} />
      {/* Subtle dot texture — matches tours page */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,218,0,0.9) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />
      {/* Gold accent line at the top — sweeps away as overlay lifts */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: '1.5px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,218,0,0.6) 50%, transparent 100%)',
          boxShadow: '0 0 12px rgba(255,218,0,0.32)',
        }}
      />
    </div>
  )
}
