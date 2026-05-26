import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdminRequest } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const PUBLIC_READ_KEYS = new Set(['pending_booking_timeout_hours'])

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key')
    if (!key || !PUBLIC_READ_KEYS.has(key)) {
      const unauthorized = requireAdminRequest(request)
      if (unauthorized) return unauthorized
    }

    const query = supabaseAdmin.from('app_settings').select('key, value, updated_at')
    if (key) query.eq('key', key)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, settings: data })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const unauthorized = requireAdminRequest(request)
  if (unauthorized) return unauthorized

  try {
    const { key, value } = await request.json()
    if (!key || value === undefined) {
      return NextResponse.json({ success: false, error: 'Missing key or value' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, setting: data })
  } catch (error) {
    console.error('Settings PATCH error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update setting' }, { status: 500 })
  }
}
