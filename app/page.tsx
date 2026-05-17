'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  Users, Star, Clock, ArrowRight, Car, MapPin,
  Shield, ChevronRight, CheckCircle, Zap, ChevronDown,
} from 'lucide-react'
import { fetchAllTours, fetchAllTourRatingStats, type RatingStats } from '@/lib/db'
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
  const [ratingStats, setRatingStats] = useState<Record<string, RatingStats>>({})
  const [loadingTours, setLoadingTours] = useState(true)
  const [expandedTourId, setExpandedTourId] = useState<string | null>(null)
  const [cardImgIdx, setCardImgIdx] = useState<Record<string, number>>({})
  const touchStartX = useRef<number>(0)
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
    Promise.all([fetchAllTours(), fetchAllTourRatingStats()]).then(([tours, stats]) => {
      setFeaturedTours(tours.slice(0, 4))
      setRatingStats(stats)
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

        // Initially hide all hero and stats elements and disable interaction
        gsap.set('.hero-badge, .hero-line, .hero-btns > *, .hero-sub, .hero-mini-stat, .hero-img-main, .stat-item', { opacity: 0, pointerEvents: 'none' })

        // Hero entrance — animate TO visible state
        const tl = gsap.timeline({ delay: 0.08 })
        tl
          .to('.hero-badge', { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }, 0)
          .to('.hero-line', { y: 0, opacity: 1, stagger: 0.1, duration: 0.62, ease: 'power3.out' }, 0.28)
          .to('.hero-btns > *', { y: 0, opacity: 1, pointerEvents: 'auto', stagger: 0.1, duration: 0.38, ease: 'power2.out' }, 0.4)
          .to('.hero-sub', { y: 0, opacity: 1, duration: 0.36, ease: 'power2.out' }, 0.58)
          .to('.hero-mini-stat', { y: 0, opacity: 1, pointerEvents: 'auto', stagger: 0.06, duration: 0.3, ease: 'power2.out' }, 0.7)
          .to('.hero-img-main', { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, 0.52)

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
      // Cross-fade background images — fade out all, then fade in this group's pair
      gsap.to('.tours-bg-img', { opacity: 0, duration: 0.4, overwrite: 'auto' })
      group.forEach((cardIdx, i) => {
        const card = cardsRef.current[cardIdx]
        if (!card) return
        gsap.killTweensOf(card)
        gsap.set(card, { pointerEvents: 'auto', zIndex: 1 }) // Ensure cards are clickable and on top
        gsap.fromTo(card,
          { x: startX, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.48, delay: i * 0.1, ease: 'power3.out', overwrite: true }
        )
        const bgEl = document.querySelector<HTMLElement>(`.tours-bg-img[data-tour-idx="${cardIdx}"]`)
        if (bgEl) gsap.to(bgEl, { opacity: 1, duration: 0.7, delay: 0.12, overwrite: 'auto' })
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
        gsap.to(card, { x: endX, opacity: 0, duration: 0.38, ease: 'power3.in', overwrite: true })
      })
    }

    const resetAllCards = () => {
      cardsRef.current.forEach((card) => {
        gsap.killTweensOf(card)
        gsap.set(card, { x: window.innerWidth, opacity: 0, pointerEvents: 'none' })
      })
      gsap.set('.tours-bg-img', { opacity: 0 })
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
      gsap.to(header, { yPercent: -110, duration: 0.46, ease: 'power3.inOut' })
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
    const playSvgWipe = (forward: boolean, onMid: () => void, onDone: () => void, onWipeReachesTop?: () => void) => {
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
      // Fire when wipe bar reaches the header's bottom edge (~8% from top ≈ t=0.65s)
      if (forward && onWipeReachesTop) tl.call(onWipeReachesTop, [], 0.65)
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
          },
          () => {
            gsap.to('.tours-heading > *', { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out' })
            resetAllCards()
            gsap.delayedCall(0.15, () => { showGroup(0); gsap.delayedCall(0.4, () => { transitioning = false }) })
          },
          hideHeader  // fires the moment the wipe bar reaches the header bottom
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
        gsap.delayedCall(0.5, () => { transitioning = false })
      } else if (from.t === 'tours' && to.t === 'steps') {
        gsap.set('.step-card', { y: 50, opacity: 0 })
        moveToSection(stepsEl?.offsetTop ?? 0, false, () => {
          gsap.to('.step-card', { y: 0, opacity: 1, stagger: 0.15, duration: 0.6, ease: 'power3.out' })
          gsap.delayedCall(0.4, () => { transitioning = false })
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
            gsap.delayedCall(0.5, () => { transitioning = false })
          })
        })
      } else if (from.t === 'steps' && to.t === 'cta') {
        gsap.set('.cta-item', { y: 40, opacity: 0 })
        moveToSection(lastSlide?.offsetTop ?? 0, false, () => {
          gsap.to('.cta-item', { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power2.out' })
          gsap.delayedCall(0.4, () => { transitioning = false })
        })
      } else if (from.t === 'cta' && to.t === 'steps') {
        gsap.set('.step-card', { y: -30, opacity: 0 })
        moveToSection(stepsEl?.offsetTop ?? 0, false, () => {
          gsap.to('.step-card', { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power3.out' })
          gsap.delayedCall(0.35, () => { transitioning = false })
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

  // ── Hero radar rings + 3D phone parallax ──
  useEffect(() => {
    const hero = document.querySelector('.hero-section') as HTMLElement | null
    if (!hero) return

    // Each ring expands from r=8 → r=310, fading out, staggered so they pulse continuously
    const ringEls = Array.from(document.querySelectorAll<SVGCircleElement>('.radar-ring'))
    const D = 5       // seconds per full ring expansion
    const N = ringEls.length
    const speedProxy = { v: 1 }

    const tweens = ringEls.map((ring, i) => {
      const t = gsap.fromTo(
        ring,
        { attr: { r: 8 }, opacity: 0.55 },
        { attr: { r: 310 }, opacity: 0, duration: D, ease: 'power1.out', repeat: -1 }
      )
      // Seek each ring to its phase offset so they're already staggered on load
      t.seek(i * (D / N))
      return t
    })

    // Smoothly animates all ring timeScales together via a proxy value
    const setSpeed = (target: number, dur: number, ease: string) => {
      gsap.to(speedProxy, {
        v: target, duration: dur, ease,
        onUpdate() { tweens.forEach(t => t.timeScale(speedProxy.v)) },
      })
    }

    let settleTimer: ReturnType<typeof setTimeout>
    let lastX = -9999
    let lastY = -9999

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      if (dx * dx + dy * dy < 75 * 75) return   // ignore movements shorter than 75px
      lastX = e.clientX
      lastY = e.clientY

      const rect = hero.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      gsap.to('.hero-img-main', { rotateY: -8 + x * -12, rotateX: 2 + y * 7, duration: 0.75, ease: 'power2.out' })
      // Speed up rings while mouse is moving, ease back to calm when it stops
      setSpeed(4.5, 0.25, 'power2.out')
      clearTimeout(settleTimer)
      settleTimer = setTimeout(() => setSpeed(1, 0.8, 'power2.inOut'), 120)
    }

    const onLeave = () => {
      clearTimeout(settleTimer)
      setSpeed(1, 0.8, 'power1.inOut')
    }

    hero.addEventListener('mousemove', onMove)
    hero.addEventListener('mouseleave', onLeave)
    return () => {
      hero.removeEventListener('mousemove', onMove)
      hero.removeEventListener('mouseleave', onLeave)
      clearTimeout(settleTimer)
      tweens.forEach(t => t.kill())
    }
  }, [])

  // ── Tour card setup for scroll-jacked reveal + 3D tilt ──
  useEffect(() => {
    if (loadingTours || featuredTours.length === 0) return
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.tour-card'))
    cardsRef.current = cards
    const mouseCleanup: Array<() => void> = []

    cards.forEach((card) => {
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
        {/* ── Background atmosphere image — behind mountains ── */}
        <div className="absolute inset-0 pointer-events-none" style={{
          zIndex: 0,
          WebkitMaskImage: 'radial-gradient(ellipse 85% 80% at 50% 50%, black 15%, transparent 100%), linear-gradient(to bottom, black 55%, transparent 82%)',
          maskImage: 'radial-gradient(ellipse 85% 80% at 50% 50%, black 15%, transparent 100%), linear-gradient(to bottom, black 55%, transparent 82%)',
          WebkitMaskComposite: 'source-in',
          maskComposite: 'intersect',
        }}>
          <Image
            src="https://images.pexels.com/photos/29505269/pexels-photo-29505269.jpeg"
            alt=""
            fill
            sizes="100vw"
            style={{
              objectFit: 'cover',
              filter: 'blur(0px) brightness(0.8) contrast(2) saturate(2) hue-rotate(0deg) grayscale(0) sepia(0) invert(0) opacity(1) drop-shadow(0px 0px 0px transparent)',
              opacity: 1,
            }}
          />Z
        </div>
        {/* Light ray right */}
        <div className="absolute top-0 right-0 w-[400px] h-[1px] bg-gradient-to-l from-secondary-500/30 to-transparent" />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,218,0,0.7) 1px, transparent 1px)', backgroundSize: '38px 38px' }}
        />
        {/* Mountain silhouette */}
        <div className="absolute bottom-10 sm:bottom-0 -left-[34%] w-[168%] sm:left-0 sm:w-full pointer-events-none select-none opacity-[0.09]" style={{ zIndex: 2 }}>
          <svg className="w-full h-auto scale-y-[1.44] sm:scale-y-100 origin-bottom" viewBox="0 0 1440 160" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
            <path d="M0 160L110 72L260 120L410 48L580 110L740 18L890 90L1070 38L1260 95L1440 34V160H0Z" fill="#ffda00" />
          </svg>
        </div>

        {/* Two-column layout */}
        <div className="container mx-auto px-4 lg:px-14 xl:px-20 relative z-10 flex-1 flex flex-col justify-center -mt-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-2 items-center">

            {/* ── Left: text + CTAs ── */}
            <div className="flex flex-col justify-start">
              {/* Badge */}
              <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full border border-secondary-500/25 bg-secondary-500/8 text-secondary-400 text-xs font-semibold tracking-widest uppercase mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 animate-pulse" />
                Donyi Polo Airport #1 Service
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
                  className="group flex items-center gap-2.5 px-6 py-3 border border-white/30 bg-white/[0.1] text-white font-semibold rounded-xl hover:bg-white/[0.13] hover:border-white/45 transition-all duration-200 text-sm md:text-base will-change-transform"
                >
                  Explore Tours
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </div>

              {/* Subtitle */}
              <p className="hero-sub text-gray-500 text-xs md:text-sm mb-5 leading-relaxed max-w-md">
                Pre-book airport taxis and curated tours from Donyi Polo Airport. Transparent pricing, verified drivers — no surprises.
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

            {/* ── Right: App flow — single phone ── */}
            <div className="hidden lg:block relative h-[460px] overflow-visible">

              {/* ── Radar background layer — fixed, never tilts ── */}
              <div className="hero-radar-bg absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
                <svg
                  className="w-full h-full"
                  viewBox="0 0 560 450"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid meet"
                  aria-hidden="true"
                  style={{ overflow: 'visible' }}
                >
                  <defs>
                    <filter id="radarglow" x="-80%" y="-80%" width="260%" height="260%">
                      <feGaussianBlur stdDeviation="12" result="b"/>
                      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>

                  {/* Soft central aura — fixed warm fill behind the phone */}
                  <ellipse cx="280" cy="225" rx="210" ry="198" fill="rgba(255,218,0,0.032)"/>
                  <ellipse cx="280" cy="225" rx="125" ry="118" fill="rgba(255,218,0,0.038)"/>

                  {/* Radar rings — GSAP drives r (8→310) and opacity (0.55→0), staggered */}
                  <circle className="radar-ring" cx="280" cy="225" r="8" fill="none" stroke="rgba(255,218,0,0.52)" strokeWidth="1.2"/>
                  <circle className="radar-ring" cx="280" cy="225" r="8" fill="none" stroke="rgba(255,218,0,0.52)" strokeWidth="1.2"/>
                  <circle className="radar-ring" cx="280" cy="225" r="8" fill="none" stroke="rgba(255,218,0,0.52)" strokeWidth="1.2"/>
                  <circle className="radar-ring" cx="280" cy="225" r="8" fill="none" stroke="rgba(255,218,0,0.52)" strokeWidth="1.2"/>
                  <circle className="radar-ring" cx="280" cy="225" r="8" fill="none" stroke="rgba(255,218,0,0.52)" strokeWidth="1.2"/>

                  {/* Edge bokeh — ambient warmth at screen corners */}
                  <circle cx="-18" cy="145" r="52" fill="rgba(255,218,0,0.045)" filter="url(#radarglow)"/>
                  <circle cx="32"  cy="318" r="36" fill="rgba(255,218,0,0.035)" filter="url(#radarglow)"/>
                  <circle cx="580" cy="130" r="46" fill="rgba(255,218,0,0.045)" filter="url(#radarglow)"/>
                  <circle cx="532" cy="326" r="32" fill="rgba(255,218,0,0.035)" filter="url(#radarglow)"/>
                  {/* Scattered particles */}
                  <circle cx="-14" cy="108" r="2.2" fill="rgba(255,218,0,0.22)"/>
                  <circle cx="25"  cy="195" r="1.5" fill="rgba(255,218,0,0.17)"/>
                  <circle cx="-8"  cy="272" r="1.8" fill="rgba(255,218,0,0.19)"/>
                  <circle cx="50"  cy="82"  r="1.3" fill="rgba(255,218,0,0.14)"/>
                  <circle cx="575" cy="112" r="2.2" fill="rgba(255,218,0,0.22)"/>
                  <circle cx="538" cy="208" r="1.5" fill="rgba(255,218,0,0.17)"/>
                  <circle cx="570" cy="295" r="1.8" fill="rgba(255,218,0,0.19)"/>
                  <circle cx="504" cy="76"  r="1.3" fill="rgba(255,218,0,0.14)"/>
                </svg>
              </div>

              {/* ── Phone (tilts on mouse via hero-img-main) ── */}
              <div className="hero-img-main absolute inset-0" style={{ transformStyle: 'preserve-3d', overflow: 'visible' }}>
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 560 450"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid meet"
                  aria-hidden="true"
                  style={{ overflow: 'visible' }}
                >
                  <defs>
                    <filter id="pglow" x="-80%" y="-80%" width="260%" height="260%">
                      <feGaussianBlur stdDeviation="8" result="b"/>
                      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                    <filter id="pglow-sm" x="-120%" y="-120%" width="340%" height="340%">
                      <feGaussianBlur stdDeviation="3" result="b"/>
                      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                    <clipPath id="screenclip">
                      <rect x="178" y="62" width="204" height="318" rx="5"/>
                    </clipPath>
                    <clipPath id="logo-clip">
                      <circle cx="280" cy="221" r="46"/>
                    </clipPath>
                    <pattern id="dotgrid2" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                      <circle cx="0" cy="0" r="0.9" fill="rgba(255,218,0,0.06)"/>
                    </pattern>
                  </defs>

                  <rect width="560" height="450" fill="url(#dotgrid2)" />

                  {/* Phone ambient glow */}
                  <rect x="158" y="4" width="244" height="442" rx="40" fill="rgba(255,218,0,0.04)" filter="url(#pglow)"/>

                  {/* ── Phone body ── */}
                  <rect x="168" y="14" width="224" height="422" rx="34" fill="rgba(6,4,3,0.98)" stroke="rgba(255,218,0,0.32)" strokeWidth="1.6"/>
                  {/* Side buttons */}
                  <rect x="166" y="140" width="3" height="32" rx="1.5" fill="rgba(255,218,0,0.15)"/>
                  <rect x="166" y="180" width="3" height="32" rx="1.5" fill="rgba(255,218,0,0.15)"/>
                  <rect x="391" y="155" width="3" height="50" rx="1.5" fill="rgba(255,218,0,0.15)"/>
                  {/* Screen bg */}
                  <rect x="178" y="62" width="204" height="318" rx="5" fill="rgba(10,7,5,0.99)"/>
                  {/* Camera punch-hole */}
                  <circle cx="280" cy="38" r="8" fill="rgba(3,2,1,1)" stroke="rgba(255,218,0,0.07)" strokeWidth="0.6"/>
                  <circle cx="280" cy="38" r="4" fill="rgba(14,10,7,1)"/>
                  {/* Status bar */}
                  <text x="192" y="54" fontSize="8.5" fill="rgba(255,218,0,0.55)" fontFamily="monospace" fontWeight="bold">9:41</text>
                  <circle cx="330" cy="50" r="2.5" fill="rgba(80,220,80,0.6)"/>
                  <rect x="344" y="45" width="20" height="9" rx="2" fill="none" stroke="rgba(255,218,0,0.35)" strokeWidth="0.8"/>
                  <rect x="345" y="46" width="14" height="7" rx="1.5" fill="rgba(255,218,0,0.48)"/>
                  <rect x="364" y="47.5" width="3" height="4" rx="1" fill="rgba(255,218,0,0.25)"/>
                  <rect x="334" y="47" width="2.5" height="6" rx="0.5" fill="rgba(255,218,0,0.5)"/>
                  <rect x="337.5" y="48.5" width="2.5" height="4.5" rx="0.5" fill="rgba(255,218,0,0.38)"/>
                  <rect x="341" y="50" width="2.5" height="3" rx="0.5" fill="rgba(255,218,0,0.25)"/>
                  {/* Home bar */}
                  <rect x="251" y="412" width="58" height="5" rx="2.5" fill="rgba(255,218,0,0.18)"/>

                  {/* ══ Animated steps — clipped to screen ══ */}
                  {/* Cycle: 18s total, 3s per step. Step 1 enters via circular bloom from centre. */}
                  <g clipPath="url(#screenclip)">

                    {/* Step 1 — Logo fade in (0–3s) */}
                    <g>
                      <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.055;0.148;0.167;1" dur="18s" repeatCount="indefinite" calcMode="spline" keySplines="0.2 0 0.1 1;0 0 0 0;0.4 0 1 1;0 0 0 0"/>
                      {/* Outer glow ring */}
                      <circle cx="280" cy="221" r="52" fill="none" stroke="rgba(255,218,0,0.18)" strokeWidth="1.2"/>
                      {/* Yellow circle bg */}
                      <circle cx="280" cy="221" r="46" fill="#ffda00" filter="url(#pglow-sm)"/>
                      {/* Actual logo image */}
                      <image href="https://hpobmsfwvrewpjqnmhsv.supabase.co/storage/v1/object/sign/internal/image-removebg-preview%20(1).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMjA1YjRkYi0wMDA4LTQyOWUtYTFmZi02NzBjZTE1OWJhOTkiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbnRlcm5hbC9pbWFnZS1yZW1vdmViZy1wcmV2aWV3ICgxKS5wbmciLCJpYXQiOjE3Nzc3NTQ5NzksImV4cCI6MTkzNTQzNDk3OX0.FR2fYD_zRiEMwQcrMja4J1PCZI6o6EFZ-_-8i6T0dy8"
                        x="234" y="175" width="92" height="92"
                        clipPath="url(#logo-clip)" preserveAspectRatio="xMidYMid meet"/>
                    </g>

                    {/* Step 2 — Choose Service (3–6s) */}
                    <g>
                      <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.167;0.185;0.315;0.333;1" dur="18s" repeatCount="indefinite"/>
                      <animateTransform attributeName="transform" type="translate" values="0,10;0,10;0,0;0,0;0,-10;0,-10" keyTimes="0;0.167;0.185;0.315;0.333;1" dur="18s" repeatCount="indefinite"/>
                      <text x="192" y="88" fontSize="7.5" fill="rgba(255,218,0,0.35)" fontFamily="monospace">STEP 1 · CHOOSE SERVICE</text>
                      <text x="280" y="113" textAnchor="middle" fontSize="13" fontWeight="bold" fill="rgba(255,255,255,0.88)" fontFamily="sans-serif">What do you need?</text>
                      {/* Airport card – active */}
                      <rect x="183" y="126" width="194" height="52" rx="8" fill="rgba(255,218,0,0.1)" stroke="rgba(255,218,0,0.55)" strokeWidth="1.2"/>
                      <circle cx="206" cy="152" r="13" fill="rgba(255,218,0,0.12)"/>
                      <text x="206" y="157" textAnchor="middle" fontSize="14" fill="rgba(255,218,0,0.88)">✈</text>
                      <text x="226" y="147" fontSize="10.5" fontWeight="bold" fill="rgba(255,218,0,0.92)" fontFamily="sans-serif">Airport Taxi</text>
                      <text x="226" y="162" fontSize="8" fill="rgba(255,218,0,0.45)" fontFamily="monospace">Hollongi · HGI</text>
                      <text x="366" y="155" fontSize="14" fill="rgba(255,218,0,0.5)" fontFamily="sans-serif">›</text>
                      {/* Hourly card */}
                      <rect x="183" y="186" width="194" height="52" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
                      <circle cx="206" cy="212" r="13" fill="rgba(255,255,255,0.04)"/>
                      <text x="206" y="217" textAnchor="middle" fontSize="14" fill="rgba(255,255,255,0.45)">⏱</text>
                      <text x="226" y="207" fontSize="10.5" fontWeight="bold" fill="rgba(255,255,255,0.5)" fontFamily="sans-serif">Hourly Hire</text>
                      <text x="226" y="222" fontSize="8" fill="rgba(255,255,255,0.25)" fontFamily="monospace">Per hour · Itanagar</text>
                      <text x="366" y="215" fontSize="14" fill="rgba(255,255,255,0.2)" fontFamily="sans-serif">›</text>
                      {/* Tour card */}
                      <rect x="183" y="246" width="194" height="52" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
                      <circle cx="206" cy="272" r="13" fill="rgba(255,255,255,0.04)"/>
                      <text x="206" y="277" textAnchor="middle" fontSize="14" fill="rgba(255,255,255,0.45)">🗺</text>
                      <text x="226" y="267" fontSize="10.5" fontWeight="bold" fill="rgba(255,255,255,0.5)" fontFamily="sans-serif">Tour Package</text>
                      <text x="226" y="282" fontSize="8" fill="rgba(255,255,255,0.25)" fontFamily="monospace">Fixed price tours</text>
                      <text x="366" y="275" fontSize="14" fill="rgba(255,255,255,0.2)" fontFamily="sans-serif">›</text>
                    </g>

                    {/* Step 3 — Fill Booking Details (6–9s) */}
                    <g>
                      <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.333;0.351;0.481;0.500;1" dur="18s" repeatCount="indefinite"/>
                      <animateTransform attributeName="transform" type="translate" values="0,10;0,10;0,0;0,0;0,-10;0,-10" keyTimes="0;0.333;0.351;0.481;0.500;1" dur="18s" repeatCount="indefinite"/>
                      <text x="192" y="88" fontSize="7.5" fill="rgba(255,218,0,0.35)" fontFamily="monospace">STEP 2 · ROUTE &amp; DETAILS</text>
                      {[0,1,2,3,4].map(i => (
                        <circle key={i} cx={246+i*19} cy={100} r={i===1?4.5:2.5} fill={i===1?'#ffda00':'rgba(255,218,0,0.2)'}/>
                      ))}
                      <text x="280" y="124" textAnchor="middle" fontSize="13" fontWeight="bold" fill="rgba(255,255,255,0.88)" fontFamily="sans-serif">Route &amp; Details</text>
                      <text x="192" y="148" fontSize="8" fill="rgba(255,218,0,0.42)" fontFamily="monospace">DESTINATION</text>
                      <rect x="183" y="153" width="194" height="30" rx="5" fill="rgba(255,218,0,0.07)" stroke="rgba(255,218,0,0.3)" strokeWidth="0.8"/>
                      <circle cx="198" cy="168" r="4" fill="rgba(255,218,0,0.55)"/>
                      <text x="210" y="172" fontSize="10" fill="rgba(255,218,0,0.82)" fontFamily="sans-serif">Itanagar City</text>
                      <text x="192" y="202" fontSize="8" fill="rgba(255,255,255,0.28)" fontFamily="monospace">DATE &amp; TIME</text>
                      <rect x="183" y="207" width="194" height="30" rx="5" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8"/>
                      <text x="198" y="226" fontSize="10" fill="rgba(255,255,255,0.55)" fontFamily="sans-serif">16 May 2026 · 14:30</text>
                      <text x="192" y="256" fontSize="8" fill="rgba(255,255,255,0.28)" fontFamily="monospace">PASSENGERS</text>
                      <rect x="183" y="261" width="88" height="30" rx="5" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8"/>
                      <text x="221" y="280" textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.6)" fontFamily="sans-serif">2</text>
                      <rect x="183" y="310" width="194" height="32" rx="7" fill="#ffda00"/>
                      <text x="280" y="330" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1a1512" fontFamily="monospace">NEXT  →</text>
                    </g>

                    {/* Step 4 — Select Car (9–12s) */}
                    <g>
                      <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.500;0.518;0.648;0.667;1" dur="18s" repeatCount="indefinite"/>
                      <animateTransform attributeName="transform" type="translate" values="0,10;0,10;0,0;0,0;0,-10;0,-10" keyTimes="0;0.500;0.518;0.648;0.667;1" dur="18s" repeatCount="indefinite"/>
                      <text x="192" y="88" fontSize="7.5" fill="rgba(255,218,0,0.35)" fontFamily="monospace">STEP 3 · SELECT CAR</text>
                      {[0,1,2,3,4].map(i => (
                        <circle key={i} cx={246+i*19} cy={100} r={i===2?4.5:2.5} fill={i===2?'#ffda00':'rgba(255,218,0,0.2)'}/>
                      ))}
                      <text x="280" y="124" textAnchor="middle" fontSize="13" fontWeight="bold" fill="rgba(255,255,255,0.88)" fontFamily="sans-serif">Available Cars</text>
                      {/* SUV — selected */}
                      <rect x="183" y="133" width="194" height="68" rx="8" fill="rgba(255,218,0,0.1)" stroke="#ffda00" strokeWidth="1.2"/>
                      <rect x="188" y="138" width="32" height="20" rx="4" fill="rgba(255,218,0,0.12)"/>
                      <text x="204" y="151" textAnchor="middle" fontSize="9" fill="rgba(255,218,0,0.7)" fontFamily="monospace">SUV</text>
                      <text x="228" y="152" fontSize="10.5" fontWeight="bold" fill="rgba(255,255,255,0.88)" fontFamily="sans-serif">SUV / MUV</text>
                      <text x="228" y="167" fontSize="8" fill="rgba(255,218,0,0.48)" fontFamily="monospace">6 seats · ₹18/km</text>
                      <text x="368" y="160" textAnchor="end" fontSize="13" fontWeight="bold" fill="#ffda00" fontFamily="monospace">₹2,800</text>
                      <text x="368" y="172" textAnchor="end" fontSize="7" fill="rgba(255,218,0,0.38)" fontFamily="monospace">est. total</text>
                      <rect x="188" y="175" width="52" height="14" rx="4" fill="rgba(255,218,0,0.15)"/>
                      <text x="214" y="185" textAnchor="middle" fontSize="7" fill="rgba(255,218,0,0.8)" fontFamily="monospace">✓ SELECTED</text>
                      {/* Sedan */}
                      <rect x="183" y="210" width="194" height="60" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
                      <rect x="188" y="215" width="32" height="20" rx="4" fill="rgba(255,255,255,0.06)"/>
                      <text x="204" y="228" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.35)" fontFamily="monospace">CAR</text>
                      <text x="228" y="229" fontSize="10.5" fontWeight="bold" fill="rgba(255,255,255,0.5)" fontFamily="sans-serif">Sedan</text>
                      <text x="228" y="244" fontSize="8" fill="rgba(255,255,255,0.25)" fontFamily="monospace">4 seats · ₹12/km</text>
                      <text x="368" y="240" textAnchor="end" fontSize="13" fontWeight="bold" fill="rgba(255,255,255,0.35)" fontFamily="monospace">₹1,400</text>
                      <rect x="183" y="285" width="194" height="32" rx="7" fill="#ffda00"/>
                      <text x="280" y="305" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1a1512" fontFamily="monospace">CONTINUE  →</text>
                    </g>

                    {/* Step 5 — Payment (12–15s) */}
                    <g>
                      <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.667;0.685;0.815;0.833;1" dur="18s" repeatCount="indefinite"/>
                      <animateTransform attributeName="transform" type="translate" values="0,10;0,10;0,0;0,0;0,-10;0,-10" keyTimes="0;0.667;0.685;0.815;0.833;1" dur="18s" repeatCount="indefinite"/>
                      <text x="192" y="88" fontSize="7.5" fill="rgba(255,218,0,0.35)" fontFamily="monospace">STEP 5 · PAYMENT</text>
                      {[0,1,2,3,4].map(i => (
                        <circle key={i} cx={246+i*19} cy={100} r={i===4?4.5:2.5} fill={i===4?'#ffda00':'rgba(255,218,0,0.2)'}/>
                      ))}
                      {/* Summary */}
                      <rect x="183" y="112" width="194" height="96" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,218,0,0.12)" strokeWidth="0.8"/>
                      <text x="193" y="131" fontSize="9" fontWeight="bold" fill="rgba(255,255,255,0.72)" fontFamily="sans-serif">Airport Taxi · Itanagar</text>
                      <text x="193" y="147" fontSize="7.5" fill="rgba(255,255,255,0.32)" fontFamily="monospace">16 May 2026 · 14:30 · 2 pax</text>
                      <text x="193" y="161" fontSize="7.5" fill="rgba(255,255,255,0.32)" fontFamily="monospace">SUV / MUV</text>
                      <line x1="193" y1="170" x2="369" y2="170" stroke="rgba(255,218,0,0.1)" strokeWidth="0.6"/>
                      <text x="193" y="185" fontSize="9" fill="rgba(255,255,255,0.38)" fontFamily="monospace">TOTAL</text>
                      <text x="369" y="188" textAnchor="end" fontSize="16" fontWeight="bold" fill="#ffda00" fontFamily="monospace">₹2,800</text>
                      {/* Pay 30% */}
                      <rect x="183" y="218" width="194" height="38" rx="7" fill="rgba(255,218,0,0.1)" stroke="rgba(255,218,0,0.45)" strokeWidth="1"/>
                      <text x="280" y="233" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="rgba(255,218,0,0.88)" fontFamily="monospace">PAY 30% · ₹840</text>
                      <text x="280" y="248" textAnchor="middle" fontSize="7.5" fill="rgba(255,218,0,0.4)" fontFamily="monospace">₹1,960 cash to driver</text>
                      {/* Pay full */}
                      <rect x="183" y="265" width="194" height="38" rx="7" fill="#ffda00"/>
                      <text x="280" y="280" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#1a1512" fontFamily="monospace">PAY FULL · ₹2,800</text>
                      <text x="280" y="295" textAnchor="middle" fontSize="7.5" fill="rgba(26,21,18,0.6)" fontFamily="monospace">100% online · no cash</text>
                      <text x="280" y="325" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.18)" fontFamily="monospace">Secured by Razorpay</text>
                    </g>

                    {/* Step 6 — Confirmed (15–18s) — fades out at 17s, dark gap before bloom */}
                    <g>
                      <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.833;0.851;0.944;0.972;1" dur="18s" repeatCount="indefinite"/>
                      <animateTransform attributeName="transform" type="translate" values="0,10;0,10;0,0;0,0;0,-10;0,-10" keyTimes="0;0.833;0.851;0.944;0.972;1" dur="18s" repeatCount="indefinite"/>
                      {/* Pulse ring */}
                      <circle cx="280" cy="160" r="48" fill="none" stroke="rgba(255,218,0,0.12)" strokeWidth="1">
                        <animate attributeName="r" values="38;52;38" dur="2.4s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite"/>
                      </circle>
                      <circle cx="280" cy="160" r="38" fill="rgba(255,218,0,0.08)" stroke="rgba(255,218,0,0.32)" strokeWidth="1.2"/>
                      <circle cx="280" cy="160" r="26" fill="rgba(255,218,0,0.12)" stroke="rgba(255,218,0,0.5)" strokeWidth="1"/>
                      <polyline points="264,160 275,172 297,148" stroke="#ffda00" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#pglow-sm)"/>
                      <text x="280" y="220" textAnchor="middle" fontSize="15" fontWeight="bold" fill="rgba(255,255,255,0.92)" fontFamily="sans-serif">Booking Confirmed!</text>
                      <text x="280" y="240" textAnchor="middle" fontSize="9" fill="rgba(255,218,0,0.58)" fontFamily="monospace">BK-20260516-3842</text>
                      <text x="280" y="260" textAnchor="middle" fontSize="8.5" fill="rgba(255,255,255,0.35)" fontFamily="sans-serif">Driver will be assigned soon.</text>
                      <text x="280" y="276" textAnchor="middle" fontSize="8.5" fill="rgba(255,255,255,0.35)" fontFamily="sans-serif">Confirmation email sent.</text>
                      <rect x="203" y="294" width="154" height="32" rx="7" fill="#ffda00"/>
                      <text x="280" y="314" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#1a1512" fontFamily="monospace">VIEW BOOKING</text>
                      <rect x="203" y="335" width="154" height="28" rx="7" fill="none" stroke="rgba(255,218,0,0.35)" strokeWidth="0.8"/>
                      <text x="280" y="353" textAnchor="middle" fontSize="9" fill="rgba(255,218,0,0.5)" fontFamily="monospace">LEAVE A REVIEW  ★</text>
                    </g>


                  </g>
                </svg>
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
        {/* ── Scroll indicator — sits at label level, no extra space ── */}
        <div className="absolute bottom-[1.1rem] sm:bottom-[1.35rem] md:bottom-[1.6rem] left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none select-none">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/25">scroll</span>
          <ChevronDown size={12} className="text-white/25 animate-bounce" />
        </div>
      </section>
      </div>{/* end h-screen hero+stats wrapper */}

      {/* ════════════════════ TOURS ════════════════════ */}
      <section
        className="tours-section h-[100dvh] py-8 md:py-28 relative overflow-hidden flex flex-col justify-center"
        style={{ background: 'linear-gradient(160deg, #16120f 0%, #1c1410 35%, #110e0c 70%, #0d0b09 100%)' }}
      >
        {/* ── Tour section background atmosphere ── */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          {/* Blurred tour image halves — cross-fades between active pair */}
          {!loadingTours && featuredTours.map((tour, i) => {
            const images = tour.image_urls?.length ? tour.image_urls : tour.image_url ? [tour.image_url] : [TOUR_IMAGES[i % TOUR_IMAGES.length]]
            const isLeft = i % 2 === 0
            return (
              <div
                key={tour.id}
                className="tours-bg-img absolute inset-0"
                data-tour-idx={i}
                style={{ opacity: 0 }}
              >
                <div style={{
                  position: 'absolute',
                  left: isLeft ? '-5%' : '40%',
                  width: '65%',
                  top: '-5%',
                  height: '110%',
                  overflow: 'hidden',
                  WebkitMaskImage: isLeft
                    ? 'linear-gradient(to right, black 40%, transparent 100%)'
                    : 'linear-gradient(to left, black 40%, transparent 100%)',
                  maskImage: isLeft
                    ? 'linear-gradient(to right, black 40%, transparent 100%)'
                    : 'linear-gradient(to left, black 40%, transparent 100%)',
                }}>
                  <Image
                    src={images[0]}
                    alt=""
                    fill
                    sizes="65vw"
                    style={{ objectFit: 'cover', filter: 'blur(14px) saturate(1.3)', transform: 'scale(1.06)' }}
                  />
                </div>
              </div>
            )
          })}
          {/* Darkening overlay — lighter so image detail shows through */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(160deg, rgba(22,18,15,0.5) 0%, rgba(28,20,16,0.34) 50%, rgba(17,14,12,0.52) 100%)',
          }} />
          {/* Bottom depth fade into next section */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 to-transparent" />
        </div>

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
            <div className="relative w-full overflow-hidden h-[530px] md:h-[500px]">
              {featuredTours.map((tour, index) => {
                const posInGroup = index % 2 // 0 = left col, 1 = right col
                const isExpanded = expandedTourId === tour.id
                return (
                  <div
                    key={tour.id}
                    onClick={() => setExpandedTourId(isExpanded ? null : tour.id)}
                    className={`tour-card card-3d group absolute top-0 rounded-3xl overflow-hidden bg-primary-900/80 backdrop-blur-md border border-primary-800/60 cursor-pointer
                      w-full h-[520px] md:h-[490px] md:top-0
                      ${posInGroup === 0 ? 'md:left-0 md:w-[calc(50%-12px)]' : 'md:left-[calc(50%+12px)] md:w-[calc(50%-12px)]'}`}
                    style={{ boxShadow: '0 16px 44px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,218,0,0.1)' }}
                  >
                    {/* Image Carousel */}
                    {(() => {
                      const images = tour.image_urls?.length ? tour.image_urls : tour.image_url ? [tour.image_url] : [TOUR_IMAGES[index % TOUR_IMAGES.length]]
                      const idx = cardImgIdx[tour.id] ?? 0
                      const goTo = (e: React.MouseEvent | React.TouchEvent, next: number) => {
                        e.stopPropagation()
                        setCardImgIdx(prev => ({ ...prev, [tour.id]: (next + images.length) % images.length }))
                      }
                      return (
                        <div
                          className={`tour-img relative transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'h-[140px]' : 'h-[300px] md:h-[290px]'}`}
                          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
                          onTouchEnd={(e) => {
                            if (images.length < 2) return
                            const diff = touchStartX.current - e.changedTouches[0].clientX
                            if (Math.abs(diff) > 30) goTo(e, diff > 0 ? idx + 1 : idx - 1)
                          }}
                        >
                          <Image
                            src={images[idx]}
                            alt={tour.name}
                            fill
                            className="object-cover transition-opacity duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-primary-950/70 via-primary-950/5 to-transparent" />
                          {images.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => goTo(e, idx - 1)}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-primary-950/70 text-white flex items-center justify-center text-base hover:bg-primary-950/90 transition-colors z-10"
                              >‹</button>
                              <button
                                type="button"
                                onClick={(e) => goTo(e, idx + 1)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-primary-950/70 text-white flex items-center justify-center text-base hover:bg-primary-950/90 transition-colors z-10"
                              >›</button>
                              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                                {images.map((_, i) => (
                                  <span key={i} className={`block w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/40'}`} />
                                ))}
                              </div>
                            </>
                          )}
                          {/* Price */}
                          <div className="absolute top-4 right-4 px-3 py-1.5 bg-secondary-500 text-primary-950 font-black text-sm rounded-xl shadow-lg z-10">
                            ₹{tour.price}
                          </div>
                          {/* Rating */}
                          {ratingStats[tour.id]?.count > 0 ? (
                            <Link
                              href={`/tours/${tour.id}/reviews`}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute bottom-4 left-4 flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer z-10"
                            >
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} size={10} className={s <= Math.round(ratingStats[tour.id].avg) ? 'text-secondary-500 fill-secondary-500' : 'text-secondary-500/30 fill-secondary-500/30'} />
                                ))}
                              </div>
                              <span className="text-white text-xs font-semibold">{ratingStats[tour.id].avg} · {ratingStats[tour.id].count}</span>
                            </Link>
                          ) : (
                            <div className="absolute bottom-4 left-4 text-gray-400 text-xs font-semibold z-10">No reviews yet</div>
                          )}
                          {/* Wind breeze — single diagonal streak, color-aware via backdrop-filter */}
                          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 4 }}>
                            <div style={{
                              position: 'absolute', top: '-50%', left: 0, width: '30%', height: '200%',
                              background: 'linear-gradient(to right, transparent 0%, rgba(255,252,218,0.018) 30%, rgba(255,254,226,0.03) 50%, rgba(255,252,218,0.018) 70%, transparent 100%)',
                              backdropFilter: 'saturate(2) brightness(1.38)',
                              WebkitBackdropFilter: 'saturate(2) brightness(1.38)',
                              transformOrigin: 'top left',
                              animation: `tour-shimmer-flow ${(7.8 + ((index * 0.618) % 1) * 2).toFixed(1)}s ease-in-out ${(index * 1.5).toFixed(1)}s infinite`,
                              boxShadow: '0 0 22px 10px rgba(255,252,215,0.035)',
                            }} />
                          </div>
                        </div>
                      )
                    })()}

                    {/* Content */}
                    <div className={`transition-all duration-500 p-4 md:p-7 flex flex-col ${isExpanded ? 'h-[calc(100%-140px)]' : 'h-[calc(100%-300px)] md:h-[calc(100%-290px)]'}`}>
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
              Your ride awaits at Donyi Polo Airport - Hollongi
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
