-- ══════════════════════════════════════════════════════════════════════════════
-- Voraly · Premium membership (Whop)
-- Run manually in the Supabase SQL editor.
--
-- 1) Adds the membership columns the Whop webhook writes:
--      is_premium       — gates Pro features
--      premium_since    — first successful payment timestamp
--      whop_receipt_id  — last Whop payment id (audit / support lookups)
--
-- 2) CRITICAL HARDENING — column-level UPDATE privileges.
--    The existing RLS policy lets users UPDATE their own profiles row. Without
--    this section, any logged-in user could run
--      supabase.from('profiles').update({ is_premium: true })
--    from the browser console and grant themselves Pro for free.
--    We therefore revoke blanket UPDATE from client roles and re-grant it only
--    on the columns users legitimately edit. The service role (used by the
--    webhook and n8n) keeps full access and bypasses RLS.
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_premium      BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS premium_since   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whop_receipt_id TEXT;

-- ── Column-level UPDATE privileges ────────────────────────────────────────────
-- RLS (auth.uid() = id) still applies on top of these grants.

REVOKE UPDATE ON public.profiles FROM anon, authenticated;

GRANT UPDATE (full_name, avatar_url, linkedin_profile_text, completed_steps)
  ON public.profiles TO authenticated;

-- NOT granted to clients (server/service-role only):
--   plan, is_premium, premium_since, whop_receipt_id, ai_roadmap
