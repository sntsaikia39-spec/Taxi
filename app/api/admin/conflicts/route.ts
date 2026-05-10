import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/conflicts
 *
 * Returns two categories of booking conflicts among active (pending/confirmed) bookings:
 *
 * 1. assignment_conflicts — two vehicle_assignments reference the same car_id
 *    with overlapping time windows.  These are hard conflicts: the same physical car
 *    is scheduled for two jobs simultaneously.
 *
 * 2. model_conflicts — the number of active unassigned + assigned bookings for a
 *    car model exceeds the physical car count for that model, for some time window.
 *    These are soft conflicts: solvable by assigning different cars or cancelling.
 */
export async function GET() {
  try {
    // ── Fetch all active bookings ───────────────────────────────────────────
    const { data: activeBookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('id, booking_id, user_name, user_email, phone, car_model, booking_type, start_datetime, end_datetime, booking_status, passenger_count')
      .in('booking_status', ['pending', 'confirmed'])

    if (bookingsError) throw new Error('Failed to fetch bookings')

    // ── Fetch all vehicle assignments ───────────────────────────────────────
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('vehicle_assignments')
      .select('id, booking_id, car_id, start_datetime, end_datetime')

    if (assignmentsError) throw new Error('Failed to fetch assignments')

    // ── Fetch all active cars ───────────────────────────────────────────────
    const { data: cars, error: carsError } = await supabaseAdmin
      .from('cars')
      .select('id, model_name, number_plate, driver_name, is_active')
      .eq('is_active', true)

    if (carsError) throw new Error('Failed to fetch cars')

    const activeBookingIds = new Set((activeBookings || []).map(b => b.booking_id || b.id))

    // Filter assignments to only those tied to active bookings
    const activeAssignments = (assignments || []).filter(a => activeBookingIds.has(a.booking_id))

    // ── 1. ASSIGNMENT CONFLICTS ─────────────────────────────────────────────
    // Group assignments by car_id, then find overlapping pairs
    const byCar = new Map<string, typeof activeAssignments>()
    activeAssignments.forEach(a => {
      if (!byCar.has(a.car_id)) byCar.set(a.car_id, [])
      byCar.get(a.car_id)!.push(a)
    })

    const assignmentConflicts: {
      car_id: string
      car_number_plate: string
      car_model: string
      booking_a: (typeof activeBookings)[0] | null
      booking_b: (typeof activeBookings)[0] | null
      overlap_start: string
      overlap_end: string
    }[] = []

    byCar.forEach((assigns, carId) => {
      for (let i = 0; i < assigns.length; i++) {
        for (let j = i + 1; j < assigns.length; j++) {
          const a = assigns[i]
          const b = assigns[j]
          const aStart = new Date(a.start_datetime)
          const aEnd   = new Date(a.end_datetime)
          const bStart = new Date(b.start_datetime)
          const bEnd   = new Date(b.end_datetime)

          if (aStart < bEnd && aEnd > bStart) {
            const car = (cars || []).find(c => c.id === carId)
            const bookingA = (activeBookings || []).find(bk => (bk.booking_id || bk.id) === a.booking_id) || null
            const bookingB = (activeBookings || []).find(bk => (bk.booking_id || bk.id) === b.booking_id) || null

            assignmentConflicts.push({
              car_id:           carId,
              car_number_plate: car?.number_plate || 'Unknown',
              car_model:        car?.model_name   || 'Unknown',
              booking_a:        bookingA,
              booking_b:        bookingB,
              overlap_start:    aStart > bStart ? a.start_datetime : b.start_datetime,
              overlap_end:      aEnd < bEnd ? a.end_datetime : b.end_datetime,
            })
          }
        }
      }
    })

    // ── 2. MODEL OVER-SUBSCRIPTION ──────────────────────────────────────────
    // Count physical cars per model
    const carCountByModel = new Map<string, number>()
    ;(cars || []).forEach(c => carCountByModel.set(c.model_name, (carCountByModel.get(c.model_name) || 0) + 1))

    // Group active bookings by car_model
    const bookingsByModel = new Map<string, typeof activeBookings>()
    ;(activeBookings || []).forEach(b => {
      if (!b.car_model) return
      if (!bookingsByModel.has(b.car_model)) bookingsByModel.set(b.car_model, [])
      bookingsByModel.get(b.car_model)!.push(b)
    })

    const modelConflicts: {
      car_model: string
      physical_count: number
      conflicting_bookings: typeof activeBookings
    }[] = []

    bookingsByModel.forEach((bookingsForModel, model) => {
      const physical = carCountByModel.get(model) || 0

      // Find groups of bookings that all overlap each other
      // Simple approach: for each booking, count how many others overlap it
      bookingsForModel.forEach(bk => {
        const bkStart = new Date(bk.start_datetime)
        const bkEnd   = new Date(bk.end_datetime)

        const overlapping = bookingsForModel.filter(other => {
          if (other.booking_id === bk.booking_id) return false
          const oStart = new Date(other.start_datetime)
          const oEnd   = new Date(other.end_datetime)
          return bkStart < oEnd && bkEnd > oStart
        })

        // Including `bk` itself, total concurrent demand = overlapping.length + 1
        if (overlapping.length + 1 > physical) {
          // Only add if not already captured
          const alreadyCaptured = modelConflicts.some(mc =>
            mc.car_model === model &&
            mc.conflicting_bookings.some(cb => (cb.booking_id || cb.id) === (bk.booking_id || bk.id))
          )
          if (!alreadyCaptured) {
            modelConflicts.push({
              car_model:            model,
              physical_count:       physical,
              conflicting_bookings: [bk, ...overlapping],
            })
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      assignment_conflicts: assignmentConflicts,
      model_conflicts: modelConflicts,
      total: assignmentConflicts.length + modelConflicts.length,
    })
  } catch (error) {
    console.error('Conflict detection error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
