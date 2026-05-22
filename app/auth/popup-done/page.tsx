'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

function PopupDoneContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')

  useEffect(() => {
    const notify = () => {
      // Notify the main tab via BroadcastChannel — doesn't need window.opener.
      try {
        const bc = new BroadcastChannel('rina:auth')
        bc.postMessage({ type: 'OAUTH_DONE' })
        bc.close()
      } catch (_) {}
      // Also try postMessage in case BroadcastChannel isn't supported.
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'OAUTH_DONE' }, window.location.origin)
        }
      } catch (_) {}
    }

    const run = async () => {
      console.log('[popup-done] page loaded. code:', !!code, 'error:', errorParam)
      if (!errorParam && code) {
        const supabase = createClientComponentClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        console.log('[popup-done] exchangeCodeForSession result:', error ? error.message : 'OK')
      }
      notify()
      console.log('[popup-done] calling window.close()')
      // Keep retrying window.close() — some browsers need a moment.
      window.close()
      const t1 = setTimeout(() => { console.log('[popup-done] retry close #1'); window.close() }, 300)
      const t2 = setTimeout(() => { console.log('[popup-done] retry close #2'); window.close() }, 800)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }

    run()
  }, [code, errorParam]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center justify-center min-h-screen bg-primary-950">
      <div className="text-center text-white px-6">
        <div className="w-12 h-12 border-4 border-secondary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg font-semibold text-white">Authentication complete</p>
        <p className="text-sm text-gray-400 mt-2">You can close this window.</p>
      </div>
    </div>
  )
}

export default function PopupDonePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-primary-950">
        <div className="w-10 h-10 border-4 border-secondary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PopupDoneContent />
    </Suspense>
  )
}
