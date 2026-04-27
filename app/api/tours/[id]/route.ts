import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { error } = await supabaseAdmin.from('tour_packages').update({ is_active: false }).eq('id', id)

    if (error) {
      console.error('Error deleting tour:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Tour deleted successfully' })
  } catch (error) {
    console.error('Unexpected error deleting tour:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, description, arrival_time, duration_hours, price, max_passengers, car_model, itinerary, highlights, image_url } = body

    // Validation
    if (!name || !price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name and price' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('tour_packages')
      .update({
        name,
        description: description || null,
        arrival_time: arrival_time || null,
        duration_hours: duration_hours ? parseInt(duration_hours) : null,
        price: parseFloat(price),
        max_passengers: max_passengers ? parseInt(max_passengers) : null,
        car_model: car_model || null,
        itinerary: itinerary || null,
        highlights: highlights && Array.isArray(highlights) ? highlights : [],
        image_url: image_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating tour:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, tour: data[0] })
  } catch (error) {
    console.error('Unexpected error updating tour:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
