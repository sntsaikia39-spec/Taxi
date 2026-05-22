'use client'

import { useEffect, Suspense, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import gsap from 'gsap'

type VerificationState = 'loading' | 'success' | 'error'

function VerifyContent() {
  const searchParams = useSearchParams()
  const [state, setState] = useState<VerificationState>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [isRetrying, setIsRetrying] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const redirectTo = searchParams.get('redirect') || '/bookings'
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') || 'signup'
  const code = searchParams.get('code')
  const isPopup = searchParams.get('popup') === '1'

  const errorParam = searchParams.get('error')
  const errorDescParam = searchParams.get('error_description')

  const resolveBookingFallback = () => {
    const tourResume = sessionStorage.getItem('tourBookingResume')
    if (tourResume) {
      try {
        const parsed = JSON.parse(tourResume)
        if (parsed?.tourId) return `/tours/${parsed.tourId}/book`
      } catch {}
    }
    if (sessionStorage.getItem('bookingResume')) return '/book-taxi'
    return null
  }

  const resolvePostAuthTarget = () => {
    const stored = sessionStorage.getItem('postAuthRedirect')
    if (stored && stored.startsWith('/')) {
      sessionStorage.removeItem('postAuthRedirect')
      return stored
    }
    const bookingFallback = resolveBookingFallback()
    if (bookingFallback) return bookingFallback
    return redirectTo
  }

  const performVerification = async () => {
    setState('loading')
    setErrorMessage('')

    try {
      const supabase = createClientComponentClient()

      if (tokenHash) {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any,
        })
        if (error) throw error
        if (!data.session) throw new Error('No session was created after verification.')
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) throw error
      } else {
        throw new Error('No verification token found. Please use the link from your email.')
      }

      setState('success')
    } catch (err: any) {
      const msg: string = err?.message || 'Failed to verify your email.'
      setErrorMessage(
        msg.toLowerCase().includes('expired')
          ? 'Your verification link has expired. Please request a new one.'
          : msg.toLowerCase().includes('already') || msg.toLowerCase().includes('used')
          ? 'This verification link has already been used. If your email is verified, try signing in.'
          : msg
      )
      setState('error')
    }
  }

  useEffect(() => {
    if (errorParam || errorDescParam) {
      setErrorMessage(errorDescParam || errorParam || 'An error occurred during verification.')
      setState('error')
      return
    }
    performVerification()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { y: 24, opacity: 0, scale: 0.94 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' }
      )
    }
  }, [state])

  useEffect(() => {
    if (state !== 'success') return

    let inPopup = false
    if (code && !tokenHash) {
      try {
        const ts = parseInt(localStorage.getItem('rina:oauthPending') || '0')
        inPopup = ts > 0 && (Date.now() - ts) < 10 * 60 * 1000
      } catch (_) {}
      if (!inPopup) { try { inPopup = !!window.opener && !window.opener.closed } catch (_) {} }
      if (!inPopup) inPopup = isPopup
    }

    if (inPopup) {
      try { localStorage.removeItem('rina:oauthPending') } catch (_) {}
      try {
        const bc = new BroadcastChannel('rina:auth')
        bc.postMessage({ type: 'OAUTH_DONE' })
        bc.close()
      } catch (_) {}
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'OAUTH_DONE' }, window.location.origin)
        }
      } catch (_) {}
      const timer = setTimeout(() => window.close(), 300)
      return () => clearTimeout(timer)
    }

    try {
      const bc = new BroadcastChannel('rina:auth')
      bc.postMessage({ event: 'EMAIL_VERIFIED' })
      bc.close()
    } catch (_) {}
    const target = resolvePostAuthTarget()
    const timer = setTimeout(() => window.location.assign(target), 1500)
    return () => clearTimeout(timer)
  }, [state, redirectTo, isPopup, code, tokenHash])

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary-950">
        <div ref={cardRef} className="flex flex-col items-center gap-5">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: 'rgba(255,218,0,0.08)', border: '1px solid rgba(255,218,0,0.18)' }}
            />
            <div className="w-9 h-9 border-2 border-secondary-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-sm">Verifying your email</p>
            <p className="text-gray-500 text-xs mt-1">Just a moment...</p>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary-950 px-4">
        <div
          ref={cardRef}
          className="w-full max-w-sm rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(22,17,14,0.97)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(74,222,128,0.06)',
          }}
        >
          <div className="px-8 py-10 text-center">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative flex items-center justify-center">
                <div
                  className="absolute w-24 h-24 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.1) 0%, transparent 70%)' }}
                />
                <div
                  className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(74,222,128,0.12)',
                    border: '1px solid rgba(74,222,128,0.25)',
                    boxShadow: '0 0 32px rgba(74,222,128,0.12)',
                  }}
                >
                  <CheckCircle2 size={34} className="text-green-400" style={{ filter: 'drop-shadow(0 0 8px rgba(74,222,128,0.4))' }} />
                </div>
              </div>
            </div>

            <p className="text-secondary-500 font-bold text-[11px] uppercase tracking-widest mb-3">Verified</p>
            <h1 className="font-black text-white text-2xl mb-2">Email Confirmed!</h1>
            <p className="text-gray-400 text-sm mb-1">Welcome to Rina&apos;s Tours and Travels</p>
            <p className="text-gray-600 text-xs">Logging you in automatically...</p>

            <div className="mt-6 flex justify-center gap-1.5">
              {[0, 0.15, 0.3].map((delay) => (
                <div
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full bg-secondary-500 animate-pulse"
                  style={{ animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-950 px-4">
      <div
        ref={cardRef}
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(22,17,14,0.97)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(248,113,113,0.06)',
        }}
      >
        <div className="px-8 py-10">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-[68px] h-[68px] rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(248,113,113,0.12)',
                border: '1px solid rgba(248,113,113,0.25)',
                boxShadow: '0 0 28px rgba(248,113,113,0.1)',
              }}
            >
              <AlertCircle size={32} className="text-red-400" />
            </div>
          </div>

          <div className="text-center mb-7">
            <p className="text-red-400 font-bold text-[11px] uppercase tracking-widest mb-3">Failed</p>
            <h1 className="font-black text-white text-xl mb-2">Verification Failed</h1>
            <p className="text-gray-500 text-sm leading-relaxed">{errorMessage}</p>
          </div>

          <div className="space-y-2.5">
            {(tokenHash || code) && (
              <button
                onClick={async () => {
                  setIsRetrying(true)
                  await performVerification()
                  setIsRetrying(false)
                }}
                disabled={isRetrying}
                className="w-full px-4 py-3 rounded-xl font-bold text-sm text-primary-950 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: '#ffda00', boxShadow: '0 4px 16px rgba(255,218,0,0.2)' }}
              >
                <RefreshCw size={15} className={isRetrying ? 'animate-spin' : ''} />
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </button>
            )}

            <Link
              href="/signup"
              className="block px-4 py-3 rounded-xl font-semibold text-sm text-center text-gray-300 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Request New Link
            </Link>

            <Link
              href="/login"
              className="block px-4 py-2 text-center text-sm font-semibold text-gray-600 hover:text-secondary-500 transition-colors"
            >
              Back to Login
            </Link>
          </div>

          <p className="text-center text-[11px] text-gray-700 mt-6">
            If issues persist, contact support
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-primary-950">
        <div className="w-10 h-10 border-2 border-secondary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
