-- ══════════════════════════════════════════════════════════════════════════════
-- Voraly · Roadmap fields on profiles
-- Adds the two columns the "Voraly: AI Roadmap Generator V1" n8n workflow reads
-- and writes:
--   • linkedin_profile_text — raw professional background text (fed to the agent)
--   • ai_roadmap            — structured JSON { roadmap_steps: [...] } written back
--                             by the workflow's Supabase "Update Row" node.
-- RLS already restricts profiles to the owner (auth.uid() = id); these columns
-- inherit that policy, so no extra grants are required.
-- Run manually in the Supabase SQL editor (project is local-first).
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS linkedin_profile_text TEXT,
  ADD COLUMN IF NOT EXISTS ai_roadmap            JSONB;
