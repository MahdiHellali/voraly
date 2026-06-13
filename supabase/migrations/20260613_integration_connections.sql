-- ─────────────────────────────────────────────────────────────────────────────
-- Voraly · integration_connections  (Google Calendar / Notion OAuth tokens)
--
-- Séparée de platform_connections (qui gère Upwork/LinkedIn/Fiverr/Malt).
-- Une ligne par (user_id, provider).
-- Alimentée par les futurs flux OAuth Google Calendar & Notion.
-- Le dashboard lit cette table de façon résiliente (try/catch) :
-- si la table n'existe pas encore → statut par défaut 'soon'.
--
-- HOW TO RUN:
--   1. Open https://supabase.com/dashboard → your project
--   2. SQL Editor → New Query → paste this file → Run
--
-- ⚠ SECURITY NOTES
--   • access_token / refresh_token sont SENSIBLES. RLS restreint les lignes à
--     leur propriétaire, mais le code applicatif NE DOIT JAMAIS sélectionner
--     les colonnes de tokens dans un contexte client/navigateur.
--     Lecture serveur uniquement (Route Handlers / Server Actions).
--   • Pour la défense en profondeur, chiffrer les colonnes de tokens au repos
--     avec Supabase Vault / pgsodium est recommandé avant la production.
-- ─────────────────────────────────────────────────────────────────────────────


-- ══════════════════════════════════════════════════════════════════════════════
-- 1. TABLE
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.integration_connections (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider       TEXT        NOT NULL,
  access_token   TEXT        NOT NULL,
  refresh_token  TEXT,
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT integration_connections_provider_chk
    CHECK (provider IN ('google_calendar', 'notion')),

  CONSTRAINT integration_connections_user_provider_uniq
    UNIQUE (user_id, provider)
);


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. ROW LEVEL SECURITY — owner-only access (auth.uid() = user_id)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "integration_connections: select own" ON public.integration_connections;
DROP POLICY IF EXISTS "integration_connections: insert own" ON public.integration_connections;
DROP POLICY IF EXISTS "integration_connections: update own" ON public.integration_connections;
DROP POLICY IF EXISTS "integration_connections: delete own" ON public.integration_connections;

CREATE POLICY "integration_connections: select own"
  ON public.integration_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "integration_connections: insert own"
  ON public.integration_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "integration_connections: update own"
  ON public.integration_connections
  FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "integration_connections: delete own"
  ON public.integration_connections
  FOR DELETE
  USING (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. updated_at auto-touch trigger
--    Réutilise public.touch_updated_at() définie dans 20260610_platform_connections.sql
-- ══════════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS integration_connections_set_updated_at ON public.integration_connections;

CREATE TRIGGER integration_connections_set_updated_at
  BEFORE UPDATE ON public.integration_connections
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. VERIFICATION — expect rls_enabled = true
-- ══════════════════════════════════════════════════════════════════════════════

SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'integration_connections';
