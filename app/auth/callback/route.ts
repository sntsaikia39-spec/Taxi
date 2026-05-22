import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect') || '/bookings'
  const popup = requestUrl.searchParams.get('popup')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  if (error || errorDescription) {
    const errorUrl = new URL('/auth/verify', requestUrl.origin)
    errorUrl.searchParams.set('error', error || 'unknown_error')
    errorUrl.searchParams.set('error_description', errorDescription || 'An unknown error occurred')
    return NextResponse.redirect(errorUrl)
  }

  if (code) {
    // Popup OAuth: go to the dedicated close page — it exchanges the code,
    // notifies the main tab via BroadcastChannel, then calls window.close().
    if (popup) {
      const popupUrl = new URL('/auth/popup-done', requestUrl.origin)
      popupUrl.searchParams.set('code', code)
      return NextResponse.redirect(popupUrl)
    }

    // Normal flow: exchange the code server-side where the PKCE verifier is
    // accessible via cookies (stored by @supabase/auth-helpers-nextjs).
    try {
      const supabase = createRouteHandlerClient({ cookies })
      await supabase.auth.exchangeCodeForSession(code)
      // Redirect directly to the target — no verify screen needed for OAuth.
      const target = redirect.startsWith('/') ? redirect : '/bookings'
      return NextResponse.redirect(new URL(target, requestUrl.origin))
    } catch {
      // Fallback: let the client-side verify page handle it
      const verifyUrl = new URL('/auth/verify', requestUrl.origin)
      verifyUrl.searchParams.set('code', code)
      verifyUrl.searchParams.set('redirect', redirect)
      return NextResponse.redirect(verifyUrl)
    }
  }

  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
