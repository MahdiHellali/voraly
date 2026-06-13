-- ─────────────────────────────────────────────────────────────────────────────
-- Voraly · deadlines  (cache des livraisons issues de Google Calendar / Notion)
--
-- Alimentée par les futurs syncs d'intégrations (non construits).
-- Une ligne par (user_id, source, external_id).
-- Le dashboard lit cette table de façon résiliente (try/catch) :
-- si la table n'existe pas encore → [] (empty state).
--
-- HOW TO RUN:
--   1. Open https://supabase.com/dashboard → your project
--   2. SQL Editor → New Query → paste this file → Run
-- ─────────────────────────────────────────────────────────────────────────────


-- ══════════════════════════════════════════════════════════════════════════════
-- 1. TABLE
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.deadlines (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source       TEXT        NOT NULL,
  external_id  TEXT        NOT NULL,
  title        TEXT        NOT NULL,
  client       TEXT,
  due_at       TIMESTAMPTZ NOT NULL,
  progress     INT         NOT NULL DEFAULT 0
                             CHECK (progress BETWEEN 0 AND 100),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT deadlines_source_chk
    CHECK (source IN ('google_calendar', 'notion')),

  CONSTRAINT deadlines_user_source_external_uniq
    UNIQUE (user_id, source, external_id)
);

CREATE INDEX IF NOT EXISTS deadlines_user_due_at_idx
  ON public.deadlines (user_id, due_at);


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. ROW LEVEL SECURITY — owner-only access (auth.uid() = user_id)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deadlines: select own" ON public.deadlines;
DROP POLICY IF EXISTS "deadlines: insert own" ON public.deadlines;
DROP POLICY IF EXISTS "deadlines: update own" ON public.deadlines;
DROP POLICY IF EXISTS "deadlines: delete own" ON public.deadlines;

CREATE POLICY "deadlines: select own"
  ON public.deadlines
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "deadlines: insert own"
  ON public.deadlines
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "deadlines: update own"
  ON public.deadlines
  FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "deadlines: delete own"
  ON public.deadlines
  FOR DELETE
  USING (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. updated_at auto-touch trigger
--    Réutilise public.touch_updated_at() définie dans 20260610_platform_connections.sql
-- ══════════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS deadlines_set_updated_at ON public.deadlines;

CREATE TRIGGER deadlines_set_updated_at
  BEFORE UPDATE ON public.deadlines
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. VERIFICATION — expect rls_enabled = true
-- ══════════════════════════════════════════════════════════════════════════════

SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'deadlines';
