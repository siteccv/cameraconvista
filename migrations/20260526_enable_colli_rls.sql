begin;

alter table public.colli_sections enable row level security;
alter table public.colli_categories enable row level security;
alter table public.colli_items enable row level security;
alter table public.colli_item_allergens enable row level security;
alter table public.colli_allergens enable row level security;
alter table public.colli_wine_categories enable row level security;
alter table public.colli_wines enable row level security;
alter table public.colli_settings enable row level security;
alter table public.colli_menu_snapshots enable row level security;

drop policy if exists "Colli sections service_role only" on public.colli_sections;
create policy "Colli sections service_role only"
  on public.colli_sections
  for all
  to public
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Colli categories service_role only" on public.colli_categories;
create policy "Colli categories service_role only"
  on public.colli_categories
  for all
  to public
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Colli items service_role only" on public.colli_items;
create policy "Colli items service_role only"
  on public.colli_items
  for all
  to public
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Colli item allergens service_role only" on public.colli_item_allergens;
create policy "Colli item allergens service_role only"
  on public.colli_item_allergens
  for all
  to public
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Colli allergens service_role only" on public.colli_allergens;
create policy "Colli allergens service_role only"
  on public.colli_allergens
  for all
  to public
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Colli wine categories service_role only" on public.colli_wine_categories;
create policy "Colli wine categories service_role only"
  on public.colli_wine_categories
  for all
  to public
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Colli wines service_role only" on public.colli_wines;
create policy "Colli wines service_role only"
  on public.colli_wines
  for all
  to public
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Colli settings service_role only" on public.colli_settings;
create policy "Colli settings service_role only"
  on public.colli_settings
  for all
  to public
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Colli snapshots service_role only" on public.colli_menu_snapshots;
create policy "Colli snapshots service_role only"
  on public.colli_menu_snapshots
  for all
  to public
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

commit;
