import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { error } = await supabaseAdmin.from('destinations').update({ is_active: false }).eq('id', id)

    if (error) {
      console.error('Error deleting destination:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Destination deleted successfully' })
  } catch (error) {
    console.error('Unexpected error deleting destination:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, distance_km, estimated_duration, description } = body

    // Validation
    if (!name || !distance_km || !estimated_duration) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('destinations')
      .update({
        name,
        distance_km: parseFloat(distance_km),
        estimated_duration,
        description: description || null,
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating destination:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, destination: data[0] })
  } catch (error) {
    console.error('Unexpected error updating destination:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
