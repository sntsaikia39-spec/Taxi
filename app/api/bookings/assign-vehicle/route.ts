import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdminRequest } from '@/lib/admin-auth'
import { getSpecificCarAssignmentConflicts } from '@/lib/conflicts'
import { isValidEmail, sendAdminDriverEmailAlert, sendDriverAssignment, sendVehicleAssignment } from '@/lib/resend-notifications'

// Helper function to get current time in IST format
function getCurrentTimeIST(): string {
  const now = new Date()
  const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000) // Add 5:30 hours for IST

  const year = istTime.getUTCFullYear()
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0')
  const day = String(istTime.getUTCDate()).padStart(2, '0')
  const hour = String(istTime.getUTCHours()).padStart(2, '0')
  const minute = String(istTime.getUTCMinutes()).padStart(2, '0')
  const second = String(istTime.getUTCSeconds()).padStart(2, '0')

  return `${year}-${month}-${day}T${hour}:${minute}:${second}+05:30`
}

function isAssignmentOverlapError(error: unknown): boolean {
  const err = error as { code?: unknown; message?: unknown; details?: unknown }
  const text = `${String(err?.message || '')} ${String(err?.details || '')}`.toLowerCase()
  return err?.code === '23P01' || text.includes('overlapping active vehicle assignment')
}

