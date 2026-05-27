import { NextRequest, NextResponse } from 'next/server'
import { logSystemEvent } from '@/lib/system-events'

export async function POST(request: NextRequest) {
  try {
    // Get the token from Authorization header
    const token = request.headers.get('Authorization')?.split(' ')[1]

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    // Token validation could be done here if needed
    // For now, just confirm logout on client-side (token is removed from localStorage)
    await logSystemEvent({
      severity: 'info',
      event_type: 'admin_logout',
      actor_type: 'admin',
      message: 'Admin logout requested',
    })

    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
