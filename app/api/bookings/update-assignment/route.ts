import { supabaseAdmin } from '@/lib/supabase-admin'

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

    // TODO: Send reassignment confirmation email when email system is implemented
    // For now, just log the email details
    console.log('📧 Reassignment Confirmation Email would be sent to:', user_email)
    console.log('Reassignment Details:')
    console.log('  - Customer:', user_name)
    console.log('  - Booking ID:', booking_id)
    console.log('  - Previous Vehicle:', oldCar?.model_name, `(${oldCar?.number_plate})`)
    console.log('  - Previous Driver:', oldCar?.driver_name, `-`, oldCar?.driver_phone)
    console.log('  - New Vehicle:', car.model_name)
    console.log('  - New Registration:', car.number_plate)
    console.log('  - New Driver:', car.driver_name)
    console.log('  - New Driver Phone:', car.driver_phone)
    console.log('  - Start:', new Date(start_datetime).toLocaleString('en-IN'))
    console.log('  - End:', new Date(end_datetime).toLocaleString('en-IN'))

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
