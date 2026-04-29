'use client'

import { useEffect, Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

type VerificationState = 'loading' | 'success' | 'error'

function VerifyContent() {
  const searchParams = useSearchParams()
  const [state, setState] = useState<VerificationState>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [isRetrying, setIsRetrying] = useState(false)

  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') || 'signup'
  const code = searchParams.get('code')

  const errorParam = searchParams.get('error')
  const errorDescParam = searchParams.get('error_description')

  const performVerification = async () => {
    setState('loading')
    setErrorMessage('')

    try {
      const supabase = createClientComponentClient()

      if (tokenHash) {
        // token_hash approach — stateless, works cross-browser and cross-device
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any,
        })
        if (error) throw error
        if (!data.session) throw new Error('No session was created after verification.')
      } else if (code) {
        // PKCE code approach — same browser only (fallback for OAuth callbacks)
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

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-secondary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Verifying your email...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait a moment</p>
        </div>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={36} className="text-green-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Verified!</h1>
          <p className="text-gray-600 mb-1">Welcome to Rina&apos;s Tours and Travels</p>
          <p className="text-sm text-gray-500">Logging you in automatically...</p>
          <div className="mt-6 flex justify-center gap-1">
            <div className="w-1.5 h-1.5 bg-secondary-500 rounded-full animate-pulse" />
            <div className="w-1.5 h-1.5 bg-secondary-500 rounded-full animate-pulse" />
            <div className="w-1.5 h-1.5 bg-secondary-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle size={36} className="text-red-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
          <p className="text-gray-600 mb-6">{errorMessage}</p>

          <div className="space-y-3">
            {(tokenHash || code) && (
              <button
                onClick={async () => {
                  setIsRetrying(true)
                  await performVerification()
                  setIsRetrying(false)
                }}
                disabled={isRetrying}
                className="w-full px-4 py-3 bg-secondary-500 text-white rounded-lg font-semibold hover:bg-secondary-600 transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} className={isRetrying ? 'animate-spin' : ''} />
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </button>
            )}

            <Link
              href="/signup"
              className="block px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-smooth"
            >
              Request New Link
            </Link>

            <Link
              href="/login"
              className="block px-4 py-3 text-secondary-500 font-semibold hover:text-secondary-600 transition-smooth"
            >
              Back to Login
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            If you continue to experience issues, please contact support
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-12 h-12 border-4 border-secondary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
