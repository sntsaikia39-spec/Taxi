'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>
  signUpWithEmail: (email: string, password: string, fullName?: string, redirectTo?: string) => Promise<{ error: any; needsVerification?: boolean; smtpError?: boolean }>
  signInWithOAuth: (provider: 'google', redirectTo?: string) => Promise<{ error: any }>
  getOAuthUrl: (provider: 'google', redirectTo?: string, popup?: boolean) => Promise<{ url: string | null; error: any }>
  refreshAuth: () => Promise<void>
  resendVerificationEmail: (email: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user || null)
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription?.unsubscribe()
  }, [])

  const signUpWithEmail = async (email: string, password: string, fullName?: string, redirectTo?: string) => {
    try {
      const callbackUrl = redirectTo
        ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
        : `${window.location.origin}/auth/callback`
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName || '' },
          emailRedirectTo: callbackUrl,
        },
      })

      // SMTP failure: user was created but confirmation email couldn't be sent.
      // Treat it as needsVerification so the user sees the "check your email"
      // screen — they can use the resend button once SMTP is fixed.
      if (error?.message?.toLowerCase().includes('sending confirmation email') ||
          error?.message?.toLowerCase().includes('error sending') ||
          error?.status === 500) {
        return { error: null, needsVerification: true, smtpError: true }
      }

      // Supabase silently returns user with empty identities when the email is
      // already registered (avoids leaking account existence). Surface it as an
      // explicit error so the UI can redirect to login instead.
      if (!error && data.user && (data.user.identities?.length ?? 0) === 0) {
        return {
          error: { message: 'This email is already registered. Please sign in instead.' },
          needsVerification: false,
          smtpError: false,
        }
      }

      const needsVerification = !error && !!data.user && data.session === null
      return { error, needsVerification, smtpError: false }
    } catch (error) {
      return { error, needsVerification: false, smtpError: false }
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const resendVerificationEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signInWithOAuth = async (provider: 'google', redirectTo?: string) => {
    try {
      const callbackUrl = redirectTo
        ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
        : `${window.location.origin}/auth/callback`

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callbackUrl },
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  // Returns the OAuth URL without redirecting — used by popup-based auth.
  // For popups we point redirectTo directly at /auth/popup-done so the code never
  // passes through /auth/callback (which was dropping our custom query params).
  const getOAuthUrl = async (provider: 'google', redirectTo?: string, popup?: boolean) => {
    try {
      const callbackUrl = popup
        ? `${window.location.origin}/auth/popup-done`
        : (() => {
            const u = new URL(`${window.location.origin}/auth/callback`)
            if (redirectTo) u.searchParams.set('redirect', redirectTo)
            return u.toString()
          })()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callbackUrl, skipBrowserRedirect: true },
      })
      return { url: data?.url || null, error }
    } catch (error) {
      return { url: null, error }
    }
  }

  // Force-reads the current session and updates user state.
  // Called by AuthGate after the popup signals completion.
  const refreshAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    } catch {}
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      sessionStorage.removeItem('bookingData')
      sessionStorage.removeItem('tourBookingData')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signInWithEmail, signUpWithEmail, signInWithOAuth, getOAuthUrl, refreshAuth, resendVerificationEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
