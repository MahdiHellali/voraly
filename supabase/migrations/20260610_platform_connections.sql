-- ─────────────────────────────────────────────────────────────────────────────
-- Voraly · platform_connections  (OAuth 2.0 token storage)
--
-- Replaces the deprecated Chrome-extension scraping approach with standard
-- OAuth API connections (Upwork, LinkedIn, …). One row per (user, platform).
--
-- HOW TO RUN:
--   1. Open https://supabase.com/dashboard → your project
--   2. SQL Editor → New Query → paste this file → Run
--
-- ⚠ SECURITY NOTES
--   • access_token / refresh_token are SENSITIVE. RLS restricts rows to their
--     owner, but the application code must NEVER select the token columns into
--     a client/browser context. The dashboard reads only
--     (platform_name, expires_at, updated_at). Tokens are read server-side only
--     (Route Handlers / Server Actions) when calling the provider APIs.
--   • For defence-in-depth, encrypting the token columns at rest with
--     Supabase Vault / pgsodium is recommended before production. Placeholder
--     hook left at the bottom of this file.
-- ─────────────────────────────────────────────────────────────────────────────


-- ══════════════════════════════════════════════════════════════════════════════
-- 1. TABLE
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.platform_connections (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_name  TEXT        NOT NULL,
  access_token   TEXT        NOT NULL,
  refresh_token  TEXT,
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Restrict to the platforms we actually support (defence-in-depth at the DB).
  CONSTRAINT platform_connections_platform_chk
    CHECK (platform_name IN ('upwork', 'linkedin', 'fiverr', 'malt')),

  -- One connection per platform per user → enables clean UPSERT on (user_id, platform_name).
  CONSTRAINT platform_connections_user_platform_uniq
    UNIQUE (user_id, platform_name)
);

CREATE INDEX IF NOT EXISTS platform_connections_user_id_idx
  ON public.platform_connections(user_id);


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. ROW LEVEL SECURITY — owner-only access (auth.uid() = user_id)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_connections: select own" ON public.platform_connections;
DROP POLICY IF EXISTS "platform_connections: insert own" ON public.platform_connections;
DROP POLICY IF EXISTS "platform_connections: update own" ON public.platform_connections;
DROP POLICY IF EXISTS "platform_connections: delete own" ON public.platform_connections;

CREATE POLICY "platform_connections: select own"
  ON public.platform_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "platform_connections: insert own"
  ON public.platform_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "platform_connections: update own"
  ON public.platform_connections
  FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "platform_connections: delete own"
  ON public.platform_connections
  FOR DELETE
  USING (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. updated_at auto-touch trigger
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS platform_connections_set_updated_at ON public.platform_connections;

CREATE TRIGGER platform_connections_set_updated_at
  BEFORE UPDATE ON public.platform_connections
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. (OPTIONAL, RECOMMENDED FOR PRODUCTION) Encrypt tokens at rest
--    Uncomment after enabling the Vault / pgsodium extension:
--
--    CREATE EXTENSION IF NOT EXISTS supabase_vault;
--    -- then store tokens via vault.create_secret() / vault.decrypted_secrets
--    -- instead of the plaintext access_token / refresh_token columns.
-- ══════════════════════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════════════════════
-- 5. VERIFICATION — expect rls_enabled = true
-- ══════════════════════════════════════════════════════════════════════════════

SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'platform_connections';
