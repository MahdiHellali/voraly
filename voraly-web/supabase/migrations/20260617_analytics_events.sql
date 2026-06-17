-- Index complémentaire pour analytics_events (schéma Hermes : page_url)
-- La table, is_admin et les policies sont dans /supabase/migrations/20260616_analytics_events.sql

create index if not exists analytics_events_created_page_idx
  on public.analytics_events(created_at desc, page_url);
