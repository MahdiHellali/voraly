-- ─────────────────────────────────────────────────────────────────────────────
-- Voraly · Roadmaps versioning + completed_daily_tasks
--
-- HOW TO RUN:
--   1. Open https://supabase.com/dashboard → your project
--   2. SQL Editor → New Query → paste this file → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. TABLE: public.roadmaps  (historique versionné des roadmaps IA)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  roadmap_data    JSONB       NOT NULL DEFAULT '{}',   -- { roadmap_steps, marketing_strategy }
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,   -- seule 1 ligne active par user
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes courantes
CREATE INDEX IF NOT EXISTS roadmaps_user_id_idx       ON public.roadmaps(user_id);
CREATE INDEX IF NOT EXISTS roadmaps_user_active_idx   ON public.roadmaps(user_id, is_active);
CREATE INDEX IF NOT EXISTS roadmaps_created_at_idx    ON public.roadmaps(created_at DESC);

-- RLS
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roadmaps: select own" ON public.roadmaps;
DROP POLICY IF EXISTS "roadmaps: insert own" ON public.roadmaps;
DROP POLICY IF EXISTS "roadmaps: update own" ON public.roadmaps;
DROP POLICY IF EXISTS "roadmaps: delete own" ON public.roadmaps;

CREATE POLICY "roadmaps: select own"
  ON public.roadmaps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "roadmaps: insert own"
  ON public.roadmaps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "roadmaps: update own"
  ON public.roadmaps FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "roadmaps: delete own"
  ON public.roadmaps FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS roadmaps_set_updated_at ON public.roadmaps;
CREATE TRIGGER roadmaps_set_updated_at
  BEFORE UPDATE ON public.roadmaps
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. COLONNE: profiles.completed_daily_tasks
--    Array de strings au format "${step_number}-${day}-${taskIndex}"
--    ex: ["1-Lundi-0", "1-Lundi-1", "1-Mardi-0"]
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS completed_daily_tasks JSONB NOT NULL DEFAULT '[]';

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. VERIFICATION
-- ══════════════════════════════════════════════════════════════════════════════
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('roadmaps', 'profiles');

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'completed_daily_tasks';
