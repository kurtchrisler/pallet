-- Adds Brand, UPC, manifest Item #, and Retail Value to items — all
-- informational fields alongside the existing est_value (which still
-- drives cost allocation; these don't change that math). Row-level
-- security and table-level GRANTs already cover the whole `items` table,
-- so no policy/GRANT changes are needed for new columns on it.

alter table public.items
  add column if not exists brand text not null default '',
  add column if not exists upc text not null default '',
  add column if not exists item_number text not null default '',
  add column if not exists retail_value numeric(10,2) not null default 0;
