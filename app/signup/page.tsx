'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
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
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md">
            <div className="card p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={36} className="text-green-500" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-1">
                {smtpFailed ? 'Account created' : 'Verify your email'}
              </h1>
              <p className="text-sm text-gray-500 mb-6">Almost there!</p>
              
              {smtpFailed ? (
                <p className="text-gray-600 mb-6">
                  Your account was created but we couldn&apos;t send the verification email right now.
                  Use the button below to resend it.
                </p>
              ) : (
                <>
                  <p className="text-gray-600 mb-1">We sent a verification link to</p>
                  <p className="font-semibold text-gray-900 mb-6 break-all">{email}</p>
                  <p className="text-sm text-gray-500 mb-8">
                    Click the link in the email — this page will log you in automatically.
                    The link expires in 24 hours.
                  </p>
                </>
              )}

              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full mb-3 px-4 py-3 border-2 border-secondary-500 rounded-lg font-semibold hover:bg-secondary-50 transition-smooth flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={16} className={resending ? 'animate-spin' : ''} />
                {resending ? 'Sending...' : 'Resend verification email'}
              </button>

              <Link
                href={`/login?redirect=${encodeURIComponent(redirect)}`}
                className="block text-sm text-secondary-600 hover:underline"
              >
                Already verified? Sign in
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // ── Sign up form ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="card p-5 md:p-8">
            {/* Header */}
            <div className="text-center mb-6 md:mb-8">
              <div className="flex justify-center mb-3 md:mb-4">
                <svg viewBox="0 0 100 100" width="56" height="56" xmlns="http://www.w3.org/2000/svg" className="rounded-full shadow">
                  <circle cx="50" cy="50" r="50" fill="#ffda00"/>
                  <text x="50" y="67" textAnchor="middle" fontFamily="Georgia,serif" fontWeight="bold" fontSize="52" fill="#1a1a2e">R</text>
                </svg>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Create Account</h1>
              <p className="text-gray-600">Join Rina&apos;s Tours and Travels today</p>
            </div>

            {/* Google Sign Up */}
            <button
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full mb-6 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-secondary-500 transition-smooth flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
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
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or sign up with email</span>
              </div>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="First Last"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <UserPlus size={20} />
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-secondary-500 font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function Signup() {
  return <Suspense><SignupContent /></Suspense>
}
