-- Tracks whether an item has been listed for sale yet, independent of
-- in_stock/sold status (an item can be in stock and either listed or not
-- yet listed). Row-level security and table-level GRANTs already cover
-- the whole `items` table, so no policy/GRANT changes are needed.

alter table public.items
  add column if not exists listed boolean not null default false;
