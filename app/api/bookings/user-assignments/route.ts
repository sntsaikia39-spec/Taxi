import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// POST body: { bookingIds: string[] }
// Returns all vehicle_assignments (with car details) for the given booking_ids.
export async function POST(request: NextRequest) {
  try {
    const { bookingIds } = await request.json()

    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      return Response.json({ success: true, assignments: [] })
    }

    const { data, error } = await supabaseAdmin
      .from('vehicle_assignments')
      .select(`
        id,
        booking_id,
        car_id,
        start_datetime,
        end_datetime,
        assigned_at,
        cars (
          id,
          model_name,
          class,
          number_plate,
          capacity,
          driver_name,
          driver_phone,
          driver_email
        )
      `)
      .in('booking_id', bookingIds)

    if (error) {
      console.error('Error fetching user assignments:', error)
      return Response.json({ success: false, error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, assignments: data || [] })
  } catch (err) {
    console.error('user-assignments route error:', err)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
