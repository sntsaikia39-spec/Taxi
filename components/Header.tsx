'use client'

import Link from 'next/link'
import { Menu, X, LogOut, ChevronRight } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import Logo from '@/components/Logo'
import gsap from 'gsap'

declare global {
  interface Window {
    __headerIntroPlayed?: boolean
  }
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileMenuMounted, setMobileMenuMounted] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, signOut, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const headerRef = useRef<HTMLElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuInnerRef = useRef<HTMLElement>(null)
  const accountMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const shouldPlayIntro = typeof window !== 'undefined' && !window.__headerIntroPlayed
    const ctx = gsap.context(() => {
      if (shouldPlayIntro) {
        gsap.from(headerRef.current, {
          y: -70,
          opacity: 0,
          duration: 0.65,
          ease: 'power3.out',
        })
      }
    }, headerRef)

    const flashRay = headerRef.current?.querySelector('[data-header-flash-ray]') as HTMLElement | null
    if (flashRay && shouldPlayIntro) {
      gsap.set(flashRay, { xPercent: -115, opacity: 0 })
      gsap.timeline({ delay: 0.36 })
        .to(flashRay, { opacity: 1, duration: 0.08, ease: 'power1.out' })
        .to(flashRay, { xPercent: 135, duration: 0.8, ease: 'power3.out' }, 0)
        .to(flashRay, { opacity: 0, duration: 0.12, ease: 'power1.in' }, 0.74)
    }
    if (typeof window !== 'undefined') window.__headerIntroPlayed = true

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setAccountMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!accountMenuRef.current?.contains(e.target as Node)) {
        setAccountMenuOpen(false)
      }
    }
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAccountMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [])

  useEffect(() => {
    if (mobileMenuOpen) {
      if (!mobileMenuMounted) {
        setMobileMenuMounted(true)
        return
      }
    }

    const panel = mobileMenuRef.current
    const inner = mobileMenuInnerRef.current
    if (!panel || !inner) return

    const items = inner.querySelectorAll('[data-mobile-item]')

    if (mobileMenuOpen) {
      gsap.killTweensOf([panel, inner, ...Array.from(items)])
      gsap.set(panel, { display: 'block' })
      gsap.set(inner, { opacity: 0, y: -14 })
      gsap.set(items, { opacity: 0, y: -10 })

      gsap.timeline()
        .to(panel, {
          height: 'auto',
          opacity: 1,
          duration: 0.34,
          ease: 'power3.out',
        })
        .to(inner, {
          opacity: 1,
          y: 0,
          duration: 0.24,
          ease: 'power2.out',
        }, '-=0.18')
        .to(items, {
          opacity: 1,
          y: 0,
          duration: 0.22,
          stagger: 0.04,
          ease: 'power2.out',
        }, '-=0.16')
      return
    }

    if (!mobileMenuMounted) return
    gsap.killTweensOf([panel, inner, ...Array.from(items)])
    gsap.timeline({
      onComplete: () => setMobileMenuMounted(false),
    })
      .to(items, {
        opacity: 0,
        y: -8,
        duration: 0.14,
        stagger: 0.02,
        ease: 'power1.in',
      })
      .to(inner, {
        opacity: 0,
        y: -10,
        duration: 0.15,
        ease: 'power1.in',
      }, '-=0.08')
      .to(panel, {
        height: 0,
        opacity: 0,
        duration: 0.22,
        ease: 'power2.inOut',
      }, '-=0.1')
  }, [mobileMenuOpen, mobileMenuMounted])

  const handleLogout = async () => {
    setAccountMenuOpen(false)
    await signOut()
    router.push('/')
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/book-taxi', label: 'Book Taxi' },
    { href: '/tours', label: 'Tours' },
    ...(user ? [{ href: '/bookings', label: 'My Bookings' }] : []),
  ]

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 w-full z-50 overflow-visible text-white border-b border-white/[0.08] transition-all duration-500 ${
        scrolled
          ? 'bg-primary-950/96 backdrop-blur-md shadow-[0_12px_28px_rgba(8,6,5,0.38)]'
          : 'bg-primary-950/98 shadow-[0_8px_20px_rgba(8,6,5,0.24)]'
      }`}
    >
      <div className="absolute bottom-0 left-0 w-full pointer-events-none bg-gradient-to-r from-transparent via-white/[0.11] to-transparent" style={{ height: '0.5px' }} />
      <div
        data-header-flash-ray
        className="absolute bottom-0 left-0 w-full pointer-events-none opacity-0"
        style={{
          height: '1.5px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,218,0,0.1) 32%, rgba(255,218,0,0.88) 50%, rgba(255,218,0,0.1) 68%, transparent 100%)',
          filter: 'drop-shadow(0 0 10px rgba(255,218,0,0.55))',
          willChange: 'transform, opacity',
        }}
      />
      <div className="container mx-auto px-4 lg:px-14 xl:px-20">
        <div className="relative flex items-center justify-between h-16 md:h-20">

          <Link href="/" className="flex items-center group shrink-0">
            <Logo
              size="md"
              showName
              nameClass="text-secondary-500 text-lg group-hover:text-secondary-400 transition-colors duration-200"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 group whitespace-nowrap
                    ${active ? 'text-secondary-500' : 'text-gray-300 hover:text-white'}`}
                >
                  {link.label}
                  <span
                    className={`absolute bottom-1 left-4 right-4 h-0.5 bg-secondary-500 rounded-full transition-transform duration-200 origin-left
                      ${active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}
                  />
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0 relative">
            {!isLoading ? (
              user ? (
                <div ref={accountMenuRef} className="relative">
                  <button
                    onClick={() => setAccountMenuOpen((v) => !v)}
                    className="w-10 h-10 rounded-full bg-secondary-500 text-primary-950 font-black text-sm flex items-center justify-center shadow-[0_10px_26px_rgba(255,218,0,0.28)] hover:bg-secondary-400 transition-colors"
                    aria-label="Open account menu"
                  >
                    {user.email?.[0].toUpperCase()}
                  </button>
                  {accountMenuOpen && (
                    <div className="absolute right-0 top-[calc(100%+12px)] w-52 rounded-2xl border border-white/[0.08] bg-primary-950/95 backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,218,0,0.06)] overflow-hidden z-[70]">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-white/[0.06]">
                        <div className="w-8 h-8 rounded-full bg-secondary-500 text-primary-950 font-black text-xs flex items-center justify-center mb-2">
                          {user.email?.[0].toUpperCase()}
                        </div>
                        <p className="text-white text-[13px] font-semibold truncate leading-tight">
                          {user.user_metadata?.full_name || 'Account'}
                        </p>
                        <p className="text-gray-500 text-[11px] truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>
                      {/* Actions */}
                      <div className="p-1.5">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-medium"
                        >
                          <LogOut size={14} />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="px-5 py-2.5 bg-secondary-500 text-primary-950 text-sm font-black rounded-xl hover:bg-secondary-400 active:scale-95 transition-all duration-200 shadow-lg shadow-secondary-500/20"
                  >
                    Sign Up
                  </Link>
                </div>
              )
            ) : (
              <div className="hidden md:block w-32 h-9 bg-primary-900 rounded-xl animate-pulse" />
            )}

            <button
              className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-xl border border-white/10 bg-primary-900/40 hover:bg-primary-900 transition-colors"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <span className={`absolute transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}`}>
                <X size={20} />
              </span>
              <span className={`absolute transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0'}`}>
                <Menu size={20} />
              </span>
            </button>
          </div>
        </div>
      </div>

      {mobileMenuMounted && (
        <div
          ref={mobileMenuRef}
          className="md:hidden overflow-hidden border-t border-white/10 bg-primary-950/95 backdrop-blur-xl"
          style={{ height: 0, opacity: 0 }}
        >
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary-500/40 to-transparent" />
          <nav ref={mobileMenuInnerRef} className="container mx-auto px-4 py-4 space-y-1.5">
            {navLinks.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  data-mobile-item
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 border
                    ${active
                      ? 'bg-secondary-500/18 text-secondary-500 border-secondary-500/45 shadow-[0_10px_26px_rgba(255,218,0,0.16)]'
                      : 'text-gray-100 border-white/10 bg-primary-900/60 hover:bg-primary-900 hover:border-white/20'
                    }`}
                >
                  {link.label}
                  <ChevronRight size={14} className={`transition-transform duration-200 opacity-60 ${active ? '' : 'group-hover:translate-x-0.5'}`} />
                </Link>
              )
            })}

            {!isLoading && (
              <div data-mobile-item className="pt-3 mt-3 border-t border-white/10">
                {user ? (
                  <p className="px-2 text-xs text-gray-400">Use the profile icon in header to logout</p>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 px-4 py-3 text-center border border-white/20 rounded-2xl text-sm font-medium text-white hover:bg-primary-900 transition-all duration-200"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 px-4 py-3 bg-secondary-500 text-primary-950 rounded-2xl text-center text-sm font-black hover:bg-secondary-400 transition-all duration-200 shadow-[0_10px_24px_rgba(255,218,0,0.3)]"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
