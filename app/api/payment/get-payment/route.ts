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

    // Fetch payment record by booking_id
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .single()

    if (error) {
      console.error('Error fetching payment:', error)
      return Response.json(
        {
          success: false,
          error: 'Payment record not found',
        },
        { status: 404 }
      )
    }

    return Response.json(payment, { status: 200 })
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
