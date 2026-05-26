import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdminRequest } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// Core delete logic — shared by cron and manual trigger
async function deleteExpiredPendingBookings(timeoutDays: number) {
  const cutoff = new Date(Date.now() - timeoutDays * 24 * 60 * 60 * 1000).toISOString()

  const { data: staleBookings, error: fetchError } = await supabaseAdmin
    .from('bookings')
    .select('id, booking_id')
    .eq('booking_status', 'pending')
    .lt('created_at', cutoff)

  if (fetchError) throw fetchError

  if (!staleBookings || staleBookings.length === 0) {
    return 0
  }

  const bookingIds = staleBookings.map(b => b.booking_id).filter(Boolean)
  const internalIds = staleBookings.map(b => b.id).filter(Boolean)
  const allIds = [...new Set([...bookingIds, ...internalIds])]

  for (const table of ['vehicle_assignments', 'payments', 'assignments']) {
    const { error } = await supabaseAdmin.from(table as any).delete().in('booking_id', allIds)
    if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
      console.error(`Cleanup error in ${table}:`, error)
    }
  }

  const { error: deleteError } = await supabaseAdmin
    .from('bookings')
    .delete()
    .in('id', internalIds)

  if (deleteError) throw deleteError

  return staleBookings.length
}

async function updateLastCleanupTime() {
  await supabaseAdmin
    .from('app_settings')
    .upsert(
      { key: 'last_cleanup_ran_at', value: new Date().toISOString(), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
}

// GET — called by Vercel Cron daily (requires CRON_SECRET)
// Only deletes bookings when enough days have passed since the last cleanup run
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: settings } = await supabaseAdmin
      .from('app_settings')
      .select('key, value')
      .in('key', ['pending_booking_timeout_hours', 'auto_cleanup_enabled', 'last_cleanup_ran_at'])

    const s: Record<string, string> = {}
    for (const row of settings ?? []) s[row.key] = row.value

    if (s['auto_cleanup_enabled'] === 'false') {
      console.log('[CRON] Auto-cleanup is disabled — skipping')
      return NextResponse.json({ success: true, skipped: true, reason: 'disabled' })
    }

    // stored as hours internally (days * 24); default 1 day
    const timeoutHours = s['pending_booking_timeout_hours'] ? parseInt(s['pending_booking_timeout_hours']) : 24
    const timeoutDays = timeoutHours / 24
    const timeoutMs = timeoutHours * 60 * 60 * 1000

    // Skip if not enough time has passed since the last cleanup run
    if (s['last_cleanup_ran_at']) {
      const msSinceLastRun = Date.now() - new Date(s['last_cleanup_ran_at']).getTime()
      if (msSinceLastRun < timeoutMs) {
        const daysLeft = Math.ceil((timeoutMs - msSinceLastRun) / (24 * 60 * 60 * 1000))
        console.log(`[CRON] Too soon — ${daysLeft}d remaining until next cleanup window`)
        return NextResponse.json({ success: true, skipped: true, reason: 'too_soon', daysLeft })
      }
    }

    const deleted = await deleteExpiredPendingBookings(timeoutDays)
    await updateLastCleanupTime()

    console.log(`[CRON] Cleanup complete — deleted: ${deleted}, window: ${timeoutDays}d`)
    return NextResponse.json({ success: true, deleted, timeoutDays })
  } catch (error) {
    console.error('[CRON] Cleanup error:', error)
    return NextResponse.json({ success: false, error: 'Cleanup failed' }, { status: 500 })
  }
}

// POST — manual "Clean Up Now" from admin panel
// Always runs immediately regardless of last cleanup time
export async function POST(request: NextRequest) {
  const unauthorized = requireAdminRequest(request)
  if (unauthorized) return unauthorized

  try {
    const { data: settings } = await supabaseAdmin
      .from('app_settings')
      .select('key, value')
      .in('key', ['pending_booking_timeout_hours', 'auto_cleanup_enabled'])

    const s: Record<string, string> = {}
    for (const row of settings ?? []) s[row.key] = row.value

    if (s['auto_cleanup_enabled'] === 'false') {
      return NextResponse.json({ success: true, skipped: true, reason: 'Auto-cleanup is disabled' })
    }

    const timeoutHours = s['pending_booking_timeout_hours'] ? parseInt(s['pending_booking_timeout_hours']) : 24
    const timeoutDays = timeoutHours / 24
    const deleted = await deleteExpiredPendingBookings(timeoutDays)
    await updateLastCleanupTime()

    return NextResponse.json({ success: true, deleted, timeoutDays })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ success: false, error: 'Cleanup failed' }, { status: 500 })
  }
}
