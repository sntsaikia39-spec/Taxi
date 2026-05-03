'use client'

import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

type SplashPhase = 'loading' | 'exiting' | 'hidden'
type DotLottieInstance = {
  isLoaded?: boolean
  isReady?: boolean
  play?: () => void
  addEventListener: (event: string, listener: () => void) => void
  removeEventListener: (event: string, listener: () => void) => void
}

const MIN_VISIBLE_MS = 2800
const EXIT_MS = 520

export default function AppSplashLoader() {
  const [phase, setPhase] = useState<SplashPhase>('loading')
  const [pageLoaded, setPageLoaded] = useState(false)
  const [motionReady, setMotionReady] = useState(false)
  const [dotLottie, setDotLottie] = useState<DotLottieInstance | null>(null)
  const hasStartedRef = useRef(false)
  const ringsRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleWindowLoad = () => setPageLoaded(true)

    if (document.readyState === 'complete') {
      setPageLoaded(true)
    } else {
      window.addEventListener('load', handleWindowLoad, { once: true })
    }

    return () => {
      window.removeEventListener('load', handleWindowLoad)
    }
  }, [])

  useEffect(() => {
    if (!dotLottie) return

    const startMotion = () => {
      if (hasStartedRef.current) return
      if (!dotLottie.isReady || !dotLottie.isLoaded) return

      hasStartedRef.current = true
      window.requestAnimationFrame(() => {
        setMotionReady(true)
        window.requestAnimationFrame(() => {
          dotLottie.play?.()
        })
      })
    }

    const failOpenMotion = () => {
      if (hasStartedRef.current) return
      hasStartedRef.current = true
      setMotionReady(true)
    }

    startMotion()
    dotLottie.addEventListener('ready', startMotion)
    dotLottie.addEventListener('load', startMotion)
    dotLottie.addEventListener('loadError', failOpenMotion)

    return () => {
      dotLottie.removeEventListener('ready', startMotion)
      dotLottie.removeEventListener('load', startMotion)
      dotLottie.removeEventListener('loadError', failOpenMotion)
    }
  }, [dotLottie])

  useEffect(() => {
    // Failsafe: if lottie fails to load or ready event doesn't fire, force exit after 3 seconds
    const failsafeTimer = window.setTimeout(() => {
        if (!motionReady) {
            setMotionReady(true);
        }
    }, 3000);

    return () => window.clearTimeout(failsafeTimer);
  }, [motionReady]);

  useEffect(() => {
    if (!pageLoaded || !motionReady) return

    const exitTimer = window.setTimeout(() => setPhase('exiting'), MIN_VISIBLE_MS)
    return () => window.clearTimeout(exitTimer)
  }, [motionReady, pageLoaded])

  useEffect(() => {
    if (phase !== 'exiting') return

    const hideTimer = window.setTimeout(() => setPhase('hidden'), EXIT_MS)
    return () => window.clearTimeout(hideTimer)
  }, [phase])

  // GSAP Radar Inward Animation & Trail Momentum
  useEffect(() => {
    if (!motionReady) return

    const ctx = gsap.context(() => {
      // 1. Radar Rings
      if (ringsRef.current) {
        const rings = gsap.utils.toArray(ringsRef.current.children)
        rings.forEach((ring: any, i: number) => {
          gsap.fromTo(ring,
            { scale: 4, opacity: 0 },
            {
              scale: 0,
              duration: 2.8,
              repeat: -1,
              delay: i * 0.7,
              ease: "power2.in",
            }
          )
          gsap.to(ring, {
            opacity: 0.5,
            duration: 1.4,
            yoyo: true,
            repeat: -1,
            delay: i * 0.7,
            ease: "power1.inOut"
          })
        })
      }

      // 2. Car Trail Momentum (Synced to CSS keyframes of 2.75s)
      if (trailRef.current) {
        const lines = gsap.utils.toArray(trailRef.current.children)
        const tl = gsap.timeline()
        
        // Fast entrance
        tl.set(lines, { scaleX: 0, opacity: 0 })
        tl.to(lines, { scaleX: 1.8, opacity: 1, duration: 0.2, stagger: 0.05, ease: "power2.out" })
        // Slow down and fade tail
        tl.to(lines, { scaleX: 0, opacity: 0, duration: 0.6, stagger: 0.05, ease: "power2.inOut" }, 0.4)
        
        // Wait, then fast exit - increased scale and duration to follow car fully off-screen
        tl.to(lines, { scaleX: 5.5, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power2.in" }, 1.65)
        tl.to(lines, { scaleX: 0, opacity: 0, duration: 1.0, stagger: 0.08, ease: "power1.inOut" }, 2.3)
      }
    })

    return () => ctx.revert()
  }, [motionReady])

  if (phase === 'hidden') return null

  return (
    <div
      aria-hidden="true"
      className={`app-splash ${phase === 'exiting' ? 'app-splash--exit' : ''}`}
    >
      <div className="app-splash__track" />
      
      <div className="app-splash__content-wrapper" style={{ transform: 'translateY(40px)' }}>
        {/* Radar Rings Container */}
        <div ref={ringsRef} className={`app-splash__radar-container ${phase === 'exiting' ? 'app-splash__radar-container--exit' : ''}`}>
          <div className="app-splash__radar-ring" />
          <div className="app-splash__radar-ring" />
          <div className="app-splash__radar-ring" />
          <div className="app-splash__radar-ring" />
        </div>

        <div
          className={`app-splash__taxi ${motionReady ? 'app-splash__taxi--start' : ''} ${
            phase === 'exiting' ? 'app-splash__taxi--exit' : ''
          }`}
        >
          {/* GSAP Trail lines */}
          <div ref={trailRef} className="app-splash__trail">
            <div className="app-splash__trail-line" style={{ width: '90px' }} />
            <div className="app-splash__trail-line" style={{ width: '130px', marginLeft: '10px' }} />
            <div className="app-splash__trail-line" style={{ width: '100px', marginLeft: '5px' }} />
          </div>

          <DotLottieReact
            src="/assets/yellow taxi.lottie"
            loop={true}
            autoplay={true}
            dotLottieRefCallback={setDotLottie}
            className="app-splash__taxi-lottie"
          />
        </div>
      </div>
    </div>
  )
}
