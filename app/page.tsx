'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  Users, Star, Clock, ArrowRight, Car, MapPin,
  Shield, ChevronRight, CheckCircle, Zap,
} from 'lucide-react'
import { fetchAllTours } from '@/lib/db'
import type { TourPackage } from '@/lib/db'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

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

const TOUR_IMAGES = [
  'https://images.pexels.com/photos/1172064/pexels-photo-1172064.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/258109/pexels-photo-258109.jpeg?cs=srgb&dl=backlit-beach-color-258109.jpg&fm=jpg',
  'https://www.goodfreephotos.com/albums/other-landscapes/mountains-and-pond-landscape-with-majestic-scenery.jpg',
  'https://i0.wp.com/picjumbo.com/wp-content/uploads/beautiful-nature-mountain-scenery-with-flowers-free-photo.jpg?w=2210&quality=70',
]

const STATS = [
  { value: 5000, label: 'Happy Travelers', suffix: '+', decimal: false },
  { value: 1000, label: 'Rides Completed', suffix: '+', decimal: false },
  { value: 50, label: 'Verified Drivers', suffix: '+', decimal: false },
  { value: 4.8, label: 'Avg. Rating', suffix: '★', decimal: true },
]

const HOW_IT_WORKS = [
  { Icon: Car, step: '01', title: 'Book Online', desc: 'Choose your taxi or tour package and confirm in minutes — no calls, no hassle.' },
  { Icon: Shield, step: '02', title: 'We Confirm', desc: 'Instant confirmation with driver details and transparent pricing. Zero hidden fees.' },
  { Icon: MapPin, step: '03', title: 'We Pick You Up', desc: "Driver arrives on time at Hollongi Airport. Sit back and enjoy Arunachal Pradesh." },
]

