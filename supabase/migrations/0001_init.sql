-- Pallet Ledger — initial multi-tenant schema
-- Run this once in your Supabase project's SQL editor (or via `supabase db push`).
-- Every business table carries `user_id default auth.uid()` and row-level security
-- so one signed-in user can only ever see or touch their own rows.

-- ---------------------------------------------------------------------------
-- profiles: one row per signed-up user, created automatically on signup
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  business_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- subscriptions: synced from Stripe by the webhook (service role only —
-- there is no insert/update policy for regular users on purpose)
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'none',
  price_id text,
  current_period_end timestamptz,
  trial_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- pallets
-- ---------------------------------------------------------------------------
create table if not exists public.pallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source text not null default 'Unknown source',
  purchase_date date not null default current_date,
  cost numeric(10,2) not null default 0,
  freight numeric(10,2) not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.pallets enable row level security;

create policy "pallets_all_own" on public.pallets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- items
-- ---------------------------------------------------------------------------
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pallet_id uuid not null references public.pallets(id) on delete cascade,
  name text not null default 'Unnamed item',
  category text not null default 'Other',
  condition text not null default 'Good',
  est_value numeric(10,2) not null default 0,
  note text not null default '',
  status text not null default 'in_stock' check (status in ('in_stock', 'sold')),
  created_at timestamptz not null default now()
);

alter table public.items enable row level security;

create policy "items_all_own" on public.items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists items_pallet_id_idx on public.items(pallet_id);

-- ---------------------------------------------------------------------------
-- sales — one sale per item
-- ---------------------------------------------------------------------------
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_id uuid not null unique references public.items(id) on delete cascade,
  sale_date date not null default current_date,
  price numeric(10,2) not null default 0,
  buyer text not null default '',
  channel text not null default 'Other',
  payment text not null default 'Cash',
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.sales enable row level security;

create policy "sales_all_own" on public.sales
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  expense_date date not null default current_date,
  category text not null default 'Other',
  amount numeric(10,2) not null default 0,
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "expenses_all_own" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Keep a sold item's status in sync automatically when a sale row is
-- inserted/deleted, so app code never has to remember to do it in two places.
-- ---------------------------------------------------------------------------
create or replace function public.mark_item_sold()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.items set status = 'sold' where id = new.item_id;
  return new;
end;
$$;

drop trigger if exists on_sale_insert on public.sales;
create trigger on_sale_insert
  after insert on public.sales
  for each row execute procedure public.mark_item_sold();

create or replace function public.mark_item_in_stock()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.items set status = 'in_stock' where id = old.item_id;
  return old;
end;
$$;

drop trigger if exists on_sale_delete on public.sales;
create trigger on_sale_delete
  after delete on public.sales
  for each row execute procedure public.mark_item_in_stock();
