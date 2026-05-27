import { supabaseAdmin } from '@/lib/supabase-admin'

export type EventSeverity = 'info' | 'warn' | 'error' | 'security'
export type EventActorType = 'system' | 'admin' | 'user' | 'job'

type LogEventInput = {
  severity?: EventSeverity
  event_type: string
  actor_type?: EventActorType
  actor_id?: string | null
  actor_label?: string | null
  entity_type?: string | null
  entity_id?: string | null
  message: string
  metadata?: Record<string, unknown>
}

function sanitizeMetadata(metadata: Record<string, unknown> = {}) {
  const redacted = new Set([
    'password',
    'password_hash',
    'token',
    'access_token',
    'refresh_token',
    'authorization',
    'cookie',
    'secret',
    'key',
    'api_key',
  ])

  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(metadata)) {
    const lk = k.toLowerCase()
    if (redacted.has(lk) || lk.includes('password') || lk.includes('token') || lk.includes('secret')) {
      out[k] = '[REDACTED]'
      continue
    }
    if (typeof v === 'string' && v.length > 500) {
      out[k] = `${v.slice(0, 500)}...`
      continue
    }
    out[k] = v
  }
  return out
}

export async function logSystemEvent(input: LogEventInput) {
  try {
    await supabaseAdmin.from('system_events').insert([
      {
        severity: input.severity || 'info',
        event_type: input.event_type,
        actor_type: input.actor_type || 'system',
        actor_id: input.actor_id || null,
        actor_label: input.actor_label || null,
        entity_type: input.entity_type || null,
        entity_id: input.entity_id || null,
        message: input.message,
        metadata: sanitizeMetadata(input.metadata || {}),
      },
    ])

    // Free-tier optimization: keep only the newest N rows.
    // Controlled via app_settings.system_logs_max_rows (default 2000).
    const { data: setting } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'system_logs_max_rows')
      .maybeSingle()

    const maxRows = Math.max(100, parseInt(String(setting?.value || '2000'), 10) || 2000)

    const { count } = await supabaseAdmin
      .from('system_events')
      .select('id', { count: 'exact', head: true })

    const total = count || 0
    if (total <= maxRows) return

    const overflow = total - maxRows
    const { data: oldRows } = await supabaseAdmin
      .from('system_events')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(overflow)

    const ids = (oldRows || []).map((r: any) => r.id).filter(Boolean)
    if (ids.length > 0) {
      await supabaseAdmin.from('system_events').delete().in('id', ids)
    }
  } catch (err) {
    // Do not throw from logger: never break business flow because logs failed.
    console.error('system_events log failed:', err)
  }
}
