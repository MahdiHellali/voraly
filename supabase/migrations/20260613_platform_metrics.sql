-- ─────────────────────────────────────────────────────────────────────────────
-- Voraly · platform_metrics  (snapshots journaliers par plateforme)
--
-- Alimentée par les futurs syncs API (Upwork, Fiverr, Malt, LinkedIn).
-- Une ligne par (user_id, platform_name, metric_date).
-- Le dashboard lit cette table de façon résiliente (try/catch) : si la table
-- n'existe pas encore, il affiche des empty states sans crasher.
--
-- HOW TO RUN:
--   1. Open https://supabase.com/dashboard → your project
--   2. SQL Editor → New Query → paste this file → Run
--
-- ⚠ SECURITY NOTES
--   • RLS owner-only : auth.uid() = user_id sur toutes les opérations.
--   • Le code applicatif NE sélectionne JAMAIS les colonnes de tokens depuis
--     un contexte client/navigateur. Lecture serveur uniquement.
-- ─────────────────────────────────────────────────────────────────────────────


-- ══════════════════════════════════════════════════════════════════════════════
-- 1. TABLE
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.platform_metrics (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_name    TEXT        NOT NULL,
  metric_date      DATE        NOT NULL,
  revenue          NUMERIC(12,2) NOT NULL DEFAULT 0,
  new_proposals    INT         NOT NULL DEFAULT 0,
  pending_replies  INT         NOT NULL DEFAULT 0,
  active_orders    INT         NOT NULL DEFAULT 0,
  conversion_rate  NUMERIC(5,2),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT platform_metrics_platform_chk
    CHECK (platform_name IN ('upwork', 'linkedin', 'fiverr', 'malt')),

  CONSTRAINT platform_metrics_user_platform_date_uniq
    UNIQUE (user_id, platform_name, metric_date)
);

CREATE INDEX IF NOT EXISTS platform_metrics_user_date_idx
  ON public.platform_metrics (user_id, metric_date);


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. ROW LEVEL SECURITY — owner-only access (auth.uid() = user_id)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.platform_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_metrics: select own" ON public.platform_metrics;
DROP POLICY IF EXISTS "platform_metrics: insert own" ON public.platform_metrics;
DROP POLICY IF EXISTS "platform_metrics: update own" ON public.platform_metrics;
DROP POLICY IF EXISTS "platform_metrics: delete own" ON public.platform_metrics;

CREATE POLICY "platform_metrics: select own"
  ON public.platform_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "platform_metrics: insert own"
  ON public.platform_metrics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "platform_metrics: update own"
  ON public.platform_metrics
  FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "platform_metrics: delete own"
  ON public.platform_metrics
  FOR DELETE
  USING (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. updated_at auto-touch trigger
--    Réutilise public.touch_updated_at() définie dans 20260610_platform_connections.sql
-- ══════════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS platform_metrics_set_updated_at ON public.platform_metrics;

CREATE TRIGGER platform_metrics_set_updated_at
  BEFORE UPDATE ON public.platform_metrics
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. VERIFICATION — expect rls_enabled = true
-- ══════════════════════════════════════════════════════════════════════════════

SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'platform_metrics';
