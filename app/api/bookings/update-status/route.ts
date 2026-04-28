import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled']

export async function PATCH(request: Request) {
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

    return Response.json({ success: true, booking: data })
  } catch (error) {
    console.error('update-status error:', error)
    return Response.json({ error: 'Failed to update booking status' }, { status: 500 })
  }
}
