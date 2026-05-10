import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

    // Extract HH:mm from arrival_time (stored as datetime string like "...T09:00...")
    const timeMatch = tour.arrival_time?.match(/T(\d{2}):(\d{2})/)
    const startTime = timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : '09:00'
    const durationHours = tour.duration_hours || 4

    const requestStart = new Date(`${bookingDate}T${startTime}:00`)
    if (isNaN(requestStart.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid booking_date' }, { status: 400 })
    }
    const requestEnd = new Date(requestStart.getTime() + durationHours * 3600000)

    // Count physical active cars of this model
    const { data: carsOfModel, error: carsError } = await supabaseAdmin
      .from('cars')
      .select('id')
      .eq('model_name', tour.car_model)
      .eq('is_active', true)

    if (carsError) throw new Error('Failed to fetch cars')

    const totalCars = carsOfModel?.length ?? 0
    if (totalCars === 0) {
      return NextResponse.json({ success: true, available: false, available_count: 0, car_model: tour.car_model })
    }

    // Active bookings for this model
    const { data: activeBookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('booking_id, start_datetime, end_datetime')
      .eq('car_model', tour.car_model)
      .in('booking_status', ['pending', 'confirmed'])

    if (bookingsError) throw new Error('Failed to fetch bookings')

    // Filter to overlapping window
    const overlapping = (activeBookings || []).filter(b => {
      if (!b.start_datetime || !b.end_datetime) return false
      const bStart = new Date(b.start_datetime)
      const bEnd = new Date(b.end_datetime)
      return requestStart < bEnd && requestEnd > bStart
    })

    const overlappingIds = overlapping.map(b => b.booking_id)
    const assignedCarIds = new Set<string>()
    const assignedBookingIds = new Set<string>()

    if (overlappingIds.length > 0) {
      const { data: assignments } = await supabaseAdmin
        .from('vehicle_assignments')
        .select('booking_id, car_id')
        .in('booking_id', overlappingIds)

      ;(assignments || []).forEach(a => {
        assignedCarIds.add(a.car_id)
        assignedBookingIds.add(a.booking_id)
      })
    }

    const blockedByAssignment = (carsOfModel ?? []).filter(c => assignedCarIds.has(c.id)).length
    const blockedByUnassigned = overlapping.filter(b => !assignedBookingIds.has(b.booking_id)).length
    const totalBlocked = Math.min(blockedByAssignment + blockedByUnassigned, totalCars)
    const availableCount = totalCars - totalBlocked

    return NextResponse.json({
      success: true,
      available: availableCount > 0,
      available_count: availableCount,
      car_model: tour.car_model,
    })
  } catch (error) {
    console.error('Tour availability check error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
