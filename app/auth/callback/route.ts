import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirect = requestUrl.searchParams.get('redirect') || '/bookings'
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle Supabase errors (e.g., invalid token, expired token)
  if (error || errorDescription) {
    const errorUrl = new URL('/auth/verify', requestUrl.origin)
    errorUrl.searchParams.set('error', error || 'unknown_error')
    errorUrl.searchParams.set('error_description', errorDescription || 'An unknown error occurred')
    return NextResponse.redirect(errorUrl)
  }

  if (code) {
    // Pass code to client-side page so exchangeCodeForSession can set cookies
    // in the browser context, enabling reliable auto-login after verification.
    const verifyUrl = new URL('/auth/verify', requestUrl.origin)
    verifyUrl.searchParams.set('code', code)
    verifyUrl.searchParams.set('redirect', redirect)
    return NextResponse.redirect(verifyUrl)
  }

  // No code and no error - redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
