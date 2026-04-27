import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookings:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, bookings: data || [] })
  } catch (error) {
    console.error('Bookings fetch error:', error)
    return Response.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}
