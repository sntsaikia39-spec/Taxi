import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data: payments, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all payments:', error)
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return Response.json({ success: true, payments: payments || [] })
  } catch (error) {
    console.error('Error in get-all payments route:', error)
    return Response.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}
