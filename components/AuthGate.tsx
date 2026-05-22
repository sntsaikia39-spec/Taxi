'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { validateFullName, validateEmail, validatePassword } from '@/lib/validation'
import { Mail, Lock, User as UserIcon, X, LogIn, UserPlus, CheckCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface AuthGateProps {
  /** Called when the user dismisses the modal without authenticating. */
  onClose: () => void
  /**
   * Called right before a Google OAuth redirect so the parent can persist
   * its booking state to sessionStorage. OAuth needs a full-page redirect;
   * email/password auth is fully inline and never triggers this.
   */
  onOAuthStart: () => void
}

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

/**
 * Inline authentication modal shown inside a booking flow, just before the
 * contact step. Email/password sign-in and sign-up happen without any page
 * navigation — when auth succeeds, AuthContext updates `user` and the booking
 * page advances on its own. Google OAuth is the only path that redirects.
 */
export default function AuthGate({ onClose, onOAuthStart }: AuthGateProps) {
  const { signInWithEmail, signUpWithEmail, signInWithOAuth, getOAuthUrl, refreshAuth, resendVerificationEmail } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [smtpFailed, setSmtpFailed] = useState(false)

  // Lock background scroll while open; close on Escape.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // After signup, watch for email verification — instantly via BroadcastChannel
  // (same browser, the /auth/verify tab broadcasts) and via polling (any device).
  // On success, AuthContext's onAuthStateChange sets `user` and the booking page
  // advances to the contact step. No navigation of this tab is needed.
  useEffect(() => {
    if (!verificationSent || !email || !password) return
    let bc: BroadcastChannel | null = null
    try {
      bc = new BroadcastChannel('rina:auth')
      bc.onmessage = (e) => {
        if (e.data?.event === 'EMAIL_VERIFIED') signInWithEmail(email, password)
      }
    } catch (_) {}
    let stopped = false
    let attempts = 0
    const interval = setInterval(async () => {
      if (stopped || attempts >= 72) return // give up after ~6 minutes
      attempts++
      await signInWithEmail(email, password)
    }, 5000)
    return () => { stopped = true; clearInterval(interval); bc?.close() }
  }, [verificationSent, email, password, signInWithEmail])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      const { error } = await signInWithEmail(email, password)
      if (error) {
        const m = (error.message || '').toLowerCase()
        if (m.includes('not confirmed') || m.includes('not_confirmed')) {
          toast('Please verify your email to continue.', { icon: '✉️' })
          setVerificationSent(true)
        } else if (m.includes('invalid login') || m.includes('invalid credentials') || m.includes('wrong password')) {
          toast.error('Incorrect email or password.')
        } else {
          toast.error(error.message || 'Failed to sign in')
        }
        return
      }
      toast.success('Signed in!')
      // Success: AuthContext picks up the session and the booking page closes
      // this modal and advances to the contact step.
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const nv = validateFullName(fullName)
    if (!nv.valid) { toast.error(nv.error || 'Invalid full name'); return }
    const ev = validateEmail(email)
    if (!ev.valid) { toast.error(ev.error || 'Invalid email'); return }
    const pv = validatePassword(password)
    if (!pv.valid) { toast.error(pv.error || 'Invalid password'); return }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      const { error, needsVerification, smtpError } = await signUpWithEmail(
        email, password, fullName, window.location.pathname,
      )
      if (error) {
        const m = (error.message || '').toLowerCase()
        if (m.includes('already registered') || m.includes('already been registered')) {
          toast.error('An account with this email already exists. Please sign in.')
          setMode('login')
        } else {
          toast.error(error.message || 'Failed to create account')
        }
        return
      }
      if (needsVerification) {
        setSmtpFailed(!!smtpError)
        setVerificationSent(true)
      } else {
        toast.success('Account created!')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      const { error } = await resendVerificationEmail(email)
      if (error) toast.error(error.message || 'Could not resend email')
      else toast.success('Verification email sent! Check your inbox.')
    } finally {
      setResending(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    try {
      const { url, error } = await getOAuthUrl('google', window.location.pathname, true)
      if (error || !url) {
        toast.error((error as any)?.message || 'Google sign-in failed')
        setLoading(false)
        return
      }

      // Try to open a popup so the booking page never navigates away.
      const w = 500, h = 640
      const left = Math.max(0, Math.round((screen.width - w) / 2))
      const top = Math.max(0, Math.round((screen.height - h) / 2))
      const popup = window.open(url, 'google-auth', `width=${w},height=${h},left=${left},top=${top},toolbar=0,menubar=0,location=0,scrollbars=1`)

      if (!popup || popup.closed) {
        // Popup blocked — fall back to full-page redirect.
        onOAuthStart()
        window.location.href = url
        return
      }

      // Store a timestamp so /auth/verify can detect it's running inside a popup.
      // localStorage is shared across same-origin windows; window.opener is null
      // here because Google's COOP headers sever the opener reference.
      // We store a timestamp (not '1') so stale keys from abandoned popups expire.
      try { localStorage.setItem('rina:oauthPending', String(Date.now())) } catch (_) {}

      let cleanedUp = false
      const cleanup = () => {
        if (cleanedUp) return
        cleanedUp = true
        try { localStorage.removeItem('rina:oauthPending') } catch (_) {}
        try { bc?.close() } catch (_) {}
        window.removeEventListener('message', onMsg)
      }

      // Primary: BroadcastChannel — works even when window.opener is null (COOP).
      let bc: BroadcastChannel | null = null
      try {
        bc = new BroadcastChannel('rina:auth')
        bc.onmessage = async (e) => {
          if (e.data?.type !== 'OAUTH_DONE') return
          cleanup()
          setLoading(false)
          await refreshAuth()
        }
      } catch (_) {}

      // Fallback: window.opener postMessage (works when COOP doesn't sever it).
      const onMsg = async (e: MessageEvent) => {
        if (e.origin !== window.location.origin || e.data?.type !== 'OAUTH_DONE') return
        cleanup()
        setLoading(false)
        await refreshAuth()
      }
      window.addEventListener('message', onMsg)

      // Detect manual popup close. IMPORTANT: COOP makes popup.closed return true
      // immediately from the opener side (Google's headers sever the reference), so
      // we must NOT call cleanup() here — that would remove the localStorage key
      // before /auth/verify gets a chance to read it. We only stop the spinner.
      const poll = setInterval(() => {
        let closed = false
        try { closed = !!popup.closed } catch (_) {}
        if (closed) { clearInterval(poll); if (!cleanedUp) setLoading(false) }
      }, 600)

    } catch (err: any) {
      toast.error(err?.message || 'Google sign-in failed')
      setLoading(false)
    }
  }

  const inputCls =
    'w-full rounded-xl border border-primary-700 bg-primary-950/70 px-3 py-2.5 pl-9 text-sm text-white placeholder:text-gray-500 outline-none focus:border-secondary-500'

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md max-h-[92vh] overflow-y-auto scrollbar-thin-modern rounded-3xl border border-secondary-500/25 bg-primary-900 p-5 md:p-6 shadow-[0_24px_64px_rgba(0,0,0,0.55)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {verificationSent ? (
          // ── Verification pending ──────────────────────────────────────────
          <div className="text-center pt-2">
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-400/40 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-500" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              {smtpFailed ? 'Account created' : 'Verify your email'}
            </h2>
            {smtpFailed ? (
              <p className="text-sm text-gray-300 mb-4">
                Your account was created but we couldn&apos;t send the verification email.
                Use the button below to resend it.
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-300">We sent a verification link to</p>
                <p className="font-semibold text-white mb-3 break-all">{email}</p>
                <p className="text-xs text-gray-400 mb-4">
                  Click the link in the email — this window continues your booking
                  automatically once you&apos;re verified.
                </p>
              </>
            )}
            <div className="flex items-center justify-center gap-2 text-xs text-secondary-300 mb-4">
              <RefreshCw size={13} className="animate-spin" />
              Waiting for verification…
            </div>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full px-4 py-2 border border-secondary-500/60 rounded-xl font-semibold text-secondary-400 hover:bg-secondary-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={15} className={resending ? 'animate-spin' : ''} />
              {resending ? 'Sending…' : 'Resend verification email'}
            </button>
          </div>
        ) : (
          // ── Login / Signup ────────────────────────────────────────────────
          <>
            <div className="text-center mb-4 pt-1">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
              </h2>
              <p className="text-sm text-gray-400">
                One quick step before your contact details — your booking is saved.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full mb-3 px-4 py-2.5 bg-white rounded-xl hover:opacity-95 transition flex items-center justify-center gap-2 font-semibold text-sm disabled:opacity-50"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-primary-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-primary-900 text-gray-500">or use email</span>
              </div>
            </div>

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-500" size={16} />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com" className={inputCls} required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-500" size={16} />
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password" className={inputCls} required
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-secondary-500 px-4 py-2.5 font-black text-primary-950 text-sm hover:bg-secondary-400 transition-colors disabled:opacity-50"
                >
                  <LogIn size={18} />
                  {loading ? 'Signing in…' : 'Sign In & Continue'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-3">
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 text-gray-500" size={16} />
                  <input
                    type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full name" className={inputCls} required
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-500" size={16} />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com" className={inputCls} required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-500" size={16} />
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (min 6 characters)" className={inputCls} required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-500" size={16} />
                  <input
                    type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password" className={inputCls} required
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-secondary-500 px-4 py-2.5 font-black text-primary-950 text-sm hover:bg-secondary-400 transition-colors disabled:opacity-50"
                >
                  <UserPlus size={18} />
                  {loading ? 'Creating account…' : 'Create Account & Continue'}
                </button>
              </form>
            )}

            <p className="text-center text-sm text-gray-400 mt-4">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button type="button" onClick={() => setMode('signup')} className="text-secondary-500 font-semibold hover:underline">
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button type="button" onClick={() => setMode('login')} className="text-secondary-500 font-semibold hover:underline">
                    Sign in
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
