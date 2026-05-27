import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminFromRequest, requireAdminRequest } from '@/lib/admin-auth'
import { logSystemEvent } from '@/lib/system-events'

export const dynamic = 'force-dynamic'

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled']

export async function PATCH(request: Request) {
  const unauthorized = requireAdminRequest(request)
  if (unauthorized) return unauthorized
  const admin = getAdminFromRequest(request)

  try {
    const { booking_id, status } = await request.json()

    if (!booking_id || !status) {
      return Response.json({ error: 'booking_id and status are required' }, { status: 400 })
    }

    if (!VALID_STATUSES.includes(status)) {
      return Response.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({ booking_status: status })
      .eq('booking_id', booking_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating booking status:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    await logSystemEvent({
      severity: 'info',
      event_type: 'booking_status_updated',
      actor_type: 'admin',
      actor_id: admin?.id || null,
      actor_label: admin?.email || null,
      entity_type: 'booking',
      entity_id: booking_id,
      message: `Booking status changed to ${status}`,
      metadata: { status },
    })

    return Response.json({ success: true, booking: data })
  } catch (error) {
    console.error('update-status error:', error)
    await logSystemEvent({
      severity: 'error',
      event_type: 'booking_status_update_failed',
      actor_type: 'admin',
      actor_id: admin?.id || null,
      actor_label: admin?.email || null,
      message: 'Booking status update failed',
      metadata: { error: error instanceof Error ? error.message : String(error) },
    })
    return Response.json({ error: 'Failed to update booking status' }, { status: 500 })
  }
}
