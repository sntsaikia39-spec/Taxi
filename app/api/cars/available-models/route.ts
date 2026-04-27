import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cars/available-models
 * 
 * Fetches unique car models available for booking in a given timeslot.
 * 
 * Query parameters:
 * - booking_date: Date in YYYY-MM-DD format
 * - start_time: Time in HH:mm format
 * - end_time: Time in HH:mm format (estimated trip end time)
 * 
 * Returns only model names (not specific cars) that:
 * 1. Have at least one active car in the database
 * 2. Have at least one car available (not booked) for the given timeslot
 * 3. Are not already shown (deduplicated by model_name)
 * 
 * Logic:
 * 1. Get all active cars grouped by model_name
 * 2. For each model_name, check if ANY car of that model is free during the timeslot
 * 3. A car is FREE if it has no overlapping assignment for that date/time
 * 4. Return only unique model_names with their basic info (no number_plate, no specific car details)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const bookingDate = searchParams.get('booking_date')
    const startTime = searchParams.get('start_time')
    const endTime = searchParams.get('end_time')

    // Validation
    if (!bookingDate || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required query parameters: booking_date, start_time, end_time' },
        { status: 400 }
      )
    }

    console.log('🔍 Fetching available car models for timeslot:', {
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
    })

    // Step 1: Get all active cars with their details
    const { data: activeCars, error: carsError } = await supabaseAdmin
      .from('cars')
      .select('id, model_name, class, capacity, per_km_charge, per_hr_charge, is_active')
      .eq('is_active', true)
      .order('model_name', { ascending: true })

    if (carsError) {
      console.error('Error fetching cars:', carsError)
      return NextResponse.json({ success: false, error: 'Failed to fetch cars' }, { status: 500 })
    }

    if (!activeCars || activeCars.length === 0) {
      console.log('⚠️ No active cars found in system')
      return NextResponse.json({ success: true, models: [] })
    }

    // Step 2: Get all assignments for the booking date to check for conflicts
    // Create datetime range for the booking
    const bookingStartDateTime = `${bookingDate}T${startTime}`
    const bookingEndDateTime = `${bookingDate}T${endTime}`

    console.log('📅 Checking assignments for date:', bookingDate)

    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('vehicle_assignments')
      .select('car_id, start_datetime, end_datetime')

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError)
      return NextResponse.json({ success: false, error: 'Failed to fetch assignments' }, { status: 500 })
    }

    return processAvailableModels(activeCars, assignments || [], bookingStartDateTime, bookingEndDateTime)
  } catch (error) {
    console.error('Unexpected error fetching available car models:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Helper function to process available car models
 * Deduplicates by model_name and checks availability against assignments
 */
function processAvailableModels(
  cars: any[],
  assignments: any[],
  bookingStartDateTime: string,
  bookingEndDateTime: string
) {
  // Parse booking datetime
  const bookingStart = new Date(bookingStartDateTime)
  const bookingEnd = new Date(bookingEndDateTime)

  if (isNaN(bookingStart.getTime()) || isNaN(bookingEnd.getTime())) {
    return NextResponse.json(
      { success: false, error: 'Invalid datetime format. Use YYYY-MM-DD for date and HH:mm for time.' },
      { status: 400 }
    )
  }

  console.log('⏰ Booking time range:', {
    start: bookingStart.toISOString(),
    end: bookingEnd.toISOString(),
  })

  // Group cars by model_name
  const modelGroups = new Map<string, typeof cars>()
  cars.forEach((car) => {
    if (!modelGroups.has(car.model_name)) {
      modelGroups.set(car.model_name, [])
    }
    modelGroups.get(car.model_name)!.push(car)
  })

  console.log(`📦 Found ${modelGroups.size} unique car models`)

  // For each model, check if ANY car is available
  const availableModels: any[] = []

  modelGroups.forEach((carsOfModel, modelName) => {
    const isModelAvailable = carsOfModel.some((car) => {
      // Check if this specific car has any overlapping assignment
      const hasConflict = assignments.some((assignment) => {
        if (assignment.car_id !== car.id) return false

        const assignmentStart = new Date(assignment.start_datetime)
        const assignmentEnd = new Date(assignment.end_datetime)

        // Check for time overlap
        // Times overlap if: booking_start < assignment_end AND booking_end > assignment_start
        const isOverlapping = bookingStart < assignmentEnd && bookingEnd > assignmentStart

        if (isOverlapping) {
          console.log(`  ⚠️ Car ${car.id} (${modelName}) has conflict:`, {
            assignment: {
              start: assignmentStart.toISOString(),
              end: assignmentEnd.toISOString(),
            },
            booking: {
              start: bookingStart.toISOString(),
              end: bookingEnd.toISOString(),
            },
          })
        }

        return isOverlapping
      })

      return !hasConflict
    })

    if (isModelAvailable) {
      // Get representative data from first car of this model
      const representative = carsOfModel[0]
      availableModels.push({
        model_name: modelName,
        class: representative.class,
        capacity: representative.capacity,
        per_km_charge: representative.per_km_charge,
        per_hr_charge: representative.per_hr_charge,
        available_count: carsOfModel.length, // Total cars of this model (for admin info)
      })
      console.log(`✅ Model '${modelName}' is available (${carsOfModel.length} car${carsOfModel.length > 1 ? 's' : ''})`)
    } else {
      console.log(`❌ Model '${modelName}' is fully booked for this timeslot`)
    }
  })

  console.log(`📊 Result: ${availableModels.length} models available out of ${modelGroups.size}`)

  return NextResponse.json({ success: true, models: availableModels })
}
