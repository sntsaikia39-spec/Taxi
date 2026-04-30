import { supabaseAdmin } from '@/lib/supabase-admin'
import { isValidEmail, sendAdminDriverEmailAlert, sendDriverAssignment, sendVehicleAssignment } from '@/lib/resend-notifications'

export async function POST(request: Request) {
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
      .select('id, model_name, number_plate, driver_name, driver_phone, driver_email')
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

    // Update vehicle assignment record
    const { data: updatedAssignment, error: updateError } = await supabaseAdmin
      .from('vehicle_assignments')
      .update({
        car_id: car_id,
        start_datetime: start_datetime,
        end_datetime: end_datetime,
      })
      .eq('id', assignment_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating assignment:', updateError)
      return Response.json(
        { success: false, error: 'Failed to update vehicle assignment' },
        { status: 500 }
      )
    }

    console.log('✅ Assignment updated successfully:', updatedAssignment)

    // Fetch pickup details once — used by both customer and driver emails
    const { data: bookingDetails } = await supabaseAdmin
      .from('bookings')
      .select('pickup_date, pickup_time, start_datetime, user_name, phone')
      .eq('booking_id', booking_id)
      .single()

    const pickupDate = bookingDetails?.pickup_date
      || (bookingDetails?.start_datetime ? bookingDetails.start_datetime.split('T')[0] : start_datetime?.split('T')[0])
    const pickupTime = bookingDetails?.pickup_time
      || (start_datetime ? new Date(start_datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : undefined)

    // Send reassignment email to customer
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
        isReassignment: true,
      }).catch((err) => {
        console.error('[EMAIL] Driver reassignment email error:', err)
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
        message: 'Vehicle assignment updated successfully',
        assignment: updatedAssignment,
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
