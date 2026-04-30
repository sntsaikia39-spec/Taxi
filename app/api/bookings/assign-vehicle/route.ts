import { supabaseAdmin } from '@/lib/supabase-admin'
import { isValidEmail, sendAdminDriverEmailAlert, sendDriverAssignment, sendVehicleAssignment } from '@/lib/resend-notifications'

export async function POST(request: Request) {
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
      .select('id, booking_id')
      .eq('booking_id', booking_id)
      .single()

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError)
      return Response.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verify car exists
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

    console.log('✅ Booking and Car verified')

    // Create vehicle assignment record
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('vehicle_assignments')
      .insert([
        {
          booking_id: booking_id,
          car_id: car_id,
          start_datetime: start_datetime,
          end_datetime: end_datetime,
          assigned_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (assignmentError) {
      console.error('Error creating assignment:', assignmentError)
      return Response.json(
        { success: false, error: 'Failed to assign vehicle' },
        { status: 500 }
      )
    }

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
