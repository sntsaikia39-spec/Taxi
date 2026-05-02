'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import { Mail, Lock, User as UserIcon, UserPlus, CheckCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { validateFullName, validateEmail, validatePassword } from '@/lib/validation'

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/bookings'
  const { signUpWithEmail, signInWithEmail, signInWithOAuth, resendVerificationEmail, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [smtpFailed, setSmtpFailed] = useState(false)

  useEffect(() => {
    document.documentElement.style.overflowY = 'auto'
    document.body.style.overflowY = 'auto'
    document.documentElement.style.overflowX = 'hidden'
    document.body.style.overflowX = 'hidden'

    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [])

  // Auto-login once email is verified — works same browser (BroadcastChannel)
  // and cross-device (polling signInWithPassword every 10s)
  useEffect(() => {
    if (!verificationSent || !email || !password) return

    // Same browser, any tab: verify tab broadcasts → navigate immediately
    let bc: BroadcastChannel | null = null
    try {
      bc = new BroadcastChannel('rina:auth')
      bc.onmessage = (e) => {
        if (e.data?.event === 'EMAIL_VERIFIED') {
          window.location.href = redirect
        }
      }
    } catch (_) {}

    // Cross-device: poll sign-in every 10s — succeeds once email is verified
    let stopped = false
    let attempts = 0
    const poll = async () => {
      if (stopped || attempts >= 36) return // stop after 6 minutes
      attempts++
      const { error } = await signInWithEmail(email, password)
      if (!error) {
        stopped = true
        // onAuthStateChange fires in AuthContext → user state updates → if(user) redirects below
      }
    }
    const interval = setInterval(poll, 10000)

    return () => {
      stopped = true
      clearInterval(interval)
      bc?.close()
    }
  }, [verificationSent]) // eslint-disable-line react-hooks/exhaustive-deps

  if (user) {
    router.push(redirect)
    return null
  }

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    const fullNameValidation = validateFullName(fullName)
    if (!fullNameValidation.valid) {
      toast.error(fullNameValidation.error || 'Invalid full name')
      return
    }

    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      toast.error(emailValidation.error || 'Invalid email')
      return
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.error || 'Invalid password')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { error, needsVerification, smtpError } = await signUpWithEmail(email, password, fullName)
      if (error) {
        if (error.message?.toLowerCase().includes('already registered') || error.message?.toLowerCase().includes('already been registered')) {
          toast.error('An account with this email already exists. Please sign in.')
          router.push(`/login?redirect=${encodeURIComponent(redirect)}`)
        } else {
          toast.error(error.message || 'Failed to create account')
        }
        return
      }
      if (needsVerification) {
        setSmtpFailed(!!smtpError)
        setVerificationSent(true)
      } else {
        toast.success('Account created! You are now signed in.')
        router.push(redirect)
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      const { error } = await resendVerificationEmail(email)
      if (error) {
        toast.error(error.message || 'Could not resend email')
      } else {
        toast.success('Verification email resent! Check your inbox.')
      }
    } finally {
      setResending(false)
    }
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    try {
      const { error } = await signInWithOAuth('google', redirect)
      if (error) toast.error(error.message || 'Failed to sign up with Google')
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // ── Verification sent screen ────────────────────────────────────────────────
  if (verificationSent) {
    return (
      <div className="flex min-h-screen flex-col bg-primary-950">
        <Header />
        <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12 md:py-16">
          <div className="absolute top-0 right-0 h-[420px] w-[420px] rounded-full bg-secondary-500/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 h-[320px] w-[320px] rounded-full bg-secondary-500/10 blur-[110px] pointer-events-none" />
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,218,0,0.7) 1px, transparent 1px)', backgroundSize: '34px 34px' }}
          />
          <div className="relative z-10 w-full max-w-md">
            <div className="rounded-3xl border border-secondary-500/25 bg-primary-900/80 p-3 text-center shadow-[0_24px_64px_rgba(0,0,0,0.45)] backdrop-blur-sm">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 bg-green-500/15 rounded-full flex items-center justify-center border border-green-400/40">
                  <CheckCircle size={30} className="text-green-500" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {smtpFailed ? 'Account created' : 'Verify your email'}
              </h1>
              <p className="text-xs text-gray-400 mb-3">Almost there!</p>
              
              {smtpFailed ? (
                 <p className="text-sm text-gray-300 mb-3">
                  Your account was created but we couldn&apos;t send the verification email right now.
                  Use the button below to resend it.
                </p>
              ) : (
                <>
                   <p className="text-gray-300 mb-1">We sent a verification link to</p>
                   <p className="font-semibold text-white mb-3 break-all">{email}</p>
                   <p className="text-xs text-gray-400 mb-4">
                    Click the link in the email — this page will log you in automatically.
                    The link expires in 24 hours.
                  </p>
                </>
              )}

              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full mb-1.5 px-4 py-2 border border-secondary-500/60 rounded-xl font-semibold text-secondary-400 hover:bg-secondary-500/10 transition-smooth flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={16} className={resending ? 'animate-spin' : ''} />
                {resending ? 'Sending...' : 'Resend verification email'}
              </button>

              <Link
                href={`/login?redirect=${encodeURIComponent(redirect)}`}
                className="block text-xs text-secondary-500 hover:underline"
              >
                Already verified? Sign in
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Sign up form ────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-primary-950">
      <Header />

      <main className="relative flex flex-1 items-start justify-center overflow-hidden px-4 pt-[105px] pb-12 md:pt-[105px] md:pb-16">
        <div className="absolute top-0 right-0 h-[420px] w-[420px] rounded-full bg-secondary-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-[320px] w-[320px] rounded-full bg-secondary-500/10 blur-[110px] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,218,0,0.7) 1px, transparent 1px)', backgroundSize: '34px 34px' }}
        />
        <div className="relative z-10 w-full max-w-md">
          <div className="rounded-3xl border border-secondary-500/25 bg-primary-900/80 p-2.5 md:p-3 shadow-[0_24px_64px_rgba(0,0,0,0.45)] backdrop-blur-sm">
            {/* Header */}
            <div className="text-center mb-3 md:mb-3.5">
              <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Create Account</h1>
              <p className="text-sm text-gray-300">Join Rina&apos;s Tours and Travels today</p>
            </div>

            {/* Google Sign Up */}
            <button
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full mb-3 px-4 py-2 bg-white border border-white/20 rounded-xl hover:border-secondary-500 transition-smooth flex items-center justify-center gap-2 font-semibold text-sm disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative mb-3">
              <div className="absolute inset-0 flex items-center">
                 <div className="w-full border-t border-primary-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                 <span className="px-2 bg-primary-900 text-gray-400">or sign up with email</span>
              </div>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleEmailSignup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5">Full Name</label>
                <div className="relative">
                   <UserIcon className="absolute left-3 top-2 text-gray-500" size={16} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="First Last"
                    className="w-full rounded-xl border border-primary-700 bg-primary-950/70 px-3 py-2 pl-9 text-sm text-white placeholder:text-gray-500 outline-none focus:border-secondary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5">Email</label>
                <div className="relative">
                   <Mail className="absolute left-3 top-2 text-gray-500" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full rounded-xl border border-primary-700 bg-primary-950/70 px-3 py-2 pl-9 text-sm text-white placeholder:text-gray-500 outline-none focus:border-secondary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5">Password</label>
                <div className="relative">
                   <Lock className="absolute left-3 top-2 text-gray-500" size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl border border-primary-700 bg-primary-950/70 px-3 py-2 pl-9 text-sm text-white placeholder:text-gray-500 outline-none focus:border-secondary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5">Confirm Password</label>
                <div className="relative">
                   <Lock className="absolute left-3 top-2 text-gray-500" size={16} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full rounded-xl border border-primary-700 bg-primary-950/70 px-3 py-2 pl-9 text-sm text-white placeholder:text-gray-500 outline-none focus:border-secondary-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-secondary-500 px-4 py-2 font-black text-primary-950 text-sm hover:bg-secondary-400 transition-colors disabled:opacity-50"
              >
                <UserPlus size={20} />
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-3 pt-3 border-t border-primary-700 text-center">
              <p className="text-sm text-gray-300">
                Already have an account?{' '}
                <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-secondary-500 font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function Signup() {
  return <Suspense><SignupContent /></Suspense>
}

