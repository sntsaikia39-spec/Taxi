import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('destinations')
      .select(`
        id,
        name,
        distance_km,
        estimated_duration,
        description,
        is_active,
        created_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching destinations:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, destinations: data })
  } catch (error) {
    console.error('Unexpected error fetching destinations:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, distance_km, estimated_duration, description } = body

    // Validation
    if (!name || !distance_km || !estimated_duration) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin.from('destinations').insert([
      {
        name,
        distance_km: parseFloat(distance_km),
        estimated_duration,
        description: description || null,
        is_active: true,
      },
    ]).select()

    if (error) {
      console.error('Error creating destination:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, destination: data[0] }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error creating destination:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
