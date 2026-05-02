'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

type HomeGuards = {
  target?: EventTarget | null
  wheel?: (e: WheelEvent) => void
  touchstart?: (e: TouchEvent) => void
  touchend?: (e: TouchEvent) => void
  click?: (e: MouseEvent) => void
}

declare global {
  interface Window {
    __homeScrollGuards?: HomeGuards
  }
}

export default function RouteScrollUnlocker() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/') return

    const forceUnlockScroll = () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      document.documentElement.style.overflowY = 'auto'
      document.body.style.overflowY = 'auto'
      document.documentElement.style.overflowX = 'hidden'
      document.body.style.overflowX = 'hidden'
    }
    forceUnlockScroll()

    const guards = window.__homeScrollGuards
    if (guards) {
      if (guards.wheel) window.removeEventListener('wheel', guards.wheel)
      if (guards.touchstart) window.removeEventListener('touchstart', guards.touchstart)
      if (guards.touchend) window.removeEventListener('touchend', guards.touchend)
      if (guards.click) window.removeEventListener('click', guards.click)

      const target = guards.target as (EventTarget & {
        removeEventListener?: (type: string, listener: EventListenerOrEventListenerObject) => void
      }) | null | undefined
      if (target?.removeEventListener) {
        if (guards.wheel) target.removeEventListener('wheel', guards.wheel as EventListener)
        if (guards.touchstart) target.removeEventListener('touchstart', guards.touchstart as EventListener)
        if (guards.touchend) target.removeEventListener('touchend', guards.touchend as EventListener)
        if (guards.click) target.removeEventListener('click', guards.click as EventListener)
      }
      delete window.__homeScrollGuards
    }

    // Re-apply unlock on next frame in case transition code writes overflow later in the tick.
    const rafId = window.requestAnimationFrame(forceUnlockScroll)
    const timeoutId = window.setTimeout(forceUnlockScroll, 0)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.clearTimeout(timeoutId)
    }
  }, [pathname])

  return null
}
