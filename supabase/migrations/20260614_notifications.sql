-- ─────────────────────────────────────────────────────────────────────────────
-- Voraly · Notifications (Tables for user-specific and global announcements)
--
-- HOW TO RUN:
--   1. Open https://supabase.com/dashboard → your project
--   2. SQL Editor → New Query → paste this file → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. TABLE: public.notifications
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE, -- Nullable for global notifications
  title        TEXT        NOT NULL,
  content      TEXT        NOT NULL,
  is_global    BOOLEAN     NOT NULL DEFAULT FALSE,
  read         BOOLEAN     NOT NULL DEFAULT FALSE, -- Used for user-specific notifications
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. TABLE: public.notification_reads (for global announcements tracking)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.notification_reads (
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID        NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, notification_id)
);

-- Enable RLS
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. RLS POLICIES
-- ══════════════════════════════════════════════════════════════════════════════

-- For notifications:
DROP POLICY IF EXISTS "notifications: select user or global" ON public.notifications;
DROP POLICY IF EXISTS "notifications: update user own read" ON public.notifications;
DROP POLICY IF EXISTS "notifications: delete user own" ON public.notifications;

CREATE POLICY "notifications: select user or global"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id OR is_global = TRUE);

CREATE POLICY "notifications: update user own read"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications: delete user own"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- For notification_reads:
DROP POLICY IF EXISTS "notification_reads: select own" ON public.notification_reads;
DROP POLICY IF EXISTS "notification_reads: insert own" ON public.notification_reads;

CREATE POLICY "notification_reads: select own"
  ON public.notification_reads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notification_reads: insert own"
  ON public.notification_reads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. Triggers and Indexes
-- ══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

DROP TRIGGER IF EXISTS notifications_set_updated_at ON public.notifications;
CREATE TRIGGER notifications_set_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. VERIFICATION
-- ══════════════════════════════════════════════════════════════════════════════
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('notifications', 'notification_reads');
