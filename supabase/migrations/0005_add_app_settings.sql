-- A small key/value store for server-only integration state — right now
-- just the AWeber OAuth tokens, which rotate over time and need a durable
-- place to live besides a static env var (the refresh token AWeber hands
-- back on each refresh may not be the same one you started with).
--
-- This table is never meant to be read by end users, so it's locked down
-- to service_role only: RLS is enabled with zero policies for
-- authenticated/anon, which denies them all access by default.

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

grant select, insert, update on public.app_settings to service_role;

notify pgrst, 'reload schema';
