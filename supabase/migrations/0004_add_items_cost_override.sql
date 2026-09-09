-- Lets a user manually set an item's cost, overriding the automatic
-- retail-value-proportional allocation for that one item. Null (the
-- default) means "keep auto-calculating this item's cost as before."
-- Row-level security and table-level GRANTs already cover the whole
-- `items` table, so no policy/GRANT changes are needed.

alter table public.items
  add column if not exists cost_override numeric(10,2);

notify pgrst, 'reload schema';
