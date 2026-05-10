import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cars/available-models
 *
 * Availability algorithm (in order of precedence):
 *
 * 1. booking_status is the PRIMARY signal.
 *    - 'pending' | 'confirmed'  → booking is active, car/model is busy
 *    - 'completed' | 'cancelled' → booking is done, car is free immediately
 *    - End-datetime is only used to check whether a booking's time window
 *      overlaps with the requested window — NOT to decide if a car is free.
 *
 * 2. Two-tier conflict detection per model:
 *    a. ASSIGNED cars: a specific car.id is blocked when it has a
 *       vehicle_assignment linked to an active (pending/confirmed) booking
 *       whose time window overlaps the requested window.
 *    b. UNASSIGNED slots: an active booking with no vehicle_assignment yet
 *       still reserves one physical car of the booked model_name. Each such
 *       booking blocks one slot until it gets assigned or cancelled/completed.
 *
 * 3. available_count = total physical cars of model
 *                    − cars blocked by assignments (tier a)
 *                    − slots blocked by unassigned bookings (tier b)
 *    Models with available_count ≤ 0 are excluded from the response.
 *
 * Query params: booking_date (YYYY-MM-DD), start_time (HH:mm), end_time (HH:mm)
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams
    const bookingDate = sp.get('booking_date')
    const startTime   = sp.get('start_time')
    const endTime     = sp.get('end_time')
    // end_date: optional. When a booking crosses midnight, the client sends the
    // actual end date so requestEnd is computed correctly instead of wrapping.
    const endDate     = sp.get('end_date') || bookingDate

    if (!bookingDate || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required query parameters: booking_date, start_time, end_time' },
        { status: 400 }
      )
    }

    // ── 0. Check conflict control toggle ───────────────────────────────────
    const { data: settingRow } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'conflict_control_enabled')
      .single()

    const conflictControlEnabled = settingRow?.value !== 'false'

    if (!conflictControlEnabled) {
      // Conflict control is OFF — return all active cars as available (no overlap checks)
      const { data: allCars, error: allCarsError } = await supabaseAdmin
        .from('cars')
        .select('id, model_name, class, capacity, per_km_charge, per_hr_charge')
        .eq('is_active', true)
        .order('model_name', { ascending: true })

      if (allCarsError) throw new Error('Failed to fetch cars')

      const modelMap = new Map<string, { model_name: string; class: string; capacity: number; per_km_charge: number; per_hr_charge: number }>()
      ;(allCars || []).forEach(car => {
        if (!modelMap.has(car.model_name)) modelMap.set(car.model_name, car)
      })

      const counts = new Map<string, number>()
      ;(allCars || []).forEach(car => counts.set(car.model_name, (counts.get(car.model_name) || 0) + 1))

      const models = Array.from(modelMap.values()).map(rep => ({
        model_name:      rep.model_name,
        class:           rep.class,
        capacity:        rep.capacity,
        per_km_charge:   rep.per_km_charge,
        per_hr_charge:   rep.per_hr_charge,
        available_count: counts.get(rep.model_name) || 1,
      }))

      return NextResponse.json({ success: true, models, conflict_control_enabled: false })
    }

    const requestStart = new Date(`${bookingDate}T${startTime}`)
    const requestEnd   = new Date(`${endDate}T${endTime}`)   // endDate may differ from bookingDate for long trips

    if (isNaN(requestStart.getTime()) || isNaN(requestEnd.getTime()) || requestEnd <= requestStart) {
      return NextResponse.json(
        { success: false, error: 'Invalid date/time: end must be after start' },
        { status: 400 }
      )
    }

    // ── 1. All active physical cars ─────────────────────────────────────────
    const { data: activeCars, error: carsError } = await supabaseAdmin
      .from('cars')
      .select('id, model_name, class, capacity, per_km_charge, per_hr_charge')
      .eq('is_active', true)
      .order('model_name', { ascending: true })

    if (carsError) throw new Error('Failed to fetch cars')
    if (!activeCars || activeCars.length === 0) {
      return NextResponse.json({ success: true, models: [] })
    }

    // ── 2. All active bookings (pending/confirmed) ──────────────────────────
    // We fetch all active bookings and filter for time overlap in JS to avoid
    // timezone ambiguity between query-param times and IST-suffixed DB values.
    const { data: allActiveBookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('booking_id, car_model, start_datetime, end_datetime, booking_status')
      .in('booking_status', ['pending', 'confirmed'])

    if (bookingsError) throw new Error('Failed to fetch active bookings')

    // Keep only bookings whose time window overlaps the requested window
    const overlappingActiveBookings = (allActiveBookings || []).filter(b => {
      if (!b.start_datetime || !b.end_datetime) return false
      const bStart = new Date(b.start_datetime)
      const bEnd   = new Date(b.end_datetime)
      // Standard interval overlap: A.start < B.end && A.end > B.start
      return requestStart < bEnd && requestEnd > bStart
    })

    // ── 3. Assignments that belong to those active overlapping bookings ──────
    const activeBookingIds = overlappingActiveBookings.map(b => b.booking_id)

    const assignedCarIds     = new Set<string>()
    const assignedBookingIds = new Set<string>()

    if (activeBookingIds.length > 0) {
      const { data: assignments, error: assignmentsError } = await supabaseAdmin
        .from('vehicle_assignments')
        .select('booking_id, car_id')
        .in('booking_id', activeBookingIds)

      if (assignmentsError) throw new Error('Failed to fetch assignments')

      ;(assignments || []).forEach(a => {
        assignedCarIds.add(a.car_id)
        assignedBookingIds.add(a.booking_id)
      })
    }

    // ── 4. Unassigned active bookings → block one slot per model ───────────
    // A booking that is active but has no assignment yet still reserves a
    // physical car. Count how many such bookings exist per model_name.
    const unassignedBlocksByModel = new Map<string, number>()
    overlappingActiveBookings
      .filter(b => b.car_model && !assignedBookingIds.has(b.booking_id))
      .forEach(b => {
        const prev = unassignedBlocksByModel.get(b.car_model!) || 0
        unassignedBlocksByModel.set(b.car_model!, prev + 1)
      })

    // ── 5. Group physical cars by model_name ────────────────────────────────
    const modelGroups = new Map<string, typeof activeCars>()
    activeCars.forEach(car => {
      if (!modelGroups.has(car.model_name)) modelGroups.set(car.model_name, [])
      modelGroups.get(car.model_name)!.push(car)
    })

    // ── 6. Compute available count per model and build response ─────────────
    const availableModels: {
      model_name: string
      class: string
      capacity: number
      per_km_charge: number
      per_hr_charge: number
      available_count: number
    }[] = []

    modelGroups.forEach((carsOfModel, modelName) => {
      // Tier (a): specific car IDs blocked by assignment to an active booking
      const blockedByAssignment = carsOfModel.filter(c => assignedCarIds.has(c.id)).length

      // Tier (b): generic slots blocked by unassigned active bookings
      const blockedByUnassigned = unassignedBlocksByModel.get(modelName) || 0

      const totalBlocked  = Math.min(blockedByAssignment + blockedByUnassigned, carsOfModel.length)
      const availableCount = carsOfModel.length - totalBlocked

      if (availableCount > 0) {
        const rep = carsOfModel[0]
        availableModels.push({
          model_name:    modelName,
          class:         rep.class,
          capacity:      rep.capacity,
          per_km_charge: rep.per_km_charge,
          per_hr_charge: rep.per_hr_charge,
          available_count: availableCount,
        })
      }
    })

    return NextResponse.json({ success: true, models: availableModels })

  } catch (error) {
    console.error('Error in available-models:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
