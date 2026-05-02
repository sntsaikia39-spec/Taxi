'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import { Mail, Lock, LogIn, RefreshCw, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/bookings'
  const { signInWithEmail, signInWithOAuth, resendVerificationEmail, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  // Show the "verify your email" nudge when Supabase blocks login due to unverified email
  const [showVerifyNudge, setShowVerifyNudge] = useState(false)

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

  if (user) {
    router.push(redirect)
    return null
  }

  const isEmailNotConfirmed = (msg: string) =>
    msg.toLowerCase().includes('email not confirmed') ||
    msg.toLowerCase().includes('not confirmed') ||
    msg.toLowerCase().includes('email_not_confirmed')

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    setShowVerifyNudge(false)
    try {
      const { error } = await signInWithEmail(email, password)
      if (error) {
        if (isEmailNotConfirmed(error.message || '')) {
          setShowVerifyNudge(true)
        } else if (
          error.message?.toLowerCase().includes('invalid login') ||
          error.message?.toLowerCase().includes('invalid credentials') ||
          error.message?.toLowerCase().includes('wrong password')
        ) {
          toast.error('Incorrect email or password. Please try again.')
        } else {
          toast.error(error.message || 'Failed to sign in')
        }
        return
      }
      toast.success('Signed in successfully!')
      router.push(redirect)
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Enter your email address above first')
      return
    }
    setResending(true)
    try {
      const { error } = await resendVerificationEmail(email)
      if (error) {
        toast.error(error.message || 'Could not resend email')
      } else {
        toast.success('Verification email sent! Check your inbox.')
      }
    } finally {
      setResending(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const { error } = await signInWithOAuth('google', redirect)
      if (error) toast.error(error.message || 'Failed to sign in with Google')
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

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
          <div className="rounded-3xl border border-secondary-500/25 bg-primary-900/80 p-3 md:p-4 shadow-[0_24px_64px_rgba(0,0,0,0.45)] backdrop-blur-sm">
            {/* Header */}
            <div className="text-center mb-4 md:mb-5">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Welcome Back</h1>
              <p className="text-gray-300">Sign in to your Rina&apos;s Tours and Travels account</p>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full mb-4 px-4 py-2.5 bg-white border border-white/20 rounded-xl hover:border-secondary-500 transition-smooth flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
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
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                 <div className="w-full border-t border-primary-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                 <span className="px-2 bg-primary-900 text-gray-400">or continue with email</span>
              </div>
            </div>

            {/* Email not confirmed nudge */}
            {showVerifyNudge && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-400/40 rounded-xl flex gap-3">
                <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-300 mb-1">Please verify your email first</p>
                  <p className="text-amber-200 mb-3">
                    Check your inbox for the verification link we sent to <strong>{email}</strong>.
                    You must verify your email before signing in.
                  </p>
                  <button
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="flex items-center gap-1.5 text-amber-300 font-semibold hover:text-amber-200 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                    {resending ? 'Sending...' : 'Resend verification email'}
                  </button>
                </div>
              </div>
            )}

            {/* Email Sign In Form */}
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1">Email</label>
                <div className="relative">
                   <Mail className="absolute left-3 top-2.5 text-gray-500" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setShowVerifyNudge(false) }}
                    placeholder="your@email.com"
                    className="w-full rounded-xl border border-primary-700 bg-primary-950/70 px-3 py-2.5 pl-9 text-white placeholder:text-gray-500 outline-none focus:border-secondary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1">Password</label>
                <div className="relative">
                   <Lock className="absolute left-3 top-2.5 text-gray-500" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-primary-700 bg-primary-950/70 px-3 py-2.5 pl-9 text-white placeholder:text-gray-500 outline-none focus:border-secondary-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-secondary-500 px-4 py-2.5 font-black text-primary-950 hover:bg-secondary-400 transition-colors disabled:opacity-50"
              >
                <LogIn size={20} />
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {/* Forgot Password */}
            <div className="mt-3 text-center">
              <Link href="/forgot-password" className="text-secondary-500 hover:underline text-sm">
                Forgot password?
              </Link>
            </div>

            {/* Sign Up Link */}
            <div className="mt-4 pt-4 border-t border-primary-700 text-center">
              <p className="text-gray-300">
                Don&apos;t have an account?{' '}
                <Link href={`/signup?redirect=${encodeURIComponent(redirect)}`} className="text-secondary-500 font-semibold hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function Login() {
  return <Suspense><LoginContent /></Suspense>
}

