import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdminRequest } from '@/lib/admin-auth'
import { getSpecificCarAssignmentConflicts } from '@/lib/conflicts'
import { isValidEmail, sendAdminDriverEmailAlert, sendDriverAssignment, sendVehicleAssignment } from '@/lib/resend-notifications'

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
    const { assignment_id, booking_id, car_id, start_datetime, end_datetime, user_email, user_name } = body

    console.log('=== Updating Vehicle Assignment ===')
    console.log('Assignment ID:', assignment_id)
    console.log('New Car ID:', car_id)
    console.log('Booking ID:', booking_id)

    // Validate required fields
    if (!assignment_id || !car_id) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify assignment exists
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('vehicle_assignments')
      .select('*')
      .eq('id', assignment_id)
      .single()

    if (assignmentError || !assignment) {
      console.error('Assignment not found:', assignmentError)
      return Response.json(
        { success: false, error: 'Vehicle assignment not found' },
        { status: 404 }
      )
    }

    console.log('✅ Assignment verified:', assignment)

    // Verify new car exists
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

    console.log('✅ New car verified:', car)

    // Get old car details for comparison
    const { data: oldCar } = await supabaseAdmin
      .from('cars')
      .select('id, model_name, number_plate, driver_name, driver_phone')
      .eq('id', assignment.car_id)
      .single()

    const actualStartDateTime = start_datetime || assignment.start_datetime
    const actualEndDateTime = end_datetime || assignment.end_datetime
    const resolvedBookingId = booking_id || assignment.booking_id
    let conflictChecks = await getSpecificCarAssignmentConflicts({
      carId: car_id,
      start: actualStartDateTime,
      end: actualEndDateTime,
      excludeBookingId: resolvedBookingId,
    })

    const { data: bookingForWarnings } = await supabaseAdmin
      .from('bookings')
      .select('passenger_count')
      .eq('booking_id', resolvedBookingId)
      .single()

    const hasCapacityWarning = Number(bookingForWarnings?.passenger_count || 0) > Number(car.capacity || 0)
    let warnings = [
      ...(conflictChecks.length > 0
        ? [{
            type: 'assignment_conflict',
            message: 'This vehicle is already assigned to another active booking in the selected time window. Admin override was allowed and recorded; resolve it later from the conflict scanner.',
            conflicts: conflictChecks,
          }]
        : []),
      ...(hasCapacityWarning
        ? [{
            type: 'capacity_warning',
            message: `This vehicle has ${car.capacity} seats but the booking has ${bookingForWarnings?.passenger_count} passenger(s).`,
        }]
        : []),
    ]
    let shouldRecordOverride = conflictChecks.length > 0

    let updatePayload: Record<string, unknown> = {
      car_id: car_id,
      start_datetime: actualStartDateTime,
      end_datetime: actualEndDateTime,
      car_model_snapshot: car.model_name,
      car_number_plate_snapshot: car.number_plate,
      car_class_snapshot: car.class || null,
      driver_name_snapshot: car.driver_name || null,
      driver_phone_snapshot: car.driver_phone || null,
      driver_email_snapshot: car.driver_email || null,
      conflict_override: shouldRecordOverride,
      conflict_override_reason: shouldRecordOverride ? 'Admin reassigned this vehicle despite an overlapping active assignment.' : null,
      conflict_override_at: shouldRecordOverride ? new Date().toISOString() : null,
    }

    // Update vehicle assignment record
    let updateResult = await supabaseAdmin
      .from('vehicle_assignments')
      .update(updatePayload)
      .eq('id', assignment_id)
      .select()
      .single()

    if (updateResult.error && isAssignmentOverlapError(updateResult.error) && !shouldRecordOverride) {
      conflictChecks = await getSpecificCarAssignmentConflicts({
        carId: car_id,
        start: actualStartDateTime,
        end: actualEndDateTime,
        excludeBookingId: resolvedBookingId,
      })
      shouldRecordOverride = true
      warnings = [
        {
          type: 'assignment_conflict',
          message: 'This vehicle became assigned to another active booking while you were saving. Admin override was allowed and recorded; resolve it later from the conflict scanner.',
          conflicts: conflictChecks,
        },
        ...(hasCapacityWarning
          ? [{
              type: 'capacity_warning',
              message: `This vehicle has ${car.capacity} seats but the booking has ${bookingForWarnings?.passenger_count} passenger(s).`,
            }]
          : []),
      ]
      updatePayload = {
        ...updatePayload,
        conflict_override: true,
        conflict_override_reason: 'Admin reassigned this vehicle despite a concurrent overlapping active assignment.',
        conflict_override_at: new Date().toISOString(),
      }

      updateResult = await supabaseAdmin
        .from('vehicle_assignments')
        .update(updatePayload)
        .eq('id', assignment_id)
        .select()
        .single()
    }

    if (updateResult.error && String(updateResult.error.message || '').includes('conflict_override')) {
      const legacyPayload = { ...updatePayload }
      delete legacyPayload.conflict_override
      delete legacyPayload.conflict_override_reason
      delete legacyPayload.conflict_override_at

      updateResult = await supabaseAdmin
        .from('vehicle_assignments')
        .update(legacyPayload)
        .eq('id', assignment_id)
        .select()
        .single()
    }

    if (updateResult.error) {
      console.error('Error updating assignment:', updateResult.error)
      return Response.json(
        { success: false, error: 'Failed to update vehicle assignment' },
        { status: 500 }
      )
    }

    const updatedAssignment = updateResult.data
    console.log('✅ Assignment updated successfully:', updatedAssignment)

    // Fetch pickup details once — used by both customer and driver emails
    const { data: bookingDetails } = await supabaseAdmin
      .from('bookings')
      .select('pickup_date, pickup_time, start_datetime, user_name, phone')
      .eq('booking_id', resolvedBookingId)
      .single()

    const pickupDate = bookingDetails?.pickup_date
      || (bookingDetails?.start_datetime ? bookingDetails.start_datetime.split('T')[0] : actualStartDateTime?.split('T')[0])
    const pickupTime = bookingDetails?.pickup_time
      || (actualStartDateTime ? new Date(actualStartDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : undefined)

    // Send reassignment email to customer
    if (user_email) {
      await sendVehicleAssignment({
        to: user_email,
        userName: user_name || 'Customer',
        bookingId: resolvedBookingId,
        pickupDate,
        pickupTime,
        vehicleModel: car.model_name,
        numberPlate: car.number_plate,
        driverName: car.driver_name,
        driverPhone: car.driver_phone,
        isReassignment: true,
      }).catch((err) => console.error('[EMAIL] Reassignment email error:', err))
    }

    // Send reassignment notification to driver — gracefully handle bad email
    ;(async () => {
      const driverEmail = car.driver_email?.trim() || ''
      if (!driverEmail) return

      if (!isValidEmail(driverEmail)) {
        console.warn(`[EMAIL] Driver email invalid format: "${driverEmail}" — notifying admin`)
        await sendAdminDriverEmailAlert({
          bookingId: resolvedBookingId,
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
        bookingId: resolvedBookingId,
        customerName: bookingDetails?.user_name || user_name || 'Customer',
        customerPhone: bookingDetails?.phone || '',
        pickupDate,
        pickupTime,
        vehicleModel: car.model_name,
        numberPlate: car.number_plate,
        isReassignment: true,
      }).catch((err) => {
        console.error('[EMAIL] Driver reassignment email error:', err)
        return { success: false, error: err }
      })

      if (!result.success) {
        console.warn(`[EMAIL] Driver email delivery failed for "${driverEmail}" — notifying admin`)
        await sendAdminDriverEmailAlert({
          bookingId: resolvedBookingId,
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
        message: 'Vehicle assignment updated successfully',
        assignment: updatedAssignment,
        warnings,
        conflict_override: shouldRecordOverride,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in update-assignment route:', error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