export default function Home() {
  const [featuredTours, setFeaturedTours] = useState<TourPackage[]>([])
  const [loadingTours, setLoadingTours] = useState(true)
  const [expandedTourId, setExpandedTourId] = useState<string | null>(null)
  const mainRef = useRef<HTMLDivElement>(null)
  const overlayPathsRef = useRef<SVGPathElement[]>([])
  const overlaySvgRef = useRef<SVGSVGElement>(null)
  const cardsRef = useRef<HTMLElement[]>([])

  // Keep homepage deterministic on refresh/back-forward cache:
  // always start from hero instead of browser-restored deep scroll positions.
  useLayoutEffect(() => {
    const resetScrollTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    resetScrollTop()
    const rafId = window.requestAnimationFrame(resetScrollTop)
    const timeoutId = window.setTimeout(resetScrollTop, 120)

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) resetScrollTop()
    }
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.clearTimeout(timeoutId)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  useEffect(() => {
    fetchAllTours().then((tours) => {
      setFeaturedTours(tours.slice(0, 4))
      setLoadingTours(false)
    })
  }, [])

  // ── Main scroll + entrance animations ──
  useEffect(() => {
    let ctx: gsap.Context | null = null

    const startAnims = () => {
      ctx = gsap.context(() => {
        // Set initial 3D state for hero cards
        gsap.set('.hero-img-main', { transformPerspective: 1200, rotateY: -8, rotateX: 2, z: 0 })
        gsap.set('.hero-img-back', { transformPerspective: 1200, rotateY: -16, rotateX: 4, x: 36, y: 22, z: -50 })
        
        // Initially hide all hero and stats elements
        gsap.set('.hero-badge, .hero-line, .hero-btns > *, .hero-sub, .hero-mini-stat, .hero-img-back, .hero-img-main, .hero-float-1, .hero-float-2, .stat-item', { opacity: 0 })

        // Hero entrance — animate TO visible state
        const tl = gsap.timeline({ delay: 0.08 })
        tl
          .to('.hero-badge', { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }, 0)
          .to('.hero-line', { y: 0, opacity: 1, stagger: 0.1, duration: 0.62, ease: 'power3.out' }, 0.28)
          .to('.hero-btns > *', { y: 0, opacity: 1, stagger: 0.1, duration: 0.38, ease: 'power2.out' }, 0.4)
          .to('.hero-sub', { y: 0, opacity: 1, duration: 0.36, ease: 'power2.out' }, 0.58)
          .to('.hero-mini-stat', { y: 0, opacity: 1, stagger: 0.06, duration: 0.3, ease: 'power2.out' }, 0.7)
          .to('.hero-img-back', { x: 0, opacity: 1, duration: 0.75, ease: 'power3.out' }, 0.38)
          .to('.hero-img-main', { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, 0.52)
          .to('.hero-float-1', { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(2)' }, 0.72)
          .to('.hero-float-2', { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(2)' }, 0.84)

        // Stats — animate in and counter on load
        gsap.to('.stat-item', { y: 0, opacity: 1, stagger: 0.09, duration: 0.5, ease: 'power2.out', delay: 0.9 })
        gsap.delayedCall(0.9, () => {
          document.querySelectorAll('.stat-number').forEach((el, i) => {
            const stat = STATS[i]
            if (!stat) return
            const proxy = { val: 0 }
            gsap.to(proxy, {
              val: stat.value, duration: 2, ease: 'power2.out',
              onUpdate() {
                ;(el as HTMLElement).textContent = stat.decimal
                  ? proxy.val.toFixed(1)
                  : Math.floor(proxy.val).toString()
              },
            })
          })
        })

        // Pre-hide per-section elements — animated in by doStep on arrival
        gsap.set('.tours-heading > *', { opacity: 0, y: 20 })
        gsap.set('.step-card', { opacity: 0, y: 50 })
        gsap.set('.cta-item', { opacity: 0, y: 32 })

      }, mainRef)
    }

    const onSplashFinished = () => {
      startAnims()
      window.removeEventListener('splashFinished', onSplashFinished)
    }

    if ((window as any).__splashFinished) {
      startAnims()
    } else {
      window.addEventListener('splashFinished', onSplashFinished)
    }

    return () => {
      ctx?.revert()
      window.removeEventListener('splashFinished', onSplashFinished)
    }
  }, [])

  // ── Fully controlled single-step scroll — entire homepage ──
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    const trY = [100, 100]
    let stepIdx = 0
    let transitioning = false
    let headerAutoHideTimer: ReturnType<typeof setTimeout> | null = null
    let headerHovered = false

    const isMobile = () => window.innerWidth < 768

    const getGroups = (): number[][] => {
      const len = cardsRef.current.length
      if (isMobile()) return Array.from({ length: len }, (_, i) => [i])
      const groups: number[][] = []
      for (let i = 0; i < len; i += 2) {
        const g = [i]
        if (i + 1 < len) g.push(i + 1)
        groups.push(g)
      }
      return groups
    }

    type S = { t: 'hero' | 'steps' | 'cta' } | { t: 'tours'; gi: number }
    const buildSteps = (): S[] => {
      const groups = getGroups()
      return [{ t: 'hero' }, ...groups.map((_, i): S => ({ t: 'tours', gi: i })), { t: 'steps' }, { t: 'cta' }]
    }

    const showGroup = (gIdx: number, fromRight = true) => {
      const groups = getGroups()
      const group = groups[gIdx]
      if (!group) return
      const startX = fromRight ? window.innerWidth : -window.innerWidth
      group.forEach((cardIdx, i) => {
        const card = cardsRef.current[cardIdx]
        if (!card) return
        gsap.killTweensOf(card)
        gsap.set(card, { pointerEvents: 'auto', zIndex: 1 }) // Ensure cards are clickable and on top
        gsap.fromTo(card,
          { x: startX, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.65, delay: i * 0.15, ease: 'power3.out' }
        )
      })
    }

    const hideGroup = (gIdx: number, toLeft = true) => {
      const groups = getGroups()
      const group = groups[gIdx]
      if (!group) return
      const endX = toLeft ? -window.innerWidth : window.innerWidth
      group.forEach((cardIdx) => {
        const card = cardsRef.current[cardIdx]
        if (!card) return
        gsap.killTweensOf(card)
        gsap.set(card, { pointerEvents: 'none' })
        gsap.to(card, { x: endX, opacity: 0, duration: 0.46, ease: 'power3.in' })
      })
    }

    const resetAllCards = () => {
      cardsRef.current.forEach((card) => {
        gsap.killTweensOf(card)
        gsap.set(card, { x: window.innerWidth, opacity: 0, pointerEvents: 'none' })
      })
    }

    // ── Header helpers ──
    const header = document.querySelector('header') as HTMLElement | null
    const flashRay = document.querySelector('[data-header-flash-ray]') as HTMLElement | null
    const playHeaderFlashRay = () => {
      if (!flashRay) return
      gsap.killTweensOf(flashRay)
      gsap.set(flashRay, { xPercent: -115, opacity: 0 })
      gsap.timeline()
        .to(flashRay, { opacity: 1, duration: 0.08, ease: 'power1.out' })
        .to(flashRay, { xPercent: 135, duration: 0.8, ease: 'power3.out' }, 0)
        .to(flashRay, { opacity: 0, duration: 0.12, ease: 'power1.in' }, 0.74)
    }
    const hideHeader = () => {
      if (!header) return
      gsap.killTweensOf(header)
      gsap.set(header, { opacity: 1 })
      gsap.to(header, { yPercent: -110, duration: 0.46, ease: 'power3.inOut', delay: 0.05 })
    }
    const isInteractiveTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null
      if (!el) return false
      return Boolean(
        el.closest('a, button, input, textarea, select, label, summary, [role="button"], [data-no-header-peek]')
      )
    }
    const showHeaderTemporarily = () => {
      if (!header) return
      // Keep hero behavior unchanged (header stays available there).
      if (stepIdx === 0 || transitioning) return
      if (headerAutoHideTimer) {
        clearTimeout(headerAutoHideTimer)
        headerAutoHideTimer = null
      }
      gsap.killTweensOf(header)
      gsap.set(header, { opacity: 1 })
      gsap.to(header, { yPercent: 0, duration: 0.55, ease: 'power2.out' })
      headerAutoHideTimer = setTimeout(() => {
        if (!headerHovered) hideHeader()
        headerAutoHideTimer = null
      }, 4800)
    }
    const scheduleHeaderHide = () => {
      if (stepIdx === 0 || transitioning) return
      if (headerAutoHideTimer) clearTimeout(headerAutoHideTimer)
      headerAutoHideTimer = setTimeout(() => {
        if (!headerHovered) hideHeader()
        headerAutoHideTimer = null
      }, 450)
    }
    const handleHeaderMouseEnter = () => {
      headerHovered = true
      if (headerAutoHideTimer) {
        clearTimeout(headerAutoHideTimer)
        headerAutoHideTimer = null
      }
    }
    const handleHeaderMouseLeave = () => {
      headerHovered = false
      scheduleHeaderHide()
    }
    // ── SVG overlay ──
    const renderTr = (fromBottom: boolean) => {
      overlayPathsRef.current.forEach((path, i) => {
        if (!path) return
        const y = trY[i]
        path.setAttribute('d', fromBottom ? `M 0 ${y} H 100 V 100 H 0 Z` : `M 0 ${y} H 100 V 0 H 0 Z`)
      })
    }
    renderTr(true)

    // ── Main element translate (virtual scroll) ──
    const mainEl = mainRef.current
    if (mainEl) gsap.set(mainEl, { y: 0 })
    const moveToSection = (offsetY: number, instant: boolean, onDone?: () => void) => {
      if (!mainEl) { onDone?.(); return }
      if (instant) { gsap.set(mainEl, { y: -offsetY }); onDone?.() }
      else gsap.to(mainEl, { y: -offsetY, duration: 0.49, ease: 'power3.inOut', onComplete: onDone })
    }

    // ── SVG wipe helper ──
    const playSvgWipe = (forward: boolean, onMid: () => void, onDone: () => void) => {
      const svg = overlaySvgRef.current
      trY[0] = forward ? 100 : 0; trY[1] = forward ? 100 : 0
      renderTr(forward)
      if (svg) gsap.set(svg, { opacity: 1 })
      const tl = gsap.timeline({ onUpdate: () => renderTr(forward), defaults: { ease: 'power3.inOut', duration: 0.9 } })
      if (!forward && header) {
        gsap.killTweensOf(header)
        gsap.set(header, { opacity: 1, yPercent: -110 })
        tl.to(header, { yPercent: 0, duration: 1.07, ease: 'power3.out' }, 0)
      }
      tl.to(trY, { 0: forward ? 0 : 100 }, 0)
      tl.to(trY, { 1: forward ? 0 : 100 }, 0.16)
      tl.call(() => {
        onMid()
        if (svg) gsap.to(svg, { opacity: 0, duration: 0.35, ease: 'power2.out', onComplete: () => {
          trY[0] = 100; trY[1] = 100; renderTr(true); gsap.set(svg, { opacity: 1 })
          if (!forward) gsap.delayedCall(0.65, playHeaderFlashRay)
          onDone()
        }})
        else onDone()
      }, [], 1.64)
    }

    // ── Step transition handler ──
    const doStep = (from: S, to: S, fwd: boolean) => {
      const toursEl = document.querySelector<HTMLElement>('.tours-section')
      const stepsEl = document.querySelector<HTMLElement>('.steps-section')
      const lastSlide = document.querySelector<HTMLElement>('.last-slide-wrapper')

      if (from.t === 'hero' && to.t === 'tours') {
        playSvgWipe(true,
          () => {
            gsap.set('.tours-heading > *', { opacity: 0, y: 20 })
            moveToSection(toursEl?.offsetTop ?? 0, true) // Instant move to tours section
            hideHeader()
          },
          () => {
            gsap.to('.tours-heading > *', { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out' })
            resetAllCards()
            gsap.delayedCall(0.2, () => { showGroup(0); gsap.delayedCall(0.9, () => { transitioning = false }) })
          }
        )
      } else if (from.t === 'tours' && to.t === 'hero') {
        playSvgWipe(false,
          () => { moveToSection(0, true); resetAllCards() }, // Instant move to hero section
          () => { transitioning = false }
        )
      } else if (from.t === 'tours' && to.t === 'tours') {
        const fromGi = (from as { t: 'tours'; gi: number }).gi
        const toGi   = (to   as { t: 'tours'; gi: number }).gi
        hideGroup(fromGi, fwd)
        showGroup(toGi, fwd) // showGroup handles its own stagger
        gsap.delayedCall(1.3, () => { transitioning = false }) // hide (0.46) + show (0.65 + 0.15) = 1.26s
      } else if (from.t === 'tours' && to.t === 'steps') {
        gsap.set('.step-card', { y: 50, opacity: 0 })
        moveToSection(stepsEl?.offsetTop ?? 0, false, () => {
          gsap.to('.step-card', { y: 0, opacity: 1, stagger: 0.15, duration: 0.6, ease: 'power3.out' })
          gsap.delayedCall(0.6, () => { transitioning = false })
        })
      } else if (from.t === 'steps' && to.t === 'tours') {
        hideHeader()
        gsap.to('.step-card', { y: 30, opacity: 0, stagger: 0.06, duration: 0.3, ease: 'power2.in' })
        const groups = getGroups()
        gsap.delayedCall(0.25, () => {
          gsap.set('.tours-heading > *', { opacity: 0, y: 20 })
          // Hide all tour cards before sliding back to tours so we never
          // see a card already parked at x:0 during the section transition.
          resetAllCards()
          moveToSection(toursEl?.offsetTop ?? 0, false, () => {
            gsap.to('.tours-heading > *', { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out' })
            showGroup(groups.length - 1, false) // showGroup handles its own stagger
            gsap.delayedCall(0.9, () => { transitioning = false }) // showGroup duration + stagger
          })
        })
      } else if (from.t === 'steps' && to.t === 'cta') {
        gsap.set('.cta-item', { y: 40, opacity: 0 })
        moveToSection(lastSlide?.offsetTop ?? 0, false, () => {
          gsap.to('.cta-item', { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power2.out' })
          gsap.delayedCall(0.6, () => { transitioning = false })
        })
      } else if (from.t === 'cta' && to.t === 'steps') {
        gsap.set('.step-card', { y: -30, opacity: 0 })
        moveToSection(stepsEl?.offsetTop ?? 0, false, () => {
          gsap.to('.step-card', { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power3.out' })
          gsap.delayedCall(0.5, () => { transitioning = false })
        })
      } else {
        transitioning = false
      }
    }

    // ── Navigate one step ──
    const navigate = (dir: 'fwd' | 'bwd') => {
      if (transitioning) return
      setExpandedTourId(null) // Reset expansion when scrolling between slides
      const steps = buildSteps()
      const nextIdx = dir === 'fwd' ? stepIdx + 1 : stepIdx - 1
      if (nextIdx < 0 || nextIdx >= steps.length) return
      const from = steps[stepIdx]
      const to   = steps[nextIdx]
      stepIdx = nextIdx
      transitioning = true
      doStep(from as S, to as S, dir === 'fwd')
    }

    // ── Input: wheel — one gesture = one step ──
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.deltaY > 2) navigate('fwd')
      else if (e.deltaY < -2) navigate('bwd')
    }

    // ── Input: touch ──
    let touchStartY = 0
    const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY }
    const handleTouchEnd = (e: TouchEvent) => {
      const dy = touchStartY - e.changedTouches[0].clientY
      if (dy > 30) navigate('fwd')
      else if (dy < -30) navigate('bwd')
      else if (!isInteractiveTarget(e.target)) showHeaderTemporarily()
    }
    const handleClick = (e: MouseEvent) => {
      if (!isInteractiveTarget(e.target)) showHeaderTemporarily()
    }

    // Remove any stale handlers before attaching fresh ones.
    const stale = window.__homeScrollGuards
    if (stale) {
      if (stale.wheel) window.removeEventListener('wheel', stale.wheel)
      if (stale.touchstart) window.removeEventListener('touchstart', stale.touchstart)
      if (stale.touchend) window.removeEventListener('touchend', stale.touchend)
      if (stale.click) window.removeEventListener('click', stale.click)
      const staleTarget = stale.target as (EventTarget & {
        removeEventListener?: (type: string, listener: EventListenerOrEventListenerObject) => void
      }) | null | undefined
      if (staleTarget?.removeEventListener) {
        if (stale.wheel) staleTarget.removeEventListener('wheel', stale.wheel as EventListener)
        if (stale.touchstart) staleTarget.removeEventListener('touchstart', stale.touchstart as EventListener)
        if (stale.touchend) staleTarget.removeEventListener('touchend', stale.touchend as EventListener)
        if (stale.click) staleTarget.removeEventListener('click', stale.click as EventListener)
      }
    }

    if (mainEl) {
      mainEl.addEventListener('wheel', handleWheel, { passive: false })
      mainEl.addEventListener('touchstart', handleTouchStart, { passive: true })
      mainEl.addEventListener('touchend', handleTouchEnd, { passive: true })
      mainEl.addEventListener('click', handleClick, { passive: true })
    }
    window.__homeScrollGuards = {
      target: mainEl ?? null,
      wheel: handleWheel,
      touchstart: handleTouchStart,
      touchend: handleTouchEnd,
      click: handleClick,
    }
    if (header) {
      header.addEventListener('mouseenter', handleHeaderMouseEnter)
      header.addEventListener('mouseleave', handleHeaderMouseLeave)
    }

    return () => {
      if (mainEl) {
        mainEl.removeEventListener('wheel', handleWheel)
        mainEl.removeEventListener('touchstart', handleTouchStart)
        mainEl.removeEventListener('touchend', handleTouchEnd)
        mainEl.removeEventListener('click', handleClick)
      }
      if (window.__homeScrollGuards?.wheel === handleWheel) {
        delete window.__homeScrollGuards
      }
      if (header) {
        header.removeEventListener('mouseenter', handleHeaderMouseEnter)
        header.removeEventListener('mouseleave', handleHeaderMouseLeave)
      }
      if (headerAutoHideTimer) clearTimeout(headerAutoHideTimer)
      if (header) gsap.set(header, { opacity: 1, yPercent: 0 })
      if (mainEl) gsap.set(mainEl, { y: 0 })
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [])

  // ── Hero 3D mouse parallax ──
  useEffect(() => {
    const hero = document.querySelector('.hero-section') as HTMLElement | null
    if (!hero) return
    const onMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      gsap.to('.hero-img-main', { rotateY: -8 + x * -12, rotateX: 2 + y * 7, duration: 0.75, ease: 'power2.out' })
      gsap.to('.hero-img-back', { rotateY: -16 + x * -8, rotateX: 4 + y * 4, x: 36 + x * 20, y: 22 + y * 14, duration: 0.95, ease: 'power2.out' })
      gsap.to('.hero-float-1', { x: x * -24, y: y * -18, duration: 1, ease: 'power2.out' })
      gsap.to('.hero-float-2', { x: x * 18, y: y * 12, duration: 1.1, ease: 'power2.out' })
    }
    hero.addEventListener('mousemove', onMove)
    return () => hero.removeEventListener('mousemove', onMove)
  }, [])

  // ── Tour card setup for scroll-jacked reveal + 3D tilt ──
  useEffect(() => {
    if (loadingTours || featuredTours.length === 0) return
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.tour-card'))
    cardsRef.current = cards
    const mouseCleanup: Array<() => void> = []

    cards.forEach((card) => {
      const imgWrapper = card.querySelector<HTMLElement>('.tour-img')
      const imgEl = imgWrapper?.querySelector<HTMLElement>('img')
      const heading = card.querySelector<HTMLElement>('h3')
      const desc = card.querySelector<HTMLElement>('p')
      const meta = card.querySelector<HTMLElement>('.flex.items-center.justify-between')

      // Position all cards off-screen to the right (carousel mode)
      gsap.set(card, { x: window.innerWidth, opacity: 0, pointerEvents: 'none' })
      if (heading) gsap.set(heading, { opacity: 1 })
      if (desc)    gsap.set(desc,    { opacity: 1 })
      if (meta)    gsap.set(meta,    { opacity: 1 })

      // Desktop 3D tilt on hover
      const onMove = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        gsap.to(card, { rotateY: x * 7, rotateX: -y * 5, transformPerspective: 900, duration: 0.35, ease: 'power2.out' })
      }
      const onLeave = () => gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'power2.out' })
      card.addEventListener('mousemove', onMove)
      card.addEventListener('mouseleave', onLeave)
      mouseCleanup.push(() => {
        card.removeEventListener('mousemove', onMove)
        card.removeEventListener('mouseleave', onLeave)
      })
    })

    return () => mouseCleanup.forEach(fn => fn())
  }, [loadingTours, featuredTours])

  return (
    <>
    {/* Header outside mainRef — truly viewport-fixed at z-50, above the SVG wipe overlay (z-49) */}
    <Header />
    <div ref={mainRef} className="flex flex-col bg-primary-950" style={{ willChange: 'transform' }}>

      {/* ════════════════════ HERO + STATS = exactly 100vh ════════════════════ */}
      <div className="h-[100dvh] flex flex-col overflow-hidden">

      {/* ════════════════════ HERO ════════════════════ */}
      <section className="hero-section relative bg-primary-950 overflow-hidden flex-1 flex flex-col pt-12 md:pt-20 justify-center">
        {/* Light ray right */}
        <div className="absolute top-0 right-0 w-[400px] h-[1px] bg-gradient-to-l from-secondary-500/30 to-transparent" />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,218,0,0.7) 1px, transparent 1px)', backgroundSize: '38px 38px' }}
        />
        {/* Mountain silhouette */}
        <div className="absolute bottom-10 sm:bottom-0 -left-[34%] w-[168%] sm:left-0 sm:w-full pointer-events-none select-none opacity-[0.09]">
          <svg className="w-full h-auto" viewBox="0 0 1440 160" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
            <path d="M0 160L110 72L260 120L410 48L580 110L740 18L890 90L1070 38L1260 95L1440 34V160H0Z" fill="#ffda00" />
          </svg>
        </div>

        {/* Two-column layout */}
        <div className="container mx-auto px-4 lg:px-8 relative z-10 flex-1 flex flex-col justify-center -mt-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">

            {/* ── Left: text + CTAs ── */}
            <div className="flex flex-col justify-start">
              {/* Badge */}
              <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full border border-secondary-500/25 bg-secondary-500/8 text-secondary-400 text-xs font-semibold tracking-widest uppercase mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 animate-pulse" />
                Hollongi Airport #1 Service
              </div>

              {/* Headline */}
              <div className="overflow-hidden mb-4">
                <h1 className="font-black leading-[0.95] tracking-tight">
                  <span className="hero-line block text-4xl md:text-5xl lg:text-6xl text-white">Explore</span>
                  <span className="hero-line block text-5xl md:text-6xl lg:text-7xl text-secondary-500">Arunachal</span>
                  <span className="hero-line block text-4xl md:text-5xl lg:text-6xl text-white">Your Way</span>
                </h1>
              </div>

              {/* CTAs — immediately after headline, always visible */}
              <div className="hero-btns flex flex-wrap gap-2.5 mb-5 md:mb-6 opacity-100">
                <Link
                  href="/book-taxi"
                  className="group flex items-center gap-2.5 px-6 py-3 bg-secondary-500 text-primary-950 font-black rounded-xl hover:bg-secondary-400 active:scale-[0.97] transition-all duration-200 shadow-2xl shadow-secondary-500/25 text-sm md:text-base will-change-transform"
                >
                  Book Taxi Now
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
                <Link
                  href="/tours"
                  className="group flex items-center gap-2.5 px-6 py-3 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/[0.07] hover:border-white/35 transition-all duration-200 text-sm md:text-base will-change-transform"
                >
                  Explore Tours
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </div>

              {/* Subtitle */}
              <p className="hero-sub text-gray-500 text-xs md:text-sm mb-5 leading-relaxed max-w-md">
                Pre-book airport taxis and curated tours from Hollongi. Transparent pricing, verified drivers — no surprises.
              </p>

              {/* Trust badges */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {[
                  { Icon: CheckCircle, label: 'Verified Drivers', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
                  { Icon: Shield, label: 'No Hidden Fees', color: 'text-secondary-400', bg: 'bg-secondary-500/10 border-secondary-500/20' },
                  { Icon: Zap, label: 'Book in 2 min', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                ].map(({ Icon, label, color, bg }, i) => (
                  <div key={i} className={`hero-mini-stat flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${bg}`}>
                    <Icon size={12} className={color} />
                    <span className="text-gray-300 text-xs font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: 3D image stack ── */}
            <div className="hidden lg:flex relative items-center justify-center h-[380px]">
              {/* Back card */}
              <div
                className="hero-img-back absolute rounded-2xl overflow-hidden"
                style={{
                  width: '240px', height: '320px',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
                  transformStyle: 'preserve-3d',
                }}
              >
                <Image src={TOUR_IMAGES[1]} alt="Tour" fill className="object-cover" />
                <div className="absolute inset-0 bg-primary-950/50" />
              </div>

              {/* Main card */}
              <div
                className="hero-img-main relative rounded-2xl overflow-hidden"
                style={{
                  width: '240px', height: '320px',
                  boxShadow: '0 0 0 1px rgba(255,218,0,0.18), 0 40px 90px rgba(0,0,0,0.65), 0 0 80px rgba(255,218,0,0.06)',
                  transformStyle: 'preserve-3d',
                }}
              >
                <Image src={TOUR_IMAGES[0]} alt="Arunachal Pradesh" fill className="object-cover" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-950/85 via-primary-950/10 to-transparent" />
                {/* Featured pill */}
                <div className="absolute top-4 left-4 px-2.5 py-1 bg-secondary-500 text-primary-950 text-[10px] font-black rounded-lg tracking-widest">
                  FEATURED
                </div>
                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-0.5 mb-1.5">
                    {[1,2,3,4,5].map(s => <Star key={s} size={9} className="text-secondary-500 fill-secondary-500" />)}
                    <span className="text-white/80 text-xs ml-1">4.8 · 120 reviews</span>
                  </div>
                  <p className="text-white font-bold text-sm">Arunachal Pradesh</p>
                  <p className="text-gray-400 text-xs">Starting from ₹999</p>
                </div>
              </div>

              {/* Floating badge 1 — verified */}
              <div
                className="hero-float-1 absolute top-8 -left-4 bg-white rounded-2xl p-3 flex items-center gap-2"
                style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.25)', minWidth: '140px' }}
              >
                <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle size={16} className="text-green-500" />
                </div>
                <div>
                  <p className="text-primary-950 font-bold text-xs leading-none mb-0.5">Verified</p>
                  <p className="text-gray-400 text-[9px]">All drivers checked</p>
                </div>
              </div>

              {/* Floating badge 2 — instant */}
              <div
                className="hero-float-2 absolute -bottom-2 -right-4 bg-secondary-500 rounded-2xl p-3 flex items-center gap-2"
                style={{ boxShadow: '0 20px 50px rgba(255,218,0,0.35)', minWidth: '130px' }}
              >
                <div className="w-8 h-8 bg-primary-950/15 rounded-xl flex items-center justify-center shrink-0">
                  <Zap size={16} className="text-primary-950" />
                </div>
                <div>
                  <p className="text-primary-950 font-bold text-xs leading-none mb-0.5">Instant</p>
                  <p className="text-primary-800 text-[9px]">Book in 2 min</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ STATS ════════════════════ */}
      <section className="stats-section relative z-20 shrink-0 -mt-10 -ml-[3px] sm:mt-0 sm:ml-0 py-4 sm:py-5 md:py-6" style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1410 50%, #0f0c0a 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,218,0,0.1), inset 0 -1px 0 rgba(0,0,0,0.8), 0 10px 40px rgba(0,0,0,0.8), 0 0 100px rgba(255,218,0,0.05)',
        border: '1px solid',
        borderColor: 'rgba(255,218,0,0.15)',
        borderImageSource: 'linear-gradient(135deg, rgba(255,218,0,0.3) 0%, rgba(255,218,0,0.1) 50%, rgba(255,218,0,0.05) 100%)',
        borderImageSlice: 1,
      }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,218,0,0.08) 0%, transparent 60%)',
        }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 sm:gap-6">
            {STATS.map((stat, i) => (
              <div key={i} className="stat-item text-center min-w-0">
                <div className="flex items-baseline justify-center gap-1 mb-1 sm:mb-1.5">
                  <span className="stat-number text-[2rem] leading-none sm:text-3xl md:text-4xl font-black text-secondary-500">
                    {stat.decimal ? stat.value.toFixed(1) : stat.value}
                  </span>
                  <span className="text-secondary-500 font-black text-base sm:text-lg">{stat.suffix}</span>
                </div>
                <p className="text-gray-500 text-[11px] leading-snug sm:text-xs md:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </div>{/* end h-screen hero+stats wrapper */}

      {/* ════════════════════ TOURS ════════════════════ */}
      <section
        className="tours-section h-[100dvh] py-8 md:py-28 relative overflow-hidden flex flex-col justify-center"
        style={{ background: 'linear-gradient(160deg, #16120f 0%, #1c1410 35%, #110e0c 70%, #0d0b09 100%)' }}
      >
        {/* Top side flowing shadow of the 'How it works' section below for depth */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/75 to-transparent pointer-events-none" />

        {/* Enhanced Waterfall streams with synchronized splash */}
        {(() => {
          const streams = [
            { left: '8%',   dur: 10, delay: 0,   h: 380, w: 2.5, op: 0.45, blur: 1 },
            { left: '18%',  dur: 13, delay: 1.5, h: 420, w: 3, op: 0.50, blur: 1.2 },
            { left: '28%',  dur: 11, delay: 0.8, h: 350, w: 2, op: 0.42, blur: 0.8 },
            { left: '40%',  dur: 14, delay: 2.2, h: 400, w: 3.5, op: 0.55, blur: 1.5 },
            { left: '52%',  dur: 12, delay: 1.2, h: 360, w: 2.5, op: 0.48, blur: 1 },
            { left: '64%',  dur: 15, delay: 2.8, h: 410, w: 2, op: 0.44, blur: 0.9 },
            { left: '74%',  dur: 11, delay: 0.5, h: 370, w: 3, op: 0.52, blur: 1.2 },
            { left: '84%',  dur: 13, delay: 1.8, h: 390, w: 2.5, op: 0.46, blur: 1 },
            { left: '92%',  dur: 12, delay: 0.3, h: 340, w: 2, op: 0.40, blur: 0.8 },
          ];
          return (
            <>
              {streams.map((s, i) => (
                <div key={i} className="absolute pointer-events-none select-none" style={{
                  width: `${s.w}px`,
                  height: `${s.h}px`,
                  left: s.left,
                  top: 0,
                  background: `linear-gradient(180deg, transparent 0%, rgba(200,180,60,${s.op * 0.2}) 15%, rgba(255,200,70,${s.op * 0.5}) 40%, rgba(255,210,80,${s.op * 0.7}) 65%, rgba(255,220,100,${s.op}) 92%, rgba(255,240,150,${s.op * 0.9}) 97%)`,
                  animation: `streamFall ${s.dur}s linear infinite`,
                  animationDelay: `${s.delay}s`,
                  filter: `blur(${s.blur}px) drop-shadow(0 0 ${s.blur * 2}px rgba(255,218,0,${s.op * 0.4}))`,
                  boxShadow: `inset 0 0 ${s.w}px rgba(255,240,150,${s.op * 0.6}), 0 0 ${s.blur + 2}px rgba(255,200,0,${s.op * 0.3})`,
                  clipPath: `polygon(50% 0, 100% 15%, 100% 100%, 0 100%, 0 15%)`,
                }} />
              ))}
            </>
          );
        })()}

        {/* Grain texture */}
        <div className="absolute inset-0 opacity-[0.022] pointer-events-none select-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '180px' }} />

        <div className="container mx-auto px-4 relative z-10 -translate-y-[30px] md:translate-y-0">
          <div className="tours-heading flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6 md:mb-12">
            <div>
              <p className="text-secondary-500 font-semibold text-xs tracking-[0.22em] uppercase mb-3">Top Packages</p>
              <h2 className="text-3xl md:text-5xl font-black text-white">Featured Tours</h2>
            </div>
            <Link href="/tours" className="group inline-flex items-center gap-2 text-gray-400 font-semibold hover:text-secondary-500 transition-colors text-sm">
              View All
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loadingTours ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="rounded-2xl overflow-hidden bg-primary-900/60 animate-pulse">
                  <div className="bg-primary-800/50 h-64" />
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredTours.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 mb-6">No tours available at the moment.</p>
              <Link href="/tours" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-950 text-white font-bold rounded-xl hover:bg-primary-900 transition-all">
                View All Tours <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            // Carousel container — fixed height, all cards absolutely positioned at same location
            // Mobile: full-width cards stack at card-0 position (4 scroll steps)
            // Desktop: 2-column pairs stack at row-0 position (2 scroll steps)
            <div className="relative w-full overflow-hidden h-[485px] md:h-[500px]">
              {featuredTours.map((tour, index) => {
                const posInGroup = index % 2 // 0 = left col, 1 = right col
                const isExpanded = expandedTourId === tour.id
                return (
                  <div
                    key={tour.id}
                    onClick={() => setExpandedTourId(isExpanded ? null : tour.id)}
                    className={`tour-card card-3d group absolute top-0 rounded-3xl overflow-hidden bg-primary-900/80 backdrop-blur-md border border-primary-800/60 cursor-pointer
                      w-full h-[475px] md:h-[490px] md:top-0
                      ${posInGroup === 0 ? 'md:left-0 md:w-[calc(50%-12px)]' : 'md:left-[calc(50%+12px)] md:w-[calc(50%-12px)]'}`}
                    style={{ boxShadow: '0 16px 44px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,218,0,0.1)' }}
                  >
                    {/* Image */}
                    <div className={`tour-img relative transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'h-[140px]' : 'h-[274.2px] md:h-[290px]'}`}>
                      <Image
                        src={TOUR_IMAGES[index % TOUR_IMAGES.length]}
                        alt={tour.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary-950/70 via-primary-950/5 to-transparent" />
                      {/* Price */}
                      <div className="absolute top-4 right-4 px-3 py-1.5 bg-secondary-500 text-primary-950 font-black text-sm rounded-xl shadow-lg">
                        ₹{tour.price}
                      </div>
                      {/* Rating */}
                      <div className="absolute bottom-4 left-4 flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={10} className={s <= 4 ? 'text-secondary-500 fill-secondary-500' : 'text-secondary-500/30 fill-secondary-500/30'} />
                          ))}
                        </div>
                        <span className="text-white text-xs font-semibold">4.8</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className={`transition-all duration-500 p-4 md:p-7 flex flex-col ${isExpanded ? 'h-[calc(100%-140px)]' : 'h-[calc(100%-274.2px)] md:h-[calc(100%-290px)]'}`}>
                      <div className={`flex-1 ${isExpanded ? 'overflow-y-auto pr-1' : 'overflow-hidden'}`}>
                        <h3 className={`font-black text-white mb-2.5 transition-all ${isExpanded ? 'text-xl' : 'text-2xl'}`}>{tour.name}</h3>
                        <p className={`text-gray-400 text-sm md:text-base mb-5 leading-relaxed ${isExpanded ? '' : 'line-clamp-3 min-h-[3.75rem] md:min-h-[4.5rem]'}`}>
                          {tour.description}
                        </p>

                        {/* Expanded Details: Itinerary */}
                        {isExpanded && tour.itinerary && (
                          <div className="mt-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-500">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Itinerary</p>
                            <p className="text-gray-400 text-xs leading-relaxed italic">{tour.itinerary}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <div className={`flex items-center gap-4 text-xs md:text-sm text-gray-400 transition-opacity ${isExpanded ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
                          <span className="flex items-center gap-1.5">
                            <Clock size={12} className="text-secondary-500" />{tour.duration_hours}h
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users size={12} className="text-secondary-500" />{tour.max_passengers} pax
                          </span>
                        </div>
                        <Link
                          onClick={(e) => e.stopPropagation()}
                          href={`/tours/${tour.id}/book`}
                          className="group/btn flex items-center gap-2 px-5 py-2.5 bg-primary-950 text-white text-sm font-bold rounded-xl hover:bg-secondary-500 hover:text-primary-950 transition-all duration-200 shadow-lg shadow-primary-950/20"
                        >
                          Book Now
                          <ArrowRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════ HOW IT WORKS — dark ════════════════════ */}
      <section className="steps-section h-[100dvh] py-6 sm:py-16 md:py-28 bg-primary-950 relative overflow-hidden flex flex-col justify-center">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,218,0,0.8) 1px, transparent 1px)', backgroundSize: '36px 36px' }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-secondary-500/30 to-transparent" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8 max-[760px]:mb-5 sm:mb-12 md:mb-16">
            <p className="text-secondary-500 font-semibold text-xs tracking-[0.22em] uppercase mb-2 max-[760px]:mb-1.5">Simple Process</p>
            <h2 className="text-[2rem] max-[760px]:text-[1.8rem] leading-tight sm:text-4xl md:text-5xl font-black text-white mb-2 sm:mb-4">How It Works</h2>
            <p className="text-gray-500 text-sm max-[760px]:text-[13px] max-w-md mx-auto">Three steps from landing to exploring.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-[760px]:gap-2.5 sm:gap-5 md:gap-6 max-w-5xl mx-auto">
            {HOW_IT_WORKS.map(({ Icon, step, title, desc }, i) => (
              <div key={i} className="step-card group relative">
                {/* Connector */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-secondary-500/30 to-transparent z-10 translate-x-3" />
                )}
                <div className="h-full p-4 max-[760px]:p-3.5 sm:p-6 md:p-8 rounded-2xl bg-primary-900/40 border border-primary-800 hover:border-secondary-500/30 hover:bg-primary-900/70 transition-all duration-300">
                  <div className="flex items-start justify-between mb-3 max-[760px]:mb-2.5 sm:mb-5 md:mb-6">
                    <div className="w-11 h-11 max-[760px]:w-10 max-[760px]:h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-secondary-500/10 border border-secondary-500/20 flex items-center justify-center group-hover:bg-secondary-500 group-hover:border-secondary-500 transition-all duration-300 shrink-0">
                      <Icon size={18} className="text-secondary-500 group-hover:text-primary-950 transition-colors duration-300" />
                    </div>
                    <span className="text-4xl max-[760px]:text-3xl sm:text-5xl font-black text-primary-800 group-hover:text-secondary-500/20 transition-colors duration-300 leading-none">
                      {step}
                    </span>
                  </div>
                  <h3 className="text-[1.65rem] max-[760px]:text-[1.45rem] sm:text-xl md:text-2xl font-black text-white mb-1.5 sm:mb-3">{title}</h3>
                  <p className="text-sm max-[760px]:text-[13px] sm:text-sm text-gray-500 leading-relaxed line-clamp-2 max-[760px]:line-clamp-2">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ CTA ════════════════════ */}
      {/* Grouping CTA and Footer to ensure they are treated as one viewport-constrained slide */}
      <div className="last-slide-wrapper h-[100dvh] flex flex-col">
      <section className="cta-section flex-1 pt-8 pb-4 md:pt-[4.6rem] md:pb-24 bg-secondary-500 relative overflow-hidden flex flex-col justify-center">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #1a1512 1.5px, transparent 1.5px)', backgroundSize: '26px 26px' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[280px] bg-white opacity-[0.07] rounded-full blur-[80px] pointer-events-none" />

        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-2xl mx-auto">
            <p className="cta-item text-primary-800 font-semibold text-xs tracking-[0.22em] uppercase mb-2 max-[760px]:mb-1.5">Ready to travel?</p>
            <h2 className="cta-item text-[2.1rem] max-[760px]:text-[1.85rem] md:text-5xl font-black text-primary-950 mb-2 max-[760px]:mb-1.5 leading-tight">
              Your ride awaits at Hollongi
            </h2>
            <p className="cta-item text-primary-800 text-sm max-[760px]:text-[13px] md:text-base mb-4 max-[760px]:mb-3 max-w-lg mx-auto leading-relaxed">
              Skip the queue. Pre-book your taxi or tour — verified drivers, transparent pricing.
            </p>
            <div className="cta-item flex flex-col sm:flex-row gap-2.5 max-[760px]:gap-2 justify-center">
              <Link
                href="/book-taxi"
                className="group flex items-center justify-center gap-2.5 px-6 max-[760px]:px-5 py-3 max-[760px]:py-2.5 bg-primary-950 text-white font-black rounded-2xl hover:bg-primary-900 active:scale-[0.97] transition-all shadow-2xl shadow-primary-950/25 text-sm md:text-base"
              >
                Book Taxi Now
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/tours"
                className="group flex items-center justify-center gap-2.5 px-6 max-[760px]:px-5 py-3 max-[760px]:py-2.5 border-2 border-primary-950/20 text-primary-950 font-bold rounded-2xl hover:bg-primary-950/[0.07] transition-all text-sm md:text-base"
              >
                Explore Tours
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      </div>
    </div>

      {/* ── Section wipe overlay — outside mainRef so fixed positioning is always viewport-relative ── */}
      <svg
        ref={overlaySvgRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 49, top: 0, left: 0 }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Path 0 — yellow bar, leads */}
        <path
          ref={el => { if (el) overlayPathsRef.current[0] = el }}
          fill="#ffda00"
        />
        {/* Path 1 — dark bar, follows with offset */}
        <path
          ref={el => { if (el) overlayPathsRef.current[1] = el }}
          fill="#0d0b09"
        />
      </svg>
    </>
  )
}
