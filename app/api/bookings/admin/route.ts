import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('Error fetching admin bookings:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, bookings: data || [] })
  } catch (error) {
    console.error('Admin bookings fetch error:', error)
    return Response.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}
