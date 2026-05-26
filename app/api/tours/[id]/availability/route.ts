import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  addMinutesToISTDateTime,
  createDateTimeIST,
  getConflictControlEnabled,
  getModelAvailability,
} from '@/lib/conflicts'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingDate = request.nextUrl.searchParams.get('booking_date')
    if (!bookingDate) {
      return NextResponse.json({ success: false, error: 'Missing booking_date' }, { status: 400 })
    }

    const { data: tour, error: tourError } = await supabaseAdmin
      .from('tour_packages')
      .select('car_model, arrival_time, duration_hours')
      .eq('id', params.id)
      .single()

    if (tourError || !tour) {
      return NextResponse.json({ success: false, error: 'Tour not found' }, { status: 404 })
    }

    if (!tour.car_model) {
      return NextResponse.json({ success: true, available: true, available_count: null, car_model: null })
    }

    const conflictControlEnabled = await getConflictControlEnabled()
    if (!conflictControlEnabled) {
      return NextResponse.json({
        success: true,
        available: true,
        available_count: null,
        car_model: tour.car_model,
        conflict_control_enabled: false,
      })
    }

    const arrivalTime = String(tour.arrival_time || '')
    const timeMatch = arrivalTime.match(/[T\s](\d{2}):(\d{2})/) || arrivalTime.match(/^(\d{2}):(\d{2})/)
    const startTime = timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : '09:00'
    const durationHours = Number(tour.duration_hours || 4)
    const requestStart = createDateTimeIST(bookingDate, startTime)
    const requestEnd = addMinutesToISTDateTime(requestStart, durationHours * 60)

    const availability = await getModelAvailability(tour.car_model, {
      start: requestStart,
      end: requestEnd,
    })

    const availableCount = availability?.available_count || 0
    const available = availableCount > 0

    return NextResponse.json({
      success: true,
      available,
      available_count: availableCount,
      car_model: tour.car_model,
      conflict_control_enabled: true,
      warning: available
        ? null
        : `The preferred ${tour.car_model} vehicle may not be available for this timeslot. You can still book the tour, and another suitable vehicle may be assigned.`,
    })
  } catch (error) {
    console.error('Tour availability check error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
