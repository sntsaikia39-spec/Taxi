import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
      return Response.json(
        {
          success: false,
          error: 'Missing bookingId parameter',
        },
        { status: 400 }
      )
    }

    // Try direct lookup first (covers rows where payments.booking_id equals provided value)
    const { data: directPayment, error: directError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .single()

    if (!directError && directPayment) {
      return Response.json(directPayment, { status: 200 })
    }

    // Fallback: bookingId may be DB UUID (bookings.id) while payment row stores bookings.booking_id
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('booking_id')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking?.booking_id) {
      console.error('Error resolving booking identifier:', bookingError || 'booking not found')
      return Response.json(
        {
          success: false,
          error: 'Payment record not found',
        },
        { status: 404 }
      )
    }

    const { data: fallbackPayment, error: fallbackError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('booking_id', booking.booking_id)
      .single()

    if (fallbackError || !fallbackPayment) {
      console.error('Error fetching payment:', fallbackError || directError)
      return Response.json(
        {
          success: false,
          error: 'Payment record not found',
        },
        { status: 404 }
      )
    }

    return Response.json(fallbackPayment, { status: 200 })
  } catch (error) {
    console.error('Error in get-payment route:', error)
    return Response.json(
      {
        success: false,
        error: 'Failed to fetch payment record',
      },
      { status: 500 }
    )
  }
}
