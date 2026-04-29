import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Server-side code exchange endpoint
 * Exchanges verification code for session WITHOUT requiring PKCE code verifier
 * This allows multi-device email verification (e.g., sign up on Device A, verify on Device B)
 */
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'No verification code provided' },
        { status: 400 }
      )
    }

    // Create server-side Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Exchange code for session - server-side doesn't need PKCE verifier
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Code exchange error:', error)
      return NextResponse.json(
        { 
          error: error.message || 'Failed to exchange code for session',
          code: error.status
        },
        { status: 400 }
      )
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'No session created after code exchange' },
        { status: 400 }
      )
    }

    // Return session tokens so client can set cookies
    return NextResponse.json({
      success: true,
      session: data.session,
      user: data.user,
    })
  } catch (err: any) {
    console.error('Verification error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
