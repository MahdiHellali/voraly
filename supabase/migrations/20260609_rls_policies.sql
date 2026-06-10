-- ─────────────────────────────────────────────────────────────────────────────
-- Voraly · Row Level Security (RLS) Policies
--
-- HOW TO RUN:
--   1. Open https://supabase.com/dashboard → your project
--   2. Go to SQL Editor → New Query
--   3. Paste this entire file and click "Run"
--
-- NOTE ON user_quotas:
--   The old Edge Function stored fake string IDs (e.g. "usr_abc123").
--   We drop and recreate the table with the correct UUID type so that
--   auth.uid() (which returns uuid) can be compared without casting errors.
-- ─────────────────────────────────────────────────────────────────────────────


-- ══════════════════════════════════════════════════════════════════════════════
-- 1. TABLE: user_quotas
-- ══════════════════════════════════════════════════════════════════════════════

-- Drop old table (it had user_id TEXT with fake IDs — no real user data)
DROP TABLE IF EXISTS public.user_quotas CASCADE;

CREATE TABLE public.user_quotas (
  user_id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  messages_remaining INTEGER     NOT NULL DEFAULT 3,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;

-- SELECT: users read only their own quota
CREATE POLICY "user_quotas: users read own row"
  ON public.user_quotas
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: users create only their own quota row
CREATE POLICY "user_quotas: users insert own row"
  ON public.user_quotas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: users update only their own quota row
-- (the chat-refine Edge Function uses the service role and bypasses RLS)
CREATE POLICY "user_quotas: users update own row"
  ON public.user_quotas
  FOR UPDATE
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_quotas_user_id_idx ON public.user_quotas(user_id);


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. TABLE: profiles
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  plan        TEXT        NOT NULL DEFAULT 'free',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles: users read own row"   ON public.profiles;
DROP POLICY IF EXISTS "profiles: users insert own row" ON public.profiles;
DROP POLICY IF EXISTS "profiles: users update own row" ON public.profiles;

CREATE POLICY "profiles: users read own row"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: users insert own row"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: users update own row"
  ON public.profiles
  FOR UPDATE
  USING     (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS profiles_id_idx ON public.profiles(id);


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. TRIGGER: auto-create profile row on new signup
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. VERIFICATION — should show rls_enabled = true for both tables
-- ══════════════════════════════════════════════════════════════════════════════

SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_quotas', 'profiles');
