import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('tour_packages')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tours:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, tours: data })
  } catch (error) {
    console.error('Unexpected error fetching tours:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, arrival_time, duration_hours, price, max_passengers, car_type, itinerary, highlights, image_url } = body

    // Validation
    if (!name || !price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name and price' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin.from('tour_packages').insert([
      {
        name,
        description: description || null,
        arrival_time: arrival_time || null,
        duration_hours: duration_hours ? parseInt(duration_hours) : null,
        price: parseFloat(price),
        max_passengers: max_passengers ? parseInt(max_passengers) : null,
        car_type: car_type || null,
        itinerary: itinerary || null,
        highlights: highlights && Array.isArray(highlights) ? highlights : [],
        image_url: image_url || null,
        is_active: true,
      },
    ]).select()

    if (error) {
      console.error('Error creating tour:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, tour: data[0] }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error creating tour:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
