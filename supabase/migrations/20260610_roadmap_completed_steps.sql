-- ══════════════════════════════════════════════════════════════════════════════
-- Voraly · Roadmap gamification — completed checkpoints
-- Persists which roadmap steps a freelancer has marked as completed so their
-- progression is restored on next login. Stored as a JSONB array of step_number
-- values, e.g. [1, 3]. RLS on profiles (auth.uid() = id) already scopes it to
-- the owner. Run manually in the Supabase SQL editor.
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS completed_steps JSONB NOT NULL DEFAULT '[]'::jsonb;
