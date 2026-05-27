-- System events for admin-visible operational logs.
-- Stores sanitized, structured events only (no secrets/raw payloads).

CREATE TABLE IF NOT EXISTS public.system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  severity VARCHAR(16) NOT NULL DEFAULT 'info',
  event_type VARCHAR(80) NOT NULL,
  actor_type VARCHAR(32) NOT NULL DEFAULT 'system',
  actor_id UUID NULL,
  actor_label VARCHAR(255) NULL,
  entity_type VARCHAR(64) NULL,
  entity_id VARCHAR(128) NULL,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_system_events_created_at ON public.system_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_type ON public.system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_system_events_severity ON public.system_events(severity);
CREATE INDEX IF NOT EXISTS idx_system_events_actor ON public.system_events(actor_type, actor_id);

