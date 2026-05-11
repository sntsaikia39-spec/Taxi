import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { booking_id } = await request.json()
    if (!booking_id) {
      return NextResponse.json({ success: false, error: 'booking_id required' }, { status: 400 })
    }

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('booking_id', booking_id)
      .single()

    if (error || !booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    if (booking.booking_status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Booking is not pending' }, { status: 400 })
    }

    let destinationName: string | null = null
    let tourName: string | null = null

    if (booking.destination_id) {
      const { data: dest } = await supabaseAdmin
        .from('destinations')
        .select('name')
        .eq('id', booking.destination_id)
        .single()
      destinationName = dest?.name || null
    }

    if (booking.tour_package_id) {
      const { data: tour } = await supabaseAdmin
        .from('tour_packages')
        .select('name')
        .eq('id', booking.tour_package_id)
        .single()
      tourName = tour?.name || null
    }

    return NextResponse.json({ success: true, booking, destinationName, tourName })
  } catch (error) {
    console.error('Resume booking error:', error)
    return NextResponse.json({ success: false, error: 'Failed to resume booking' }, { status: 500 })
  }
}
