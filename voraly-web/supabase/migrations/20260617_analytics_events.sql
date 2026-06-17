-- ─── Voraly · Migration : analytics_events ────────────────────────────────────
-- Table d'événements analytics server-side.
-- Lecture : service_role uniquement (admin). Écriture : utilisateurs authentifiés.

create table if not exists public.analytics_events (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  page text,
  metadata jsonb default '{}',
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at desc);
create index if not exists analytics_events_user_id_idx on public.analytics_events(user_id);
create index if not exists analytics_events_event_name_idx on public.analytics_events(event_name);

alter table public.analytics_events enable row level security;

-- Insert autorisé pour tous les utilisateurs authentifiés (user_id doit matcher)
create policy "auth users can insert events" on public.analytics_events
  for insert to authenticated with check (auth.uid() = user_id);

-- Pas de SELECT policy : seul le service_role (admin) peut lire

-- Supprime l'index event_name inutile
drop index if exists analytics_events_event_name_idx;

-- Index composite pour la query top_pages_7d
create index if not exists analytics_events_created_page_idx
  on public.analytics_events(created_at desc, page);

-- RPC top_pages_7d : agrégation côté DB
create or replace function public.top_pages_7d()
returns table(page text, views bigint)
language sql
security definer
set search_path = public
as $$
  select page, count(*) as views
  from analytics_events
  where created_at >= now() - interval '7 days'
    and page is not null
  group by page
  order by views desc
  limit 10;
$$;
