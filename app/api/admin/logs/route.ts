import { requireAdminRequest } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const unauthorized = requireAdminRequest(request)
  if (unauthorized) return unauthorized

  try {
    const url = new URL(request.url)
    const severity = (url.searchParams.get('severity') || 'all').toLowerCase()
    const eventType = (url.searchParams.get('event_type') || '').trim()
    const q = (url.searchParams.get('q') || '').trim()
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(10, Number(url.searchParams.get('limit') || '30')))
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabaseAdmin
      .from('system_events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (severity !== 'all') query = query.eq('severity', severity)
    if (eventType) query = query.eq('event_type', eventType)
    if (q) query = query.or(`message.ilike.%${q}%,actor_label.ilike.%${q}%,entity_id.ilike.%${q}%`)

    const { data, error, count } = await query
    if (error) {
      console.error('Error fetching system events:', error)
      return Response.json({ success: false, error: 'Failed to fetch logs' }, { status: 500 })
    }

    return Response.json({
      success: true,
      logs: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.max(1, Math.ceil((count || 0) / limit)),
      },
    })
  } catch (error) {
    console.error('Admin logs route error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