export async function POST(request: Request) {
  const unauthorized = requireAdminRequest(request)
  if (unauthorized) return unauthorized

  try {
    const body = await request.json()
    const { booking_id, car_id, start_datetime, end_datetime, user_email, user_name } = body

    console.log('=== Assigning Vehicle to Booking ===')
    console.log('Booking ID:', booking_id)
    console.log('Car ID:', car_id)
    console.log('Start DateTime:', start_datetime)
    console.log('End DateTime:', end_datetime)

    // Validate required fields
    if (!booking_id || !car_id || !start_datetime || !end_datetime) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify booking exists
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, booking_id, passenger_count')
      .eq('booking_id', booking_id)
      .single()

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError)
      return Response.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    const { data: existingAssignments, error: existingAssignmentError } = await supabaseAdmin
      .from('vehicle_assignments')
      .select('id')
      .eq('booking_id', booking_id)
      .limit(1)

    if (existingAssignmentError) {
      console.error('Error checking existing assignment:', existingAssignmentError)
      return Response.json(
        { success: false, error: 'Failed to check existing vehicle assignment' },
        { status: 500 }
      )
    }

    if (existingAssignments && existingAssignments.length > 0) {
      return Response.json(
        { success: false, error: 'This booking already has a vehicle assignment. Use reassignment instead.' },
        { status: 409 }
      )
    }

    // Verify car exists
    const { data: car, error: carError } = await supabaseAdmin
      .from('cars')
      .select('id, model_name, class, number_plate, driver_name, driver_phone, driver_email, capacity')
      .eq('id', car_id)
      .single()

    if (carError || !car) {
      console.error('Car not found:', carError)
      return Response.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    console.log('✅ Booking and Car verified')

    // Get current time in IST
    const currentTimeIST = getCurrentTimeIST()
    let assignmentConflicts = await getSpecificCarAssignmentConflicts({
      carId: car_id,
      start: start_datetime,
      end: end_datetime,
      excludeBookingId: booking_id,
    })
    const hasCapacityWarning = Number(booking.passenger_count || 0) > Number(car.capacity || 0)
    let warnings = [
      ...(assignmentConflicts.length > 0
        ? [{
            type: 'assignment_conflict',
            message: 'This vehicle is already assigned to another active booking in the selected time window. Admin override was allowed and recorded; resolve it later from the conflict scanner.',
            conflicts: assignmentConflicts,
          }]
        : []),
      ...(hasCapacityWarning
        ? [{
            type: 'capacity_warning',
            message: `This vehicle has ${car.capacity} seats but the booking has ${booking.passenger_count} passenger(s).`,
        }]
        : []),
    ]
    let shouldRecordOverride = assignmentConflicts.length > 0

    // Create vehicle assignment record
    let assignmentPayload: Record<string, unknown> = {
      booking_id: booking_id,
      car_id: car_id,
      start_datetime: start_datetime,
      end_datetime: end_datetime,
      assigned_at: currentTimeIST,
      created_at: currentTimeIST,
      car_model_snapshot: car.model_name,
      car_number_plate_snapshot: car.number_plate,
      car_class_snapshot: car.class || null,
      driver_name_snapshot: car.driver_name || null,
      driver_phone_snapshot: car.driver_phone || null,
      driver_email_snapshot: car.driver_email || null,
      conflict_override: shouldRecordOverride,
      conflict_override_reason: shouldRecordOverride ? 'Admin assigned this vehicle despite an overlapping active assignment.' : null,
      conflict_override_at: shouldRecordOverride ? currentTimeIST : null,
    }

    let assignmentResult = await supabaseAdmin
      .from('vehicle_assignments')
      .insert([assignmentPayload])
      .select()
      .single()

    if (assignmentResult.error && isAssignmentOverlapError(assignmentResult.error) && !shouldRecordOverride) {
      assignmentConflicts = await getSpecificCarAssignmentConflicts({
        carId: car_id,
        start: start_datetime,
        end: end_datetime,
        excludeBookingId: booking_id,
      })
      shouldRecordOverride = true
      warnings = [
        {
          type: 'assignment_conflict',
          message: 'This vehicle became assigned to another active booking while you were saving. Admin override was allowed and recorded; resolve it later from the conflict scanner.',
          conflicts: assignmentConflicts,
        },
        ...(hasCapacityWarning
          ? [{
              type: 'capacity_warning',
              message: `This vehicle has ${car.capacity} seats but the booking has ${booking.passenger_count} passenger(s).`,
            }]
          : []),
      ]
      assignmentPayload = {
        ...assignmentPayload,
        conflict_override: true,
        conflict_override_reason: 'Admin assigned this vehicle despite a concurrent overlapping active assignment.',
        conflict_override_at: currentTimeIST,
      }

      assignmentResult = await supabaseAdmin
        .from('vehicle_assignments')
        .insert([assignmentPayload])
        .select()
        .single()
    }

    if (assignmentResult.error && String(assignmentResult.error.message || '').includes('conflict_override')) {
      const legacyPayload = { ...assignmentPayload }
      delete legacyPayload.conflict_override
      delete legacyPayload.conflict_override_reason
      delete legacyPayload.conflict_override_at

      assignmentResult = await supabaseAdmin
        .from('vehicle_assignments')
        .insert([legacyPayload])
        .select()
        .single()
    }

    if (assignmentResult.error) {
      console.error('Error creating assignment:', assignmentResult.error)
      return Response.json(
        { success: false, error: 'Failed to assign vehicle' },
        { status: 500 }
      )
    }

    const assignment = assignmentResult.data
    console.log('✅ Vehicle assignment created successfully:', assignment)

    // Fetch pickup details once — used by both customer and driver emails
    const { data: bookingDetails } = await supabaseAdmin
      .from('bookings')
      .select('pickup_date, pickup_time, user_name, phone')
      .eq('booking_id', booking_id)
      .single()

    const pickupDate = bookingDetails?.pickup_date || start_datetime
    const pickupTime = bookingDetails?.pickup_time

    // Send vehicle assignment email to customer
    if (user_email) {
      await sendVehicleAssignment({
        to: user_email,
        userName: user_name || 'Customer',
        bookingId: booking_id,
        pickupDate,
        pickupTime,
        vehicleModel: car.model_name,
        numberPlate: car.number_plate,
        driverName: car.driver_name,
        driverPhone: car.driver_phone,
      }).catch((err) => console.error('Assignment email error (non-critical):', err))
    }

    // Send assignment notification to driver — gracefully handle bad email
    ;(async () => {
      const driverEmail = car.driver_email?.trim() || ''
      if (!driverEmail) return // no email on file, skip silently

      if (!isValidEmail(driverEmail)) {
        console.warn(`[EMAIL] Driver email invalid format: "${driverEmail}" — notifying admin`)
        await sendAdminDriverEmailAlert({
          bookingId: booking_id,
          driverName: car.driver_name,
          driverEmail,
          carModel: car.model_name,
          numberPlate: car.number_plate,
          reason: 'invalid_format',
        }).catch((err) => console.error('[EMAIL] Admin driver alert error:', err))
        return
      }

      const result = await sendDriverAssignment({
        to: driverEmail,
        driverName: car.driver_name,
        bookingId: booking_id,
        customerName: bookingDetails?.user_name || user_name || 'Customer',
        customerPhone: bookingDetails?.phone || '',
        pickupDate,
        pickupTime,
        vehicleModel: car.model_name,
        numberPlate: car.number_plate,
      }).catch((err) => {
        console.error('[EMAIL] Driver assignment email error:', err)
        return { success: false, error: err }
      })

      if (!result.success) {
        console.warn(`[EMAIL] Driver email delivery failed for "${driverEmail}" — notifying admin`)
        await sendAdminDriverEmailAlert({
          bookingId: booking_id,
          driverName: car.driver_name,
          driverEmail,
          carModel: car.model_name,
          numberPlate: car.number_plate,
          reason: 'send_failed',
        }).catch((err) => console.error('[EMAIL] Admin driver alert error:', err))
      }
    })().catch((err) => console.error('[EMAIL] Driver email flow error:', err))

    return Response.json(
      {
        success: true,
        message: 'Vehicle assigned successfully',
        assignment: assignment,
        warnings,
        conflict_override: shouldRecordOverride,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in assign-vehicle route:', error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
