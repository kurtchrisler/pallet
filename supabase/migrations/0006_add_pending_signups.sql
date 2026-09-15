-- Pay-before-account signup: someone fills out the signup form (email,
-- password, business name) *before* they've paid. We hold that here,
-- encrypted, keyed by a random id we hand to Stripe as checkout metadata.
-- Only once Stripe confirms payment do we actually create the Supabase
-- auth account and delete this row.
--
-- The password is encrypted (AES-256-GCM, see src/lib/crypto.ts) rather
-- than stored in plain text, and this table is locked down to service_role
-- only — RLS is enabled with zero policies for authenticated/anon, which
-- denies them all access by default. Nothing here is ever read by the
-- browser.

create table if not exists public.pending_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  business_name text,
  password_ciphertext text not null,
  password_iv text not null,
  password_tag text not null,
  created_at timestamptz not null default now()
);

alter table public.pending_signups enable row level security;

grant select, insert, update, delete on public.pending_signups to service_role;

notify pgrst, 'reload schema';
