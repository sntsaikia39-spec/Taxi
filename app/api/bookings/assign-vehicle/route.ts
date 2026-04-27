import { supabaseAdmin } from '@/lib/supabase-admin'

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
      .select('id, model_name, number_plate, driver_name, driver_phone')
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

    // TODO: Send assignment confirmation email when email system is implemented
    // For now, just log the email details
    console.log('📧 Assignment Confirmation Email would be sent to:', user_email)
    console.log('Assignment Details:')
    console.log('  - Customer:', user_name)
    console.log('  - Booking ID:', booking_id)
    console.log('  - Vehicle:', car.model_name)
    console.log('  - Registration:', car.number_plate)
    console.log('  - Driver:', car.driver_name)
    console.log('  - Driver Phone:', car.driver_phone)
    console.log('  - Start:', new Date(start_datetime).toLocaleString('en-IN'))
    console.log('  - End:', new Date(end_datetime).toLocaleString('en-IN'))

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
