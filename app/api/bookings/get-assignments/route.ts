import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    console.log('=== Fetching Vehicle Assignments ===')

    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('vehicle_assignments')
      .select('*')
      .order('created_at', { ascending: false })

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError)
      return Response.json(
        { success: false, error: 'Failed to fetch assignments' },
        { status: 500 }
      )
    }

    console.log('✅ Assignments fetched successfully:', assignments?.length || 0)

    return Response.json(
      {
        success: true,
        assignments: assignments || [],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in get-assignments route:', error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
