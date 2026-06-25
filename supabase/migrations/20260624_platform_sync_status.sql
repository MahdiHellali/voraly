-- ─────────────────────────────────────────────────────────────────────────────
-- Voraly · platform_connections — colonnes de statut de synchronisation
--
-- Ajoute le suivi du dernier sync et de l'état de session pour le moteur de
-- synchronisation (extension Chrome / content-script). Le dashboard lit
-- last_sync_at pour afficher « Synchronisé il y a X min » et `sync_status`
-- pour le badge `session_expired` (animation rose néon).
--
-- HOW TO RUN:
--   1. Open https://supabase.com/dashboard → your project
--   2. SQL Editor → New Query → paste this file → Run
--
-- ⚠ SECURITY NOTES
--   • RLS owner-only déjà actif sur platform_connections (auth.uid() = user_id).
--   • Ces colonnes ne sont PAS sensibles ; elles peuvent être lues côté client.
--     Les colonnes de tokens restent serveur-only.
-- ─────────────────────────────────────────────────────────────────────────────


-- ══════════════════════════════════════════════════════════════════════════════
-- 1. COLONNES
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.platform_connections
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

ALTER TABLE public.platform_connections
  ADD COLUMN IF NOT EXISTS sync_status TEXT NOT NULL DEFAULT 'idle';

-- Domaine restreint des statuts (defence-in-depth au niveau BDD).
ALTER TABLE public.platform_connections
  DROP CONSTRAINT IF EXISTS platform_connections_sync_status_chk;

ALTER TABLE public.platform_connections
  ADD CONSTRAINT platform_connections_sync_status_chk
  CHECK (sync_status IN ('idle', 'synced', 'session_expired', 'error'));


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. SNAPSHOT BRUT — platform_metrics.raw_metrics
--    Les KPIs du sync (totalEarnings, pendingBalance, activeOrders, rating) ne
--    tiennent pas tous dans les colonnes typées. On préserve le payload complet
--    en JSONB pour ne perdre aucune donnée et permettre de futures lectures.
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.platform_metrics
  ADD COLUMN IF NOT EXISTS raw_metrics JSONB;


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. VERIFICATION — expect les nouvelles colonnes présentes
-- ══════════════════════════════════════════════════════════════════════════════

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'platform_connections'
  AND column_name IN ('last_sync_at', 'sync_status')
ORDER BY column_name;
