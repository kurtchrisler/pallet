-- Sales/marketing attribution: which UTM-tagged link (or, failing that,
-- which referring site) brought each customer in. Captured client-side the
-- moment someone first lands on the site (see AttributionCapture.tsx),
-- carried through the pay-first signup flow on pending_signups, and landed
-- on profiles once the real account is created — so you can just open the
-- profiles table in Supabase and see where each customer came from.

alter table public.pending_signups
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists referrer_host text;

alter table public.profiles
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists referrer_host text;

-- Same trigger as before, just also copying attribution out of the new
-- user's metadata (set at account-creation time — see completeSignup in
-- src/lib/signup.ts) into these new columns.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, utm_source, utm_medium, utm_campaign, referrer_host)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'utm_source',
    new.raw_user_meta_data->>'utm_medium',
    new.raw_user_meta_data->>'utm_campaign',
    new.raw_user_meta_data->>'referrer_host'
  );
  return new;
end;
$$;

notify pgrst, 'reload schema';
