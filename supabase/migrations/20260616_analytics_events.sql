-- ─────────────────────────────────────────────────────────────────────────────
-- Voraly · Analytics Events
-- 
-- HOW TO RUN:
--   1. SQL Editor dans Supabase Dashboard
--   2. Ou exécuter via curl (voir run-migration.sh)
-- ─────────────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. TABLE: public.analytics_events
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type     TEXT        NOT NULL,         -- 'page_view', 'feature_use', 'signup', 'premium_upgrade'
  user_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id     TEXT        NOT NULL,
  page_url       TEXT        NOT NULL,
  referrer       TEXT,
  user_agent     TEXT,
  event_data     JSONB       DEFAULT '{}'::jsonb,
  ip_anonymized  TEXT,                          -- Dernier octet tronqué (ex: 192.168.1.xxx)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. TABLE: profiles — add is_admin column
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. RLS POLICIES
-- ══════════════════════════════════════════════════════════════════════════════
-- INSERT: anyone peut envoyer un event (tracking anonyme autorisé)
DROP POLICY IF EXISTS "analytics_events: insert anyone" ON public.analytics_events;
CREATE POLICY "analytics_events: insert anyone"
  ON public.analytics_events
  FOR INSERT
  WITH CHECK (true);

-- SELECT: seulement les admins peuvent lire les stats
DROP POLICY IF EXISTS "analytics_events: select admin only" ON public.analytics_events;
CREATE POLICY "analytics_events: select admin only"
  ON public.analytics_events
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. INDEXES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS analytics_events_type_created_idx
  ON public.analytics_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_session_idx
  ON public.analytics_events(session_id);

CREATE INDEX IF NOT EXISTS analytics_events_user_idx
  ON public.analytics_events(user_id);

CREATE INDEX IF NOT EXISTS analytics_events_page_url_idx
  ON public.analytics_events(page_url);

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. VERIFICATION
-- ══════════════════════════════════════════════════════════════════════════════
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'analytics_events';